import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native'
import { signUp } from '../../lib/auth'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  })

  if (!fontsLoaded) return null

  const handleRegister = async () => {
    const { error } = await signUp(email, password)
    if (error) { alert(error.message); return }
    alert('Account created! Please login.')
    router.push('/(auth)/login')
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Background blobs */}
        <View style={[styles.blob, styles.blobTopRight]} />
        <View style={[styles.blob, styles.blobBottomLeft]} />
        <View style={[styles.blob, styles.blobMid]} />

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
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
          <Text style={styles.title}>Hello there 👋</Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>

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

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#C4B5C8"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleRegister}>
            <Text style={styles.buttonText}>Create Account</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.bottomLink}>
            <Text style={styles.bottomText}>
              Already have an account?{'  '}
              <Text style={styles.bottomTextBold}>Sign in</Text>
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FDF6FF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.45 },
  blobTopRight: { width: 220, height: 220, backgroundColor: '#F9C6D0', top: -60, right: -60 },
  blobBottomLeft: { width: 180, height: 180, backgroundColor: '#C8E6FA', bottom: 40, left: -50 },
  blobMid: { width: 130, height: 130, backgroundColor: '#D8F3DC', top: '45%', right: 10 },

  backButton: {
    position: 'absolute',
    top: 52, left: 24, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12, padding: 8,
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

  button: {
    backgroundColor: '#C084F5', borderRadius: 18, padding: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonText: { fontFamily: 'Outfit_700Bold', color: '#fff', fontSize: 16, letterSpacing: 0.4 },

  bottomLink: { marginTop: 22, alignItems: 'center' },
  bottomText: { fontFamily: 'Outfit_400Regular', color: '#9A85A4', fontSize: 14 },
  bottomTextBold: { fontFamily: 'Outfit_700Bold', color: '#C084F5' },
})