import { supabase } from './supabase'

export const getAssignments = async (userId: string) => {
  return await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
}

export const addAssignment = async (data: any) => {
<<<<<<< HEAD
  return await supabase.from('assignments').insert(data)
=======
  // .select().single() is required so the caller gets back the inserted
  // row (with its generated id) — without it, `data` is null and anything
  // relying on the new row's id (e.g. the AI banner) silently no-ops.
  return await supabase.from('assignments').insert(data).select().single()
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
}

export const deleteAssignment = async (id: string) => {
  return await supabase.from('assignments').delete().eq('id', id)
}

export const updateAssignment = async (id: string, data: any) => {
  return await supabase.from('assignments').update(data).eq('id', id)
}