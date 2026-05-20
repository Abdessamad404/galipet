import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Platform,
  Modal, TextInput, KeyboardAvoidingView,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Calendar, Clock, X, Star, MessageSquare } from 'lucide-react-native'
import { bookingService, Booking, BookingStatus } from '@/services/booking.service'
import { reviewService, Review } from '@/services/review.service'
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

// ── Review modal state ──
interface ReviewModalState {
  visible:   boolean
  bookingId: string
  proName:   string
  existing:  Review | null
  rating:    number
  comment:   string
  loading:   boolean
}

const EMPTY_MODAL: ReviewModalState = {
  visible: false, bookingId: '', proName: '', existing: null,
  rating: 0, comment: '', loading: false,
}

export default function MesReservationsScreen() {
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal]           = useState<ReviewModalState>(EMPTY_MODAL)

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
    const booking = bookings.find((b) => b.id === id)
    const isAccepted = booking?.status === 'accepted'
    const msg = isAccepted
      ? 'Le professionnel a déjà accepté votre demande. Annuler quand même ?'
      : 'Annuler cette réservation ?'

    const confirm = Platform.OS === 'web'
      ? window.confirm(msg)
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Annuler la réservation', msg, [
            { text: 'Non', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Oui, annuler', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirm) return
    try {
      const updated = await bookingService.cancel(id)
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b))
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Impossible d\'annuler.'
      if (Platform.OS === 'web') window.alert(errMsg)
      else Alert.alert('Erreur', errMsg)
    }
  }

  async function openReviewModal(booking: Booking) {
    const proName = booking.pro?.company_name || `${booking.pro?.first_name} ${booking.pro?.last_name}`
    try {
      const existing = await reviewService.getByBooking(booking.id)
      setModal({
        visible: true,
        bookingId: booking.id,
        proName,
        existing,
        rating:  existing?.rating  ?? 0,
        comment: existing?.comment ?? '',
        loading: false,
      })
    } catch {
      setModal({ visible: true, bookingId: booking.id, proName, existing: null, rating: 0, comment: '', loading: false })
    }
  }

  async function submitReview() {
    if (modal.rating === 0) {
      if (Platform.OS === 'web') window.alert('Veuillez choisir une note.')
      else Alert.alert('Note manquante', 'Veuillez choisir une note entre 1 et 5 étoiles.')
      return
    }
    setModal((m) => ({ ...m, loading: true }))
    try {
      if (modal.existing) {
        await reviewService.update(modal.existing.id, modal.rating, modal.comment || undefined)
      } else {
        await reviewService.create(modal.bookingId, modal.rating, modal.comment || undefined)
      }
      setModal(EMPTY_MODAL)
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Impossible d\'enregistrer l\'avis.'
      setModal((m) => ({ ...m, loading: false }))
      if (Platform.OS === 'web') window.alert(errMsg)
      else Alert.alert('Erreur', errMsg)
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
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              onReview={openReviewModal}
            />
          ))
        )}
      </ScrollView>

      {/* ── Modal Avis ── */}
      <Modal visible={modal.visible} transparent animationType="slide" onRequestClose={() => setModal(EMPTY_MODAL)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {modal.existing ? 'Modifier votre avis' : 'Laisser un avis'}
            </Text>
            <Text style={styles.modalSubtitle}>{modal.proName}</Text>

            {/* Étoiles */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setModal((m) => ({ ...m, rating: star }))} activeOpacity={0.7}>
                  <Star
                    size={36}
                    color={star <= modal.rating ? '#F59E0B' : Colors.border}
                    fill={star <= modal.rating ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {modal.rating === 0 ? 'Sélectionnez une note' :
               modal.rating === 1 ? '⭐ Mauvais' :
               modal.rating === 2 ? '⭐⭐ Passable' :
               modal.rating === 3 ? '⭐⭐⭐ Bien' :
               modal.rating === 4 ? '⭐⭐⭐⭐ Très bien' :
               '⭐⭐⭐⭐⭐ Excellent'}
            </Text>

            {/* Commentaire */}
            <TextInput
              style={styles.commentInput}
              placeholder="Votre commentaire (optionnel)"
              placeholderTextColor={Colors.textMuted}
              value={modal.comment}
              onChangeText={(t) => setModal((m) => ({ ...m, comment: t }))}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModal(EMPTY_MODAL)} disabled={modal.loading}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitReview} disabled={modal.loading} activeOpacity={0.8}>
                {modal.loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalSubmitText}>{modal.existing ? 'Modifier' : 'Publier'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

function BookingCard({
  booking, onCancel, onReview,
}: {
  booking: Booking
  onCancel: (id: string) => void
  onReview: (b: Booking) => void
}) {
  const status = STATUS_CONFIG[booking.status]
  const date   = new Date(booking.scheduled_at)

  return (
    <View style={styles.card}>
      {/* En-tête */}
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

      {/* Messages pro */}
      {booking.reject_reason && (
        <Text style={styles.cardNote}>Refusée : {booking.reject_reason}</Text>
      )}
      {booking.cancel_reason && (
        <Text style={styles.cardNote}>Annulée : {booking.cancel_reason}</Text>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        {(booking.status === 'pending' || booking.status === 'accepted') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(booking.id)} activeOpacity={0.7}>
            <X size={14} color={Colors.error} />
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'completed' && (
          <TouchableOpacity style={styles.reviewBtn} onPress={() => onReview(booking)} activeOpacity={0.7}>
            <Star size={14} color={Colors.primary} />
            <Text style={styles.reviewBtnText}>Laisser un avis</Text>
          </TouchableOpacity>
        )}
      </View>
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

  cardActions:   { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  cancelBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cancelBtnText: { fontSize: Typography.sm, color: Colors.error, fontWeight: Typography.medium },
  reviewBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  reviewBtnText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing['2xl'], gap: Spacing.md,
  },
  modalTitle:    { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },
  modalSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },

  starsRow:    { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  ratingLabel: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },

  commentInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Typography.sm, color: Colors.textPrimary,
    minHeight: 96, backgroundColor: Colors.background,
  },

  modalActions:     { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  modalCancelBtn:   {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText:  { fontSize: Typography.md, color: Colors.textSecondary },
  modalSubmitBtn:   {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  modalSubmitText:  { fontSize: Typography.md, color: '#fff', fontWeight: Typography.semibold },
})
