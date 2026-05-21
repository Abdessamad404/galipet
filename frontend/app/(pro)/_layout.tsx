import { Tabs } from 'expo-router'
import { LayoutDashboard, CalendarDays, User, Menu, BookOpen, MessageCircle } from 'lucide-react-native'
import { Colors, Typography } from '@/constants/theme'

// Tab navigator pour le rôle PROFESSIONAL
// 4 tabs : Dashboard · Calendrier · Mon Profil · Menu Gali'Pet
// Différence vs owner : Dashboard en 1er, pas d'icône Agenda dans le header (elle est dans la tab bar)

export default function ProLayout() {
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
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservations/index"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
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
      <Tabs.Screen name="messages/[id]" options={{ href: null, headerShown: false }} />
    </Tabs>
  )
}
