import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { petService } from '@/services/pet.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const SIZES   = [{ key: 'small', label: 'Petit' }, { key: 'medium', label: 'Moyen' }, { key: 'large', label: 'Grand' }]
const COATS   = [{ key: 'short', label: 'Court' }, { key: 'medium', label: 'Mi-long' }, { key: 'long', label: 'Long' }, { key: 'hairless', label: 'Sans poils' }]
const SPECIES = ['Chien', 'Chat', 'Lapin', 'Oiseau', 'Hamster', 'Reptile', 'Poisson', 'Autre']

export default function NouvelAnimalScreen() {
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName]       = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed]     = useState('')
  const [age, setAge]         = useState('')
  const [weight, setWeight]   = useState('')
  const [size, setSize]       = useState<string | null>(null)
  const [coatType, setCoatType] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate() {
    const errors: Record<string, string> = {}
    if (!name.trim())    errors.name    = 'Nom requis'
    if (!species.trim()) errors.species = 'Espèce requise'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreate() {
    if (!validate()) return
    setIsLoading(true)
    try {
      const pet = await petService.createPet({
        name: name.trim(),
        species: species.trim().toLowerCase(),
        breed: breed.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        size: (size as any) || undefined,
        coat_type: (coatType as any) || undefined,
      })
      // Redirige vers l'écran de détail pour compléter le profil
      router.replace(`/(owner)/mes-animaux/${pet.id}`)
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Impossible de créer l\'animal.'
      if (Platform.OS === 'web') {
        window.alert(msg)
      } else {
        Alert.alert('Erreur', msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel animal</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Espèce rapide */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ESPÈCE</Text>
          <View style={styles.pillsRow}>
            {SPECIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pill, species.toLowerCase() === s.toLowerCase() && styles.pillActive]}
                onPress={() => setSpecies(s.toLowerCase())}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, species.toLowerCase() === s.toLowerCase() && styles.pillTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {fieldErrors.species && <Text style={styles.fieldError}>{fieldErrors.species}</Text>}
        </View>

        {/* Infos de base */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>INFORMATIONS DE BASE</Text>

          <Field label="Nom *" value={name} onChangeText={setName} placeholder="Rex, Mia..." error={fieldErrors.name} />
          <Field label="Race" value={breed} onChangeText={setBreed} placeholder="Berger allemand, Siamois..." />

          <View style={styles.row}>
            <Field label="Âge (ans)" value={age} onChangeText={setAge} placeholder="3" keyboardType="numeric" style={{ flex: 1 }} />
            <Field label="Poids (kg)" value={weight} onChangeText={setWeight} placeholder="8.5" keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>

          {/* Taille */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Taille</Text>
            <View style={styles.pillsRow}>
              {SIZES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.pill, size === s.key && styles.pillActive]}
                  onPress={() => setSize(size === s.key ? null : s.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, size === s.key && styles.pillTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pelage */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type de pelage</Text>
            <View style={styles.pillsRow}>
              {COATS.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.pill, coatType === c.key && styles.pillActive]}
                  onPress={() => setCoatType(coatType === c.key ? null : c.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, coatType === c.key && styles.pillTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <Text style={styles.createButtonText}>Créer le profil</Text>
          }
        </TouchableOpacity>

        <Text style={styles.hint}>
          Vous pourrez ajouter les photos, la santé et la personnalité sur l'écran suivant.
        </Text>
      </ScrollView>
    </View>
  )
}

function Field({
  label, value, onChangeText, placeholder, error,
  keyboardType, style,
}: {
  label: string; value: string; onChangeText: (t: string) => void
  placeholder: string; error?: string; keyboardType?: any; style?: object
}) {
  return (
    <View style={[{ gap: Spacing.xs }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },

  content: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: 48 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.base, ...Shadow.sm,
  },
  sectionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },

  row: { flexDirection: 'row', gap: Spacing.md },
  fieldGroup: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  fieldError: { fontSize: Typography.xs, color: Colors.error },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { fontSize: Typography.sm, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primaryDark, fontWeight: Typography.semibold },

  createButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.base, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.semibold },
  hint: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
})
