import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/ThemeStore'

export default function Layout() {
  const theme = useThemeStore((state) => state.theme)
  const { session, initialized, loadSession } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        useAuthStore.setState({ session: newSession })
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/register')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/home')
    }
  }, [session, segments, initialized])

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme === 'dark' ? '#1A1025' : '#FDF6FF' }
      }} />
    </SafeAreaProvider>
  )
}