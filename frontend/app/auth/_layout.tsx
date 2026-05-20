import { Stack } from 'expo-router'

// Layout pour le groupe auth (login, register, forgot-password)
// Pas de header — on le gère manuellement dans chaque écran
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
