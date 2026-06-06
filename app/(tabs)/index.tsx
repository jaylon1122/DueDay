import { ActivityIndicator, View } from 'react-native'
import { useThemeStore } from '../../store/ThemeStore'

export default function Index() {
  const theme = useThemeStore((state) => state.theme)

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'dark' ? '#000' : '#FDF6FF' }}>
      <ActivityIndicator size="large" color="#C084F5" />
    </View>
  )
}