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
      async (_event, newSession) => {
        useAuthStore.setState({ session: newSession })

        // Auto-create profile for new OAuth users (Google/Facebook)
        if (newSession?.user) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', newSession.user.id)
            .single()

          if (!existingProfile) {
            const email = newSession.user.email ?? ''
            const username = email.split('@')[0]
            const fullName = newSession.user.user_metadata?.full_name ??
                              newSession.user.user_metadata?.name ?? ''
            const avatarUrl = newSession.user.user_metadata?.avatar_url ??
                               newSession.user.user_metadata?.picture ?? null

            await supabase.from('profiles').upsert({
              id: newSession.user.id,
              username,
              full_name: fullName,
              avatar_url: avatarUrl,
            })
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized) return

    const segs = segments as string[]
    const inAuthGroup = segs[0] === '(auth)'
    const inTabsGroup = segs[0] === '(tabs)'
    const isLanding = segs.length === 0 || segs[0] === 'index'

    if (session && (inAuthGroup || isLanding)) {
      router.replace('/(tabs)/home')
    } else if (!session && inTabsGroup) {
      router.replace('/')
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