import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://pbijrinzodlqlpqwhdod.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiaWpyaW56b2RscWxwcXdoZG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjA5ODQsImV4cCI6MjA5NjAzNjk4NH0.NxQ873DrKPWKKzXErAjFQlxAyJqR4pTsctSQG9Lyk3o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})