import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MessageCircle, CalendarDays, Bell, BookOpen } from 'lucide-react-native'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing } from '@/constants/theme'

// ─── AppHeader ────────────────────────────────────────────────────────────────
// Barre de navigation partagée : avatar (gauche) · logo (centre) · icônes (droite)
// role="owner"        → Messages + Agenda (réservations) + Notifs
// role="professional" → Messages + Notifs

type Props = { role: 'owner' | 'professional' }

export function AppHeader({ role }: Props) {
  const { profile }  = useAuthStore()
  const insets        = useSafeAreaInsets()

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`
    : '?'

  const goProfile       = () =>
    role === 'owner'
      ? router.navigate('/(owner)/profil')
      : router.navigate('/(pro)/profil')

  const goMessages      = () =>
    role === 'owner'
      ? router.push('/(owner)/messages')
      : router.push('/(pro)/messages')

  const goAgenda        = () => router.push('/(owner)/mes-reservations')
  const goReservations  = () => router.push('/(pro)/reservations')

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ── Avatar (gauche) ── */}
      <TouchableOpacity onPress={goProfile} activeOpacity={0.75} style={s.left}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Logo (centre) ── */}
      <View style={s.center} pointerEvents="none">
        <Text style={s.logo}>gali'pet</Text>
      </View>

      {/* ── Icônes (droite) ── */}
      <View style={s.right}>
        <TouchableOpacity onPress={goMessages} activeOpacity={0.7} style={s.iconBtn}>
          <MessageCircle size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {role === 'owner' && (
          <TouchableOpacity onPress={goAgenda} activeOpacity={0.7} style={s.iconBtn}>
            <CalendarDays size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {role === 'professional' && (
          <TouchableOpacity onPress={goReservations} activeOpacity={0.7} style={s.iconBtn}>
            <BookOpen size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Notifs — placeholder F07 */}
        <TouchableOpacity activeOpacity={0.7} style={s.iconBtn}>
          <Bell size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HEADER_H = 52

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H + 44, // 44 = typical status bar — actual height driven by paddingTop
    minHeight: HEADER_H,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
  },

  left: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
