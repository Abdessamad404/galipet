import { Tabs, Redirect } from 'expo-router'
import { Compass, PawPrint, User, Menu } from 'lucide-react-native'
import { Colors, Typography } from '@/constants/theme'
import { useAuthStore } from '@/store/authStore'
import { AppHeader } from '@/components/AppHeader'

// Tab navigator pour le rôle OWNER
// 4 tabs : Explorer · Mes Animaux · Profil · Gali'Pet
// Messages + Réservations accessibles via l'AppHeader (icônes), pas en tab

export default function OwnerLayout() {
  const { profile, isInitialized } = useAuthStore()

  // Attendre que initialize() ait fini avant de décider de rediriger.
  // Sans ça, le refresh déconnecte car profile=null pendant le chargement async.
  if (!isInitialized) return null
  if (!profile) return <Redirect href="/auth/login" />
  if (profile.role !== 'owner') return <Redirect href="/(pro)/dashboard" />

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader role="owner" />,
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
        name="explorer/index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mes-animaux/index"
        options={{
          title: 'Mes Animaux',
          tabBarIcon: ({ color, size }) => <PawPrint size={size} color={color} />,
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
      <Tabs.Screen name="mes-reservations/index" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="mes-reservations/[id]"  options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="messages/index"         options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="messages/[id]"          options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="mes-animaux/nouveau"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="mes-animaux/[id]"       options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="explorer/[id]"          options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="explorer/booking"       options={{ href: null, headerShown: false }} />
    </Tabs>
  )
}
