import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Platform, Image, Animated, TextInput,
} from 'react-native'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { MapPin, Navigation, ChevronRight, X, Search, LayoutGrid, Map, SlidersHorizontal } from 'lucide-react-native'
import { professionalService, ProfessionalNearby } from '@/services/professional.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'
import ProMap from '@/components/ProMap'

// ─── Constants ────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [
  { label: '2 km',  value: 2  },
  { label: '5 km',  value: 5  },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
]

const SERVICE_FILTERS = [
  { key: 'all',          label: 'Tous'        },
  { key: 'sante',        label: 'Santé'       },
  { key: 'toilettage',   label: 'Toilettage'  },
  { key: 'pet-sitting',  label: 'Pet-sitting' },
  { key: 'education',    label: 'Éducation'   },
]

const ACTIVITY_LABELS: Record<string, string> = {
  sante:         'Santé',
  toilettage:    'Toilettage',
  'pet-sitting': 'Pet-sitting',
  education:     'Éducation',
}

function getActivityLabel(type: string) {
  return ACTIVITY_LABELS[type] ?? type
}

// ─── Geocoding (Nominatim, no API key) ───────────────────────────────────────

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExplorerScreen() {
  const [location, setLocation]     = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius]         = useState(5)
  const [pros, setPros]             = useState<ProfessionalNearby[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [selected, setSelected]     = useState<ProfessionalNearby | null>(null)
  const [viewMode, setViewMode]     = useState<'map' | 'grid'>('map')
  const [serviceFilter, setServiceFilter] = useState('all')

  // City search
  const [cityInput, setCityInput]         = useState('')
  const [cityLabel, setCityLabel]         = useState<string | null>(null)
  const [citySearching, setCitySearching] = useState(false)
  const [showCityBar, setShowCityBar]     = useState(false)

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
    setCityLabel(null)
    try {
      const coords = await getCoords()
      setLocation(coords)
      await loadPros(coords)
    } catch (err: any) {
      setError(err?.message ?? 'Impossible de récupérer votre position.')
    } finally {
      setLoading(false)
    }
  }

  async function getCoords(): Promise<{ lat: number; lng: number }> {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Géolocalisation non supportée par ce navigateur.'))
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(new Error(`Localisation refusée : ${err.message}`)),
          { timeout: 10000, enableHighAccuracy: false }
        )
      })
    }
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Autorisation de localisation refusée.')
    }
    let loc = await Location.getLastKnownPositionAsync()
    if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    if (!loc) throw new Error('Position indisponible')
    return { lat: loc.coords.latitude, lng: loc.coords.longitude }
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

  async function handleCitySearch() {
    if (!cityInput.trim()) return
    setCitySearching(true)
    const coords = await geocodeCity(cityInput.trim())
    setCitySearching(false)
    if (!coords) {
      if (Platform.OS === 'web') window.alert('Ville introuvable. Vérifiez l\'orthographe.')
      return
    }
    setCityLabel(cityInput.trim())
    setLocation(coords)
    setShowCityBar(false)
    setCityInput('')
    setLoading(true)
    try {
      const data = await professionalService.getNearby({ ...coords, radius })
      setPros(data)
    } catch {
      setError('Impossible de charger les professionnels.')
    } finally {
      setLoading(false)
    }
  }

  // Filtered pros (client-side by service type)
  const filteredPros = serviceFilter === 'all'
    ? pros
    : pros.filter(p => p.activity_types?.includes(serviceFilter))

  const canShowMap = !!location && ProMap !== null

  if (loading && pros.length === 0) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>Localisation en cours…</Text>
      </View>
    )
  }

  if (error && pros.length === 0) {
    return (
      <View style={s.centered}>
        <MapPin size={48} color={Colors.border} />
        <Text style={s.errorTitle}>Localisation indisponible</Text>
        <Text style={s.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={requestLocationAndLoad} activeOpacity={0.8}>
          <Navigation size={16} color={Colors.textInverse} />
          <Text style={s.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const detailCard = selected ? (
    <ProDetailCard pro={selected} onClose={() => setSelected(null)} />
  ) : null

  return (
    <View style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Explorer</Text>
            <Text style={s.headerSubtitle}>
              {cityLabel ? `📍 ${cityLabel}` : 'Autour de vous'} · {filteredPros.length} pro{filteredPros.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={s.headerActions}>
            {/* City search toggle */}
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowCityBar(v => !v)} activeOpacity={0.7}>
              <Search size={18} color={showCityBar ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>
            {/* My location — always visible; highlighted when on a searched city */}
            <TouchableOpacity
              style={[s.iconBtn, cityLabel ? s.iconBtnActive : null]}
              onPress={requestLocationAndLoad}
              activeOpacity={0.7}
            >
              <Navigation size={18} color={cityLabel ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>
            {/* Map/Grid toggle */}
            {canShowMap && (
              <TouchableOpacity style={s.iconBtn} onPress={() => setViewMode(v => v === 'map' ? 'grid' : 'map')} activeOpacity={0.7}>
                {viewMode === 'map'
                  ? <LayoutGrid size={18} color={Colors.textSecondary} />
                  : <Map size={18} color={Colors.textSecondary} />
                }
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* City search bar */}
        {showCityBar && (
          <View style={s.cityBar}>
            <TextInput
              style={s.cityInput}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="Rechercher une ville..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleCitySearch}
            />
            {citySearching
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : (
                <TouchableOpacity onPress={handleCitySearch} activeOpacity={0.7} style={s.citySearchBtn}>
                  <Search size={16} color={Colors.textInverse} />
                </TouchableOpacity>
              )
            }
          </View>
        )}
      </View>

      {/* ── Filter bar ── */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {/* Radius */}
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[s.pill, radius === opt.value && s.pillActive]}
              onPress={() => setRadius(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, radius === opt.value && s.pillTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          <View style={s.filterDivider} />

          {/* Service type */}
          {SERVICE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.pill, serviceFilter === f.key && s.pillActiveService]}
              onPress={() => setServiceFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, serviceFilter === f.key && s.pillTextActiveService]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: Spacing.base }} />}
      </View>

      {/* ── Content ── */}
      {canShowMap && viewMode === 'map' ? (
        <ProMap
          location={location!}
          pros={filteredPros}
          selected={selected}
          radius={radius}
          slideAnim={slideAnim}
          onSelectPro={setSelected}
          onRecenter={requestLocationAndLoad}
          detailCard={detailCard}
        />
      ) : (
        <ScrollView contentContainerStyle={[s.grid, filteredPros.length === 0 && s.gridEmpty]}>
          {filteredPros.length === 0 ? (
            <EmptyState radius={radius} filtered={serviceFilter !== 'all'} />
          ) : (
            filteredPros.map((pro) => <ProGridCard key={pro.id} pro={pro} />)
          )}
        </ScrollView>
      )}
    </View>
  )
}

// ─── Pro grid card ────────────────────────────────────────────────────────────

function ProGridCard({ pro }: { pro: ProfessionalNearby }) {
  return (
    <TouchableOpacity style={g.card} onPress={() => router.push(`/(owner)/explorer/${pro.id}`)} activeOpacity={0.75}>
      <View style={g.avatar}>
        {pro.avatar_url
          ? <Image source={{ uri: pro.avatar_url }} style={g.avatarImg} />
          : <Text style={g.avatarInitials}>{pro.first_name[0]}{pro.last_name[0]}</Text>
        }
      </View>
      <View style={g.info}>
        <Text style={g.name} numberOfLines={1}>{pro.first_name} {pro.last_name}</Text>
        {pro.company_name && <Text style={g.company} numberOfLines={1}>{pro.company_name}</Text>}
        <View style={g.meta}>
          <MapPin size={10} color={Colors.textMuted} />
          <Text style={g.metaText}>{pro.distance_km.toFixed(1)} km</Text>
        </View>
        {pro.activity_types?.length > 0 && (
          <View style={g.tags}>
            {pro.activity_types.slice(0, 2).map((t) => (
              <View key={t} style={g.tag}>
                <Text style={g.tagText}>{getActivityLabel(t)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Pro detail card (map overlay) ───────────────────────────────────────────

function ProDetailCard({ pro, onClose }: { pro: ProfessionalNearby; onClose: () => void }) {
  return (
    <View style={d.container}>
      <TouchableOpacity style={d.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <X size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      <View style={d.row}>
        <View style={d.avatar}>
          {pro.avatar_url
            ? <Image source={{ uri: pro.avatar_url }} style={d.avatarImg} />
            : <Text style={d.avatarInitials}>{pro.first_name[0]}{pro.last_name[0]}</Text>
          }
        </View>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/(owner)/explorer/${pro.id}`)} activeOpacity={0.7}>
          <Text style={d.name}>{pro.first_name} {pro.last_name}</Text>
          {pro.company_name && <Text style={d.company}>{pro.company_name}</Text>}
          <View style={d.meta}>
            <MapPin size={12} color={Colors.textMuted} />
            <Text style={d.metaText}>{pro.city ? `${pro.city} · ` : ''}{pro.distance_km.toFixed(1)} km</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(owner)/explorer/${pro.id}`)} activeOpacity={0.7}>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      {pro.activity_types?.length > 0 && (
        <View style={d.tags}>
          {pro.activity_types.map((t) => (
            <View key={t} style={d.tag}>
              <Text style={d.tagText}>{getActivityLabel(t)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ radius, filtered }: { radius: number; filtered: boolean }) {
  return (
    <View style={s.emptyState}>
      <MapPin size={48} color={Colors.border} />
      <Text style={s.errorTitle}>
        {filtered ? 'Aucun pro pour ce service' : `Aucun pro dans les ${radius} km`}
      </Text>
      <Text style={s.errorSubtitle}>
        {filtered ? 'Essayez un autre type de service ou agrandissez le rayon.' : 'Essayez d\'agrandir le rayon de recherche.'}
      </Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['2xl'] },

  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  headerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:   { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerSubtitle:{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn:       { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primary },

  cityBar:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cityInput:     { flex: 1, height: 36, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, fontSize: Typography.sm, color: Colors.textPrimary, backgroundColor: Colors.background },
  citySearchBtn: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  filterBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterScroll: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  filterDivider:{ width: 1, height: 18, backgroundColor: Colors.border, marginHorizontal: Spacing.xs },

  pill:               { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  pillActive:         { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillActiveService:  { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  pillText:           { fontSize: Typography.xs, color: Colors.textSecondary },
  pillTextActive:     { color: Colors.primaryDark, fontWeight: Typography.semibold },
  pillTextActiveService: { color: '#7C3AED', fontWeight: Typography.semibold },

  grid:      { padding: Spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridEmpty: { flex: 1 },
  emptyState:{ flex: 1, paddingTop: 80, alignItems: 'center', gap: Spacing.md, width: '100%' },

  loadingText:   { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  errorTitle:    { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  errorSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.sm },
  retryText:     { color: Colors.textInverse, fontWeight: Typography.semibold, fontSize: Typography.base },
})

const g = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  avatar: {
    width: '100%', height: 110,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg:      { width: '100%', height: 110 },
  avatarInitials: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.primaryDark },
  info:    { padding: Spacing.sm, gap: 2 },
  name:    { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  company: { fontSize: Typography.xs, color: Colors.textSecondary },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  metaText:{ fontSize: 10, color: Colors.textMuted },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: Spacing.xs },
  tag:     { paddingHorizontal: Spacing.xs, paddingVertical: 1, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  tagText: { fontSize: 9, color: Colors.primaryDark },
})

const d = StyleSheet.create({
  container: { gap: Spacing.md },
  closeBtn:  { position: 'absolute', top: -4, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 52, height: 52 },
  avatarInitials: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primaryDark },
  name:    { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  company: { fontSize: Typography.sm, color: Colors.textSecondary },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:{ fontSize: Typography.xs, color: Colors.textMuted },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag:     { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  tagText: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.medium },
})
