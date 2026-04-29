'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateCase(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const updates = {
    status: formData.get('status') as string,
    case_number: formData.get('case_number') as string,
    grounds: formData.get('grounds') as string,
    maintenance_guideline: parseFloat(formData.get('maintenance_guideline') as string) || 0,
    child_support_guideline: parseFloat(formData.get('child_support_guideline') as string) || 0,
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
    const match = key.match(/^assets\[(\d+)\]\[(.*?)\]$/);
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

  revalidatePath(`/admin/cases/${id}`)
}

export async function deleteCase(id: string) {
  const supabase = await createClient()
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