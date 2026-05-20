import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, CheckCircle } from 'lucide-react-native'
import { useAuthStore } from '@/store/authStore'
import { profileService } from '@/services/profile.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'
import DateInput from '@/components/DateInput'

// Écran profil owner — informations personnelles + avatar
// Le toggle Aperçu/Profil n'est pertinent que pour les pros (F02 pro)

export default function OwnerProfileScreen() {
  const { profile, initialize } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Champs du formulaire initialisés depuis le store
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName]   = useState(profile?.last_name ?? '')
  const [phone, setPhone]         = useState(profile?.phone ?? '')
  const [address, setAddress]     = useState(profile?.address ?? '')
  const [city, setCity]           = useState(profile?.city ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '')
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null)

  // Resync si le store se met à jour (ex: après upload avatar)
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name)
      setLastName(profile.last_name)
      setPhone(profile.phone ?? '')
      setAddress(profile.address ?? '')
      setCity(profile.city ?? '')
      setBirthDate(profile.birth_date ?? '')
      setAvatarUri(profile.avatar_url ?? null)
    }
  }, [profile?.id])

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour changer votre photo.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    setAvatarUri(uri)
    setAvatarUploading(true)
    try {
      await profileService.uploadAvatar(uri)
      await initialize() // rafraîchit le store
    } catch {
      Alert.alert('Erreur', "Impossible d'uploader la photo.")
      setAvatarUri(profile?.avatar_url ?? null) // rollback
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSave() {
    setIsLoading(true)
    setIsSaved(false)
    try {
      await profileService.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        birth_date: birthDate.trim() || null,
      } as any)
      await initialize() // rafraîchit le store
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil.')
    } finally {
      setIsLoading(false)
    }
  }

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {avatarUploading
              ? <ActivityIndicator size="small" color={Colors.textInverse} />
              : <Camera size={16} color={Colors.textInverse} />
            }
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Appuyez pour changer la photo</Text>
      </View>

      {/* Informations personnelles */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>

        <View style={styles.row}>
          <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Jean" style={{ flex: 1 }} />
          <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Dupont" style={{ flex: 1 }} />
        </View>

        <Field
          label="Email"
          value={profile?.email ?? ''}
          onChangeText={() => {}}
          placeholder=""
          editable={false}
          hint="L'email ne peut pas être modifié"
        />

        <Field
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="06 12 34 56 78"
          keyboardType="phone-pad"
        />

        <DateInput
          label="Date de naissance"
          value={birthDate}
          onChange={setBirthDate}
        />

        <Field
          label="Adresse"
          value={address}
          onChangeText={setAddress}
          placeholder="12 rue des Lilas"
        />

        <Field
          label="Ville"
          value={city}
          onChangeText={setCity}
          placeholder="Paris"
        />
      </View>

      {/* Bouton sauvegarder */}
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.textInverse} />
        ) : isSaved ? (
          <View style={styles.savedRow}>
            <CheckCircle size={18} color={Colors.textInverse} />
            <Text style={styles.saveButtonText}>Sauvegardé</Text>
          </View>
        ) : (
          <Text style={styles.saveButtonText}>Sauvegarder</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  )
}

// ─────────────────────────────────────────────
// Composant champ de formulaire réutilisable
// ─────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder, hint,
  editable = true, keyboardType, style,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder: string
  hint?: string
  editable?: boolean
  keyboardType?: any
  style?: object
}) {
  return (
    <View style={[fieldStyles.field, style]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, !editable && fieldStyles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  inputDisabled: { backgroundColor: Colors.surfaceAlt, color: Colors.textSecondary },
  hint: { fontSize: Typography.xs, color: Colors.textMuted },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  avatarWrapper: { position: 'relative' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.textInverse,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    lineHeight: Typography['2xl'],
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  avatarHint: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.sm },

  card: {
    marginHorizontal: Spacing['2xl'],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.base,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  row: { flexDirection: 'row', gap: Spacing.md },

  saveButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.semibold },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
})
