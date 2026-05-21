import { Tabs, Redirect } from 'expo-router'
import { Compass, PawPrint, User, Menu, BookOpen, MessageCircle } from 'lucide-react-native'
import { Colors, Typography } from '@/constants/theme'
import { useAuthStore } from '@/store/authStore'

// Tab navigator pour le rôle OWNER
// Guard: si le profil n'est pas owner, on redirige vers le bon navigator

export default function OwnerLayout() {
  const { profile } = useAuthStore()

  if (!profile) return <Redirect href="/auth/login" />
  if (profile.role !== 'owner') return <Redirect href="/(pro)/dashboard" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
        name="mes-reservations/index"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
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
      {/* Écrans hors tab bar — accessibles via navigation mais sans onglet */}
      <Tabs.Screen name="mes-animaux/nouveau"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="mes-animaux/[id]"      options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="explorer/[id]"         options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="explorer/booking"      options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="messages/[id]"         options={{ href: null, headerShown: false }} />
    </Tabs>
  )
}
