import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  })

  if (!fontsLoaded) return null

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) { alert(error.message); return }
    alert('Check your email for a reset link!')
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />
        <View style={[styles.blob, styles.blobMid]} />
        <View style={[styles.dot, { top: 90, left: 45 }]} />
        <View style={[styles.dot, { bottom: 160, right: 50 }]} />
        <View style={[styles.dotSmall, { top: 200, right: 70 }]} />
        <View style={[styles.dotSmall, { bottom: 240, left: 60 }]} />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#7B5EA7" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.appName}>DueDay</Text>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@email.com"
            placeholderTextColor="#C4B5C8"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleReset}>
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </Pressable>

          <TouchableOpacity onPress={() => router.back()} style={styles.bottomLink}>
            <Text style={styles.bottomText}>
              Remember your password?{'  '}
              <Text style={styles.bottomTextBold}>Sign in</Text>
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
  blobTop: { width: 240, height: 240, backgroundColor: '#FADADD', top: -80, right: -60 },
  blobBottom: { width: 180, height: 180, backgroundColor: '#C8F0D8', bottom: 20, left: -40 },
  blobMid: { width: 110, height: 110, backgroundColor: '#FFF0C2', top: '35%', left: 30 },
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

  appName: {
    fontFamily: 'Outfit_900Black',
    fontSize: 28, color: '#C084F5',
    textAlign: 'center', letterSpacing: 3, marginBottom: 14,
  },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: 12 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#3D2C4E', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#9A85A4', textAlign: 'center', marginBottom: 28 },

  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#7B5EA7', marginBottom: 6, marginLeft: 4 },
  input: {
    fontFamily: 'Outfit_400Regular',
    backgroundColor: '#F9F0FF', borderWidth: 1.5, borderColor: '#E8D5F5',
    borderRadius: 16, padding: 14, fontSize: 15, color: '#3D2C4E', marginBottom: 16,
  },

  button: {
    backgroundColor: '#F9A8C9', borderRadius: 18, padding: 16, alignItems: 'center',
    shadowColor: '#F9A8C9', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonText: { fontFamily: 'Outfit_700Bold', color: '#fff', fontSize: 16, letterSpacing: 0.4 },

  bottomLink: { marginTop: 22, alignItems: 'center' },
  bottomText: { fontFamily: 'Outfit_400Regular', color: '#9A85A4', fontSize: 14 },
  bottomTextBold: { fontFamily: 'Outfit_700Bold', color: '#C084F5' },
})