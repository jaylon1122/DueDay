import { create } from 'zustand'

export type Language = 'English' | 'Filipino' | 'Spanish' | 'French' | 'Japanese' | 'Korean'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'English',
  setLanguage: (lang) => set({ language: lang }),
}))