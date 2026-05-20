import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, Calendar, Clock, MessageCircle, PawPrint } from 'lucide-react-native'
import { bookingService } from '@/services/booking.service'
import { petService } from '@/services/pet.service'
import { Pet } from '@/types'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'
import DateInput from '@/components/DateInput'
import TimeInput from '@/components/TimeInput'

const SERVICES = [
  { key: 'grooming',  label: '✂️ Toilettage' },
  { key: 'sitting',   label: '🐾 Pet-sitting' },
  { key: 'training',  label: '🎓 Éducation' },
  { key: 'vet',       label: '🩺 Vétérinaire' },
  { key: 'walking',   label: '🦮 Promenade' },
  { key: 'boarding',  label: '🏠 Pension' },
]

export default function BookingScreen() {
  const { proId, proName } = useLocalSearchParams<{ proId: string; proName: string }>()

  const [pets, setPets]               = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string | null>(null)
  const [service, setService]         = useState('')
  const [date, setDate]               = useState('')
  const [time, setTime]               = useState('')
  const [message, setMessage]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [loadingPets, setLoadingPets] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    petService.getPets()
      .then(setPets)
      .catch(() => {})
      .finally(() => setLoadingPets(false))
  }, [])

  function validate() {
    const errors: Record<string, string> = {}
    if (!service)  errors.service = 'Choisissez un service'
    if (!date)     errors.date    = 'Sélectionnez une date'
    if (!time)     errors.time    = 'Sélectionnez une heure'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const scheduledAt = new Date(`${date.trim()}T${time.trim()}:00`).toISOString()
      await bookingService.create({
        pro_id:       proId,
        pet_id:       selectedPet || undefined,
        service_type: service,
        scheduled_at: scheduledAt,
        message:      message.trim() || undefined,
      })
      // Succès → retour avec confirmation
      if (Platform.OS === 'web') {
        window.alert('Demande envoyée ! Le professionnel reviendra vers vous.')
      } else {
        Alert.alert('Demande envoyée !', 'Le professionnel reviendra vers vous.')
      }
      router.replace('/(owner)/mes-reservations')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Impossible d\'envoyer la demande.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Réserver</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Pro cible */}
        <View style={styles.proCard}>
          <Text style={styles.proLabel}>Professionnel</Text>
          <Text style={styles.proName}>{proName || 'Professionnel'}</Text>
        </View>

        {/* Service */}
        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>SERVICE</Text>
          </View>
          <View style={styles.pillsRow}>
            {SERVICES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.pill, service === s.key && styles.pillActive]}
                onPress={() => setService(s.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, service === s.key && styles.pillTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {fieldErrors.service && <Text style={styles.fieldError}>{fieldErrors.service}</Text>}
        </View>

        {/* Animal */}
        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <PawPrint size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>ANIMAL (optionnel)</Text>
          </View>
          {loadingPets ? (
            <ActivityIndicator color={Colors.primary} />
          ) : pets.length === 0 ? (
            <Text style={styles.hint}>Aucun animal enregistré — vous pouvez réserver sans.</Text>
          ) : (
            <View style={styles.pillsRow}>
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[styles.pill, selectedPet === pet.id && styles.pillActive]}
                  onPress={() => setSelectedPet(selectedPet === pet.id ? null : pet.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selectedPet === pet.id && styles.pillTextActive]}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date & heure */}
        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>DATE & HEURE</Text>
          </View>
          <View style={styles.row}>
            <DateInput
              label="Date *"
              value={date}
              onChange={setDate}
              error={fieldErrors.date}
              style={{ flex: 1 }}
            />
            <TimeInput
              label="Heure *"
              value={time}
              onChange={setTime}
              error={fieldErrors.time}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Message */}
        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <MessageCircle size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>MESSAGE (optionnel)</Text>
          </View>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Présentez votre animal, précisez vos besoins..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Bouton envoyer */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <Text style={styles.submitBtnText}>Envoyer la demande</Text>
          }
        </TouchableOpacity>

      </ScrollView>
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
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },

  content: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: 48 },

  proCard: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.lg,
    padding: Spacing.base, gap: 2,
  },
  proLabel: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.medium },
  proName:  { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primaryDark },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.md, ...Shadow.sm,
  },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sectionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  pillActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText:       { fontSize: Typography.sm, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primaryDark, fontWeight: Typography.semibold },

  row:   { flexDirection: 'row', gap: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  fieldError: { fontSize: Typography.xs, color: Colors.error },
  hint:       { fontSize: Typography.sm, color: Colors.textMuted, fontStyle: 'italic' },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.base, alignItems: 'center', ...Shadow.sm,
  },
  btnDisabled:    { opacity: 0.6 },
  submitBtnText:  { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.semibold },
})
