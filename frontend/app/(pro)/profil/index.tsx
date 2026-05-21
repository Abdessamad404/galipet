import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image, Modal, Platform,
} from 'react-native'
import DateInput from '@/components/DateInput'
import * as ImagePicker from 'expo-image-picker'
import { Camera, CheckCircle, Plus, Trash2, CreditCard } from 'lucide-react-native'
import { Switch } from 'react-native'
import { useAuthStore } from '@/store/authStore'
import { profileService } from '@/services/profile.service'
import { Certification, ProAboutQA } from '@/types'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const ACTIVITY_TYPES = [
  { key: 'sante',       label: '🩺 Santé' },
  { key: 'toilettage',  label: '✂️ Toilettage' },
  { key: 'pet-sitting', label: '🐾 Pet-sitting' },
  { key: 'education',   label: '🎓 Éducation' },
]

const VALID_ACTIVITY_KEYS = ACTIVITY_TYPES.map((t) => t.key)
const filterActivityTypes = (types: string[]) => types.filter((t) => VALID_ACTIVITY_KEYS.includes(t))

const DAYS = [
  { key: 'lun', label: 'Lundi' },
  { key: 'mar', label: 'Mardi' },
  { key: 'mer', label: 'Mercredi' },
  { key: 'jeu', label: 'Jeudi' },
  { key: 'ven', label: 'Vendredi' },
  { key: 'sam', label: 'Samedi' },
  { key: 'dim', label: 'Dimanche' },
]

