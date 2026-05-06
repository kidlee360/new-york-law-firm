'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper function to get user's role
async function getUserRole(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }
  return profile.role;
}

export async function updateCase(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const updates = {
    status: formData.get('status') as string,
    case_number: formData.get('case_number') as string,
    grounds: formData.get('grounds') as string,
    maintenance_guideline: parseFloat(formData.get('maintenance_guideline') as string) || 0,
    child_support_guideline: parseFloat(formData.get('child_support_guideline') as string) || 0,
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to update case details.');
  }

  // Update the main case details
  const { error: caseError } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', id)

  if (caseError) {
    console.error('Update Case Error:', caseError);
    throw new Error(`Failed to update case: ${caseError.message}`);
  }

  // --- Handle Asset Updates ---
  const assetsToUpdate: any[] = [];
  // FormData entries are flat. We need to reconstruct the asset objects.
  // Example: assets[0][id], assets[0][asset_type], assets[0][description], assets[0][estimated_value]
  const assetMap = new Map<string, any>(); // Map to store assets by their index

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^assets\[([^\]]+)\]\[([^\]]+)\]$/);
    if (match) {
      const index = match[1];
      const field = match[2];
      
      if (!assetMap.has(index)) {
        assetMap.set(index, { case_id: id }); // Initialize with case_id
      }
      const currentAsset = assetMap.get(index);

      if (field === 'estimated_value') {
        currentAsset[field] = parseFloat(value as string) || 0;
      } else {
        currentAsset[field] = value;
      }
    }
  }

  for (const asset of assetMap.values()) {
    assetsToUpdate.push(asset);
  }

  // Perform updates for each asset
  for (const asset of assetsToUpdate) {
    const { id: assetId, ...assetUpdates } = asset; // Extract id for update, rest are updates
    
    if (assetId) { // Only update existing assets for now
      const { error: assetError } = await supabase
        .from('assets')
        .update(assetUpdates)
        .eq('id', assetId);

      if (assetError) {
        console.error(`Update Asset Error for ID ${assetId}:`, assetError);
        throw new Error(`Failed to update asset ${assetId}: ${assetError.message}`);
      }
    }
  }

  // --- Handle Expense Updates ---
  // Permissions check for expense updates
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to update expenses.');
  }



  const expenseMap = new Map<string, any>();
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^expenses\[([^\]]+)\]\[([^\]]+)\]$/);
    if (match) {
      const index = match[1];
      const field = match[2];
      if (!expenseMap.has(index)) expenseMap.set(index, {});
      const current = expenseMap.get(index);
      if (field === 'amount') current[field] = parseFloat(value as string) || 0;
      else current[field] = value;
    }
  }

  for (const [expenseId, expenseUpdates] of expenseMap.entries()) {
    const { error: expenseError } = await supabase
      .from('expenses')
      .update(expenseUpdates)
      .eq('id', expenseId);

    if (expenseError) {
      console.error(`Update Expense Error for ID ${expenseId}:`, expenseError);
      throw new Error(`Failed to update expense: ${expenseError.message}`);
    }
  }

  revalidatePath(`/admin/cases/${id}`)
}

export async function deleteCase(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || userRole !== 'admin') { // Only admin can delete a case
    throw new Error('Forbidden: You do not have permission to delete cases.');
  }

  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete Error:', error)
    return
  }

  redirect('/admin/dashboard')
}

// NEW ACTION: Update Deadline Status
export async function updateDeadlineStatus(caseId: string, deadlineId: string, completed: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to update deadline status.');
  }

  const { error } = await supabase
    .from('deadlines')
    .update({ completed: completed })
    .eq('id', deadlineId);

  if (error) {
    console.error('Error updating deadline status:', error);
    throw new Error(`Failed to update deadline status: ${error.message}`);
  }

  revalidatePath(`/admin/cases/${caseId}`); // Revalidate the case page to show updated status
}

export async function addAsset(caseId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to add assets.');
  }
  
  const data = {
    case_id: caseId,
    asset_type: formData.get('new_asset_type') as string,
    description: formData.get('new_description') as string,
    estimated_value: parseFloat(formData.get('new_value') as string) || 0,
  };

  const { error } = await supabase.from('assets').insert(data);
  if (error) throw error;

  revalidatePath(`/admin/cases/${caseId}`);
}

export async function deleteAsset(caseId: string, assetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to delete assets.');
  }
  const { error } = await supabase.from('assets').delete().eq('id', assetId);

  if (error) throw error;

  revalidatePath(`/admin/cases/${caseId}`);
}

export async function addExpense(caseId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to add expenses.');
  }
  const data = {
    case_id: caseId,
    category: formData.get('new_exp_category') as string,
    description: formData.get('new_exp_description') as string,
    amount: parseFloat(formData.get('new_exp_amount') as string) || 0,
  };

  const { error } = await supabase.from('expenses').insert(data);
  if (error) throw error;
  revalidatePath(`/admin/cases/${caseId}`);
}

export async function deleteExpense(caseId: string, expenseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to delete expenses.');
  }
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

  if (error) throw error;
  revalidatePath(`/admin/cases/${caseId}`);
}

export async function addNote(caseId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const content = formData.get('note_content') as string;
  
  if (!content || !user) return;

  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to add notes.');
  }

  const { error } = await supabase.from('notes').insert({
    case_id: caseId,
    content: content,
    user_id: user.id
  });

  if (error) throw error;
  revalidatePath(`/admin/cases/${caseId}`);
}

export async function uploadDocument(caseId: string, formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const category = formData.get('category') as string;
  const { data: { user } } = await supabase.auth.getUser();

  if (!file || file.size === 0 || !user) return;

  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to upload documents.');
  }

  // 1. Upload file to Storage
  const fileExt = file.name.split('.').pop();
  const storagePath = `${caseId}/${Date.now()}-${file.name}`;
  
  const { error: storageError } = await supabase.storage
    .from('case-files')
    .upload(storagePath, file);

  if (storageError) throw storageError;

  // 2. Insert metadata into Database
  const { error: dbError } = await supabase.from('documents').insert({
    case_id: caseId,
    file_path: storagePath,
    file_name: file.name,
    file_size: file.size,
    content_type: file.type,
    category: category || 'Discovery',
    uploaded_by: user.id
  });

  if (dbError) throw dbError;
  revalidatePath(`/admin/cases/${caseId}`);
}

export async function deleteDocument(caseId: string, documentId: string, filePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to delete documents.');
  }
  
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('case-files')
    .remove([filePath]);
    
  if (storageError) throw storageError;

  // Delete from DB
  const { error: dbError } = await supabase.from('documents').delete().eq('id', documentId);
  
  if (dbError) throw dbError;
  revalidatePath(`/admin/cases/${caseId}`);
}

export async function getSignedDocumentUrl(filePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // Not strictly forbidden, but no signed URL for unauthenticated
  const userRole = await getUserRole(user.id);
  if (!userRole) return null; // No role, no access
  // All authenticated users can view/download documents if they can access the case page
  // A more granular check would ensure the user is linked to the case.

  const { data, error } = await supabase.storage
    .from('case-files')
    .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}