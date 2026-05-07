import { createClient } from "@/lib/supabase/server";
import { getPagination } from "./utils";

export async function getAttorneyDashboardData(userId?: string, search?: string, status?: string, page?: number) {
  const supabase = await createClient();
  const PAGE_SIZE = 10;
  const currentPage = page || 0;
  const { from, to } = getPagination(currentPage, PAGE_SIZE);

  const { data: cases, error } = await supabase.rpc('search_cases_for_user', {
    p_user_id: userId,
    p_search: search?.trim() || null,
    p_from: from,
    p_to: to,
  });
  
  if (error) throw error;
  console.log('Fetched cases:', cases);
  console.log('Total cases count:', cases.length);
  console.log('Range:', from, to);
  return (cases);

  
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



