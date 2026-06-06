import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  low:     { color: '#16A34A', bg: '#DCFCE7', label: 'Low' },
  medium:  { color: '#D97706', bg: '#FEF3C7', label: 'Medium' },
  high:    { color: '#DC2626', bg: '#FEE2E2', label: 'High' },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: '#C084F5', bg: '#F3E8FF', label: 'Pending' },
  in_progress: { color: '#3B82F6', bg: '#EFF6FF', label: 'In Progress' },
  done:        { color: '#16A34A', bg: '#DCFCE7', label: 'Done' },
}

export default function AssignmentCard({ item, onDelete, onEdit, onStatusChange }: any) {
  const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending
  const isOverdue = new Date(item.due_date) < new Date() && item.status !== 'done'

  const confirmDelete = () => {
    Alert.alert('Delete Assignment', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
    ])
  }

  const cycleStatus = () => {
    const order = ['pending', 'in_progress', 'done']
    const next = order[(order.indexOf(item.status ?? 'pending') + 1) % order.length]
    onStatusChange(item.id, next)
  }

  return (
    <View style={[styles.card, isOverdue && styles.cardOverdue]}>

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.subjectBadge, { backgroundColor: priority.bg }]}>
          <Text style={[styles.subjectText, { color: priority.color }]}>{item.subject}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
            <Ionicons name="pencil-outline" size={16} color="#9A85A4" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.title, item.status === 'done' && styles.titleDone]}>
        {item.title}
      </Text>

      {/* Description */}
      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={isOverdue ? '#EF4444' : '#9A85A4'} />
          <Text style={[styles.dueText, isOverdue && styles.dueOverdue]}>
            {isOverdue ? 'Overdue · ' : ''}{new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
          </View>
          <TouchableOpacity
            style={[styles.badge, { backgroundColor: status.bg }]}
            onPress={cycleStatus}
          >
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C9A8D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#F3E8FF',
  },
  cardOverdue: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFAFA',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  subjectText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#F9F0FF', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#3D2C4E', marginBottom: 4 },
  titleDone: { textDecorationLine: 'line-through', color: '#9A85A4' },
  description: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#9A85A4', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueText: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#9A85A4' },
  dueOverdue: { color: '#EF4444', fontFamily: 'Outfit_600SemiBold' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
})