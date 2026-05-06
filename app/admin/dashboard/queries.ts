import { createClient } from "@/lib/supabase/server";

export async function getAttorneyDashboardData(userId?: string, search?: string, status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('cases')
    .select(`
      id,
      created_at,
      case_number,
      status,
      grounds,
      date_filed,
      parties!inner (
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
    `);

  // Filter by status if selected
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Global search across case number and party names
  if (search) {
    // For many-to-one relations in an OR logic tree, use the relation(column.op.val) syntax.
    // Since we are using !inner in the select, this allows us to search across the join.
    // Ensure there are NO spaces between the relation name and the parentheses.
    query = query.or(`case_number.ilike.%${search}%,parties(first_name.ilike.%${search}%),parties(last_name.ilike.%${search}%)`);
  }

  // Filter by user association. 
  // Note: If you only want cases where the user is a party, 
  // you may need to use 'parties!inner(...)' in the select statement.
  const { data: cases, error } = await query
    .order('created_at', { ascending: false })
    .eq('parties.user_id', userId as string);

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