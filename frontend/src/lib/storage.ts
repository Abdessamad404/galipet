import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Wrapper unifié pour le stockage du token.
// - Mobile (iOS/Android) → SecureStore (chiffré, stockage sécurisé dans le keychain)
// - Web → localStorage (non chiffré, uniquement pour le développement/test)
// On importe toujours ce module à la place de SecureStore directement.

export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key)
    }
    return SecureStore.getItemAsync(key)
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },

  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}
