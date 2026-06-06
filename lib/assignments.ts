import { supabase } from './supabase'

export const getAssignments = async (userId: string) => {
  return await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
}

export const addAssignment = async (data: any) => {
  return await supabase.from('assignments').insert(data)
}

export const deleteAssignment = async (id: string) => {
  return await supabase.from('assignments').delete().eq('id', id)
}

export const updateAssignment = async (id: string, data: any) => {
  return await supabase.from('assignments').update(data).eq('id', id)
}