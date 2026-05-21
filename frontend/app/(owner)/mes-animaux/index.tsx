import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Plus, PawPrint, ChevronRight, LayoutGrid, List } from 'lucide-react-native'
import { petService } from '@/services/pet.service'
import { Pet } from '@/types'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

// Emojis par espèce pour le placeholder visuel
const SPECIES_EMOJI: Record<string, string> = {
  chien: '🐶', chat: '🐱', lapin: '🐰', oiseau: '🐦',
  hamster: '🐹', cochon: '🐷', reptile: '🦎', poisson: '🐠',
}

function getEmoji(species: string) {
  return SPECIES_EMOJI[species.toLowerCase()] ?? '🐾'
}

const SIZE_LABELS: Record<string, string> = {
  small: 'Petit', medium: 'Moyen', large: 'Grand',
}

export default function MesAnimauxScreen() {
  const [pets, setPets]             = useState<Pet[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isGrid, setIsGrid]         = useState(false)

  // useFocusEffect recharge la liste chaque fois qu'on revient sur cet écran
  // (utile après création ou modification d'un animal)
  useFocusEffect(
    useCallback(() => {
      loadPets()
    }, [])
  )

  async function loadPets(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await petService.getPets()
      setPets(data)
    } catch {
      // silencieux — liste vide
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Animaux</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsGrid((g) => !g)} activeOpacity={0.7}>
            {isGrid
              ? <List size={18} color={Colors.textSecondary} />
              : <LayoutGrid size={18} color={Colors.textSecondary} />
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(owner)/mes-animaux/nouveau')} activeOpacity={0.8}>
            <Plus size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[isGrid ? styles.grid : styles.list, pets.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPets(true)}
            tintColor={Colors.primary}
          />
        }
      >
        {pets.length === 0 ? (
          <EmptyState />
        ) : isGrid ? (
          pets.map((pet) => (
            <PetGridCard
              key={pet.id}
              pet={pet}
              onPress={() => router.push(`/(owner)/mes-animaux/${pet.id}`)}
            />
          ))
        ) : (
          pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onPress={() => router.push(`/(owner)/mes-animaux/${pet.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────
// PetGridCard
// ─────────────────────────────────────────────
function PetGridCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.gridPhoto}>
        {pet.main_photo_url ? (
          <Image source={{ uri: pet.main_photo_url }} style={styles.gridImage} />
        ) : (
          <Text style={styles.gridEmoji}>{getEmoji(pet.species)}</Text>
        )}
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{pet.name}</Text>
        <Text style={styles.gridSpecies} numberOfLines={1}>{pet.species}</Text>
        {pet.is_verified && (
          <Text style={styles.gridVerified}>✓ Vérifié</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────
// PetCard
// ─────────────────────────────────────────────
function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Photo ou emoji */}
      <View style={styles.cardPhoto}>
        {pet.main_photo_url ? (
          <Image source={{ uri: pet.main_photo_url }} style={styles.cardImage} />
        ) : (
          <Text style={styles.cardEmoji}>{getEmoji(pet.species)}</Text>
        )}
      </View>

      {/* Infos */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{pet.name}</Text>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>
        <Text style={styles.cardSpecies}>
          {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
        </Text>
        <View style={styles.cardTags}>
          {pet.age != null && (
            <Tag label={`${pet.age} an${pet.age > 1 ? 's' : ''}`} />
          )}
          {pet.size && <Tag label={SIZE_LABELS[pet.size]} />}
          {pet.has_lof && <Tag label="LOF" color={Colors.primary} />}
          {pet.is_verified && <Tag label="✓ Vérifié" color={Colors.success} />}
        </View>
      </View>
    </TouchableOpacity>
  )
}

function Tag({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[tagStyles.tag, color && { borderColor: color }]}>
      <Text style={[tagStyles.text, color && { color }]}>{label}</Text>
    </View>
  )
}

const tagStyles = StyleSheet.create({
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: Typography.xs, color: Colors.textSecondary },
})

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <PawPrint size={56} color={Colors.border} />
      <Text style={styles.emptyTitle}>Aucun animal pour l'instant</Text>
      <Text style={styles.emptySubtitle}>
        Ajoutez votre premier compagnon en appuyant sur le bouton +
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  toggleBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  list: { padding: Spacing['2xl'], gap: Spacing.md },
  listEmpty: { flex: 1 },
  grid: {
    padding: Spacing['2xl'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardPhoto: {
    width: 90,
    height: 90,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: { width: 90, height: 90 },
  cardEmoji: { fontSize: 40 },
  cardContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  cardSpecies: { fontSize: Typography.sm, color: Colors.textSecondary },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },

  // Grid card
  gridCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  gridPhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridImage: { width: '100%', height: '100%' },
  gridEmoji: { fontSize: 42 },
  gridInfo: { padding: Spacing.sm, gap: 2 },
  gridName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  gridSpecies: { fontSize: Typography.xs, color: Colors.textSecondary },
  gridVerified: { fontSize: Typography.xs, color: Colors.success, marginTop: 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing['3xl'] },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
