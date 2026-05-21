import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert, Platform,
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import {
  ArrowLeft, Calendar, Clock, DollarSign,
  MessageSquare, User, PawPrint,
  CheckCircle, XCircle, AlertCircle, Circle,
} from 'lucide-react-native'
import { bookingService, Booking } from '@/services/booking.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  sante:         'Santé & Soin',
  toilettage:    'Toilettage',
  'pet-sitting': 'Pet-sitting',
  education:     'Éducation',
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:         { label: 'En attente',   bg: Colors.warningLight,  color: Colors.warning  },
  accepted:        { label: 'Acceptée',     bg: Colors.successLight,  color: Colors.success  },
  in_progress:     { label: 'En cours',     bg: '#DBEAFE',            color: Colors.info     },
  completed:       { label: 'Terminée',     bg: Colors.successLight,  color: Colors.success  },
  rejected:        { label: 'Refusée',      bg: Colors.errorLight,    color: Colors.error    },
  cancelled:       { label: 'Annulée',      bg: Colors.errorLight,    color: Colors.error    },
  no_show:         { label: 'Absent',       bg: Colors.warningLight,  color: Colors.warning  },
  rescheduled:     { label: 'Reprogrammée', bg: Colors.warningLight,  color: Colors.warning  },
  blocked:         { label: 'Bloqué',       bg: Colors.surfaceAlt,    color: Colors.textMuted},
  awaiting_payment:{ label: 'Paiement',     bg: Colors.warningLight,  color: Colors.warning  },
}

type StepState = 'done' | 'active' | 'pending' | 'error' | 'warn'
interface TimelineStep { label: string; state: StepState; detail?: string }

function buildTimeline(b: Booking): TimelineStep[] {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  switch (b.status) {
    case 'pending':
      return [
        { label: 'Demande reçue',    state: 'done',   detail: fmt(b.created_at) },
        { label: 'En attente',       state: 'active' },
      ]
    case 'accepted':
      return [
        { label: 'Demande reçue',    state: 'done' },
        { label: 'Acceptée',         state: 'done' },
        { label: 'Prestation prévue',state: 'active', detail: fmt(b.scheduled_at) },
      ]
    case 'in_progress':
      return [
        { label: 'Demande reçue',    state: 'done'   },
        { label: 'Acceptée',         state: 'done'   },
        { label: 'En cours',         state: 'active' },
        { label: 'À terminer',       state: 'pending'},
      ]
    case 'completed':
      return [
        { label: 'Demande reçue',    state: 'done' },
        { label: 'Acceptée',         state: 'done' },
        { label: 'En cours',         state: 'done' },
        { label: 'Terminée',         state: 'done', detail: fmt(b.updated_at) },
      ]
    case 'rejected':
      return [
        { label: 'Demande reçue',    state: 'done'  },
        { label: 'Refusée',          state: 'error', detail: b.reject_reason ?? undefined },
      ]
    case 'cancelled':
      return [
        { label: 'Demande reçue',    state: 'done'  },
        { label: 'Annulée',          state: 'error', detail: b.cancel_reason ?? undefined },
      ]
    case 'no_show':
      return [
        { label: 'Demande reçue',    state: 'done' },
        { label: 'Acceptée',         state: 'done' },
        { label: 'Client absent',    state: 'warn' },
      ]
    default:
      return [{ label: b.status, state: 'active' }]
  }
}

