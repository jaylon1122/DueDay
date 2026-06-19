import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
    DayPlan, RankedAssignment, generateDailyPlan, rankAssignments
} from '../../lib/aiScheduler'
import { fetchAiPlanExplanation, type AiPlanExplanation } from '../../lib/aiPlanExplain'
import { getAssignments } from '../../lib/assignments'
import { getProfile } from '../../lib/profile'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/ThemeStore'

const PRIORITY_COLORS: Record<string, string> = {
    low: '#86EFAC',
    medium: '#FCD34D',
    high: '#F9A8C9',
}

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
    light: { color: '#16A34A', bg: '#DCFCE7', label: 'Light', emoji: '🟢' },
    moderate: { color: '#D97706', bg: '#FEF3C7', label: 'Moderate', emoji: '🟡' },
    heavy: { color: '#DC2626', bg: '#FEE2E2', label: 'Heavy', emoji: '🔴' },
}

export default function AIPlan() {
    const session = useAuthStore((state) => state.session)
    const theme = useThemeStore((state) => state.theme)
    const [loading, setLoading] = useState(true)
    const [ranked, setRanked] = useState<RankedAssignment[]>([])
    const [dailyPlan, setDailyPlan] = useState<DayPlan[]>([])
    const [capacity, setCapacity] = useState(5)
    const [explanation, setExplanation] = useState<AiPlanExplanation | null>(null)
    const [explaining, setExplaining] = useState(false)

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

    const load = useCallback(async () => {
        if (!session?.user?.id) return
        setLoading(true)
        try {
            const [{ data: assignments }, { data: profile }] = await Promise.all([
                getAssignments(session.user.id),
                getProfile(session.user.id),
            ])

            const dailyCapacity = profile?.daily_study_capacity ?? 5
            setCapacity(dailyCapacity)

            const r = rankAssignments(assignments || [])
            const plan = generateDailyPlan(r, dailyCapacity)
            setRanked(r)
            setDailyPlan(plan)

            setExplanation(null)
            setExplaining(true)
            fetchAiPlanExplanation(r, plan, dailyCapacity)
                .then(setExplanation)
                .finally(() => setExplaining(false))
        } catch (err) {
            console.warn('AI Plan load failed:', err)
        } finally {
            setLoading(false)
        }
    }, [session])

    useFocusEffect(useCallback(() => { load() }, [load]))

    if (!fontsLoaded) return null

    if (loading) {
        return (
            <View style={[styles.flex, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#C084F5" />
            </View>
        )
    }

    const formatDay = (d: Date) => {
        const todayMidnight = new Date()
        todayMidnight.setHours(0, 0, 0, 0)
        const diff = Math.round((d.getTime() - todayMidnight.getTime()) / 86400000)
        if (diff === 0) return 'Today'
        if (diff === 1) return 'Tomorrow'
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const next7Days = dailyPlan.filter(d => d.items.length > 0).slice(0, 7)

    return (
        <ScrollView
            style={[styles.flex, { backgroundColor: bg }]}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
        >
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobMid]} />

            <View style={styles.header}>
                <Text style={[styles.eyebrow, { color: textSecondary }]}>✨ Powered by AI</Text>
                <Text style={[styles.title, { color: textPrimary }]}>Your AI Plan</Text>
                <Text style={[styles.subtitle, { color: textSecondary }]}>
                    Based on priority, due dates, and your {capacity}h/day capacity
                </Text>
            </View>

            {(explanation || explaining) && (
                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.cardTitle, { color: textPrimary }]}>💬 Coach's Take</Text>
                    {explaining ? (
                        <View style={styles.explainLoading}>
                            <ActivityIndicator size="small" color="#C084F5" />
                            <Text style={[styles.explainText, { color: textSecondary }]}>Personalizing your plan…</Text>
                        </View>
                    ) : explanation ? (
                        <>
                            <Text style={[styles.explainText, { color: textPrimary }]}>{explanation.summary}</Text>
                            {explanation.focusToday ? (
                                <View style={[styles.focusBox, { backgroundColor: isDark ? 'rgba(192,132,245,0.15)' : '#F3E8FF' }]}>
                                    <Text style={[styles.focusLabel, { color: textSecondary }]}>Start here</Text>
                                    <Text style={[styles.focusText, { color: textPrimary }]}>{explanation.focusToday}</Text>
                                </View>
                            ) : null}
                        </>
                    ) : null}
                </View>
            )}

            {/* Top Priorities */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>🎯 Do These First</Text>

                {ranked.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyEmoji}>🎉</Text>
                        <Text style={[styles.emptyText, { color: textPrimary }]}>Nothing pending — you're all caught up!</Text>
                    </View>
                ) : (
                    ranked.slice(0, 5).map((a, i) => (
                        <View
                            key={a.id}
                            style={[
                                styles.rankRow,
                                { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3E8FF' },
                                i === Math.min(ranked.length, 5) - 1 && { borderBottomWidth: 0 },
                            ]}
                        >
                            <View style={[styles.rankBadge, a.isOverdue && { backgroundColor: '#FEE2E2' }]}>
                                <Text style={[styles.rankNumber, a.isOverdue && { color: '#EF4444' }]}>{i + 1}</Text>
                            </View>
                            <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[a.priority] ?? '#C084F5' }]} />
                            <View style={styles.rankInfo}>
                                <Text style={[styles.rankTitle, { color: textPrimary }]}>{a.title}</Text>
                                <Text style={[styles.rankReason, { color: textSecondary }]}>{a.reason}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Daily Plan */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>📅 Suggested Study Plan</Text>

                {next7Days.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyEmoji}>🗓️</Text>
                        <Text style={[styles.emptyText, { color: textPrimary }]}>No upcoming workload to plan</Text>
                    </View>
                ) : (
                    next7Days.map((day) => {
                        const tier = TIER_CONFIG[day.tier]
                        return (
                            <View
                                key={day.dateKey}
                                style={[styles.dayCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9F0FF' }]}
                            >
                                <View style={styles.dayHeader}>
                                    <Text style={[styles.dayLabel, { color: textPrimary }]}>{formatDay(day.dateObj)}</Text>
                                    <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
                                        <Text style={[styles.tierText, { color: tier.color }]}>
                                            {tier.emoji} {tier.label} · {day.totalHours.toFixed(1)}h
                                        </Text>
                                    </View>
                                </View>
                                {day.items.map((item, idx) => (
                                    <View key={idx} style={styles.dayItemRow}>
                                        <Ionicons name="ellipse" size={6} color="#C084F5" />
                                        <Text style={[styles.dayItemText, { color: textSecondary }]}>
                                            {item.title} — {item.hours.toFixed(1)}h
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )
                    })
                )}
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

    header: { marginTop: 56, marginBottom: 20 },
    eyebrow: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, letterSpacing: 1, marginBottom: 4 },
    title: { fontFamily: 'Outfit_700Bold', fontSize: 26 },
    subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 4 },

    card: {
        borderRadius: 24, padding: 20, marginBottom: 16,
        shadowColor: '#C9A8D4', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
    },
    cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, marginBottom: 14 },

    explainLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    explainText: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 21 },
    focusBox: { marginTop: 12, borderRadius: 12, padding: 12 },
    focusLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
    focusText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },

    emptyBox: { alignItems: 'center', paddingVertical: 20 },
    emptyEmoji: { fontSize: 32, marginBottom: 8 },
    emptyText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },

    rankRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 12, borderBottomWidth: 1,
    },
    rankBadge: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center',
    },
    rankNumber: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#C084F5' },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    rankInfo: { flex: 1 },
    rankTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
    rankReason: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 2 },

    dayCard: { borderRadius: 16, padding: 14, marginBottom: 10 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dayLabel: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
    tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    tierText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
    dayItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    dayItemText: { fontFamily: 'Outfit_400Regular', fontSize: 13 },
})