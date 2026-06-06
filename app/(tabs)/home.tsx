import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { G, Path, Svg, Text as SvgText } from 'react-native-svg'
import { getAssignments } from '../../lib/assignments'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/ThemeStore'

type Assignment = {
  id: string
  title: string
  subject: string
  priority: string
  status: string
  due_date: string
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#86EFAC',
  medium: '#FCD34D',
  high: '#F9A8C9',
}

function parseDueDate(due_date: string) {
  const raw = due_date.replace('T', ' ').split(' ')[0]
  const [year, month, day] = raw.split('-').map(Number)
  return { year, month: month - 1, day }
}

function DonutChart({ done, pending, late, size = 160, innerRadius = 50 }: {
  done: number; pending: number; late: number; size?: number; innerRadius?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 10
  const total = done + pending + late

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Path
          d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`}
          fill="#F3E8FF"
        />
        <Path
          d={`M ${cx} ${cy - innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${cx - 0.01} ${cy - innerRadius} Z`}
          fill="white"
        />
        <SvgText x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight="bold" fill="#C084F5">0%</SvgText>
        <SvgText x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#9A85A4">Complete</SvgText>
      </Svg>
    )
  }

  const data = [
    { value: done, color: '#86EFAC' },
    { value: pending, color: '#C084F5' },
    { value: late, color: '#F9A8C9' },
  ].filter(d => d.value > 0)

  let startAngle = -Math.PI / 2
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI
    const endAngle = startAngle + angle
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const ix1 = cx + innerRadius * Math.cos(startAngle)
    const iy1 = cy + innerRadius * Math.sin(startAngle)
    const ix2 = cx + innerRadius * Math.cos(endAngle)
    const iy2 = cy + innerRadius * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ')
    startAngle = endAngle + 0.04
    return { path, color: d.color }
  })

  const pct = Math.round((done / total) * 100)

  return (
    <Svg width={size} height={size}>
      <G>{slices.map((s, i) => <Path key={i} d={s.path} fill={s.color} />)}</G>
      <SvgText x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight="bold" fill="#3D2C4E">{pct}%</SvgText>
      <SvgText x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#9A85A4">Complete</SvgText>
    </Svg>
  )
}

export default function Home() {
  const session = useAuthStore((state) => state.session)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const isDark = theme === 'dark'
  const bg = isDark ? '#1A1025' : '#FDF6FF'
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.88)'
  const textPrimary = isDark ? '#F3E8FF' : '#3D2C4E'
  const textSecondary = isDark ? '#A78BBA' : '#9A85A4'

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  })

  useFocusEffect(
    useCallback(() => {
      if (!session) return
      getAssignments(session.user.id).then(({ data }) => {
        setAssignments((data as Assignment[]) || [])
      })
    }, [session])
  )

  if (!fontsLoaded) return null

  const firstName = session?.user?.email?.split('@')[0] ?? 'there'
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const total = assignments.length
  const done = assignments.filter(a => a.status === 'done').length
  const pending = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length
  const late = assignments.filter(a => {
    const { year, month, day } = parseDueDate(a.due_date)
    return new Date(year, month, day) < todayMidnight && a.status !== 'done'
  }).length

  const upcoming = assignments
    .filter(a => {
      const { year, month, day } = parseDueDate(a.due_date)
      return new Date(year, month, day) >= todayMidnight && a.status !== 'done'
    })
    .sort((a, b) => {
      const da = parseDueDate(a.due_date)
      const db = parseDueDate(b.due_date)
      return new Date(da.year, da.month, da.day).getTime() -
        new Date(db.year, db.month, db.day).getTime()
    })
    .slice(0, 3)

  const getGreeting = () => {
    const h = today.getHours()
    if (h < 12) return 'Good morning ☀️'
    if (h < 18) return 'Good afternoon 🌤'
    return 'Good evening 🌙'
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: bg }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobMid]} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.name, { color: textPrimary }]}>{firstName}</Text>
        </View>

        {/* Theme toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeToggle, { backgroundColor: isDark ? 'rgba(192,132,245,0.2)' : '#F3E8FF' }]}
          activeOpacity={0.8}
        >
          <Text style={styles.themeEmoji}>{isDark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.appName}>DueDay</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(192,132,245,0.15)' : '#F3E8FF' }]}>
          <Text style={styles.statEmoji}>📋</Text>
          <Text style={[styles.statValue, { color: textPrimary }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(249,168,201,0.15)' : '#FEE2E2' }]}>
          <Text style={styles.statEmoji}>⏳</Text>
          <Text style={[styles.statValue, { color: textPrimary }]}>{pending}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(134,239,172,0.15)' : '#DCFCE7' }]}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={[styles.statValue, { color: textPrimary }]}>{done}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(252,211,77,0.15)' : '#FEF3C7' }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statValue, { color: textPrimary }]}>{late}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>Late</Text>
        </View>
      </View>

      {/* Analytics */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.cardTitle, { color: textPrimary }]}>📊 Analytics</Text>
        <Text style={[styles.cardSubtitle, { color: textSecondary }]}>Assignment completion overview</Text>
        <View style={styles.chartRow}>
          <DonutChart done={done} pending={pending} late={late} size={160} innerRadius={50} />
          <View style={styles.legend}>
            {[
              { label: 'Done', value: done, color: '#86EFAC' },
              { label: 'Pending', value: pending, color: '#C084F5' },
              { label: 'Late', value: late, color: '#F9A8C9' },
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View>
                  <Text style={[styles.legendLabel, { color: textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.legendValue, { color: textSecondary }]}>{item.value} tasks</Text>
                </View>
              </View>
            ))}
            <View style={[styles.legendDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EDD5F5' }]} />
            <Text style={styles.completionRate}>
              {total > 0 ? Math.round((done / total) * 100) : 0}% Complete
            </Text>
          </View>
        </View>
      </View>

      {/* Upcoming */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>📌 Upcoming</Text>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={[styles.emptyText, { color: textPrimary }]}>No upcoming assignments</Text>
            <Text style={[styles.emptySubtext, { color: textSecondary }]}>Add one in the Assignments tab</Text>
          </View>
        ) : (
          upcoming.map((item, index) => {
            const { year, month, day } = parseDueDate(item.due_date)
            const dueDate = new Date(year, month, day)
            const isToday = dueDate.toDateString() === todayMidnight.toDateString()
            const isTomorrow = dueDate.toDateString() === new Date(todayMidnight.getTime() + 86400000).toDateString()
            const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' :
              dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <View
                key={item.id}
                style={[
                  styles.assignmentRow,
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3E8FF' },
                  index === upcoming.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[styles.assignmentDot, { backgroundColor: PRIORITY_COLORS[item.priority] ?? '#C084F5' }]} />
                <View style={styles.assignmentInfo}>
                  <Text style={[styles.assignmentTitle, { color: textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.assignmentSubject, { color: textSecondary }]}>{item.subject}</Text>
                </View>
                <View style={[styles.dueBadge, isToday && { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.dueText, isToday && { color: '#EF4444' }]}>{label}</Text>
                </View>
              </View>
            )
          })
        )}
      </View>

      {/* AI Teaser */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>✨ AI Scheduler</Text>
        <Text style={styles.aiSubtitle}>
          Smart scheduling coming soon — DueDay will plan your week automatically.
        </Text>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  blobTop: { width: 260, height: 260, backgroundColor: '#F9C6D0', top: -80, right: -80 },
  blobMid: { width: 180, height: 180, backgroundColor: '#C8E6FA', top: 300, left: -60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 52, marginBottom: 4,
  },
  greeting: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
  name: { fontFamily: 'Outfit_700Bold', fontSize: 22, textTransform: 'capitalize' },

  themeToggle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  themeEmoji: { fontSize: 22 },

  appName: {
    fontFamily: 'Outfit_900Black', fontSize: 32,
    color: '#C084F5', letterSpacing: 3, marginBottom: 20,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 12, alignItems: 'center',
    shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 2 },

  card: {
    borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, marginBottom: 4 },
  cardSubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginBottom: 8 },

  chartRow: { flexDirection: 'row', alignItems: 'center' },
  legend: { flex: 1, gap: 10, paddingLeft: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  legendValue: { fontFamily: 'Outfit_400Regular', fontSize: 11 },
  legendDivider: { height: 1, marginVertical: 4 },
  completionRate: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#C084F5' },

  emptyBox: { alignItems: 'center', paddingVertical: 20 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  emptySubtext: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 4 },

  assignmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  assignmentDot: { width: 10, height: 10, borderRadius: 5 },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  assignmentSubject: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 2 },
  dueBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dueText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: '#C084F5' },

  aiCard: {
    backgroundColor: '#C084F5', borderRadius: 24, padding: 20, marginBottom: 8,
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  aiTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff', marginBottom: 6 },
  aiSubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
})