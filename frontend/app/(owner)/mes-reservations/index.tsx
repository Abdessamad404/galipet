import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Calendar, Clock, X } from 'lucide-react-native'
import { bookingService, Booking, BookingStatus } from '@/services/booking.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',  color: Colors.warning,  bg: Colors.warningLight  },
  accepted:  { label: 'Acceptée',    color: Colors.success,  bg: Colors.successLight  },
  rejected:  { label: 'Refusée',     color: Colors.error,    bg: Colors.errorLight    },
  cancelled: { label: 'Annulée',     color: Colors.textMuted, bg: Colors.surfaceAlt   },
  completed: { label: 'Terminée',    color: Colors.info,     bg: '#EFF6FF'            },
}

const SERVICE_LABELS: Record<string, string> = {
  grooming: 'Toilettage', sitting: 'Pet-sitting', training: 'Éducation',
  vet: 'Vétérinaire', walking: 'Promenade', boarding: 'Pension',
}

export default function MesReservationsScreen() {
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => { load() }, [])
  )

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await bookingService.getOwnerBookings()
      setBookings(data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleCancel(id: string) {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Annuler cette réservation ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Annuler', 'Annuler cette réservation ?', [
            { text: 'Non', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Oui, annuler', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirm) return
    try {
      const updated = await bookingService.cancel(id)
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b))
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Impossible d\'annuler.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Réservations</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, bookings.length === 0 && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptySubtitle}>Explorez les professionnels pour faire votre première réservation.</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
          ))
        )}
      </ScrollView>
    </View>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const status = STATUS_CONFIG[booking.status]
  const date = new Date(booking.scheduled_at)

  return (
    <View style={styles.card}>
      {/* En-tête carte */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardService}>{SERVICE_LABELS[booking.service_type] ?? booking.service_type}</Text>
          <Text style={styles.cardPro}>
            {booking.pro?.company_name || `${booking.pro?.first_name} ${booking.pro?.last_name}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Date */}
      <View style={styles.cardMeta}>
        <Clock size={13} color={Colors.textMuted} />
        <Text style={styles.cardMetaText}>
          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' à '}
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Animal */}
      {booking.pet && (
        <Text style={styles.cardPet}>🐾 {booking.pet.name}</Text>
      )}

      {/* Message du pro */}
      {booking.reject_reason && (
        <Text style={styles.cardNote}>Refusée : {booking.reject_reason}</Text>
      )}
      {booking.cancel_reason && (
        <Text style={styles.cardNote}>Annulée : {booking.cancel_reason}</Text>
      )}

      {/* Actions */}
      {(booking.status === 'pending' || booking.status === 'accepted') && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(booking.id)} activeOpacity={0.7}>
          <X size={14} color={Colors.error} />
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  list:      { padding: Spacing['2xl'], gap: Spacing.md },
  listEmpty: { flex: 1 },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['3xl'] },
  emptyTitle:    { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.sm, ...Shadow.sm,
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cardService:  { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  cardPro:      { fontSize: Typography.sm, color: Colors.textSecondary },
  cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardMetaText: { fontSize: Typography.sm, color: Colors.textMuted },
  cardPet:      { fontSize: Typography.sm, color: Colors.textSecondary },
  cardNote:     { fontSize: Typography.sm, color: Colors.textMuted, fontStyle: 'italic' },

  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  statusText:  { fontSize: Typography.xs, fontWeight: Typography.semibold },

  cancelBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', marginTop: Spacing.xs },
  cancelBtnText: { fontSize: Typography.sm, color: Colors.error, fontWeight: Typography.medium },
})
