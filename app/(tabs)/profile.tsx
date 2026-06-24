import {
  Outfit_400Regular, Outfit_600SemiBold,
  Outfit_700Bold, Outfit_900Black, useFonts
} from '@expo-google-fonts/outfit'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Image, Modal, ScrollView,
  StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View
} from 'react-native'
import { translations } from '../../constants/translations'
import { registerForPushNotificationsAsync } from '../../lib/notifications'
import { getProfile, pickImage, uploadAvatar, upsertProfile } from '../../lib/profile'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Language, useLanguageStore } from '../../store/languageStore'
import { useThemeStore } from '../../store/ThemeStore'

const LANGUAGES: Language[] = ['English', 'Filipino', 'Spanish', 'French', 'Japanese', 'Korean']

function ModalSheet({ visible, onClose, title, isDark, textPrimary, textSecondary, children }: any) {
  return (
    <Modal visible={!!visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1A1025' : '#FDF6FF' }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function FieldInput({ label, value, onChangeText, placeholder, secureTextEntry, multiline, inputBg, inputBorder, textPrimary }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: '#7B5EA7' }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4B5C8"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  )
}

export default function Profile() {
  const session = useAuthStore((state) => state.session)
  const clearSession = useAuthStore((state) => state.clearSession)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const language = useLanguageStore((state) => state.language)
  const setGlobalLanguage = useLanguageStore((state) => state.setLanguage)
  const t = translations[language]

  const [dailyCapacity, setDailyCapacity] = useState(5)
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editProfileModal, setEditProfileModal] = useState(false)
  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [changeEmailModal, setChangeEmailModal] = useState(false)
  const [languageModal, setLanguageModal] = useState(false)
  const [privacyModal, setPrivacyModal] = useState(false)
  const [helpModal, setHelpModal] = useState(false)
  const [aboutModal, setAboutModal] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [feedback, setFeedback] = useState('')

  const isDark = theme === 'dark'
  const bg = isDark ? '#1A1025' : '#FDF6FF'
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.88)'
  const textPrimary = isDark ? '#F3E8FF' : '#3D2C4E'
  const textSecondary = isDark ? '#A78BBA' : '#9A85A4'
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : '#F3E8FF'
  const inputBg = isDark ? 'rgba(255,255,255,0.08)' : '#F9F0FF'
  const inputBorder = isDark ? 'rgba(255,255,255,0.15)' : '#E8D5F5'

  const email = session?.user?.email ?? 'student@dueday.app'
  const displayUsername = username || email.split('@')[0]

  useEffect(() => {
    if (!session?.user?.id) return
    loadProfile()
  }, [session])

  const loadProfile = async () => {
    try {
      if (!session?.user?.id) return
      const { data, error } = await getProfile(session.user.id)
      if (error) throw error
      if (data) {
        setAvatarUrl(data.avatar_url)
        setFullName(data.full_name ?? '')
        setUsername(data.username ?? '')
        setBio(data.bio ?? '')
        setPhone(data.phone ?? '')
        if (data.language) setGlobalLanguage(data.language)
        setNotificationsEnabled(data.notifications_enabled ?? true)
        setDailyCapacity(data.daily_study_capacity ?? 5)
      }
    } catch (err: any) {
      console.warn("Profile fetch failed, using local profile state fallback:", err.message)
    }
  }

  const handlePickAvatar = async () => {
    if (!session?.user?.id) return Alert.alert('Error', 'No valid user session found')
    try {
      setUploading(true)
      const uri = await pickImage()
      if (!uri) return
      const url = await uploadAvatar(session.user.id, uri)
      setAvatarUrl(url)
      await upsertProfile(session.user.id, { avatar_url: url })
      Alert.alert('Success', 'Profile picture updated!')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      if (session?.user?.id) {
        await upsertProfile(session.user.id, {
          full_name: fullName,
          username,
          bio,
          phone,
        })
      }
      setEditProfileModal(false)
      Alert.alert('Success', 'Profile updated!')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters')
    if (newPassword !== confirmPassword)
      return Alert.alert('Error', 'Passwords do not match')
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setChangePasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
      Alert.alert('Success', 'Password changed successfully!')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail) return Alert.alert('Error', 'Enter a new email')
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      setChangeEmailModal(false)
      setNewEmail('')
      Alert.alert('Success', 'Check your new email for a confirmation link!')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLanguage = async (lang: Language) => {
    setGlobalLanguage(lang)
    setLanguageModal(false)
    try {
      if (session?.user?.id) {
        await upsertProfile(session.user.id, { language: lang })
      }
    } catch (err) {
      console.error("Failed to save language configuration online:", err)
    }
  }

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const granted = await registerForPushNotificationsAsync()
      if (!granted) {
        Alert.alert('Permission needed', 'Please enable notifications in your device settings.')
        return
      }
    }
    setNotificationsEnabled(val)
    try {
      if (session?.user?.id) {
        await upsertProfile(session.user.id, { notifications_enabled: val })
      }
    } catch (err) {
      console.error("Failed to save notifications toggle online:", err)
    }
  }

  const handleChangeCapacity = async (delta: number) => {
    const next = Math.min(12, Math.max(1, dailyCapacity + delta))
    setDailyCapacity(next)
    try {
      if (session?.user?.id) {
        await upsertProfile(session.user.id, { daily_study_capacity: next })
      }
    } catch (err) {
      console.error('Failed to save daily capacity:', err)
    }
  }

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return Alert.alert('Error', 'Please enter your feedback')
    setFeedbackModal(false)
    setFeedback('')
    Alert.alert('Thank you!', 'Your feedback has been submitted successfully.')
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => {
          supabase.auth.signOut().catch(() => {})
          setTimeout(() => {
            clearSession()
          }, 300)
        },
      },
    ])
  }

  if (!fontsLoaded) {
    return (
      <View style={[styles.flex, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C084F5" />
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: bg }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.blob, styles.blobTop, isDark && { backgroundColor: '#4A1D6E', opacity: 0.3 }]} />
      <View style={[styles.blob, styles.blobBottom, isDark && { backgroundColor: '#1A3A5C', opacity: 0.3 }]} />

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayUsername.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.editAvatarBtn}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={14} color="#fff" />
            }
          </View>
        </TouchableOpacity>

        <Text style={[styles.username, { color: textPrimary }]}>{displayUsername}</Text>
        {fullName ? <Text style={[styles.fullName, { color: textSecondary }]}>{fullName}</Text> : null}
        <Text style={[styles.emailText, { color: textSecondary }]}>{email}</Text>
        {bio ? <Text style={[styles.bio, { color: textSecondary }]}>{bio}</Text> : null}
      </View>

      {/* Stats */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{t.myStats}</Text>
        <View style={styles.statsRow}>
          {[
            { label: t.total, value: '0', bg: isDark ? 'rgba(192,132,245,0.15)' : '#F3E8FF' },
            { label: t.done, value: '0', bg: isDark ? 'rgba(134,239,172,0.15)' : '#DCFCE7' },
            { label: `${t.streak} 🔥`, value: '0', bg: isDark ? 'rgba(252,211,77,0.15)' : '#FEF3C7' },
          ].map(s => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Theme Toggle */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.themeRow}>
          <View style={styles.themeLeft}>
            <View style={[styles.themeIconBox, { backgroundColor: isDark ? 'rgba(192,132,245,0.15)' : '#FEF3C7' }]}>
              <Text style={styles.themeIconEmoji}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View>
              <Text style={[styles.themeLabel, { color: textPrimary }]}>{isDark ? t.darkMode : t.lightMode}</Text>
              <Text style={[styles.themeSubLabel, { color: textSecondary }]}>
                {isDark ? t.darkModeDesc : t.lightModeDesc}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.toggleTrack, { backgroundColor: isDark ? '#C084F5' : '#E8D5F5' }]}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 22 : 2 }] }]}>
              <Text style={styles.toggleEmoji}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Study Capacity */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{t.studySettings}</Text>
        <View style={styles.themeRow}>
          <View style={styles.themeLeft}>
            <View style={[styles.themeIconBox, { backgroundColor: isDark ? 'rgba(192,132,245,0.15)' : '#F3E8FF' }]}>
              <Ionicons name="time-outline" size={20} color="#C084F5" />
            </View>
            <View>
              <Text style={[styles.themeLabel, { color: textPrimary }]}>{t.dailyCapacity}</Text>
              <Text style={[styles.themeSubLabel, { color: textSecondary }]}>{t.dailyCapacityDesc}</Text>
            </View>
          </View>
        </View>
        <View style={styles.capacityRow}>
          <TouchableOpacity
            style={styles.capacityBtn}
            onPress={() => handleChangeCapacity(-0.5)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color="#C084F5" />
          </TouchableOpacity>
          <Text style={[styles.capacityValue, { color: textPrimary }]}>{dailyCapacity}h / day</Text>
          <TouchableOpacity
            style={styles.capacityBtn}
            onPress={() => handleChangeCapacity(0.5)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#C084F5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Settings */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{t.account}</Text>
        {[
          { icon: 'person-outline', color: '#C084F5', label: t.editProfile, onPress: () => setEditProfileModal(true) },
          { icon: 'mail-outline', color: '#93C5FD', label: t.changeEmail, onPress: () => setChangeEmailModal(true) },
          { icon: 'lock-closed-outline', color: '#F9A8C9', label: t.changePassword, onPress: () => setChangePasswordModal(true) },
        ].map((item, index, arr) => (
          <View key={item.label}>
            <TouchableOpacity style={styles.settingRow} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[styles.settingIconBox, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.settingLabel, { color: textPrimary }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={textSecondary} />
            </TouchableOpacity>
            {index < arr.length - 1 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
          </View>
        ))}
      </View>

      {/* Preferences */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{t.preferences}</Text>
        <View style={styles.settingRow}>
          <View style={[styles.settingIconBox, { backgroundColor: '#FCD34D22' }]}>
            <Ionicons name="notifications-outline" size={18} color="#FCD34D" />
          </View>
          <Text style={[styles.settingLabel, { color: textPrimary }]}>{t.notifications}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E8D5F5', true: '#C084F5' }}
            thumbColor="#fff"
          />
        </View>
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <TouchableOpacity style={styles.settingRow} onPress={() => setLanguageModal(true)} activeOpacity={0.7}>
          <View style={[styles.settingIconBox, { backgroundColor: '#93C5FD22' }]}>
            <Ionicons name="language-outline" size={18} color="#93C5FD" />
          </View>
          <Text style={[styles.settingLabel, { color: textPrimary }]}>{t.language}</Text>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: textSecondary }]}>{language}</Text>
            <Ionicons name="chevron-forward" size={16} color={textSecondary} />
          </View>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <TouchableOpacity style={styles.settingRow} onPress={() => setPrivacyModal(true)} activeOpacity={0.7}>
          <View style={[styles.settingIconBox, { backgroundColor: '#86EFAC22' }]}>
            <Ionicons name="shield-outline" size={18} color="#86EFAC" />
          </View>
          <Text style={[styles.settingLabel, { color: textPrimary }]}>{t.privacy}</Text>
          <Ionicons name="chevron-forward" size={16} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Support Settings */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{t.support}</Text>
        {[
          { icon: 'help-circle-outline', color: '#C084F5', label: t.helpFaq, onPress: () => setHelpModal(true) },
          { icon: 'chatbubble-outline', color: '#F9A8C9', label: t.sendFeedback, onPress: () => setFeedbackModal(true) },
          { icon: 'information-circle-outline', color: '#86EFAC', label: t.aboutApp, onPress: () => setAboutModal(true) },
        ].map((item, index, arr) => (
          <View key={item.label}>
            <TouchableOpacity style={styles.settingRow} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[styles.settingIconBox, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.settingLabel, { color: textPrimary }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={textSecondary} />
            </TouchableOpacity>
            {index < arr.length - 1 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
          </View>
        ))}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>{t.signOut}</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: textSecondary }]}>DueDay v1.0.0</Text>

      {/* Edit Profile Modal */}
      <ModalSheet
        visible={editProfileModal} onClose={() => setEditProfileModal(false)} title={`✏️ ${t.editProfile}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        <FieldInput label={t.fullName} value={fullName} onChangeText={setFullName} placeholder="Your full name" inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <FieldInput label={t.username} value={username} onChangeText={setUsername} placeholder="@username" inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <FieldInput label={t.bio} value={bio} onChangeText={setBio} placeholder="Tell us about yourself..." multiline inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <FieldInput label={t.phone} value={phone} onChangeText={setPhone} placeholder="+63 912 345 6789" inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.saveChanges}</Text>}
        </TouchableOpacity>
      </ModalSheet>

      {/* Change Password Modal */}
      <ModalSheet
        visible={changePasswordModal} onClose={() => setChangePasswordModal(false)} title={`🔒 ${t.changePassword}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        <FieldInput label={t.newPassword} value={newPassword} onChangeText={setNewPassword} placeholder="Min 6 characters" secureTextEntry inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <FieldInput label={t.confirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.updatePassword}</Text>}
        </TouchableOpacity>
      </ModalSheet>

      {/* Change Email Modal */}
      <ModalSheet
        visible={changeEmailModal} onClose={() => setChangeEmailModal(false)} title={`📧 ${t.changeEmail}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        <Text style={[styles.modalNote, { color: textSecondary }]}>
          A confirmation link will be sent to your new email address.
        </Text>
        <FieldInput label={t.newEmail} value={newEmail} onChangeText={setNewEmail} placeholder="newemail@example.com" inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleChangeEmail} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.sendConfirmation}</Text>}
        </TouchableOpacity>
      </ModalSheet>

      {/* Language Modal */}
      <ModalSheet
        visible={languageModal} onClose={() => setLanguageModal(false)} title={`🌐 ${t.language}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.languageRow, language === lang && styles.languageRowActive]}
            onPress={() => handleSaveLanguage(lang)}
          >
            <Text style={[styles.languageText, { color: language === lang ? '#C084F5' : textPrimary }]}>{lang}</Text>
            {language === lang && <Ionicons name="checkmark" size={18} color="#C084F5" />}
          </TouchableOpacity>
        ))}
      </ModalSheet>

      {/* Privacy Modal */}
      <ModalSheet
        visible={privacyModal} onClose={() => setPrivacyModal(false)} title={`🛡️ ${t.privacy}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        {[
          { title: 'Data Collection', desc: 'DueDay only collects data necessary to provide the service — your assignments and profile info.' },
          { title: 'Data Storage', desc: 'Your data is securely stored using Supabase with row-level security. Only you can access your data.' },
          { title: 'Third Parties', desc: 'We do not sell or share your personal data with third parties.' },
          { title: 'Account Deletion', desc: 'You can request account deletion at any time by contacting support.' },
        ].map(item => (
          <View key={item.title} style={styles.privacyItem}>
            <Text style={[styles.privacyTitle, { color: textPrimary }]}>{item.title}</Text>
            <Text style={[styles.privacyDesc, { color: textSecondary }]}>{item.desc}</Text>
          </View>
        ))}
      </ModalSheet>

      {/* Help Modal */}
      <ModalSheet
        visible={helpModal} onClose={() => setHelpModal(false)} title={`❓ ${t.helpFaq}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        {[
          { q: 'How do I add an assignment?', a: 'Go to the Assignments tab and tap the + button.' },
          { q: 'How do I mark an assignment as done?', a: 'Tap the status badge on any assignment card to cycle through statuses.' },
          { q: 'Can I change my due date?', a: 'Yes — tap the edit (pencil) icon on the assignment card.' },
          { q: 'How does the streak work?', a: 'Complete at least one assignment per day to keep your streak going.' },
          { q: 'Is my data backed up?', a: 'Yes — all data is stored securely in the cloud via Supabase.' },
        ].map(item => (
          <View key={item.q} style={styles.faqItem}>
            <Text style={[styles.faqQ, { color: textPrimary }]}>Q: {item.q}</Text>
            <Text style={[styles.faqA, { color: textSecondary }]}>A: {item.a}</Text>
          </View>
        ))}
      </ModalSheet>

      {/* Feedback Modal */}
      <ModalSheet
        visible={feedbackModal} onClose={() => setFeedbackModal(false)} title={`💬 ${t.sendFeedback}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        <Text style={[styles.modalNote, { color: textSecondary }]}>
          We'd love to hear your thoughts on DueDay!
        </Text>
        <FieldInput label={t.yourFeedback} value={feedback} onChangeText={setFeedback} placeholder="Tell us what you think..." multiline inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSendFeedback}>
          <Text style={styles.saveBtnText}>{t.submitFeedback}</Text>
        </TouchableOpacity>
      </ModalSheet>

      {/* About Modal */}
      <ModalSheet
        visible={aboutModal} onClose={() => setAboutModal(false)} title={`ℹ️ ${t.aboutApp}`}
        isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary}
      >
        <View style={styles.aboutContent}>
          <Text style={styles.aboutAppName}>DueDay</Text>
          <Text style={[styles.aboutVersion, { color: textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: textSecondary }]}>
            DueDay is a smart assignment tracker designed to help students stay on top of their academic workload. Track deadlines, manage subjects, and never miss a due date again.
          </Text>
          <View style={styles.aboutDivider} />
          <Text style={[styles.aboutCredit, { color: textSecondary }]}>Made with 💜 for students</Text>
          <Text style={[styles.aboutCredit, { color: textSecondary }]}>© 2026 DueDay</Text>
        </View>
      </ModalSheet>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  blobTop: { width: 220, height: 220, backgroundColor: '#F9C6D0', top: -60, right: -60 },
  blobBottom: { width: 180, height: 180, backgroundColor: '#C8E6FA', bottom: 40, left: -50 },

  avatarSection: { alignItems: 'center', marginTop: 56, marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#C084F5', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  avatarText: { fontFamily: 'Outfit_900Black', fontSize: 38, color: '#fff' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#C084F5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  username: { fontFamily: 'Outfit_700Bold', fontSize: 22, textTransform: 'capitalize' },
  fullName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: 2 },
  emailText: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 4 },
  bio: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  card: {
    borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
  },
  sectionTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, marginBottom: 14, letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 4 },

  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  themeIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  themeIconEmoji: { fontSize: 22 },
  themeLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  themeSubLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 2 },
  toggleTrack: { width: 52, height: 30, borderRadius: 15, justifyContent: 'center', padding: 2 },
  toggleThumb: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  toggleEmoji: { fontSize: 14 },
  capacityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 20, marginTop: 14,
  },
  capacityBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center',
  },
  capacityValue: { fontFamily: 'Outfit_700Bold', fontSize: 18, minWidth: 80, textAlign: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  settingIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue: { fontFamily: 'Outfit_400Regular', fontSize: 13 },
  divider: { height: 1, marginLeft: 50 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 18, padding: 16, marginTop: 4,
  },
  logoutText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#EF4444' },
  version: { fontFamily: 'Outfit_400Regular', fontSize: 12, textAlign: 'center', marginTop: 16 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(61,44,78,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E8D5F5', alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center',
  },
  modalNote: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginBottom: 16, lineHeight: 20 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, marginBottom: 8, marginLeft: 2 },
  input: {
    fontFamily: 'Outfit_400Regular',
    borderWidth: 1.5, borderRadius: 16,
    padding: 14, fontSize: 15,
  },

  saveBtn: {
    backgroundColor: '#C084F5', borderRadius: 18, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#fff' },

  languageRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F3E8FF',
  },
  languageRowActive: { backgroundColor: '#F9F0FF', borderRadius: 12, paddingHorizontal: 12 },
  languageText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },

  privacyItem: { marginBottom: 18 },
  privacyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, marginBottom: 4 },
  privacyDesc: { fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 20 },

  faqItem: { marginBottom: 16, padding: 14, backgroundColor: '#F9F0FF', borderRadius: 14 },
  faqQ: { fontFamily: 'Outfit_700Bold', fontSize: 13, marginBottom: 6 },
  faqA: { fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 18 },

  aboutContent: { alignItems: 'center', paddingVertical: 10 },
  aboutAppName: { fontFamily: 'Outfit_900Black', fontSize: 32, color: '#C084F5', letterSpacing: 3, marginBottom: 4 },
  aboutVersion: { fontFamily: 'Outfit_400Regular', fontSize: 14, marginBottom: 16 },
  aboutDesc: { fontFamily: 'Outfit_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  aboutDivider: { height: 1, width: '100%', backgroundColor: '#E8D5F5', marginBottom: 16 },
  aboutCredit: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginBottom: 4 },
})