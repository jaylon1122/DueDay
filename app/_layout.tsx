import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
<<<<<<< HEAD
=======
import { getAssignments } from '../lib/assignments'
import { checkAndNotifyDueToday, registerForPushNotificationsAsync } from '../lib/notifications'
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
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
<<<<<<< HEAD
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        useAuthStore.setState({ session: newSession })

        // Auto-create profile for new OAuth users (Google/Facebook)
        if (newSession?.user) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
=======
    registerForPushNotificationsAsync()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {

        // Auto-create or sync profile for OAuth users
        if (newSession?.user) {
          console.log('OAUTH METADATA:', JSON.stringify(newSession.user.user_metadata, null, 2))
          const email = newSession.user.email ?? ''
          const username = email.split('@')[0]
          const fullName = newSession.user.user_metadata?.full_name ??
                            newSession.user.user_metadata?.name
          const avatarUrl = newSession.user.user_metadata?.avatar_url ??
                             newSession.user.user_metadata?.picture

          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
            .eq('id', newSession.user.id)
            .single()

          if (!existingProfile) {
<<<<<<< HEAD
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
=======
            await supabase.from('profiles').upsert({
              id: newSession.user.id,
              username,
              full_name: fullName ?? '',
              avatar_url: avatarUrl ?? null,
            })
          } else if (fullName || avatarUrl) {
            // Sync name and picture if they changed or were missing (e.g. signed up with email, then linked FB later)
            const updates: any = {}
            if (fullName && existingProfile.full_name !== fullName) updates.full_name = fullName
            if (avatarUrl && existingProfile.avatar_url !== avatarUrl) updates.avatar_url = avatarUrl

            if (Object.keys(updates).length > 0) {
              await supabase.from('profiles').update(updates).eq('id', newSession.user.id)
            }
          }
        }

        // Update the app state ONLY AFTER the database profile has been updated
        useAuthStore.setState({ session: newSession })
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
<<<<<<< HEAD
=======
    if (!session?.user?.id) return

    const checkDueToday = async () => {
      const { data } = await getAssignments(session.user.id)
      if (data) await checkAndNotifyDueToday(data)
    }

    checkDueToday()
  }, [session?.user?.id])

  useEffect(() => {
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
    if (!initialized) return

    const segs = segments as string[]
    const inAuthGroup = segs[0] === '(auth)'
    const inTabsGroup = segs[0] === '(tabs)'
    const isLanding = segs.length === 0 || segs[0] === 'index'

    if (session && (inAuthGroup || isLanding)) {
      router.replace('/(tabs)/home')
    } else if (!session && inTabsGroup) {
<<<<<<< HEAD
      router.replace('/')
=======
      router.replace('/(auth)/login')
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
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