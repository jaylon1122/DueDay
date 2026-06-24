import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
<<<<<<< HEAD
=======
import * as Linking from 'expo-linking'
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import {
    ActivityIndicator, Alert, Image, KeyboardAvoidingView,
    Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  })

  if (!fontsLoaded) return null

  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email and password')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) { Alert.alert('Error', error.message); return }
      if (data.session && data.user) console.log('Login success:', data.user.email)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
<<<<<<< HEAD
          redirectTo: 'stickersmash://auth/callback',
          skipBrowserRedirect: true,
=======
          redirectTo: Linking.createURL('callback'),
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
        },
      })
      if (error) { Alert.alert('Error', error.message); return }
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
<<<<<<< HEAD
          'stickersmash://auth/callback'
        )
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url)
          const accessToken = url.searchParams.get('access_token')
          const refreshToken = url.searchParams.get('refresh_token')
=======
          Linking.createURL('callback')
        )
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url)
          const params = new URLSearchParams(url.hash.replace('#', ''))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
<<<<<<< HEAD
          redirectTo: 'stickersmash://auth/callback',
=======
          redirectTo: Linking.createURL('callback'),
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
          skipBrowserRedirect: true,
        },
      })
      if (error) { Alert.alert('Error', error.message); return }
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
<<<<<<< HEAD
          'stickersmash://auth/callback'
        )
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url)
          const accessToken = url.searchParams.get('access_token')
          const refreshToken = url.searchParams.get('refresh_token')
=======
          Linking.createURL('callback')
        )
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url)
          const params = new URLSearchParams(url.hash.replace('#', ''))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const errorMsg = params.get('error_description') || params.get('error')
          
          if (errorMsg) {
            Alert.alert('Facebook Error', errorMsg)
            return
          }

>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
<<<<<<< HEAD
          }
=======
          } else {
            Alert.alert('Login Failed', 'No access token found in the response URL.')
          }
        } else if (result.type !== 'cancel') {
          Alert.alert('Browser Result', JSON.stringify(result))
>>>>>>> a61e00470d0e1d3205a7d4d88eb1439751fb6297
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={[styles.blob, styles.blobTopLeft]} />
        <View style={[styles.blob, styles.blobBottomRight]} />
        <View style={[styles.blob, styles.blobMid]} />
        <View style={[styles.dot, { top: 100, right: 50 }]} />
        <View style={[styles.dot, { top: 180, left: 35 }]} />
        <View style={[styles.dot, { bottom: 140, left: 55 }]} />
        <View style={[styles.dotSmall, { top: 240, right: 80 }]} />
        <View style={[styles.dotSmall, { bottom: 220, right: 45 }]} />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/register')}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={22} color="#7B5EA7" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.appName}>DueDay</Text>
          <Text style={styles.title}>Welcome back 🌸</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@email.com"
            placeholderTextColor="#C4B5C8"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#C4B5C8"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleFacebookLogin}
              disabled={loading}
            >
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/register')}
            style={styles.bottomLink}
            disabled={loading}
          >
            <Text style={styles.bottomText}>
              Don't have an account?{'  '}
              <Text style={styles.bottomTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FDF6FF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.45 },
  blobTopLeft: { width: 200, height: 200, backgroundColor: '#FAD4E0', top: -50, left: -60 },
  blobBottomRight: { width: 200, height: 200, backgroundColor: '#B5D8FA', bottom: 20, right: -60 },
  blobMid: { width: 120, height: 120, backgroundColor: '#FFF0C2', top: '40%', left: 20 },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 999, backgroundColor: '#E8C5F5', opacity: 0.6 },
  dotSmall: { position: 'absolute', width: 6, height: 6, borderRadius: 999, backgroundColor: '#F9C6D0', opacity: 0.5 },

  backButton: {
    position: 'absolute', top: 52, left: 24, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 8,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 28, padding: 28,
    shadowColor: '#C9A8D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },

  logo: { width: 90, height: 90, alignSelf: 'center', marginBottom: 10, borderRadius: 20 },
  appName: {
    fontFamily: 'Outfit_900Black',
    fontSize: 28, color: '#C084F5',
    textAlign: 'center', letterSpacing: 3, marginBottom: 10,
  },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#3D2C4E', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#9A85A4', textAlign: 'center', marginBottom: 28 },

  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#7B5EA7', marginBottom: 6, marginLeft: 4 },
  input: {
    fontFamily: 'Outfit_400Regular',
    backgroundColor: '#F9F0FF', borderWidth: 1.5, borderColor: '#E8D5F5',
    borderRadius: 16, padding: 14, fontSize: 15, color: '#3D2C4E', marginBottom: 16,
  },

  forgotLink: { alignItems: 'flex-end', marginTop: -8, marginBottom: 16 },
  forgotText: { fontFamily: 'Outfit_600SemiBold', color: '#C084F5', fontSize: 13 },

  button: {
    backgroundColor: '#C084F5', borderRadius: 18, padding: 16, alignItems: 'center',
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: 'Outfit_700Bold', color: '#fff', fontSize: 16, letterSpacing: 0.4 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#EDD5F5' },
  dividerText: { fontFamily: 'Outfit_400Regular', marginHorizontal: 10, color: '#C4B5C8', fontSize: 12 },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  socialButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#E8D5F5', borderRadius: 16, padding: 13, backgroundColor: '#FDFAFF',
  },
  googleIcon: { width: 20, height: 20 },
  socialText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#3D2C4E' },

  bottomLink: { marginTop: 22, alignItems: 'center' },
  bottomText: { fontFamily: 'Outfit_400Regular', color: '#9A85A4', fontSize: 14 },
  bottomTextBold: { fontFamily: 'Outfit_700Bold', color: '#C084F5' },
})