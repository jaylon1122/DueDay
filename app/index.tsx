import { Outfit_400Regular, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { useRouter } from 'expo-router'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function Landing() {
  const router = useRouter()

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_900Black,
  })

  if (!fontsLoaded) return null

  return (
    <View style={styles.container}>

      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />
      <View style={[styles.blob, styles.blobMid]} />
      <View style={[styles.dot, { top: 80, left: 40 }]} />
      <View style={[styles.dot, { top: 160, right: 50 }]} />
      <View style={[styles.dot, { bottom: 200, right: 30 }]} />
      <View style={[styles.dotSmall, { top: 220, left: 70 }]} />
      <View style={[styles.dotSmall, { bottom: 280, left: 40 }]} />

      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>DueDay</Text>
        <Text style={styles.tagline}>Never miss a deadline again</Text>

        <View style={styles.features}>
          {[
            { emoji: '📋', text: 'Track all your assignments' },
            { emoji: '📅', text: 'Smart calendar view' },
            { emoji: '✨', text: 'AI-powered study planner' },
          ].map(f => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={() => router.replace('/(auth)/register')}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.signInText}>
            Already have an account?{'  '}
            <Text style={styles.signInBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6FF',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.45 },
  blobTopRight: { width: 260, height: 260, backgroundColor: '#F9C6D0', top: -80, right: -80 },
  blobBottomLeft: { width: 220, height: 220, backgroundColor: '#C8E6FA', bottom: -60, left: -60 },
  blobMid: { width: 140, height: 140, backgroundColor: '#D8F3DC', top: '40%', right: 20 },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 999, backgroundColor: '#E8C5F5', opacity: 0.6 },
  dotSmall: { position: 'absolute', width: 6, height: 6, borderRadius: 999, backgroundColor: '#F9C6D0', opacity: 0.5 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },

  logoWrapper: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  logo: { width: 90, height: 90, borderRadius: 22 },

  appName: {
    fontFamily: 'Outfit_900Black',
    fontSize: 48, color: '#C084F5',
    letterSpacing: 4, marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16, color: '#9A85A4',
    marginBottom: 48, textAlign: 'center',
  },

  features: { width: '100%', gap: 14 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 18, padding: 14,
    shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  featureIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center',
  },
  featureEmoji: { fontSize: 20 },
  featureText: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#3D2C4E', flex: 1 },

  bottom: { paddingHorizontal: 32, gap: 12 },
  getStartedBtn: {
    backgroundColor: '#C084F5', borderRadius: 20, padding: 18, alignItems: 'center',
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  getStartedText: { fontFamily: 'Outfit_900Black', fontSize: 17, color: '#fff', letterSpacing: 0.5 },
  signInBtn: { alignItems: 'center', paddingVertical: 8 },
  signInText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#9A85A4' },
  signInBold: { fontFamily: 'Outfit_700Bold', color: '#C084F5' },
})