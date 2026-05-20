import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Calendar, Check, X, CheckCircle } from 'lucide-react-native'
import { bookingService, Booking, BookingStatus } from '@/services/booking.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',  color: Colors.warning,   bg: Colors.warningLight },
  accepted:  { label: 'Acceptée',    color: Colors.success,   bg: Colors.successLight },
  rejected:  { label: 'Refusée',     color: Colors.error,     bg: Colors.errorLight   },
  cancelled: { label: 'Annulée',     color: Colors.textMuted, bg: Colors.surfaceAlt   },
  completed: { label: 'Terminée',    color: Colors.info,      bg: '#EFF6FF'           },
}

const SERVICE_LABELS: Record<string, string> = {
  grooming: 'Toilettage', sitting: 'Pet-sitting', training: 'Éducation',
  vet: 'Vétérinaire', walking: 'Promenade', boarding: 'Pension',
}

export default function ProReservationsScreen() {
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => { load() }, [])
  )

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await bookingService.getProBookings()
      setBookings(data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleAccept(id: string) {
    try {
      const updated = await bookingService.accept(id)
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b))
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Impossible d\'accepter.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    }
  }

  async function handleReject(id: string) {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Refuser cette demande ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Refuser', 'Refuser cette demande ?', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Refuser', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirm) return
    try {
      const updated = await bookingService.reject(id)
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b))
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Impossible de refuser.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    }
  }

  async function handleComplete(id: string) {
    try {
      const updated = await bookingService.complete(id)
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b))
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Impossible de terminer.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  const pending   = bookings.filter((b) => b.status === 'pending')
  const upcoming  = bookings.filter((b) => b.status === 'accepted')
  const past      = bookings.filter((b) => ['rejected', 'cancelled', 'completed'].includes(b.status))

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Réservations</Text>
        {pending.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pending.length}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, bookings.length === 0 && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptySubtitle}>Les demandes de réservation de vos clients apparaîtront ici.</Text>
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <Section title={`En attente (${pending.length})`}>
                {pending.map((b) => (
                  <ProBookingCard
                    key={b.id} booking={b}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onComplete={handleComplete}
                  />
                ))}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section title="À venir">
                {upcoming.map((b) => (
                  <ProBookingCard
                    key={b.id} booking={b}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onComplete={handleComplete}
                  />
                ))}
              </Section>
            )}
            {past.length > 0 && (
              <Section title="Historique">
                {past.map((b) => (
                  <ProBookingCard
                    key={b.id} booking={b}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onComplete={handleComplete}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  )
}

function ProBookingCard({ booking, onAccept, onReject, onComplete }: {
  booking: Booking
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onComplete: (id: string) => void
}) {
  const status = STATUS_CONFIG[booking.status]
  const date = new Date(booking.scheduled_at)

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardService}>{SERVICE_LABELS[booking.service_type] ?? booking.service_type}</Text>
          <Text style={styles.cardOwner}>
            {booking.owner?.first_name} {booking.owner?.last_name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.cardDate}>
        📅 {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
        {' à '}
        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {booking.pet && <Text style={styles.cardPet}>🐾 {booking.pet.name} ({booking.pet.species})</Text>}
      {booking.message && <Text style={styles.cardMessage}>"{booking.message}"</Text>}

      {/* Actions */}
      {booking.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(booking.id)} activeOpacity={0.8}>
            <Check size={14} color={Colors.textInverse} />
            <Text style={styles.acceptBtnText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(booking.id)} activeOpacity={0.8}>
            <X size={14} color={Colors.error} />
            <Text style={styles.rejectBtnText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      )}
      {booking.status === 'accepted' && (
        <TouchableOpacity style={styles.completeBtn} onPress={() => onComplete(booking.id)} activeOpacity={0.8}>
          <CheckCircle size={14} color={Colors.success} />
          <Text style={styles.completeBtnText}>Marquer terminée</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  badge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textInverse },

  list:      { padding: Spacing['2xl'], gap: Spacing.xl },
  listEmpty: { flex: 1 },
  sectionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['3xl'] },
  emptyTitle:    { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.sm, ...Shadow.sm,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cardService: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  cardOwner:   { fontSize: Typography.sm, color: Colors.textSecondary },
  cardDate:    { fontSize: Typography.sm, color: Colors.textMuted },
  cardPet:     { fontSize: Typography.sm, color: Colors.textSecondary },
  cardMessage: { fontSize: Typography.sm, color: Colors.textMuted, fontStyle: 'italic' },

  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  statusText:  { fontSize: Typography.xs, fontWeight: Typography.semibold },

  actions:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  acceptBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.success, borderRadius: Radius.md, paddingVertical: Spacing.sm },
  acceptBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textInverse },
  rejectBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1.5, borderColor: Colors.error, borderRadius: Radius.md, paddingVertical: Spacing.sm },
  rejectBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.error },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', marginTop: Spacing.xs },
  completeBtnText: { fontSize: Typography.sm, color: Colors.success, fontWeight: Typography.medium },
})
