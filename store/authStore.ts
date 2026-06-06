import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: any | null
  initialized: boolean
  loadSession: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  loadSession: async () => {
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, initialized: true })
  },
  clearSession: () => set({ session: null }),
}))