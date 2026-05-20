import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { Colors } from '@/constants/theme'

// Point d'entrée de l'app.
// 1. Attend que le store soit initialisé (vérifie le token en SecureStore)
// 2. Si connecté → redirige vers le bon groupe de tabs selon le rôle
// 3. Si non connecté → redirige vers /auth/login

export default function Index() {
  const { profile, isInitialized } = useAuthStore()

  // Pendant que le store vérifie le token → spinner de chargement
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!profile) {
    return <Redirect href="/auth/login" />
  }

  // Redirection selon le rôle
  // 'both' → on envoie vers owner par défaut (le switch de rôle sera dans F02)
  if (profile.role === 'professional') {
    return <Redirect href="/(pro)/dashboard" />
  }

  return <Redirect href="/(owner)/explorer" />
}
