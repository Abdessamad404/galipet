import { Tabs } from 'expo-router'
import { Compass, PawPrint, User, Menu } from 'lucide-react-native'
import { Colors, Typography } from '@/constants/theme'

// Tab navigator pour le rôle OWNER
// 4 tabs : Explorer · Mes Animaux · Mon Profil · Menu Gali'Pet

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
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
          title: 'Mon Profil',
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
    </Tabs>
  )
}
