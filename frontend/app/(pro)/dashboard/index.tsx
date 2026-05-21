import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import {
  Users, CheckCircle, Clock,
  Star, DollarSign, CalendarDays,
} from 'lucide-react-native'
import { dashboardService, DashboardData, DashboardPeriod } from '@/services/dashboard.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const ACTIVITY_LABELS: Record<string, string> = {
  grooming: 'Toilettage',
  sitting:  'Pet-sitting',
  training: 'Éducation',
  vet:      'Vétérinaire',
  walking:  'Promenade',
  boarding: 'Pension',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: Colors.warning },
  accepted:  { label: 'Confirmée',   color: Colors.info },
  completed: { label: 'Terminée',    color: Colors.success },
  cancelled: { label: 'Annulée',     color: Colors.textMuted },
  rejected:  { label: 'Refusée',     color: Colors.error },
}

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'day',   label: 'Jour' },
  { key: 'week',  label: 'Semaine' },
  { key: 'month', label: 'Mois' },
]

// ─── Minimal line chart — pure View/Text, no SVG lib ─────────────────────────
function LineChart({ data }: { data: { label: string; bookings: number }[] }) {
  const H = 80, PAD = 12
  const values = data.map((d) => d.bookings)
  const max    = Math.max(...values, 1)

  return (
    <View style={chart.outer}>
      <View style={{ height: H, position: 'relative' }}>
        {/* horizontal guide lines */}
        {[0, 0.5, 1].map((f) => (
          <View key={f} style={[chart.hLine, { bottom: PAD + f * (H - PAD * 2) }]} />
        ))}
        {/* bars — simple vertical bars per day */}
        <View style={chart.barRow}>
          {data.map((d, i) => {
            const pct = max > 0 ? d.bookings / max : 0
            return (
              <View key={i} style={chart.barCol}>
                <View style={chart.barTrack}>
                  <View style={[chart.barFill, { height: `${Math.round(pct * 100)}%` }]} />
                </View>
              </View>
            )
          })}
        </View>
      </View>
      {/* x-labels */}
      <View style={chart.labelRow}>
        {data.map((d) => (
          <Text key={d.label} style={chart.label}>{d.label}</Text>
        ))}
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [period, setPeriod]         = useState<DashboardPeriod>('week')
  const [data, setData]             = useState<DashboardData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(useCallback(() => { load() }, []))

  useEffect(() => { load() }, [period])

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else if (!data) setLoading(true)
    try {
      setData(await dashboardService.get(period))
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  if (loading && !data) {
    return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  const k = data?.kpis

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>Dashboard</Text>
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[s.pill, period === p.key && s.pillActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, period === p.key && s.pillTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── KPI grid ── */}
      <View style={s.kpiGrid}>
        <KpiCard icon={<CalendarDays size={20} color={Colors.primary} />}  label="Réservations" value={k?.total_bookings ?? 0} bg={Colors.primaryLight} />
        <KpiCard icon={<CheckCircle  size={20} color={Colors.success} />}  label="Terminées"    value={k?.completed ?? 0}       bg={Colors.successLight} />
        <KpiCard icon={<Users        size={20} color={Colors.info}    />}  label="Clients"      value={k?.unique_clients ?? 0}  bg="#DBEAFE" />
        <KpiCard icon={<DollarSign   size={20} color={Colors.teal}    />}  label="Revenus"      value={`${(k?.total_revenue ?? 0).toFixed(0)} €`} bg={Colors.tealLight} />
      </View>

      {/* ── Status counters ── */}
      <Section title="Statut des réservations">
        <View style={s.statusRow}>
          <StatusBadge label="Confirmées" count={k?.accepted  ?? 0} color={Colors.info}     />
          <StatusBadge label="En attente" count={k?.pending   ?? 0} color={Colors.warning}  />
          <StatusBadge label="Terminées"  count={k?.completed ?? 0} color={Colors.success}  />
          <StatusBadge label="Annulées"   count={k?.cancelled ?? 0} color={Colors.textMuted}/>
        </View>
      </Section>

      {/* ── Rating ── */}
      {(k?.review_count ?? 0) > 0 && (
        <View style={[s.section, s.ratingCard]}>
          <Star size={18} color="#FBBF24" fill="#FBBF24" />
          <Text style={s.ratingVal}>{(k!.avg_rating).toFixed(1)}</Text>
          <Text style={s.ratingCount}>({k!.review_count} avis)</Text>
        </View>
      )}

      {/* ── Activity trend (7 days) ── */}
      <Section title="Activité — 7 derniers jours">
        <View style={s.card}>
          {(data?.revenue_trend.length ?? 0) > 0
            ? <LineChart data={data!.revenue_trend} />
            : <Text style={s.empty}>Aucune donnée</Text>
          }
        </View>
      </Section>

      {/* ── Services ── */}
      {(data?.services.length ?? 0) > 0 && (
        <Section title="Répartition des services">
          <View style={s.card}>
            {data!.services.map((svc) => (
              <ServiceBar key={svc.service_type} svc={svc} total={k?.total_bookings ?? 1} />
            ))}
          </View>
        </Section>
      )}

      {/* ── Recent activity ── */}
      {(data?.recent.length ?? 0) > 0 && (
        <Section title="Activité récente">
          <View style={s.card}>
            {data!.recent.map((item, i) => (
              <RecentRow key={item.id} item={item} last={i === data!.recent.length - 1} />
            ))}
          </View>
        </Section>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function KpiCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string | number; bg: string
}) {
  return (
    <View style={[kpi.card, { backgroundColor: bg }]}>
      {icon}
      <Text style={kpi.value}>{value}</Text>
      <Text style={kpi.label}>{label}</Text>
    </View>
  )
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={badge.wrap}>
      <View style={[badge.dot, { backgroundColor: color }]} />
      <Text style={badge.count}>{count}</Text>
      <Text style={badge.label}>{label}</Text>
    </View>
  )
}

function ServiceBar({ svc, total }: { svc: { service_type: string; count: number }; total: number }) {
  const pct = total > 0 ? Math.round((svc.count / total) * 100) : 0
  return (
    <View style={bar.row}>
      <Text style={bar.label} numberOfLines={1}>{ACTIVITY_LABELS[svc.service_type] ?? svc.service_type}</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={bar.count}>{svc.count}</Text>
    </View>
  )
}

function RecentRow({ item, last }: { item: any; last: boolean }) {
  const st       = STATUS_META[item.status] ?? { label: item.status, color: Colors.textMuted }
  const initials = item.owner_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
  return (
    <View style={[row.wrap, !last && row.border]}>
      <View style={row.avatar}>
        {item.avatar_url
          ? <Image source={{ uri: item.avatar_url }} style={row.avatarImg} />
          : <Text style={row.initials}>{initials}</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={row.name}>{item.owner_name}</Text>
        <Text style={row.svc}>{ACTIVITY_LABELS[item.service_type] ?? item.service_type}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[row.status, { color: st.color }]}>{st.label}</Text>
        {item.price != null && <Text style={row.price}>{item.price} €</Text>}
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingBottom: 24 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  periodRow:       { flexDirection: 'row', gap: Spacing.sm },
  pill:            { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  pillActive:      { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText:        { fontSize: Typography.sm, color: Colors.textSecondary },
  pillTextActive:  { color: Colors.primaryDark, fontWeight: Typography.semibold },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.xl },

  section:      { paddingHorizontal: Spacing['2xl'], marginTop: Spacing.xl },
  sectionTitle: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, ...Shadow.sm },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, ...Shadow.sm },

  ratingCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, ...Shadow.sm },
  ratingVal:   { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  ratingCount: { fontSize: Typography.sm, color: Colors.textMuted },

  empty: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.md },
})

const kpi = StyleSheet.create({
  card:  { flex: 1, minWidth: '45%', borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs, ...Shadow.sm },
  value: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  label: { fontSize: Typography.xs, color: Colors.textSecondary },
})

const badge = StyleSheet.create({
  wrap:  { alignItems: 'center', gap: 4 },
  dot:   { width: 10, height: 10, borderRadius: 5 },
  count: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  label: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
})

const bar = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  label: { width: 80, fontSize: Typography.sm, color: Colors.textSecondary },
  track: { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: 'hidden' },
  fill:  { height: 8, backgroundColor: Colors.primary, borderRadius: Radius.full },
  count: { width: 24, fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'right' },
})

const row = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  border:    { borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 36, height: 36 },
  initials:  { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primaryDark },
  name:      { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  svc:       { fontSize: Typography.xs, color: Colors.textMuted },
  status:    { fontSize: Typography.xs, fontWeight: Typography.medium },
  price:     { fontSize: Typography.xs, color: Colors.textMuted },
})

const chart = StyleSheet.create({
  outer:    { gap: Spacing.xs },
  hLine:    { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.border },
  barRow:   { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingHorizontal: 4, height: 80 },
  barCol:   { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:  { backgroundColor: Colors.primary, borderRadius: 4, minHeight: 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-around' },
  label:    { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
})
