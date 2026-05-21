import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, Image,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, ChevronRight, X, Clock, Tag } from 'lucide-react-native'
import { bookingService, Booking } from '@/services/booking.service'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_FR  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août',
                   'Septembre','Octobre','Novembre','Décembre']

const ACTIVITY_LABELS: Record<string, string> = {
  grooming: 'Toilettage', sitting: 'Pet-sitting', training: 'Éducation',
  vet: 'Vétérinaire', walking: 'Promenade', boarding: 'Pension',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: Colors.warning,   bg: Colors.warningLight },
  accepted:  { label: 'Confirmée',  color: Colors.info,      bg: '#DBEAFE' },
  completed: { label: 'Terminée',   color: Colors.success,   bg: Colors.successLight },
  cancelled: { label: 'Annulée',    color: Colors.textMuted, bg: Colors.surfaceAlt },
  rejected:  { label: 'Refusée',    color: Colors.error,     bg: Colors.errorLight },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth()  === b.getMonth()
    && a.getDate()   === b.getDate()
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalendrierScreen() {
  const [weekStart, setWeekStart]   = useState(() => startOfWeek(new Date()))
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected]     = useState<Booking | null>(null)

  useFocusEffect(useCallback(() => { load() }, []))

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try { setBookings(await bookingService.getProBookings()) } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  // Group bookings by YYYY-MM-DD
  const byDay: Record<string, Booking[]> = {}
  for (const b of bookings) {
    const key = new Date(b.scheduled_at).toISOString().slice(0, 10)
    ;(byDay[key] = byDay[key] ?? []).push(b)
  }

  const weekEnd   = addDays(weekStart, 6)
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTH_FR[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${weekStart.getDate()} ${MONTH_FR[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_FR[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>Calendrier</Text>
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => setWeekStart(w => addDays(w, -7))} activeOpacity={0.7}>
            <ChevronLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.weekLabel}>{weekLabel}</Text>
          <TouchableOpacity style={s.navBtn} onPress={() => setWeekStart(w => addDays(w, 7))} activeOpacity={0.7}>
            <ChevronRight size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.todayBtn} onPress={() => setWeekStart(startOfWeek(new Date()))} activeOpacity={0.7}>
          <Text style={s.todayBtnText}>Aujourd'hui</Text>
        </TouchableOpacity>
      </View>

      {/* ── Week grid ── */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        contentContainerStyle={s.grid}
      >
        {days.map((day) => {
          const key      = day.toISOString().slice(0, 10)
          const slots    = (byDay[key] ?? []).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
          const isToday  = isSameDay(day, today)
          const isPast   = day < today && !isToday

          return (
            <View key={key} style={[s.dayCol, isPast && s.dayColPast]}>
              <View style={[s.dayHeader, isToday && s.dayHeaderToday]}>
                <Text style={[s.dayName, isToday && s.dayNameToday]}>{DAY_SHORT[day.getDay()]}</Text>
                <Text style={[s.dayNum,  isToday && s.dayNumToday]}>{day.getDate()}</Text>
              </View>

              {slots.length === 0 ? (
                <View style={s.emptyDay}><Text style={s.emptyDayText}>–</Text></View>
              ) : (
                slots.map((b) => {
                  const st        = STATUS_META[b.status] ?? STATUS_META.pending
                  const ownerName = b.owner ? `${b.owner.first_name} ${b.owner.last_name}` : 'Client'
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[s.slot, { backgroundColor: st.bg, borderLeftColor: st.color }]}
                      onPress={() => setSelected(b)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.slotTime, { color: st.color }]}>{fmtTime(b.scheduled_at)}</Text>
                      <Text style={s.slotSvc}  numberOfLines={1}>{ACTIVITY_LABELS[b.service_type] ?? b.service_type}</Text>
                      <Text style={s.slotOwner} numberOfLines={1}>{ownerName}</Text>
                    </TouchableOpacity>
                  )
                })
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* ── Detail modal ── */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <TouchableOpacity style={m.closeBtn} onPress={() => setSelected(null)} activeOpacity={0.7}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {selected && <DetailContent booking={selected} />}
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Detail sheet content ─────────────────────────────────────────────────────

function DetailContent({ booking: b }: { booking: Booking }) {
  const st        = STATUS_META[b.status] ?? STATUS_META.pending
  const ownerName = b.owner ? `${b.owner.first_name} ${b.owner.last_name}` : 'Client'
  const initials  = b.owner ? `${b.owner.first_name[0]}${b.owner.last_name[0]}` : '?'
  const date      = new Date(b.scheduled_at)
  const dateStr   = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr   = fmtTime(b.scheduled_at)

  return (
    <ScrollView contentContainerStyle={m.content}>
      <View style={[m.badge, { backgroundColor: st.bg }]}>
        <View style={[m.dot, { backgroundColor: st.color }]} />
        <Text style={[m.badgeText, { color: st.color }]}>{st.label}</Text>
      </View>

      <Text style={m.service}>{ACTIVITY_LABELS[b.service_type] ?? b.service_type}</Text>

      <View style={m.row}>
        <Clock size={16} color={Colors.textSecondary} />
        <View>
          <Text style={m.rowMain}>{dateStr}</Text>
          <Text style={m.rowSub}>{timeStr}{b.duration_min ? ` · ${b.duration_min} min` : ''}</Text>
        </View>
      </View>

      <View style={m.row}>
        <View style={m.avatar}>
          {b.owner?.avatar_url
            ? <Image source={{ uri: b.owner.avatar_url }} style={m.avatarImg} />
            : <Text style={m.avatarInitials}>{initials}</Text>
          }
        </View>
        <View>
          <Text style={m.rowMain}>{ownerName}</Text>
          <Text style={m.rowSub}>Client</Text>
        </View>
      </View>

      {b.price != null && (
        <View style={m.row}>
          <Tag size={16} color={Colors.textSecondary} />
          <Text style={m.rowMain}>{b.price} €</Text>
        </View>
      )}

      {b.message && (
        <View style={m.box}>
          <Text style={m.boxLabel}>Message du client</Text>
          <Text style={m.boxText}>{b.message}</Text>
        </View>
      )}

      {b.pro_note && (
        <View style={m.box}>
          <Text style={m.boxLabel}>Note pro</Text>
          <Text style={m.boxText}>{b.pro_note}</Text>
        </View>
      )}
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm,
  },
  title:        { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  navRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:       { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: Colors.surfaceAlt },
  weekLabel:    { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  todayBtn:     { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  todayBtnText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.primaryDark },

  grid:       { flexDirection: 'row', padding: Spacing.sm, gap: 4 },

  dayCol:     { flex: 1, minWidth: 0, gap: 4 },
  dayColPast: { opacity: 0.5 },

  dayHeader:      { alignItems: 'center', paddingVertical: 4, borderRadius: Radius.sm, marginBottom: 2 },
  dayHeaderToday: { backgroundColor: Colors.primary },
  dayName:        { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textMuted, textTransform: 'uppercase' },
  dayNameToday:   { color: '#fff' },
  dayNum:         { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  dayNumToday:    { color: '#fff' },

  emptyDay:     { alignItems: 'center', paddingVertical: Spacing.sm },
  emptyDayText: { fontSize: Typography.xs, color: Colors.border },

  slot:      { borderRadius: Radius.sm, borderLeftWidth: 3, paddingHorizontal: 4, paddingVertical: 4, gap: 1 },
  slotTime:  { fontSize: 9, fontWeight: Typography.bold },
  slotSvc:   { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textPrimary },
  slotOwner: { fontSize: 9, color: Colors.textSecondary },
})

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingTop: Spacing.md, maxHeight: '75%' },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  closeBtn:{ position: 'absolute', top: Spacing.md, right: Spacing.xl, zIndex: 1, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing['2xl'], paddingBottom: 40, gap: Spacing.md },

  badge:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  service: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowMain: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
  rowSub:  { fontSize: Typography.sm, color: Colors.textMuted },

  avatar:         { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:      { width: 36, height: 36 },
  avatarInitials: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primaryDark },

  box:      { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  boxLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  boxText:  { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
})
