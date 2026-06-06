import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getAssignments } from '../../lib/assignments'
import { useAuthStore } from '../../store/authStore'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const PRIORITY_COLORS: Record<string, string> = {
  low: '#86EFAC',
  medium: '#FCD34D',
  high: '#F9A8C9',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#C084F5',
  in_progress: '#93C5FD',
  done: '#86EFAC',
}

type Assignment = {
  id: string
  title: string
  subject: string
  priority: string
  status: string
  due_date: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function parseDueDate(due_date: string) {
  const raw = due_date.replace('T', ' ').split(' ')[0]
  const [year, month, day] = raw.split('-').map(Number)
  return { year, month: month - 1, day }
}

export default function Calendar() {
  const session = useAuthStore((state) => state.session)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate())
  const [assignments, setAssignments] = useState<Assignment[]>([])

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

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const getAssignmentsForDay = (day: number) => {
    return assignments.filter(a => {
      const { year, month, day: d } = parseDueDate(a.due_date)
      return d === day && month === currentMonth && year === currentYear
    })
  }

  const upcomingAssignments = assignments
    .filter(a => {
      const { year, month, day } = parseDueDate(a.due_date)
      const aDate = new Date(year, month, day)
      return aDate >= todayMidnight
    })
    .sort((a, b) => {
      const da = parseDueDate(a.due_date)
      const db = parseDueDate(b.due_date)
      return new Date(da.year, da.month, da.day).getTime() -
        new Date(db.year, db.month, db.day).getTime()
    })
    .slice(0, 5)

  const selectedAssignments = selectedDate ? getAssignmentsForDay(selectedDate) : []

  if (!fontsLoaded) return null

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>DueDay</Text>
        <Text style={styles.pageTitle}>Calendar</Text>
      </View>

      {/* Calendar card */}
      <View style={styles.calendarCard}>

        {/* Month navigation */}
        <View style={styles.monthRow}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthText}>{MONTHS[currentMonth]}</Text>
            <Text style={styles.yearText}>{currentYear}</Text>
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAYS_OF_WEEK.map(d => (
            <View key={d} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {calendarDays.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />

            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear()
            const isSelected = day === selectedDate
            const dayAssignments = getAssignmentsForDay(day)
            const hasAssignments = dayAssignments.length > 0
            const isOverdue = hasAssignments && dayAssignments.some(a => {
              const { year, month, day: d } = parseDueDate(a.due_date)
              return new Date(year, month, d) < todayMidnight && a.status !== 'done'
            })

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={styles.dayCell}
                onPress={() => setSelectedDate(day === selectedDate ? null : day)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.dayInner,
                  isToday && styles.dayToday,
                  isSelected && styles.daySelected,
                ]}>
                  <Text style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}>
                    {day}
                  </Text>
                  {hasAssignments && (
                    <View style={styles.dotsRow}>
                      {dayAssignments.slice(0, 3).map((a, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            { backgroundColor: isOverdue ? '#EF4444' : PRIORITY_COLORS[a.priority] ?? '#C084F5' }
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#C084F5' }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FCD34D' }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F9A8C9' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Overdue</Text>
          </View>
        </View>
      </View>

      {/* Selected day assignments */}
      {selectedDate && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📌 {MONTHS[currentMonth]} {selectedDate}, {currentYear}
          </Text>
          {selectedAssignments.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayEmoji}>🎉</Text>
              <Text style={styles.emptyDayText}>No assignments due</Text>
            </View>
          ) : (
            selectedAssignments.map((a, index) => (
              <View
                key={a.id}
                style={[
                  styles.assignmentRow,
                  index === selectedAssignments.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[styles.assignmentBar, { backgroundColor: PRIORITY_COLORS[a.priority] ?? '#C084F5' }]} />
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text style={styles.assignmentSubject}>{a.subject}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[a.status] ?? '#C084F5') + '33' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[a.status] ?? '#C084F5' }]}>
                    {a.status === 'in_progress' ? 'In Progress' : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Upcoming */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🗓 Upcoming Due</Text>
        {upcomingAssignments.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayEmoji}>✅</Text>
            <Text style={styles.emptyDayText}>All clear — nothing due soon!</Text>
          </View>
        ) : (
          upcomingAssignments.map((a, index) => {
            const { year, month, day } = parseDueDate(a.due_date)
            const aDate = new Date(year, month, day)
            const isOverdue = aDate < todayMidnight && a.status !== 'done'
            return (
              <View
                key={a.id}
                style={[
                  styles.assignmentRow,
                  index === upcomingAssignments.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[styles.assignmentBar, { backgroundColor: isOverdue ? '#EF4444' : PRIORITY_COLORS[a.priority] ?? '#C084F5' }]} />
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text style={styles.assignmentSubject}>{a.subject}</Text>
                </View>
                <Text style={[styles.dueDateText, isOverdue && { color: '#EF4444' }]}>
                  {aDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            )
          })
        )}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FDF6FF' },
  scroll: { padding: 20, paddingBottom: 48 },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  blobTop: { width: 220, height: 220, backgroundColor: '#F9C6D0', top: -60, right: -60 },
  blobBottom: { width: 160, height: 160, backgroundColor: '#C8E6FA', bottom: 60, left: -40 },

  header: { paddingTop: 56, marginBottom: 20 },
  appName: { fontFamily: 'Outfit_900Black', fontSize: 14, color: '#C084F5', letterSpacing: 2 },
  pageTitle: { fontFamily: 'Outfit_700Bold', fontSize: 26, color: '#3D2C4E' },

  calendarCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28, padding: 20, marginBottom: 16,
    shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 16, elevation: 4,
  },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 22, color: '#C084F5', lineHeight: 26 },
  monthCenter: { alignItems: 'center' },
  monthText: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#3D2C4E' },
  yearText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#9A85A4' },

  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderCell: { flex: 1, alignItems: 'center' },
  dayHeaderText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#9A85A4' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  dayToday: { backgroundColor: '#F3E8FF', borderWidth: 1.5, borderColor: '#C084F5' },
  daySelected: { backgroundColor: '#C084F5' },
  dayText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#3D2C4E' },
  dayTextToday: { color: '#C084F5' },
  dayTextSelected: { color: '#fff' },

  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  legend: { flexDirection: 'row', gap: 14, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#9A85A4' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 14, elevation: 3,
  },
  cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#3D2C4E', marginBottom: 14 },

  emptyDay: { alignItems: 'center', paddingVertical: 16 },
  emptyDayEmoji: { fontSize: 28, marginBottom: 6 },
  emptyDayText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#9A85A4' },

  assignmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3E8FF',
  },
  assignmentBar: { width: 4, height: 36, borderRadius: 4 },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#3D2C4E' },
  assignmentSubject: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9A85A4', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
  dueDateText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#9A85A4' },
})