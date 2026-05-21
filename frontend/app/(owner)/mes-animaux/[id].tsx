import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Platform, Image, Switch,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { ChevronLeft, Camera, Trash2, CheckCircle, Plus, X, FileText, Image as ImageIcon } from 'lucide-react-native'
import { petService } from '@/services/pet.service'
import { Pet } from '@/types'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const SIZES   = [{ key: 'small', label: 'Petit' }, { key: 'medium', label: 'Moyen' }, { key: 'large', label: 'Grand' }]
const COATS   = [{ key: 'short', label: 'Court' }, { key: 'medium', label: 'Mi-long' }, { key: 'long', label: 'Long' }, { key: 'hairless', label: 'Sans poils' }]

const SOCIAL_TAGS     = ['Joueur', 'Câlin', 'Indépendant', 'Énergique', 'Calme', 'Curieux']
const SOCIAB_TAGS     = ['Adoré des enfants', 'Bonne entente chiens', 'Bonne entente chats', 'Méfiant', 'Timide']
const LEARNING_TAGS   = ['Obéissant', 'Rapide à apprendre', 'Têtu', 'En cours de dressage', 'Non dressé']

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [pet, setPet]           = useState<Pet | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [photoUploading, setPhotoUploading]       = useState(false)
  const [galleryUploading, setGalleryUploading]   = useState(false)
  const [docUploading, setDocUploading]           = useState(false)

  // Galerie + docs santé (locaux, mise à jour immédiate via API)
  const [galleryUrls, setGalleryUrls]   = useState<string[]>([])
  const [healthDocUrls, setHealthDocUrls] = useState<string[]>([])

  // Vaccinations — édition en liste de tags
  const [vaccinations, setVaccinations]   = useState<string[]>([])
  const [vaccinInput, setVaccinInput]     = useState('')

  // Champs éditables
  const [name, setName]         = useState('')
  const [species, setSpecies]   = useState('')
  const [breed, setBreed]       = useState('')
  const [age, setAge]           = useState('')
  const [weight, setWeight]     = useState('')
  const [size, setSize]         = useState<string | null>(null)
  const [coatType, setCoatType] = useState<string | null>(null)
  const [allergies, setAllergies] = useState('')
  const [hasLof, setHasLof]     = useState(false)
  const [lofInfo, setLofInfo]   = useState('')
  const [personalNote, setPersonalNote] = useState('')
  const [proNote, setProNote]   = useState('')

  // Personnalité
  const [socialTags, setSocialTags]     = useState<string[]>([])
  const [sociabTags, setSociabTags]     = useState<string[]>([])
  const [learningTags, setLearningTags] = useState<string[]>([])

  useEffect(() => {
    loadPet()
  }, [id])

  async function loadPet() {
    try {
      const data = await petService.getPet(id)
      setPet(data)
      setName(data.name)
      setSpecies(data.species)
      setBreed(data.breed ?? '')
      setAge(data.age?.toString() ?? '')
      setWeight(data.weight?.toString() ?? '')
      setSize(data.size ?? null)
      setCoatType(data.coat_type ?? null)
      setAllergies(data.allergies ?? '')
      setHasLof(data.has_lof)
      setLofInfo(data.lof_info ?? '')
      setPersonalNote(data.personal_note ?? '')
      setProNote(data.pro_note ?? '')
      setSocialTags(data.personality_social_tags ?? [])
      setSociabTags(data.personality_sociability_tags ?? [])
      setLearningTags(data.personality_learning_tags ?? [])
      setGalleryUrls(data.gallery_urls ?? [])
      setHealthDocUrls(data.health_doc_urls ?? [])
      setVaccinations(data.vaccinations ?? [])
    } catch {
      showAlert('Erreur', 'Animal introuvable.')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return
    setPhotoUploading(true)
    try {
      const updated = await petService.uploadMainPhoto(id, result.assets[0].uri)
      setPet(updated)
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'Impossible de mettre à jour la photo.'
      showAlert('Erreur', msg)
    } finally {
      setPhotoUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await petService.updatePet(id, {
        name: name.trim(),
        species: species.trim().toLowerCase(),
        breed: breed.trim() || null,
        age: age ? parseInt(age, 10) : null,
        weight: weight ? parseFloat(weight) : null,
        size: (size as any) || null,
        coat_type: (coatType as any) || null,
        allergies: allergies.trim() || null,
        has_lof: hasLof,
        lof_info: lofInfo.trim() || null,
        personal_note: personalNote.trim() || null,
        pro_note: proNote.trim() || null,
        personality_social_tags: socialTags,
        personality_sociability_tags: sociabTags,
        personality_learning_tags: learningTags,
        vaccinations,
      })
      setPet(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      showAlert('Erreur', 'Impossible de sauvegarder.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const confirmed1 = Platform.OS === 'web'
      ? window.confirm(`Supprimer ${pet?.name} ?`)
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Supprimer', `Supprimer ${pet?.name} ?`, [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirmed1) return

    const confirmed2 = Platform.OS === 'web'
      ? window.confirm('Cette action est irréversible. Confirmer ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Confirmation', 'Cette action est irréversible.', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Supprimer définitivement', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirmed2) return

    await petService.deletePet(id)
    router.replace('/(owner)/mes-animaux')
  }

  async function handleAddGalleryPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return
    setGalleryUploading(true)
    try {
      const updated = await petService.uploadGalleryPhoto(id, result.assets[0].uri)
      setGalleryUrls(updated.gallery_urls ?? [])
    } catch (e: any) {
      showAlert('Erreur', e?.response?.data?.error || 'Impossible d\'ajouter la photo.')
    } finally {
      setGalleryUploading(false)
    }
  }

  async function handleDeleteGalleryPhoto(index: number) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer cette photo ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Supprimer', 'Supprimer cette photo ?', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirmed) return
    try {
      const updated = await petService.deleteGalleryPhoto(id, index)
      setGalleryUrls(updated.gallery_urls ?? [])
    } catch {
      showAlert('Erreur', 'Impossible de supprimer la photo.')
    }
  }

  async function handleUploadHealthDoc() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true })
      if (result.canceled || !result.assets?.[0]) return
      const asset = result.assets[0]
      setDocUploading(true)
      const updated = await petService.uploadHealthDoc(id, asset.uri, asset.name)
      setHealthDocUrls(updated.health_doc_urls ?? [])
    } catch (e: any) {
      showAlert('Erreur', e?.response?.data?.error || 'Impossible d\'uploader le document.')
    } finally {
      setDocUploading(false)
    }
  }

  function addVaccination() {
    const v = vaccinInput.trim()
    if (!v || vaccinations.includes(v)) return
    setVaccinations((prev) => [...prev, v])
    setVaccinInput('')
  }

  function removeVaccination(v: string) {
    setVaccinations((prev) => prev.filter((x) => x !== v))
  }

  function toggleTag(tag: string, list: string[], setList: (t: string[]) => void) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag])
  }

  function showAlert(title: string, msg: string) {
    if (Platform.OS === 'web') window.alert(`${title}: ${msg}`)
    else Alert.alert(title, msg)
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pet?.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Photo principale */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoWrapper} onPress={handlePickPhoto} activeOpacity={0.8}>
            {pet?.main_photo_url ? (
              <Image source={{ uri: pet.main_photo_url }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoEmoji}>🐾</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {photoUploading
                ? <ActivityIndicator size="small" color={Colors.textInverse} />
                : <Camera size={16} color={Colors.textInverse} />
              }
            </View>
          </TouchableOpacity>
        </View>

        {/* Infos de base */}
        <SectionCard title="INFORMATIONS DE BASE">
          <Field label="Nom" value={name} onChangeText={setName} placeholder="Rex" />
          <Field label="Espèce" value={species} onChangeText={setSpecies} placeholder="chien" />
          <Field label="Race" value={breed} onChangeText={setBreed} placeholder="Berger allemand" />
          <View style={styles.row}>
            <Field label="Âge (ans)" value={age} onChangeText={setAge} placeholder="3" keyboardType="numeric" style={{ flex: 1 }} />
            <Field label="Poids (kg)" value={weight} onChangeText={setWeight} placeholder="8.5" keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>
          <PillGroup label="Taille" items={SIZES} selected={size} onSelect={(k) => setSize(size === k ? null : k)} />
          <PillGroup label="Pelage" items={COATS} selected={coatType} onSelect={(k) => setCoatType(coatType === k ? null : k)} />
        </SectionCard>

        {/* Santé */}
        <SectionCard title="SANTÉ & SOINS">
          <Field
            label="Allergies connues"
            value={allergies}
            onChangeText={setAllergies}
            placeholder="Poulet, acariens..."
            multiline
          />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Certificat LOF</Text>
              <Text style={styles.sublabel}>Livre des Origines Françaises</Text>
            </View>
            <Switch
              value={hasLof}
              onValueChange={setHasLof}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
          {hasLof && (
            <Field label="Informations LOF" value={lofInfo} onChangeText={setLofInfo} placeholder="Numéro LOF, éleveur..." />
          )}
        </SectionCard>

        {/* Vaccinations */}
        <SectionCard title="VACCINS & TRAITEMENTS">
          <View style={styles.vaccinRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={vaccinInput}
              onChangeText={setVaccinInput}
              placeholder="Ex : Rage, Leptospirose..."
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={addVaccination}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.vaccinAddBtn} onPress={addVaccination} activeOpacity={0.7}>
              <Plus size={18} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
          {vaccinations.length > 0 && (
            <View style={styles.pillsRow}>
              {vaccinations.map((v) => (
                <TouchableOpacity key={v} style={styles.vaccinTag} onPress={() => removeVaccination(v)} activeOpacity={0.7}>
                  <Text style={styles.vaccinTagText}>{v}</Text>
                  <X size={12} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {vaccinations.length === 0 && (
            <Text style={styles.emptyHint}>Aucun vaccin enregistré. Tapez un nom et appuyez sur +</Text>
          )}
        </SectionCard>

        {/* Galerie photos */}
        <SectionCard title="GALERIE PHOTOS">
          <View style={styles.galleryGrid}>
            {galleryUrls.map((url, i) => (
              <View key={i} style={styles.galleryCell}>
                <Image source={{ uri: url }} style={styles.galleryImg} />
                <TouchableOpacity style={styles.galleryDelete} onPress={() => handleDeleteGalleryPhoto(i)} activeOpacity={0.7}>
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {galleryUrls.length < 6 && (
              <TouchableOpacity style={styles.galleryAdd} onPress={handleAddGalleryPhoto} activeOpacity={0.7} disabled={galleryUploading}>
                {galleryUploading
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <><ImageIcon size={22} color={Colors.textMuted} /><Text style={styles.galleryAddText}>{galleryUrls.length}/6</Text></>
                }
              </TouchableOpacity>
            )}
          </View>
        </SectionCard>

        {/* Documents santé */}
        <SectionCard title="DOCUMENTS SANTÉ">
          {healthDocUrls.length === 0 ? (
            <Text style={styles.emptyHint}>Aucun document. Carnet de santé, ordonnances, etc.</Text>
          ) : (
            healthDocUrls.map((url, i) => (
              <View key={i} style={styles.docRow}>
                <FileText size={16} color={Colors.primary} />
                <Text style={styles.docLabel} numberOfLines={1}>Document {i + 1}</Text>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.uploadDocBtn} onPress={handleUploadHealthDoc} activeOpacity={0.7} disabled={docUploading}>
            {docUploading
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <><Plus size={16} color={Colors.primary} /><Text style={styles.uploadDocText}>Ajouter un document (PDF / image)</Text></>
            }
          </TouchableOpacity>
        </SectionCard>

        {/* Personnalité */}
        <SectionCard title="PERSONNALITÉ">
          <TagGroup label="Social & Comportement" tags={SOCIAL_TAGS} selected={socialTags}
            onToggle={(t) => toggleTag(t, socialTags, setSocialTags)} />
          <TagGroup label="Sociabilité" tags={SOCIAB_TAGS} selected={sociabTags}
            onToggle={(t) => toggleTag(t, sociabTags, setSociabTags)} />
          <TagGroup label="Apprentissage" tags={LEARNING_TAGS} selected={learningTags}
            onToggle={(t) => toggleTag(t, learningTags, setLearningTags)} />
        </SectionCard>

        {/* Notes */}
        <SectionCard title="NOTES">
          <Field label="Note personnelle" value={personalNote} onChangeText={setPersonalNote}
            placeholder="Note privée visible uniquement par vous..." multiline />
          <Field label="Note pour les professionnels" value={proNote} onChangeText={setProNote}
            placeholder="Information utile pour le vétérinaire ou le toiletteur..." multiline />
        </SectionCard>

        {/* Sauvegarder */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : saved ? (
            <View style={styles.savedRow}>
              <CheckCircle size={18} color={Colors.textInverse} />
              <Text style={styles.saveButtonText}>Sauvegardé</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          )}
        </TouchableOpacity>

        {/* Zone de danger */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>ZONE DE DANGER</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
            <Trash2 size={16} color={Colors.error} />
            <Text style={styles.deleteText}>Supprimer {pet?.name}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────
// Composants internes
// ─────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, style }: {
  label: string; value: string; onChangeText: (t: string) => void
  placeholder: string; keyboardType?: any; multiline?: boolean; style?: object
}) {
  return (
    <View style={[{ gap: Spacing.xs }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  )
}

function PillGroup({ label, items, selected, onSelect }: {
  label: string; items: { key: string; label: string }[]
  selected: string | null; onSelect: (k: string) => void
}) {
  return (
    <View style={{ gap: Spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pillsRow}>
        {items.map((i) => (
          <TouchableOpacity
            key={i.key}
            style={[styles.pill, selected === i.key && styles.pillActive]}
            onPress={() => onSelect(i.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selected === i.key && styles.pillTextActive]}>{i.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

function TagGroup({ label, tags, selected, onToggle }: {
  label: string; tags: string[]; selected: string[]; onToggle: (t: string) => void
}) {
  return (
    <View style={{ gap: Spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pillsRow}>
        {tags.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.pill, selected.includes(t) && styles.pillActive]}
            onPress={() => onToggle(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selected.includes(t) && styles.pillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },

  content: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: 48 },

  photoSection: { alignItems: 'center' },
  photoWrapper: { position: 'relative' },
  photo: { width: 120, height: 120, borderRadius: Radius.xl },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  photoEmoji: { fontSize: 52 },
  cameraOverlay: {
    position: 'absolute', bottom: 4, right: 4,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.base, ...Shadow.sm,
  },
  sectionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },

  row: { flexDirection: 'row', gap: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  sublabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { fontSize: Typography.sm, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primaryDark, fontWeight: Typography.semibold },

  saveButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.base, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.semibold },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  vaccinRow:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  vaccinAddBtn:  { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  vaccinTag:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
  vaccinTagText: { fontSize: Typography.sm, color: Colors.primaryDark },
  emptyHint:     { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },

  galleryGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  galleryCell:    { width: 90, height: 90, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  galleryImg:     { width: 90, height: 90 },
  galleryDelete:  { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  galleryAdd:     { width: 90, height: 90, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  galleryAddText: { fontSize: Typography.xs, color: Colors.textMuted },

  docRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  docLabel:      { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary },
  uploadDocBtn:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  uploadDocText: { fontSize: Typography.sm, color: Colors.primary },

  dangerZone: {
    borderWidth: 1, borderColor: Colors.errorLight,
    borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md,
  },
  dangerTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.error, letterSpacing: 1 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  deleteText: { fontSize: Typography.base, color: Colors.error },
})