function StepIcon({ state }: { state: StepState }) {
  const sz = 22
  if (state === 'done')   return <CheckCircle size={sz} color={Colors.success} />
  if (state === 'error')  return <XCircle     size={sz} color={Colors.error}   />
  if (state === 'warn')   return <AlertCircle size={sz} color={Colors.warning} />
  if (state === 'active') return <CheckCircle size={sz} color={Colors.primary} />
  return <Circle size={sz} color={Colors.border} />
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookingDetailPro() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    try {
      setBooking(await bookingService.getById(id))
    } catch {
      if (Platform.OS === 'web') window.alert('Impossible de charger la prestation.')
      else Alert.alert('Erreur', 'Impossible de charger la prestation.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  if (!booking) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>Prestation introuvable.</Text>
        <TouchableOpacity onPress={() => router.navigate('/(pro)/calendrier')} style={s.backBtn}>
          <Text style={s.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const status  = STATUS_META[booking.status] ?? STATUS_META.pending
  const steps   = buildTimeline(booking)
  const owner   = booking.owner
  const pet     = booking.pet

  const scheduledDate = new Date(booking.scheduled_at)
  const dateStr = scheduledDate.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => router.navigate('/(pro)/calendrier')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Prestation</Text>
        <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Résumé ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Résumé</Text>
          <View style={s.infoRow}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={s.infoText}>{dateStr}</Text>
          </View>
          <View style={s.infoRow}>
            <Clock size={16} color={Colors.primary} />
            <Text style={s.infoText}>{timeStr}
              {booking.duration_min ? `  ·  ${booking.duration_min} min` : ''}
            </Text>
          </View>
          {booking.price != null && (
            <View style={s.infoRow}>
              <DollarSign size={16} color={Colors.primary} />
              <Text style={s.infoText}>{booking.price} MAD</Text>
            </View>
          )}
          <View style={[s.servicePill, { marginTop: Spacing.sm }]}>
            <Text style={s.servicePillText}>
              {SERVICE_LABELS[booking.service_type] ?? booking.service_type}
            </Text>
          </View>
        </View>

        {/* ── Timeline ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Suivi</Text>
          {steps.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepLeft}>
                <StepIcon state={step.state} />
                {i < steps.length - 1 && (
                  <View style={[s.stepLine,
                    step.state === 'done' && { backgroundColor: Colors.success }
                  ]} />
                )}
              </View>
              <View style={s.stepContent}>
                <Text style={[s.stepLabel,
                  step.state === 'pending' && { color: Colors.textMuted }
                ]}>{step.label}</Text>
                {step.detail && <Text style={s.stepDetail}>{step.detail}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* ── Animal ── */}
        {pet && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Animal</Text>
            <View style={s.personRow}>
              <View style={s.petAvatar}>
                {pet.main_photo_url
                  ? <Image source={{ uri: pet.main_photo_url }} style={s.petAvatarImg} />
                  : <PawPrint size={22} color={Colors.primaryDark} />
                }
              </View>
              <View>
                <Text style={s.personName}>{pet.name}</Text>
                <Text style={s.personSub}>{pet.species}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Propriétaire ── */}
        {owner && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Propriétaire</Text>
            <View style={s.personRow}>
              <View style={s.personAvatar}>
                {owner.avatar_url
                  ? <Image source={{ uri: owner.avatar_url }} style={s.personAvatarImg} />
                  : <User size={22} color={Colors.primaryDark} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.personName}>{owner.first_name} {owner.last_name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Message du propriétaire ── */}
        {booking.message && (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <MessageSquare size={15} color={Colors.textSecondary} />
              <Text style={s.cardTitle}>Message du propriétaire</Text>
            </View>
            <Text style={s.noteText}>{booking.message}</Text>
          </View>
        )}

        {/* ── Note du pro ── */}
        {booking.pro_note && (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <MessageSquare size={15} color={Colors.primary} />
              <Text style={s.cardTitle}>Votre note</Text>
            </View>
            <Text style={s.noteText}>{booking.pro_note}</Text>
          </View>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['2xl'] },
  errorText:   { fontSize: Typography.base, color: Colors.textSecondary },
  backBtn:     { marginTop: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md },
  backBtnText: { color: Colors.textInverse, fontWeight: Typography.semibold },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backButton:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  statusText:  { fontSize: Typography.xs, fontWeight: Typography.semibold },

  scroll: { padding: Spacing.base, gap: Spacing.md },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardTitle:    { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },

  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },

  servicePill:     { alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  servicePillText: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.semibold },

  stepRow:     { flexDirection: 'row', gap: Spacing.md, minHeight: 44 },
  stepLeft:    { alignItems: 'center', width: 22 },
  stepLine:    { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4, marginBottom: -4 },
  stepContent: { flex: 1, paddingBottom: Spacing.sm },
  stepLabel:   { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  stepDetail:  { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  personRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  personAvatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  personAvatarImg: { width: 48, height: 48 },
  personName:      { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  personSub:       { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },

  petAvatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  petAvatarImg: { width: 48, height: 48 },

  noteText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
})
