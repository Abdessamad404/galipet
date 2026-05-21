import { useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Modal, Image, TextInput, Platform, Alert,
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { ChevronLeft, ChevronRight, X, Clock, Tag, Lock } from 'lucide-react-native'
import { bookingService, Booking } from '@/services/booking.service'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_SHORT  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_FR   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août',
                    'Septembre','Octobre','Novembre','Décembre']
const HOUR_START = 8
const HOUR_END   = 20
const HOUR_H     = 64   // px per hour

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: 'En attente',        color: '#D97706', bg: '#FEF3C7' },
  accepted:         { label: 'Confirmée',          color: '#2563EB', bg: '#DBEAFE' },
  in_progress:      { label: 'En cours',           color: '#7C3AED', bg: '#EDE9FE' },
  completed:        { label: 'Terminée',           color: '#059669', bg: '#D1FAE5' },
  cancelled:        { label: 'Annulée',            color: '#6B7280', bg: '#F3F4F6' },
  rejected:         { label: 'Refusée',            color: '#DC2626', bg: '#FEE2E2' },
  no_show:          { label: 'Absent',             color: '#B45309', bg: '#FEF3C7' },
  rescheduled:      { label: 'Reprogrammée',       color: '#0891B2', bg: '#CFFAFE' },
  blocked:          { label: 'Bloqué',             color: '#374151', bg: '#E5E7EB' },
  awaiting_payment: { label: 'Att. paiement',      color: '#9333EA', bg: '#F3E8FF' },
}

