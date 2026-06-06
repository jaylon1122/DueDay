import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black, useFonts } from '@expo-google-fonts/outfit'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  Alert, FlatList, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native'
import AssignmentCard from '../../components/AssignmentCard'
import { addAssignment, deleteAssignment, getAssignments, updateAssignment } from '../../lib/assignments'
import { useAuthStore } from '../../store/authStore'

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Filipino', 'PE', 'Arts', 'General']
const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['pending', 'in_progress', 'done']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS = [2025, 2026, 2027, 2028]

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  low:    { color: '#16A34A', bg: '#DCFCE7', label: 'Low' },
  medium: { color: '#D97706', bg: '#FEF3C7', label: 'Medium' },
  high:   { color: '#DC2626', bg: '#FEE2E2', label: 'High' },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: '#C084F5', bg: '#F3E8FF', label: 'Pending' },
  in_progress: { color: '#3B82F6', bg: '#EFF6FF', label: 'In Progress' },
  done:        { color: '#16A34A', bg: '#DCFCE7', label: 'Done' },
}

const FILTER_TABS = ['All', 'Pending', 'In Progress', 'Done']

type Assignment = {
  id: string
  title: string
  subject: string
  description?: string
  priority: string
  status: string
  due_date: string
  user_id: string
}

export default function Assignments() {
  const session = useAuthStore((state) => state.session)
  const [items, setItems] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Assignment | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('General')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('pending')
  const [dueDate, setDueDate] = useState(new Date())

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  })

  const load = async () => {
    if (!session) {
      console.log('NO SESSION — skipping load')
      return
    }
    console.log('Loading assignments for user:', session.user.id)
    setLoading(true)
    try {
      const { data, error } = await getAssignments(session.user.id)
      console.log('DATA:', JSON.stringify(data))
      console.log('ERROR:', JSON.stringify(error))
      if (error) {
        Alert.alert('Database Error', error.message)
        return
      }
      setItems((data as Assignment[]) || [])
    } catch (err: any) {
      console.log('EXCEPTION:', err.message)
      Alert.alert('Exception', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [session])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSubject('General')
    setPriority('medium')
    setStatus('pending')
    setDueDate(new Date())
    setEditingItem(null)
  }

  const openAdd = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEdit = (item: Assignment) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description ?? '')
    setSubject(item.subject)
    setPriority(item.priority)
    setStatus(item.status)
    setDueDate(new Date(item.due_date))
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required')
    if (!session?.user?.id) return Alert.alert('Error', 'Not logged in')

    const targetDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 12, 0, 0)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      subject,
      priority,
      status,
      due_date: targetDate.toISOString(),
      user_id: session.user.id,
    }

    console.log('Saving payload:', JSON.stringify(payload))

    try {
      if (editingItem) {
        const { error } = await updateAssignment(editingItem.id, payload)
        if (error) { Alert.alert('Update Error', error.message); return }
      } else {
        const { error } = await addAssignment(payload)
        if (error) { Alert.alert('Insert Error', error.message); return }
      }
      console.log('Save successful!')
      setModalVisible(false)
      resetForm()
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteAssignment(id)
    if (error) { Alert.alert('Delete Error', error.message); return }
    load()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateAssignment(id, { status: newStatus })
    load()
  }

  const setMonth = (i: number) => {
    const d = new Date(dueDate.getTime())
    d.setMonth(i)
    setDueDate(d)
  }

  const setDay = (d: number) => {
    const date = new Date(dueDate.getTime())
    date.setDate(d)
    setDueDate(date)
  }

  const setYear = (y: number) => {
    const d = new Date(dueDate.getTime())
    d.setFullYear(y)
    setDueDate(d)
  }

  const getDaysInMonth = (year: number, month: number) => {
    const totalDays = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: totalDays }, (_, i) => i + 1)
  }

  const filtered = items.filter(item => {
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Pending' && item.status === 'pending') ||
      (filter === 'In Progress' && item.status === 'in_progress') ||
      (filter === 'Done' && item.status === 'done')
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    done: items.filter(i => i.status === 'done').length,
  }

  if (!fontsLoaded) return null

  return (
    <View style={styles.flex}>

      <View style={[styles.blob, styles.blobTop]} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>DueDay</Text>
          <Text style={styles.pageTitle}>Assignments</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color="#9A85A4" />
        <TextInput
          placeholder="Search assignments..."
          placeholderTextColor="#C4B5C8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#9A85A4" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map(tab => {
            const count =
              tab === 'All' ? counts.all :
              tab === 'Pending' ? counts.pending :
              tab === 'In Progress' ? counts.in_progress :
              counts.done
            const active = filter === tab
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setFilter(tab)}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{tab}</Text>
                <View style={[styles.filterCount, active && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No assignments found</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first one</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AssignmentCard
            item={item}
            onDelete={handleDelete}
            onEdit={openEdit}
            onStatusChange={handleStatusChange}
          />
        )}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingItem ? '✏️ Edit Assignment' : '➕ New Assignment'}
              </Text>

              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                placeholder="e.g. Problem Set 4"
                placeholderTextColor="#C4B5C8"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                placeholder="Optional notes..."
                placeholderTextColor="#C4B5C8"
                style={[styles.input, styles.inputMulti]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Subject</Text>
              <View style={styles.chipScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {SUBJECTS.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, subject === s && styles.chipActive]}
                      onPress={() => setSubject(s)}
                    >
                      <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map(p => {
                  const cfg = PRIORITY_CONFIG[p]
                  const active = priority === p
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.chipText, active && { color: '#fff' }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.chipRow}>
                {STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s]
                  const active = status === s
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[styles.chipText, active && { color: '#fff' }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.fieldLabel}>Due Date</Text>
              <View style={styles.datePreview}>
                <Ionicons name="calendar-outline" size={15} color="#C084F5" />
                <Text style={styles.datePreviewText}>
                  {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Month</Text>
                  <ScrollView style={styles.datePicker} showsVerticalScrollIndicator={false}>
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.dateOption, dueDate.getMonth() === i && styles.dateOptionActive]}
                        onPress={() => setMonth(i)}
                      >
                        <Text style={[styles.dateOptionText, dueDate.getMonth() === i && styles.dateOptionTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Day</Text>
                  <ScrollView style={styles.datePicker} showsVerticalScrollIndicator={false}>
                    {getDaysInMonth(dueDate.getFullYear(), dueDate.getMonth()).map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dateOption, dueDate.getDate() === d && styles.dateOptionActive]}
                        onPress={() => setDay(d)}
                      >
                        <Text style={[styles.dateOptionText, dueDate.getDate() === d && styles.dateOptionTextActive]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Year</Text>
                  <ScrollView style={styles.datePicker} showsVerticalScrollIndicator={false}>
                    {YEARS.map(y => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.dateOption, dueDate.getFullYear() === y && styles.dateOptionActive]}
                        onPress={() => setYear(y)}
                      >
                        <Text style={[styles.dateOptionText, dueDate.getFullYear() === y && styles.dateOptionTextActive]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setModalVisible(false); resetForm() }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{editingItem ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FDF6FF' },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  blobTop: { width: 220, height: 220, backgroundColor: '#F9C6D0', top: -60, right: -60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 12,
  },
  appName: { fontFamily: 'Outfit_900Black', fontSize: 14, color: '#C084F5', letterSpacing: 2 },
  pageTitle: { fontFamily: 'Outfit_700Bold', fontSize: 26, color: '#3D2C4E' },
  addBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#C084F5', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 20, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E8D5F5',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1, fontFamily: 'Outfit_400Regular',
    fontSize: 14, color: '#3D2C4E',
  },

  filterContainer: { height: 42, marginBottom: 8 },
  filterScroll: { flex: 1 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5, borderColor: '#E8D5F5',
  },
  filterTabActive: { backgroundColor: '#C084F5', borderColor: '#C084F5' },
  filterTabText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#9A85A4' },
  filterTabTextActive: { color: '#fff' },
  filterCount: {
    backgroundColor: '#F3E8FF', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#C084F5' },
  filterCountTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#3D2C4E' },
  emptySubtext: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#9A85A4', marginTop: 6 },

  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(61,44,78,0.3)',
  },
  modalSheet: {
    backgroundColor: '#FDF6FF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '92%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E8D5F5', alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#3D2C4E', marginBottom: 20 },

  fieldLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#7B5EA7', marginBottom: 8, marginLeft: 2 },
  input: {
    fontFamily: 'Outfit_400Regular',
    backgroundColor: '#F9F0FF', borderWidth: 1.5, borderColor: '#E8D5F5',
    borderRadius: 16, padding: 14, fontSize: 15, color: '#3D2C4E', marginBottom: 16,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },

  chipScrollContainer: { height: 46, marginBottom: 16 },
  chipScroll: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E8D5F5',
    backgroundColor: '#F9F0FF', marginRight: 4, marginBottom: 4,
  },
  chipActive: { backgroundColor: '#C084F5', borderColor: '#C084F5' },
  chipText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#9A85A4' },
  chipTextActive: { color: '#fff' },

  datePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9F0FF', borderWidth: 1.5, borderColor: '#E8D5F5',
    borderRadius: 14, padding: 12, marginBottom: 10,
  },
  datePreviewText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#3D2C4E' },

  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dateCol: { flex: 1 },
  dateColLabel: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 11,
    color: '#9A85A4', textAlign: 'center', marginBottom: 6,
  },
  datePicker: {
    height: 130, backgroundColor: '#F9F0FF',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E8D5F5',
  },
  dateOption: { paddingVertical: 7, alignItems: 'center' },
  dateOptionActive: { backgroundColor: '#C084F5', borderRadius: 10, marginHorizontal: 4 },
  dateOptionText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#9A85A4' },
  dateOptionTextActive: { color: '#fff', fontFamily: 'Outfit_700Bold' },

  modalBtns: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 18, padding: 15,
    alignItems: 'center', backgroundColor: '#F3E8FF',
  },
  cancelBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#9A85A4' },
  saveBtn: {
    flex: 1, borderRadius: 18, padding: 15,
    alignItems: 'center', backgroundColor: '#C084F5',
    shadowColor: '#C084F5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#fff' },
})