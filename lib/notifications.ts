import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C084F5',
    })
  }

  if (!Device.isDevice) {
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  return true
}

export const scheduleAssignmentNotification = async (
  assignmentId: string,
  title: string,
  dueDate: Date
) => {
  const notificationDate = new Date(dueDate)
  notificationDate.setHours(9, 0, 0, 0)

  if (notificationDate.getTime() <= Date.now()) {
    return null
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Assignment Due Today!',
      body: title,
      data: { assignmentId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
    },
  })

  return id
}

export const cancelNotification = async (notificationId: string) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}

export const checkAndNotifyDueToday = async (assignments: any[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dueToday = assignments.filter(a => {
    if (a.status === 'done') return false
    const raw = a.due_date.replace('T', ' ').split(' ')[0]
    const [year, month, day] = raw.split('-').map(Number)
    const dueDate = new Date(year, month - 1, day)
    return dueDate >= today && dueDate < tomorrow
  })

  if (dueToday.length > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: dueToday.length === 1 ? '📅 Assignment Due Today!' : `📅 ${dueToday.length} Assignments Due Today!`,
        body: dueToday.map(a => a.title).join(', '),
      },
      trigger: null,
    })
  }

  return dueToday
}