export default function ProProfileScreen() {
  const { profile, setProfile } = useAuthStore()

  const [isLoading, setIsLoading]       = useState(false)
  const [isSaved, setIsSaved]           = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUri, setAvatarUri]       = useState<string | null>(profile?.avatar_url ?? null)

  // Informations personnelles
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName]   = useState(profile?.last_name ?? '')
  const [phone, setPhone]         = useState(profile?.phone ?? '')
  const [address, setAddress]     = useState(profile?.address ?? '')
  const [city, setCity]           = useState(profile?.city ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '')

  // Informations pro
  const [title, setTitle]                   = useState(profile?.title ?? '')
  const [companyName, setCompanyName]       = useState(profile?.company_name ?? '')
  const [companyAddress, setCompanyAddress] = useState(profile?.company_address ?? '')
  const [companyEmail, setCompanyEmail]     = useState(profile?.company_email ?? '')
  const [siretIce, setSiretIce]             = useState(profile?.siret_ice ?? '')
  const [companyDesc, setCompanyDesc]       = useState(profile?.company_description ?? '')
  const [activityTypes, setActivityTypes]   = useState<string[]>(filterActivityTypes(profile?.activity_types ?? []))

  // Certifications & Q&A (chargés depuis l'API)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [aboutQA, setAboutQA]               = useState<ProAboutQA[]>([])
  const [loadingExtra, setLoadingExtra]     = useState(true)

  // Paiement configuré
  const [paymentConfigured, setPaymentConfigured] = useState(profile?.payment_configured ?? false)

  // Horaires de travail
  type DayKey = 'lun'|'mar'|'mer'|'jeu'|'ven'|'sam'|'dim'
  type DaySchedule = { open: string; close: string } | 'closed'
  const initHours = (): Record<DayKey, DaySchedule> => {
    const wh = (profile?.working_hours as any) ?? {}
    const defaults: Record<DayKey, DaySchedule> = {
      lun: 'closed', mar: 'closed', mer: 'closed', jeu: 'closed',
      ven: 'closed', sam: 'closed', dim: 'closed',
    }
    for (const k of Object.keys(defaults) as DayKey[]) {
      if (wh[k]) defaults[k] = wh[k]
    }
    return defaults
  }
  const [workingHours, setWorkingHours] = useState<Record<DayKey, DaySchedule>>(initHours)

  // Modal ajout certification
  const [certModalVisible, setCertModalVisible] = useState(false)
  const [certModalTitle, setCertModalTitle]     = useState('')
  const [certModalDesc, setCertModalDesc]       = useState('')
  const [certModalLoading, setCertModalLoading] = useState(false)

  // Modal ajout Q&A
  const [qaModalVisible, setQaModalVisible]   = useState(false)
  const [qaModalQ, setQaModalQ]               = useState('')
  const [qaModalA, setQaModalA]               = useState('')
  const [qaModalLoading, setQaModalLoading]   = useState(false)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name)
      setLastName(profile.last_name)
      setPhone(profile.phone ?? '')
      setAddress(profile.address ?? '')
      setCity(profile.city ?? '')
      setBirthDate(profile.birth_date ?? '')
      setTitle(profile.title ?? '')
      setCompanyName(profile.company_name ?? '')
      setCompanyAddress(profile.company_address ?? '')
      setCompanyEmail(profile.company_email ?? '')
      setSiretIce(profile.siret_ice ?? '')
      setCompanyDesc(profile.company_description ?? '')
      setActivityTypes(filterActivityTypes(profile.activity_types ?? []))
      setAvatarUri(profile.avatar_url ?? null)
      setPaymentConfigured(profile.payment_configured ?? false)
      const wh = (profile.working_hours as any) ?? {}
      const days: DayKey[] = ['lun','mar','mer','jeu','ven','sam','dim']
      const hours: Record<DayKey, DaySchedule> = {} as any
      for (const k of days) hours[k] = wh[k] ?? 'closed'
      setWorkingHours(hours)
    }
  }, [profile?.id])

  useEffect(() => {
    async function loadExtra() {
      try {
        const [certs, qa] = await Promise.all([
          profileService.getCertifications(),
          profileService.getAboutQA(),
        ])
        setCertifications(certs)
        setAboutQA(qa)
      } catch {
        // silencieux — listes simplement vides
      } finally {
        setLoadingExtra(false)
      }
    }
    loadExtra()
  }, [])

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie.")
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
      await initialize()
    } catch {
      Alert.alert('Erreur', "Impossible d'uploader la photo.")
      setAvatarUri(profile?.avatar_url ?? null)
    } finally {
      setAvatarUploading(false)
    }
  }

  function toggleActivityType(key: string) {
    setActivityTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    setIsLoading(true)
    setIsSaved(false)
    try {
      const updated = await profileService.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        birth_date: birthDate.trim() || null,
        title: title.trim() || null,
        company_name: companyName.trim() || null,
        company_address: companyAddress.trim() || null,
        company_email: companyEmail.trim() || null,
        siret_ice: siretIce.trim() || null,
        company_description: companyDesc.trim() || null,
        activity_types: activityTypes,
        working_hours: workingHours,
        payment_configured: paymentConfigured,
      } as any)
      setProfile(updated)   // met à jour le store sans re-fetch (évite reset des champs)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteCert(id: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer cette certification ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Supprimer', 'Supprimer cette certification ?', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirmed) return
    try {
      await profileService.deleteCertification(id)
      setCertifications((prev) => prev.filter((c) => c.id !== id))
    } catch {
      if (Platform.OS === 'web') window.alert('Impossible de supprimer la certification.')
      else Alert.alert('Erreur', 'Impossible de supprimer la certification.')
    }
  }

  function handleAddCert() {
    setCertModalTitle('')
    setCertModalDesc('')
    setCertModalVisible(true)
  }

  async function handleCertModalSubmit() {
    if (!certModalTitle.trim()) return
    setCertModalLoading(true)
    try {
      const cert = await profileService.createCertification({
        title: certModalTitle.trim(),
        description: certModalDesc.trim() || undefined,
      })
      setCertifications((prev) => [...prev, cert])
      setCertModalVisible(false)
    } catch {
      const msg = 'Impossible d\'ajouter la certification.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    } finally {
      setCertModalLoading(false)
    }
  }

  async function handleDeleteQA(id: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer cette Q&A ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Supprimer', 'Supprimer cette Q&A ?', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirmed) return
    try {
      await profileService.deleteQA(id)
      setAboutQA((prev) => prev.filter((q) => q.id !== id))
    } catch {
      if (Platform.OS === 'web') window.alert('Impossible de supprimer la Q&A.')
      else Alert.alert('Erreur', 'Impossible de supprimer la Q&A.')
    }
  }

  async function handleQAModalSubmit() {
    if (!qaModalQ.trim() || !qaModalA.trim()) return
    setQaModalLoading(true)
    try {
      const qa = await profileService.createQA({
        question: qaModalQ.trim(),
        answer: qaModalA.trim(),
        order_index: aboutQA.length,
      })
      setAboutQA((prev) => [...prev, qa])
      setQaModalVisible(false)
      setQaModalQ('')
      setQaModalA('')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Impossible d\'ajouter la Q&A.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Erreur', msg)
    } finally {
      setQaModalLoading(false)
    }
  }

  function toggleDay(key: DayKey) {
    setWorkingHours((prev) => ({
      ...prev,
      [key]: prev[key] === 'closed' ? { open: '09:00', close: '18:00' } : 'closed',
    }))
  }

  function updateDayTime(key: DayKey, field: 'open' | 'close', value: string) {
    setWorkingHours((prev) => {
      const current = prev[key]
      if (current === 'closed') return prev
      return { ...prev, [key]: { ...current, [field]: value } }
    })
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
      <SectionCard title="INFORMATIONS PERSONNELLES">
        <View style={styles.row}>
          <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Jean" style={{ flex: 1 }} />
          <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Dupont" style={{ flex: 1 }} />
        </View>
        <Field label="Email" value={profile?.email ?? ''} onChangeText={() => {}} placeholder="" editable={false} hint="Non modifiable" />
        <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78" keyboardType="phone-pad" />
        <DateInput label="Date de naissance" value={birthDate} onChange={setBirthDate} />
        <Field label="Adresse" value={address} onChangeText={setAddress} placeholder="12 rue des Lilas" />
        <Field label="Ville" value={city} onChangeText={setCity} placeholder="Paris" />
      </SectionCard>

      {/* Activité professionnelle */}
      <SectionCard title="ACTIVITÉ PROFESSIONNELLE">
        <Field label="Titre" value={title} onChangeText={setTitle} placeholder="Vétérinaire, Toiletteur..." />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Types d'activité</Text>
          <View style={styles.tagsRow}>
            {ACTIVITY_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tag, activityTypes.includes(t.key) && styles.tagActive]}
                onPress={() => toggleActivityType(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, activityTypes.includes(t.key) && styles.tagTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SectionCard>

      {/* Informations entreprise */}
      <SectionCard title="INFORMATIONS ENTREPRISE">
        <Field label="Nom de l'entreprise" value={companyName} onChangeText={setCompanyName} placeholder="Cabinet vétérinaire du Parc" />
        <Field label="Adresse professionnelle" value={companyAddress} onChangeText={setCompanyAddress} placeholder="12 avenue des Animaux" />
        <Field label="Email professionnel" value={companyEmail} onChangeText={setCompanyEmail} placeholder="contact@cabinet.fr" keyboardType="email-address" />
        <Field label="SIRET / ICE" value={siretIce} onChangeText={setSiretIce} placeholder="123 456 789 00010" keyboardType="numeric" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[fieldStyles.input, { height: 100, textAlignVertical: 'top' }]}
            value={companyDesc}
            onChangeText={setCompanyDesc}
            placeholder="Décrivez votre activité en quelques lignes..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>
      </SectionCard>

      {/* Horaires de travail */}
      <SectionCard title="HORAIRES DE TRAVAIL">
        {DAYS.map((d) => {
          const schedule = workingHours[d.key as DayKey]
          const isOpen   = schedule !== 'closed'
          return (
            <View key={d.key} style={styles.dayRow}>
              <View style={styles.dayToggleRow}>
                <Switch
                  value={isOpen}
                  onValueChange={() => toggleDay(d.key as DayKey)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={isOpen ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.dayLabel, !isOpen && styles.dayLabelClosed]}>{d.label}</Text>
              </View>
              {isOpen && typeof schedule === 'object' ? (
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={schedule.open}
                    onChangeText={(v) => updateDayTime(d.key as DayKey, 'open', v)}
                    placeholder="09:00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                  <Text style={styles.timeSep}>–</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={schedule.close}
                    onChangeText={(v) => updateDayTime(d.key as DayKey, 'close', v)}
                    placeholder="18:00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              ) : (
                <Text style={styles.dayClosedLabel}>Fermé</Text>
              )}
            </View>
          )
        })}
      </SectionCard>

      {/* Certifications */}
      <SectionCard title="CERTIFICATIONS & DIPLÔMES">
        {loadingExtra ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{cert.title}</Text>
                  {cert.description && <Text style={styles.listItemSub}>{cert.description}</Text>}
                  {cert.issued_date && <Text style={styles.listItemMeta}>{cert.issued_date}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteCert(cert.id)} hitSlop={8}>
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddCert} activeOpacity={0.7}>
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addButtonText}>Ajouter une certification</Text>
            </TouchableOpacity>
          </>
        )}
      </SectionCard>

      {/* Q&A */}
      <SectionCard title="À PROPOS DE MOI (Q&A)">
        {loadingExtra ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            {aboutQA.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{item.question}</Text>
                  <Text style={styles.listItemSub}>{item.answer}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteQA(item.id)} hitSlop={8}>
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {aboutQA.length < 5 && (
              <TouchableOpacity style={styles.addButton} onPress={() => setQaModalVisible(true)} activeOpacity={0.7}>
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.addButtonText}>Ajouter une question ({aboutQA.length}/5)</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </SectionCard>

      {/* Paiement */}
      <SectionCard title="PAIEMENT">
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <CreditCard size={20} color={paymentConfigured ? Colors.success : Colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>Paiement configuré</Text>
              <Text style={styles.paymentSub}>
                {paymentConfigured
                  ? 'Vos clients peuvent régler en ligne.'
                  : 'Activez pour accepter les paiements en ligne.'}
              </Text>
            </View>
          </View>
          <Switch
            value={paymentConfigured}
            onValueChange={setPaymentConfigured}
            trackColor={{ false: Colors.border, true: Colors.successLight }}
            thumbColor={paymentConfigured ? Colors.success : Colors.textMuted}
          />
        </View>
      </SectionCard>

      {/* Modal ajout certification */}
      <Modal
        visible={certModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCertModalVisible(false)}
      >
        <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={() => setCertModalVisible(false)}>
          <View style={modal.box} onStartShouldSetResponder={() => true}>
            <Text style={modal.title}>Nouvelle certification</Text>

            <View style={modal.field}>
              <Text style={modal.label}>Titre *</Text>
              <TextInput
                style={modal.input}
                value={certModalTitle}
                onChangeText={setCertModalTitle}
                placeholder="Ex : Certificat de toilettage canin"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>

            <View style={modal.field}>
              <Text style={modal.label}>Description (optionnel)</Text>
              <TextInput
                style={modal.input}
                value={certModalDesc}
                onChangeText={setCertModalDesc}
                placeholder="Organisme, détails..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={modal.actions}>
              <TouchableOpacity
                style={modal.cancelBtn}
                onPress={() => setCertModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={modal.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.confirmBtn, (!certModalTitle.trim() || certModalLoading) && modal.btnDisabled]}
                onPress={handleCertModalSubmit}
                disabled={!certModalTitle.trim() || certModalLoading}
                activeOpacity={0.8}
              >
                {certModalLoading
                  ? <ActivityIndicator color={Colors.textInverse} size="small" />
                  : <Text style={modal.confirmText}>Ajouter</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal ajout Q&A */}
      <Modal
        visible={qaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQaModalVisible(false)}
      >
        <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={() => setQaModalVisible(false)}>
          <View style={modal.box} onStartShouldSetResponder={() => true}>
            <Text style={modal.title}>Nouvelle question</Text>

            <View style={modal.field}>
              <Text style={modal.label}>Question *</Text>
              <TextInput
                style={modal.input}
                value={qaModalQ}
                onChangeText={setQaModalQ}
                placeholder="Ex : Depuis combien de temps exercez-vous ?"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>

            <View style={modal.field}>
              <Text style={modal.label}>Réponse *</Text>
              <TextInput
                style={[modal.input, { height: 80, textAlignVertical: 'top' }]}
                value={qaModalA}
                onChangeText={setQaModalA}
                placeholder="Votre réponse..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>

            <View style={modal.actions}>
              <TouchableOpacity
                style={modal.cancelBtn}
                onPress={() => setQaModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={modal.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.confirmBtn, ((!qaModalQ.trim() || !qaModalA.trim()) || qaModalLoading) && modal.btnDisabled]}
                onPress={handleQAModalSubmit}
                disabled={!qaModalQ.trim() || !qaModalA.trim() || qaModalLoading}
                activeOpacity={0.8}
              >
                {qaModalLoading
                  ? <ActivityIndicator color={Colors.textInverse} size="small" />
                  : <Text style={modal.confirmText}>Ajouter</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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

function Field({
  label, value, onChangeText, placeholder, hint,
  editable = true, keyboardType, style,
}: {
  label: string; value: string; onChangeText: (t: string) => void
  placeholder: string; hint?: string; editable?: boolean; keyboardType?: any; style?: object
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
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
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
    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30,
    borderRadius: 15, backgroundColor: Colors.textPrimary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  avatarHint: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.sm },

  card: {
    marginHorizontal: Spacing['2xl'], marginBottom: Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.base, ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: Typography.bold,
    color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.xs,
  },
  row: { flexDirection: 'row', gap: Spacing.md },

  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tagActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tagText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tagTextActive: { color: Colors.primaryDark, fontWeight: Typography.semibold },

  dayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  dayToggleRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayLabel:       { fontSize: Typography.sm, color: Colors.textPrimary },
  dayLabelClosed: { color: Colors.textMuted },
  dayClosedLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },
  timeRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  timeInput: {
    width: 56, textAlign: 'center',
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingVertical: 4,
    fontSize: Typography.sm, color: Colors.textPrimary,
  },
  timeSep: { fontSize: Typography.sm, color: Colors.textMuted },

  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  paymentLabel: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
  paymentSub:   { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  listItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  listItemContent: { flex: 1, gap: 2 },
  listItemTitle: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
  listItemSub: { fontSize: Typography.sm, color: Colors.textSecondary },
  listItemMeta: { fontSize: Typography.xs, color: Colors.textMuted },

  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, marginTop: Spacing.xs,
  },
  addButtonText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },

  hintText: { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },

  saveButton: {
    backgroundColor: Colors.primary, marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.xs, borderRadius: Radius.md,
    paddingVertical: Spacing.base, alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.semibold },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
})

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  box: {
    width: '100%', maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.base,
    ...Shadow.lg,
  },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
  },
  actions:    { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  cancelBtn:  { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  cancelText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
  confirmBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: Radius.md, backgroundColor: Colors.primary },
  confirmText: { fontSize: Typography.base, color: Colors.textInverse, fontWeight: Typography.semibold },
  btnDisabled: { opacity: 0.5 },
})
