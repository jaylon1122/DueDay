// lib/aiScheduler.ts

export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'in_progress' | 'done'

export interface Assignment {
  id: string
  user_id: string
  title: string
  description?: string
  subject?: string
  priority: Priority
  status: Status
  due_date: string
  estimated_hours?: number | null
}

export interface RankedAssignment extends Assignment {
  effectiveHours: number
  urgencyScore: number
  daysUntilDue: number
  isOverdue: boolean
  reason: string
}

export type WorkloadTier = 'light' | 'moderate' | 'heavy'

export interface DayPlan {
  dateKey: string // YYYY-MM-DD
  dateObj: Date
  items: { assignmentId: string; title: string; hours: number }[]
  totalHours: number
  tier: WorkloadTier
}

// ---- Same date parsing as home.tsx, so AI Plan never disagrees with Home/Calendar ----

export function parseDueDate(due_date: string) {
  const raw = due_date.replace('T', ' ').split(' ')[0]
  const [year, month, day] = raw.split('-').map(Number)
  return { year, month: month - 1, day }
}

function dueDateToObj(due_date: string): Date {
  const { year, month, day } = parseDueDate(due_date)
  return new Date(year, month, day)
}

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// ---- Defaults ----

const PRIORITY_WEIGHT: Record<Priority, number> = { low: 5, medium: 10, high: 15 }
const DEFAULT_HOURS: Record<Priority, number> = { low: 1.5, medium: 3, high: 5 }

// Subject nudges the priority-based base estimate up or down.
// Priority still dominates; this is a multiplier, not a second flat table.
const SUBJECT_MULTIPLIER: Record<string, number> = {
  math: 1.2,
  science: 1.2,
  english: 1.0,
  history: 1.0,
  filipino: 1.0,
  pe: 0.6,
  arts: 0.7,
  general: 1.0,
}

export function estimateHours(priority: Priority, subject?: string): number {
  const base = DEFAULT_HOURS[priority]
  const mult = subject ? (SUBJECT_MULTIPLIER[subject.toLowerCase()] ?? 1.0) : 1.0
  // round to nearest 0.5h so the UI never shows ugly decimals
  return Math.round(base * mult * 2) / 2
}

// ---- Urgency scoring ----

export function calculateUrgencyScore(a: Assignment, today: Date = new Date()) {
  const due = dueDateToObj(a.due_date)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysUntilDue = daysBetween(todayMidnight, due)
  const isOverdue = daysUntilDue < 0

  const priorityScore = PRIORITY_WEIGHT[a.priority]
  const effectiveHours = a.estimated_hours ?? estimateHours(a.priority, a.subject)

  const deadlineScore = isOverdue ? 50 : Math.max(0, 14 - daysUntilDue) * 2
  const overdueBonus = isOverdue ? 100 : 0

  const score = overdueBonus + deadlineScore + priorityScore + effectiveHours * 0.5

  return { score, daysUntilDue, isOverdue, effectiveHours }
}

function buildReason(a: Assignment, daysUntilDue: number, isOverdue: boolean, hours: number): string {
  if (isOverdue) {
    return `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} — handle this first.`
  }
  if (daysUntilDue === 0) return `Due today, ${a.priority} priority, ~${hours}h needed.`
  if (daysUntilDue === 1) return `Due tomorrow, ${a.priority} priority, ~${hours}h needed.`
  return `Due in ${daysUntilDue} days, ${a.priority} priority, ~${hours}h estimated.`
}

// ---- Ranking ----

