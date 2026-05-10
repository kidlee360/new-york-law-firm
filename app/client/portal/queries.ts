import { createClient } from "@/lib/supabase/server";

export async function getClientData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const email = user.email;
  const { data, error } = await supabase
  .from("cases")
  .select(`*,
    parties (*),
    notes (*),
    documents (*)
  `)
  .eq("parties.email", email)
  .single();
  if (error) throw error;
  return data;
}