const SERVICE_LABELS: Record<string, string> = {
  sante:       'Santé',
  toilettage:  'Toilettage',
  'pet-sitting': 'Pet-sitting',
  education:   'Éducation',
  blocked:     'Créneau bloqué',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
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

function fmtDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toISOLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function localDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalendrierScreen() {
  const [weekStart, setWeekStart]   = useState(() => startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected]     = useState<Booking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Create block modal
  const [blockModal, setBlockModal] = useState(false)
  const [blockHour, setBlockHour]   = useState(9)
  const [blockDuration, setBlockDuration] = useState(60)
  const [blockNote, setBlockNote]   = useState('')
  const [blockSaving, setBlockSaving] = useState(false)

  const scrollRef = useRef<ScrollView>(null)

  useFocusEffect(useCallback(() => {
    load()
    // Scroll to current hour on load
    setTimeout(() => {
      const offset = Math.max(0, (new Date().getHours() - HOUR_START - 1)) * HOUR_H
      scrollRef.current?.scrollTo({ y: offset, animated: false })
    }, 300)
  }, []))

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try { setBookings(await bookingService.getProBookings()) } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  const today = new Date()
  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Bookings for selected day
  const dayKey    = localDateKey(selectedDay)
  const daySlots  = bookings
    .filter(b => localDateKey(new Date(b.scheduled_at)) === dayKey)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

  const weekLabel = (() => {
    const end = addDays(weekStart, 6)
    return weekStart.getMonth() === end.getMonth()
      ? `${weekStart.getDate()}–${end.getDate()} ${MONTH_FR[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : `${weekStart.getDate()} ${MONTH_FR[weekStart.getMonth()]} – ${end.getDate()} ${MONTH_FR[end.getMonth()]}`
  })()

  // Booking actions
  async function handleAction(action: () => Promise<Booking>) {
    setActionLoading(true)
    try {
      const updated = await action()
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
      setSelected(updated)
    } catch (e: any) {
      showAlert('Erreur', e?.response?.data?.error || e.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteBlock(id: string) {
    const ok = Platform.OS === 'web'
      ? window.confirm('Supprimer ce créneau bloqué ?')
      : await new Promise<boolean>(r => Alert.alert('Supprimer', 'Supprimer ce créneau bloqué ?', [
          { text: 'Annuler', style: 'cancel', onPress: () => r(false) },
          { text: 'Supprimer', style: 'destructive', onPress: () => r(true) },
        ]))
    if (!ok) return
    try {
      await bookingService.deleteBlock(id)
      setBookings(prev => prev.filter(b => b.id !== id))
      setSelected(null)
    } catch (e: any) {
      showAlert('Erreur', e?.response?.data?.error || e.message)
    }
  }

  async function handleCreateBlock() {
    setBlockSaving(true)
    try {
      const d = new Date(selectedDay)
      d.setHours(blockHour, 0, 0, 0)
      const booking = await bookingService.createBlock(toISOLocal(d), blockDuration, blockNote || undefined)
      setBookings(prev => [...prev, booking])
      setBlockModal(false)
      setBlockNote('')
    } catch (e: any) {
      showAlert('Erreur', e?.response?.data?.error || e.message)
    } finally {
      setBlockSaving(false)
    }
  }

  function showAlert(title: string, msg: string) {
    if (Platform.OS === 'web') window.alert(`${title}: ${msg}`)
    else Alert.alert(title, msg)
  }

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>

  return (
    <View style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Calendrier</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setBlockModal(true)} activeOpacity={0.8}>
            <Lock size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Week navigation */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => setWeekStart(w => addDays(w, -7))} activeOpacity={0.7}>
            <ChevronLeft size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.weekLabel}>{weekLabel}</Text>
          <TouchableOpacity style={s.navBtn} onPress={() => setWeekStart(w => addDays(w, 7))} activeOpacity={0.7}>
            <ChevronRight size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Day strip */}
        <View style={s.dayStrip}>
          {days.map((day) => {
            const isToday    = isSameDay(day, today)
            const isSelected = isSameDay(day, selectedDay)
            const key        = localDateKey(day)
            const count      = bookings.filter(b => localDateKey(new Date(b.scheduled_at)) === key).length
            return (
              <TouchableOpacity
                key={key}
                style={[s.dayPill, isSelected && s.dayPillSelected]}
                onPress={() => {
                  setSelectedDay(day)
                  if (!isSameDay(day, addDays(weekStart, 0)) && !isSameDay(day, addDays(weekStart, 6))) {
                    // already in current week
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.dayPillName, isSelected && s.dayPillTextSelected, isToday && !isSelected && s.dayPillToday]}>
                  {DAY_SHORT[day.getDay()]}
                </Text>
                <Text style={[s.dayPillNum, isSelected && s.dayPillTextSelected, isToday && !isSelected && s.dayPillToday]}>
                  {day.getDate()}
                </Text>
                {count > 0 && <View style={[s.dot, isSelected && s.dotSelected]} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Selected day label + today button */}
        <View style={s.dayLabelRow}>
          <Text style={s.dayLabel}>{fmtDate(selectedDay)}</Text>
          {!isSameDay(selectedDay, today) && (
            <TouchableOpacity onPress={() => { setSelectedDay(today); setWeekStart(startOfWeek(today)) }} activeOpacity={0.7}>
              <Text style={s.todayLink}>Aujourd'hui</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Hour grid ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.grid}>
          {/* Time labels column */}
          <View style={s.timeCol}>
            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
              <View key={i} style={s.timeCell}>
                <Text style={s.timeLabel}>{String(HOUR_START + i).padStart(2, '0')}:00</Text>
              </View>
            ))}
          </View>

          {/* Events column */}
          <View style={[s.eventsCol, { height: (HOUR_END - HOUR_START) * HOUR_H }]}>
            {/* Hour lines */}
            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
              <View key={i} style={[s.hourLine, { top: i * HOUR_H }]} />
            ))}

            {/* Half-hour lines */}
            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
              <View key={`h${i}`} style={[s.halfLine, { top: i * HOUR_H + HOUR_H / 2 }]} />
            ))}

            {/* Current time indicator */}
            {isSameDay(selectedDay, today) && (() => {
              const now = new Date()
              const top = (now.getHours() - HOUR_START + now.getMinutes() / 60) * HOUR_H
              if (top < 0 || top > (HOUR_END - HOUR_START) * HOUR_H) return null
              return (
                <View style={[s.nowLine, { top }]}>
                  <View style={s.nowDot} />
                </View>
              )
            })()}

            {/* Booking blocks */}
            {daySlots.map((b) => {
              const start     = new Date(b.scheduled_at)
              const startH    = start.getHours() + start.getMinutes() / 60
              const duration  = b.duration_min ?? 60
              const top       = Math.max(0, (startH - HOUR_START) * HOUR_H)
              const height    = Math.max(28, (duration / 60) * HOUR_H - 2)
              const st        = STATUS_META[b.status] ?? STATUS_META.pending
              const isBlocked = b.status === 'blocked'
              const label     = isBlocked
                ? (b.message || 'Bloqué')
                : (b.owner ? `${b.owner.first_name} ${b.owner.last_name}` : 'Client')

              return (
                <TouchableOpacity
                  key={b.id}
                  style={[s.event, { top, height, backgroundColor: st.bg, borderLeftColor: st.color }]}
                  onPress={() => setSelected(b)}
                  activeOpacity={0.8}
                >
                  {isBlocked
                    ? <Lock size={10} color={st.color} />
                    : <Text style={[s.eventTime, { color: st.color }]}>{fmtTime(b.scheduled_at)}</Text>
                  }
                  <Text style={[s.eventTitle, { color: st.color }]} numberOfLines={1}>{label}</Text>
                  {!isBlocked && height > 40 && (
                    <Text style={s.eventSub} numberOfLines={1}>{SERVICE_LABELS[b.service_type] ?? b.service_type}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Detail sheet ── */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={m.sheet} onStartShouldSetResponder={() => true}>
            <View style={m.handle} />
            <TouchableOpacity style={m.closeBtn} onPress={() => setSelected(null)} activeOpacity={0.7}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {selected && (
              <DetailContent
                booking={selected}
                actionLoading={actionLoading}
                onAccept={() => handleAction(() => bookingService.accept(selected.id))}
                onReject={() => handleAction(() => bookingService.reject(selected.id))}
                onStart={() => handleAction(() => bookingService.start(selected.id))}
                onComplete={() => handleAction(() => bookingService.complete(selected.id))}
                onNoShow={() => handleAction(() => bookingService.noShow(selected.id))}
                onCancel={() => handleAction(() => bookingService.cancel(selected.id))}
                onDeleteBlock={() => handleDeleteBlock(selected.id)}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Create block modal ── */}
      <Modal visible={blockModal} transparent animationType="fade" onRequestClose={() => setBlockModal(false)}>
        <View style={b.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setBlockModal(false)} />
          <View style={b.box}>
            <Text style={b.title}>Bloquer un créneau</Text>
            <Text style={b.subtitle}>{fmtDate(selectedDay)}</Text>

            <Text style={b.label}>Heure de début</Text>
            <View style={b.row}>
              {[8,9,10,11,12,13,14,15,16,17,18,19].map(h => (
                <TouchableOpacity
                  key={h}
                  style={[b.hourChip, blockHour === h && b.hourChipActive]}
                  onPress={() => setBlockHour(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[b.hourChipText, blockHour === h && b.hourChipTextActive]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={b.label}>Durée</Text>
            <View style={b.row}>
              {[30, 60, 90, 120, 180, 240].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[b.hourChip, blockDuration === d && b.hourChipActive]}
                  onPress={() => setBlockDuration(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[b.hourChipText, blockDuration === d && b.hourChipTextActive]}>
                    {d < 60 ? `${d}min` : `${d/60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={b.label}>Note (optionnel)</Text>
            <TextInput
              style={b.input}
              value={blockNote}
              onChangeText={setBlockNote}
              placeholder="Ex: Pause déjeuner, RDV personnel..."
              placeholderTextColor={Colors.textMuted}
            />

            <View style={b.actions}>
              <TouchableOpacity style={b.cancelBtn} onPress={() => setBlockModal(false)} activeOpacity={0.7}>
                <Text style={b.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[b.confirmBtn, blockSaving && b.btnDisabled]}
                onPress={handleCreateBlock}
                disabled={blockSaving}
                activeOpacity={0.8}
              >
                {blockSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={b.confirmText}>Bloquer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  )
}

// ─── Detail content ───────────────────────────────────────────────────────────

interface DetailProps {
  booking: Booking
  actionLoading: boolean
  onAccept: () => void
  onReject: () => void
  onStart: () => void
  onComplete: () => void
  onNoShow: () => void
  onCancel: () => void
  onDeleteBlock: () => void
}

function DetailContent({ booking: bk, actionLoading, onAccept, onReject, onStart, onComplete, onNoShow, onCancel, onDeleteBlock }: DetailProps) {
  const st        = STATUS_META[bk.status] ?? STATUS_META.pending
  const ownerName = bk.owner ? `${bk.owner.first_name} ${bk.owner.last_name}` : 'Client'
  const initials  = bk.owner ? `${bk.owner.first_name[0]}${bk.owner.last_name[0]}` : '?'
  const isBlocked = bk.status === 'blocked'

  return (
    <ScrollView contentContainerStyle={m.content}>
      <View style={[m.badge, { backgroundColor: st.bg }]}>
        <View style={[m.dot, { backgroundColor: st.color }]} />
        <Text style={[m.badgeText, { color: st.color }]}>{st.label}</Text>
      </View>

      <Text style={m.service}>
        {isBlocked ? (bk.message || 'Créneau bloqué') : (SERVICE_LABELS[bk.service_type] ?? bk.service_type)}
      </Text>

      <View style={m.row}>
        <Clock size={16} color={Colors.textSecondary} />
        <View>
          <Text style={m.rowMain}>{fmtDate(new Date(bk.scheduled_at))}</Text>
          <Text style={m.rowSub}>{fmtTime(bk.scheduled_at)}{bk.duration_min ? ` · ${bk.duration_min} min` : ''}</Text>
        </View>
      </View>

      {!isBlocked && (
        <View style={m.row}>
          <View style={m.avatar}>
            {bk.owner?.avatar_url
              ? <Image source={{ uri: bk.owner.avatar_url }} style={m.avatarImg} />
              : <Text style={m.avatarInitials}>{initials}</Text>
            }
          </View>
          <View>
            <Text style={m.rowMain}>{ownerName}</Text>
            <Text style={m.rowSub}>Client</Text>
          </View>
        </View>
      )}

      {bk.price != null && (
        <View style={m.row}>
          <Tag size={16} color={Colors.textSecondary} />
          <Text style={m.rowMain}>{bk.price} €</Text>
        </View>
      )}

      {bk.message && !isBlocked && (
        <View style={m.box}>
          <Text style={m.boxLabel}>Message du client</Text>
          <Text style={m.boxText}>{bk.message}</Text>
        </View>
      )}

      {bk.pro_note && (
        <View style={m.box}>
          <Text style={m.boxLabel}>Note pro</Text>
          <Text style={m.boxText}>{bk.pro_note}</Text>
        </View>
      )}

      {/* ── Action buttons ── */}
      {!actionLoading ? (
        <View style={m.actions}>
          {isBlocked && (
            <ActionBtn label="Supprimer" color={Colors.error} onPress={onDeleteBlock} />
          )}
          {bk.status === 'pending' && (
            <>
              <ActionBtn label="Accepter" color={Colors.success} onPress={onAccept} />
              <ActionBtn label="Refuser"  color={Colors.error}   onPress={onReject} />
            </>
          )}
          {bk.status === 'accepted' && (
            <>
              <ActionBtn label="Démarrer"     color="#7C3AED" onPress={onStart} />
              <ActionBtn label="Terminer"     color={Colors.success} onPress={onComplete} />
              <ActionBtn label="Absent"       color="#B45309" onPress={onNoShow} />
              <ActionBtn label="Annuler"      color={Colors.error}   onPress={onCancel} />
            </>
          )}
          {bk.status === 'in_progress' && (
            <ActionBtn label="Terminer" color={Colors.success} onPress={onComplete} />
          )}
        </View>
      ) : (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
      )}

      {/* Voir la fiche complète — toujours visible */}
      <TouchableOpacity
        style={m.detailLink}
        onPress={() => router.push(`/(pro)/reservations/${bk.id}`)}
        activeOpacity={0.7}
      >
        <ChevronRight size={15} color={Colors.primary} />
        <Text style={m.detailLinkText}>Voir la fiche complète</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[m.actionBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={m.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:      { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  addBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  navRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: Colors.surfaceAlt },
  weekLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },

  dayStrip:          { flexDirection: 'row', justifyContent: 'space-between' },
  dayPill:           { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs, borderRadius: Radius.md, gap: 2 },
  dayPillSelected:   { backgroundColor: Colors.primary },
  dayPillName:       { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textMuted, textTransform: 'uppercase' },
  dayPillNum:        { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  dayPillToday:      { color: Colors.primary },
  dayPillTextSelected: { color: '#fff' },
  dot:               { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary },
  dotSelected:       { backgroundColor: '#fff' },

  dayLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel:    { fontSize: Typography.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  todayLink:   { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },

  // Hour grid
  grid:      { flexDirection: 'row' },
  timeCol:   { width: 52 },
  timeCell:  { height: HOUR_H, justifyContent: 'flex-start', paddingTop: 4, paddingRight: 8, alignItems: 'flex-end' },
  timeLabel: { fontSize: 10, color: Colors.textMuted },

  eventsCol: { flex: 1, position: 'relative', borderLeftWidth: 1, borderLeftColor: Colors.border },
  hourLine:  { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.border },
  halfLine:  { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, opacity: 0.4 },

  nowLine: { position: 'absolute', left: -4, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  nowDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error, marginRight: -4 },

  event: {
    position: 'absolute', left: 4, right: 4,
    borderRadius: Radius.sm, borderLeftWidth: 3,
    paddingHorizontal: 6, paddingVertical: 3,
    gap: 1, overflow: 'hidden',
  },
  eventTime:  { fontSize: 9, fontWeight: Typography.bold },
  eventTitle: { fontSize: 10, fontWeight: Typography.semibold },
  eventSub:   { fontSize: 9, color: Colors.textSecondary },
})

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingTop: Spacing.md, maxHeight: '80%' },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  closeBtn:{ position: 'absolute', top: Spacing.md, right: Spacing.xl, zIndex: 1, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing['2xl'], paddingBottom: 40, gap: Spacing.md },

  badge:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  service:   { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowMain: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
  rowSub:  { fontSize: Typography.sm, color: Colors.textMuted },

  avatar:         { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:      { width: 36, height: 36 },
  avatarInitials: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primaryDark },

  box:      { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  boxLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  boxText:  { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },

  actions:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionBtn:     { flex: 1, minWidth: 100, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  actionBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: '#fff' },

  detailLink:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, alignSelf: 'center' },
  detailLinkText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
})

const b = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing['2xl'] },
  box:        { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['2xl'], gap: Spacing.md },
  title:      { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  subtitle:   { fontSize: Typography.sm, color: Colors.textSecondary, textTransform: 'capitalize', marginTop: -Spacing.sm },
  label:      { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  hourChip:   { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  hourChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  hourChipText:   { fontSize: Typography.xs, color: Colors.textSecondary },
  hourChipTextActive: { color: '#fff', fontWeight: Typography.semibold },
  input:      { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.sm, color: Colors.textPrimary },
  actions:    { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  cancelBtn:  { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.surfaceAlt },
  cancelText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  confirmText:{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: '#fff' },
  btnDisabled:{ opacity: 0.5 },
})
