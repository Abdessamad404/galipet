import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Platform, Image, Animated,
} from 'react-native'
import * as Location from 'expo-location'
import { MapPin, Navigation, ChevronRight, X } from 'lucide-react-native'
import { professionalService, ProfessionalNearby } from '@/services/professional.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'
import ProMap from '@/components/ProMap'

const RADIUS_OPTIONS = [
  { label: '2 km',  value: 2  },
  { label: '5 km',  value: 5  },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
]

const ACTIVITY_LABELS: Record<string, string> = {
  grooming: 'Toilettage',
  sitting:  'Pet-sitting',
  training: 'Éducation',
  vet:      'Vétérinaire',
  walking:  'Promenade',
  boarding: 'Pension',
}

function getActivityLabel(type: string) {
  return ACTIVITY_LABELS[type] ?? type
}

// ─────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────
export default function ExplorerScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius]     = useState(5)
  const [pros, setPros]         = useState<ProfessionalNearby[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<ProfessionalNearby | null>(null)

  const slideAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    requestLocationAndLoad()
  }, [])

  useEffect(() => {
    if (location) loadPros()
  }, [radius])

  useEffect(() => {
    if (selected) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start()
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start()
    }
  }, [selected])

  async function requestLocationAndLoad() {
    setLoading(true)
    setError(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Autorisation de localisation refusée. Activez la géolocalisation pour trouver des pros près de vous.')
        setLoading(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude }
      setLocation(coords)
      await loadPros(coords)
    } catch {
      setError('Impossible de récupérer votre position.')
    } finally {
      setLoading(false)
    }
  }

  async function loadPros(coords?: { lat: number; lng: number }) {
    const pos = coords ?? location
    if (!pos) return
    setLoading(true)
    try {
      const data = await professionalService.getNearby({ ...pos, radius })
      setPros(data)
    } catch {
      setError('Impossible de charger les professionnels.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && pros.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Localisation en cours…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MapPin size={48} color={Colors.border} />
        <Text style={styles.errorTitle}>Localisation indisponible</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={requestLocationAndLoad} activeOpacity={0.8}>
          <Navigation size={16} color={Colors.textInverse} />
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const detailCard = selected ? (
    <ProDetailCard pro={selected} onClose={() => setSelected(null)} />
  ) : null

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorer</Text>
        <Text style={styles.headerSubtitle}>
          {pros.length} pro{pros.length !== 1 ? 's' : ''} trouvé{pros.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filtres rayon */}
      <View style={styles.radiusBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusScroll}>
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.radiusPill, radius === opt.value && styles.radiusPillActive]}
              onPress={() => setRadius(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.radiusPillText, radius === opt.value && styles.radiusPillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: Spacing.base }} />}
      </View>

      {/* Carte native / Liste web */}
      {Platform.OS !== 'web' && location && ProMap ? (
        <ProMap
          location={location}
          pros={pros}
          selected={selected}
          radius={radius}
          slideAnim={slideAnim}
          onSelectPro={setSelected}
          onRecenter={requestLocationAndLoad}
          detailCard={detailCard}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {pros.length === 0 ? (
            <EmptyState radius={radius} />
          ) : (
            pros.map((pro) => <ProListCard key={pro.id} pro={pro} />)
          )}
        </ScrollView>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────
// Carte de détail (slide-up sur la map native)
// ─────────────────────────────────────────────
function ProDetailCard({ pro, onClose }: { pro: ProfessionalNearby; onClose: () => void }) {
  return (
    <View style={detail.container}>
      <TouchableOpacity style={detail.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <X size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      <View style={detail.row}>
        <View style={detail.avatar}>
          {pro.avatar_url ? (
            <Image source={{ uri: pro.avatar_url }} style={detail.avatarImg} />
          ) : (
            <Text style={detail.avatarInitials}>{pro.first_name[0]}{pro.last_name[0]}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={detail.name}>{pro.first_name} {pro.last_name}</Text>
          {pro.company_name && <Text style={detail.company}>{pro.company_name}</Text>}
          {pro.title && <Text style={detail.title}>{pro.title}</Text>}
          <View style={detail.meta}>
            <MapPin size={12} color={Colors.textMuted} />
            <Text style={detail.metaText}>
              {pro.city ? `${pro.city} · ` : ''}{pro.distance_km.toFixed(1)} km
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={Colors.textMuted} />
      </View>

      {pro.activity_types.length > 0 && (
        <View style={detail.tags}>
          {pro.activity_types.map((t) => (
            <View key={t} style={detail.tag}>
              <Text style={detail.tagText}>{getActivityLabel(t)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────
// Carte liste (web)
// ─────────────────────────────────────────────
function ProListCard({ pro }: { pro: ProfessionalNearby }) {
  return (
    <TouchableOpacity style={listCard.container} activeOpacity={0.7}>
      <View style={listCard.avatar}>
        {pro.avatar_url ? (
          <Image source={{ uri: pro.avatar_url }} style={listCard.avatarImg} />
        ) : (
          <Text style={listCard.avatarInitials}>{pro.first_name[0]}{pro.last_name[0]}</Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={listCard.name}>{pro.first_name} {pro.last_name}</Text>
        {pro.company_name && <Text style={listCard.company}>{pro.company_name}</Text>}
        <View style={listCard.meta}>
          <MapPin size={12} color={Colors.textMuted} />
          <Text style={listCard.metaText}>
            {pro.city ? `${pro.city} · ` : ''}{pro.distance_km.toFixed(1)} km
          </Text>
        </View>
        {pro.activity_types.length > 0 && (
          <View style={listCard.tags}>
            {pro.activity_types.map((t) => (
              <View key={t} style={listCard.tag}>
                <Text style={listCard.tagText}>{getActivityLabel(t)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function EmptyState({ radius }: { radius: number }) {
  return (
    <View style={styles.emptyState}>
      <MapPin size={48} color={Colors.border} />
      <Text style={styles.errorTitle}>Aucun pro dans les {radius} km</Text>
      <Text style={styles.errorSubtitle}>Essayez d'agrandir le rayon de recherche.</Text>
    </View>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['2xl'] },

  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle:    { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },

  radiusBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  radiusScroll: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  radiusPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  radiusPillActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radiusPillText:       { fontSize: Typography.sm, color: Colors.textSecondary },
  radiusPillTextActive: { color: Colors.primaryDark, fontWeight: Typography.semibold },

  list:       { padding: Spacing.xl, gap: Spacing.md },
  emptyState: { paddingTop: 80, alignItems: 'center', gap: Spacing.md },

  loadingText:   { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  errorTitle:    { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  errorSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.md, marginTop: Spacing.sm,
  },
  retryText: { color: Colors.textInverse, fontWeight: Typography.semibold, fontSize: Typography.base },
})

const detail = StyleSheet.create({
  container: { gap: Spacing.md },
  closeBtn: {
    position: 'absolute', top: -4, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg:      { width: 52, height: 52 },
  avatarInitials: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primaryDark },
  name:    { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  company: { fontSize: Typography.sm, color: Colors.textSecondary },
  title:   { fontSize: Typography.sm, color: Colors.textMuted },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: Typography.xs, color: Colors.textMuted },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag:     { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  tagText: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.medium },
})

const listCard = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, ...Shadow.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg:      { width: 48, height: 48 },
  avatarInitials: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primaryDark },
  name:    { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  company: { fontSize: Typography.sm, color: Colors.textSecondary },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: Typography.xs, color: Colors.textMuted },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  tag:     { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  tagText: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.medium },
})
