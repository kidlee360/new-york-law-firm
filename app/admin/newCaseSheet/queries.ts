'use server';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Helper function to get user's role (consistent with form/actions.ts)
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

export async function performConflictCheck(name: string) {
  const supabase = await createClient();

  // This calls the SQL function you just saved in Supabase
  const { data, error } = await supabase
    .rpc('check_for_conflict', { search_name: name });

  if (error) {
    console.error("Conflict check failed:", error);
    return { hasConflict: false, matches: [], error };
  }

  // If data has length, we found someone with a similar name!
  return {
    hasConflict: (data?.length ?? 0) > 0,
    matches: data || [],
    error: null
  };
}

export async function createNewNYCase(
  caseData: any, 
  deadlineDate: string, 
  clientPartyData: any, 
  spousePartyData: any
) {
  const supabase = await createClient();

  // RBAC check: Only admin, attorney, or paralegal can create a new case
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to create new cases.');
  }

  // 1. Create the Case
  const { data: newCase, error: caseError } = await supabase
    .from('cases')
    .insert([caseData])
    .select()
    .single();

  if (caseError) throw caseError;

  // 2. Create the Client Party record
  const { error: clientError } = await supabase
    .from('parties')
    .insert([{
      ...clientPartyData,
      case_id: newCase.id,
      user_id: user.id, // Link the client party to the current user
    }]);
  if (clientError) throw clientError;

  // 3. Create the Spouse Party record
  const { error: spouseError } = await supabase
    .from('parties')
    .insert([{
      ...spousePartyData,
      case_id: newCase.id
    }]);
  if (spouseError) throw spouseError;

  // 4. Automatically create the 120-Day Deadline task
  const { error: deadlineError } = await supabase
    .from('deadlines')
    .insert([{
      case_id: newCase.id,
      title: 'Service of Process (120-Day Rule)',
      due_date: deadlineDate,
      completed: false
    }]);

  if (deadlineError) throw deadlineError;

  return newCase;
}

export async function saveCaseAssets(caseId: string, assets: any[]) {
  const supabase = await createClient();

  // RBAC check: Only admin, attorney, or paralegal can save case assets
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const userRole = await getUserRole(user.id);
  if (!userRole || (userRole !== 'admin' && userRole !== 'attorney' && userRole !== 'paralegal')) {
    throw new Error('Forbidden: You do not have permission to save case assets.');
  }

  // Map the UI state to the database column names
  const assetsToInsert = assets.map(asset => ({
    case_id: caseId,
    asset_type: asset.type,
    description: asset.desc,
    estimated_value: asset.value,
    is_marital_property: true // Default for intake
  }));

  const { data, error } = await supabase
    .from('assets')
    .insert(assetsToInsert)
    .select();

  if (error) throw error;
  return data;
}