export function rankAssignments(assignments: Assignment[], today: Date = new Date()): RankedAssignment[] {
  return assignments
    .filter((a) => a.status !== 'done')
    .map((a) => {
      const { score, daysUntilDue, isOverdue, effectiveHours } = calculateUrgencyScore(a, today)
      return {
        ...a,
        effectiveHours,
        urgencyScore: score,
        daysUntilDue,
        isOverdue,
        reason: buildReason(a, daysUntilDue, isOverdue, effectiveHours),
      }
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
}

// ---- Workload tiers ----

export function getWorkloadTier(hours: number, dailyCapacity: number): WorkloadTier {
  const lightCeiling = dailyCapacity * 0.6
  if (hours <= lightCeiling) return 'light'
  if (hours <= dailyCapacity) return 'moderate'
  return 'heavy'
}

// ---- Daily study plan (greedy allocation across days leading up to due date) ----

export function generateDailyPlan(
  ranked: RankedAssignment[],
  dailyCapacity: number = 5,
  today: Date = new Date()
): DayPlan[] {
  const dayMap = new Map<string, DayPlan>()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const urgencyIndex = new Map<string, number>()
  ranked.forEach((a, i) => urgencyIndex.set(a.id, i))

  const addToDay = (plan: DayPlan, assignmentId: string, title: string, hours: number) => {
    const existing = plan.items.find(i => i.assignmentId === assignmentId)
    if (existing) {
      existing.hours += hours
    } else {
      plan.items.push({ assignmentId, title, hours })
    }
    plan.totalHours += hours
  }

  const getDay = (d: Date): DayPlan => {
    const key = toKey(d)
    if (!dayMap.has(key)) {
      dayMap.set(key, { dateKey: key, dateObj: new Date(d), items: [], totalHours: 0, tier: 'light' })
    }
    return dayMap.get(key)!
  }


  const dueDateKeyOf = new Map<string, string>()
  ranked.forEach(a => dueDateKeyOf.set(a.id, toKey(dueDateToObj(a.due_date))))

  // ---- Pass 1: initial greedy allocation, same as before ----
  for (const a of ranked) {
    let remainingHours = a.effectiveHours
    const due = dueDateToObj(a.due_date)
    const span = a.isOverdue ? 1 : Math.max(1, daysBetween(todayMidnight, due) + 1)

    for (let i = 0; i < span && remainingHours > 0; i++) {
      const day = new Date(todayMidnight)
      day.setDate(day.getDate() + i)
      const plan = getDay(day)

      const spaceLeft = Math.max(0, dailyCapacity - plan.totalHours)
      if (spaceLeft <= 0) continue

      const allocate = Math.min(spaceLeft, remainingHours)
      if (allocate > 0) {
        addToDay(plan, a.id, a.title, allocate)
        remainingHours -= allocate
      }
    }

    if (remainingHours > 0) {
      const plan = getDay(a.isOverdue ? todayMidnight : due)
      addToDay(plan, a.id, a.title, remainingHours)
    }
  }

  // Ensure every day from today through the furthest due date exists as a slot,
  // even if empty — rebalancing needs somewhere to move hours into
  if (ranked.length > 0) {
    const maxDue = ranked.reduce((max, a) => {
      const d = dueDateToObj(a.due_date)
      return d > max ? d : max
    }, todayMidnight)
    const totalSpan = daysBetween(todayMidnight, maxDue)
    for (let i = 0; i <= totalSpan; i++) {
      const day = new Date(todayMidnight)
      day.setDate(day.getDate() + i)
      getDay(day)
    }
  }

  // ---- Pass 2: rebalance — shift flexible (less urgent, not-due-today) work off overloaded days ----
  const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  for (let dayIdx = 0; dayIdx < sortedDays.length; dayIdx++) {
    const day = sortedDays[dayIdx]
    let excess = day.totalHours - dailyCapacity
    if (excess <= 0) continue

    // Items that aren't due on this exact day can be shifted; move least-urgent first
    const movable = day.items
      .filter(item => dueDateKeyOf.get(item.assignmentId) !== day.dateKey)
      .sort((x, y) => (urgencyIndex.get(y.assignmentId) ?? 0) - (urgencyIndex.get(x.assignmentId) ?? 0))

    for (const item of movable) {
      if (excess <= 0) break
      const itemDueDateKey = dueDateKeyOf.get(item.assignmentId)!

      for (let futureIdx = dayIdx + 1; futureIdx < sortedDays.length; futureIdx++) {
        const futureDay = sortedDays[futureIdx]
        if (futureDay.dateKey > itemDueDateKey) break // can't move past its own due date

        const spaceLeft = dailyCapacity - futureDay.totalHours
        if (spaceLeft <= 0) continue

        const moveHours = Math.min(spaceLeft, item.hours, excess)
        if (moveHours <= 0) continue

        item.hours -= moveHours
        day.totalHours -= moveHours
        addToDay(futureDay, item.assignmentId, item.title, moveHours)
        excess -= moveHours

        if (item.hours <= 0 || excess <= 0) break
      }
    }

    day.items = day.items.filter(i => i.hours > 0.01)
  }

  return sortedDays
    .map((p) => ({ ...p, tier: getWorkloadTier(p.totalHours, dailyCapacity) }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}