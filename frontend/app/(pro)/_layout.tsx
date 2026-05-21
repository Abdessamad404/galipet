import { Tabs, Redirect } from 'expo-router'
import { LayoutDashboard, CalendarDays, User, Menu } from 'lucide-react-native'
import { Colors, Typography } from '@/constants/theme'
import { useAuthStore } from '@/store/authStore'
import { AppHeader } from '@/components/AppHeader'

// Tab navigator pour le rôle PROFESSIONAL
// 4 tabs : Dashboard · Calendrier · Profil · Gali'Pet
// Messages accessibles via l'AppHeader (icône), pas en tab
// Réservations accessible via navigation directe depuis le dashboard

export default function ProLayout() {
  const { profile, isInitialized } = useAuthStore()

  // Attendre que initialize() ait fini avant de décider de rediriger.
  // Sans ça, le refresh déconnecte car profile=null pendant le chargement async.
  if (!isInitialized) return null
  if (!profile) return <Redirect href="/auth/login" />
  if (profile.role !== 'professional') return <Redirect href="/(owner)/explorer" />

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader role="professional" />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: Typography.medium,
        },
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendrier/index"
        options={{
          title: 'Calendrier',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="galipet/index"
        options={{
          title: "Gali'Pet",
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />

      {/* ── Écrans hors tab bar ── */}
      <Tabs.Screen name="reservations/index" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="messages/index"     options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="messages/[id]"      options={{ href: null, headerShown: false }} />
    </Tabs>
  )
}
