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

  const { error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', id)

  if (error) throw error

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