import { createClient } from "@/lib/supabase/server";

export async function getAttorneyDashboardData(userId?: string ) {
  const supabase = await createClient();

  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      id,
      case_number,
      status,
      grounds,
      date_filed,
      parties (
        first_name,
        last_name,
        role,
        is_client,
        user_id
      ),
      deadlines (
        title,
        due_date,
        completed
      )
    `)
    .order('created_at', { ascending: false })
    .eq('parties.user_id', userId);

    console.log("id:", userId);

  if (error) throw error;
  return cases;
}

export async function getCaseById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      parties (*),
      assets (*),
      deadlines (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}