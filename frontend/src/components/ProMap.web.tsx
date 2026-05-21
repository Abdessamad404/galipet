/**
 * ProMap — web version using Leaflet loaded from CDN.
 * No extra npm package needed; works in any browser.
 */
import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { ProfessionalNearby } from '@/services/professional.service'
import { Colors, Shadow, Spacing } from '@/constants/theme'

interface Props {
  location:    { lat: number; lng: number }
  pros:        ProfessionalNearby[]
  selected:    ProfessionalNearby | null
  radius:      number
  slideAnim:   Animated.Value
  onSelectPro: (pro: ProfessionalNearby) => void
  onRecenter:  () => void
  detailCard:  React.ReactNode
}

declare const window: Window & {
  L?: any
  __leafletCSSLoaded?: boolean
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return }

    if (!window.__leafletCSSLoaded) {
      const link = document.createElement('link')
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      window.__leafletCSSLoaded = true
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    document.head.appendChild(script)
  })
}

function radiusToZoom(radiusKm: number): number {
  if (radiusKm <= 2)  return 14
  if (radiusKm <= 5)  return 13
  if (radiusKm <= 10) return 12
  return 11
}

export default function ProMap({
  location, pros, selected, radius,
  slideAnim, onSelectPro, onRecenter, detailCard,
}: Props) {
  const mapContainerRef  = useRef<HTMLDivElement | null>(null)
  const mapRef           = useRef<any>(null)
  const markersRef       = useRef<any[]>([])
  // Always-fresh ref so Leaflet closures never capture a stale onSelectPro
  const onSelectProRef   = useRef(onSelectPro)
  useEffect(() => { onSelectProRef.current = onSelectPro }, [onSelectPro])

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center:             [location.lat, location.lng],
        zoom:               radiusToZoom(radius),
        zoomControl:        true,
        zoomAnimation:      true,
        wheelPxPerZoomLevel: 1000,  // default 60 — higher = less sensitive scroll zoom
        wheelDebounceTime:  1000,   // ms between wheel events
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // User location dot
      L.circleMarker([location.lat, location.lng], {
        radius: 8, fillColor: Colors.primary,
        color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9,
      }).addTo(map)

      mapRef.current = map
    })
    return () => { cancelled = true }
  }, [])

  // ── Recenter + zoom when location/radius changes ─────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setView([location.lat, location.lng], radiusToZoom(radius))
  }, [location, radius])

  // ── Rebuild markers when pros or selection changes ────────────────────────
  useEffect(() => {
    loadLeaflet().then((L) => {
      if (!mapRef.current) return

      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      pros.forEach((pro) => {
        const isSelected = selected?.id === pro.id

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${isSelected ? Colors.primary : '#ffffff'};
            border:2.5px solid ${Colors.primary};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
              viewBox="0 0 24 24" fill="none"
              stroke="${isSelected ? '#ffffff' : Colors.primary}"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              style="pointer-events:none;display:block;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>`,
          iconSize:   [32, 32],
          iconAnchor: [16, 32],
        })

        const marker = L.marker([pro.lat, pro.lng], { icon, interactive: true })
          .addTo(mapRef.current)

        // Direct DOM listener — bypasses Leaflet's event system entirely
        // and uses the always-fresh ref to avoid stale closures
        const el = marker.getElement()
        if (el) {
          el.style.cursor = 'pointer'
          el.addEventListener('click', (e: Event) => {
            e.stopPropagation()
            onSelectProRef.current(pro)
          })
        }

        markersRef.current.push(marker)
      })
    })
  }, [pros, selected])

  return (
    <View style={styles.root}>
      <div ref={mapContainerRef as any} style={{ width: '100%', height: '100%' }} />

      {/* Detail card — zIndex above Leaflet layers */}
      {selected && (
        <Animated.View style={[styles.detailCard, { transform: [{ translateY: slideAnim }] }]}>
          {detailCard}
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  detailCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.xl,
    zIndex: 1000,
    ...Shadow.lg,
  },
})
