import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'
export const getProfile = async (userId: string) => {
  return await supabase.from('profiles').select('*').eq('id', userId).single()
}

export const upsertProfile = async (userId: string, data: any) => {
  return await supabase.from('profiles').upsert({ id: userId, ...data })
}

export const uploadAvatar = async (userId: string, uri: string) => {
  const ext = uri.split('.').pop()
  const fileName = `${userId}.${ext}`

  const response = await fetch(uri)
  const blob = await response.blob()

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, arrayBuffer, {
      contentType: `image/${ext}`,
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
  return data.publicUrl
}

export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Permission to access gallery was denied')
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled) return null
  return result.assets[0].uri
}