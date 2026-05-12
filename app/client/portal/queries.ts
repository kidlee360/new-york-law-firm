import { createClient } from "@/lib/supabase/server";

export async function getClientData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');
  const email = user.email;
  console.log("Fetching data for user email:", email);
  const { data, error } = await supabase
  .from("cases")
  .select(`*,
    parties!inner (*),
    notes (*),
    documents (*),
    deadlines (*)
  `)
  .eq("parties.email", email);
  if (error) throw error;
  console.log("Client Data:", data);
  return data;
}