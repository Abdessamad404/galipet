import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Navigation, MapPin } from 'lucide-react-native'
import { ProfessionalNearby } from '@/services/professional.service'
import { Colors, Shadow, Spacing } from '@/constants/theme'

interface Props {
  location: { lat: number; lng: number }
  pros: ProfessionalNearby[]
  selected: ProfessionalNearby | null
  radius: number
  slideAnim: Animated.Value
  onSelectPro: (pro: ProfessionalNearby) => void
  onRecenter: () => void
  detailCard: React.ReactNode
}

function radiusToDelta(radiusKm: number) {
  return (radiusKm / 111) * 2.2
}

export default function ProMap({
  location, pros, selected, radius,
  slideAnim, onSelectPro, onRecenter, detailCard,
}: Props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude:       location.lat,
          longitude:      location.lng,
          latitudeDelta:  radiusToDelta(radius),
          longitudeDelta: radiusToDelta(radius),
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pros.map((pro) => (
          <Marker
            key={pro.id}
            coordinate={{ latitude: pro.lat, longitude: pro.lng }}
            onPress={() => onSelectPro(pro)}
          >
            <View style={[
              styles.markerBubble,
              selected?.id === pro.id && styles.markerBubbleActive,
            ]}>
              <MapPin size={14} color={selected?.id === pro.id ? Colors.textInverse : Colors.primary} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Carte de détail slide-up */}
      {selected && (
        <Animated.View style={[styles.detailCard, { transform: [{ translateY: slideAnim }] }]}>
          {detailCard}
        </Animated.View>
      )}

      {/* Bouton recentrer */}
      <TouchableOpacity style={styles.recenterBtn} onPress={onRecenter} activeOpacity={0.8}>
        <Navigation size={18} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  markerBubble: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  markerBubbleActive: { backgroundColor: Colors.primary },

  detailCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.xl,
    ...Shadow.lg,
  },

  recenterBtn: {
    position: 'absolute', bottom: 200, right: Spacing.xl,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border,
  },
})
