import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Link, router } from 'expo-router'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'
import type { UserRole } from '@/types'

// L'inscription se fait en 2 étapes :
// Étape 1 — Choix du rôle (owner / professionnel)
// Étape 2 — Informations personnelles

type Role = 'owner' | 'professional'

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'owner',
    label: '🐾 Propriétaire',
    description: "Je cherche des professionnels pour mon animal",
  },
  {
    value: 'professional',
    label: '💼 Professionnel',
    description: "Je propose des services animaliers",
  },
]

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuthStore()

  useEffect(() => { clearError() }, [])

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validateStep2(): boolean {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = 'Prénom requis'
    if (!lastName.trim()) errors.lastName = 'Nom requis'
    if (!email.trim()) errors.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email invalide'
    if (!password) errors.password = 'Mot de passe requis'
    else if (password.length < 8) errors.password = 'Minimum 8 caractères'
    else if (!/[A-Z]/.test(password)) errors.password = 'Au moins une majuscule requise'
    else if (!/[0-9]/.test(password)) errors.password = 'Au moins un chiffre requis'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleRegister() {
    clearError()
    if (!validateStep2() || !role) return
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      })
      router.replace('/')
    } catch {
      // Erreur affichée via le store
    }
  }

  // --- Étape 1 : choix du rôle ---
  if (step === 1) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.logo}>gali'pet</Text>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Qui êtes-vous ?</Text>
          </View>

          <View style={styles.roleList}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
                onPress={() => setRole(r.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.roleLabel}>{r.label}</Text>
                <Text style={styles.roleDescription}>{r.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, !role && styles.buttonDisabled]}
            onPress={() => role && setStep(2)}
            disabled={!role}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/auth/login" style={styles.footerLink}>Se connecter</Link>
          </View>
        </ScrollView>
      </View>
    )
  }

  // --- Étape 2 : informations ---
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Retour étape 1 */}
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <ChevronLeft size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Vos informations</Text>
          <Text style={styles.subtitle}>
            Compte {role === 'owner' ? 'propriétaire' : 'professionnel'}
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Prénom / Nom en ligne */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={[styles.input, fieldErrors.firstName && styles.inputError]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Jean"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
              {fieldErrors.firstName && <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={[styles.input, fieldErrors.lastName && styles.inputError]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Dupont"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
              {fieldErrors.lastName && <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>}
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
          </View>

          {/* Mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputPaddingRight, fieldErrors.password && styles.inputError]}
                value={password}
                onChangeText={setPassword}
                placeholder="8 car. min, 1 majuscule, 1 chiffre"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                {showPassword
                  ? <EyeOff size={20} color={Colors.textSecondary} />
                  : <Eye size={20} color={Colors.textSecondary} />
                }
              </TouchableOpacity>
            </View>
            {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.textInverse} />
              : <Text style={styles.buttonText}>Créer mon compte</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  backText: { fontSize: Typography.sm, color: Colors.textSecondary },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logo: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary },
  roleList: { gap: Spacing.md, marginBottom: Spacing.xl },
  roleCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  roleCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  roleDescription: { fontSize: Typography.sm, color: Colors.textSecondary },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorBannerText: { color: Colors.error, fontSize: Typography.sm, textAlign: 'center' },
  form: { gap: Spacing.base },
  row: { flexDirection: 'row', gap: Spacing.md },
  field: { gap: Spacing.xs },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
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
  inputError: { borderColor: Colors.error },
  inputWrapper: { position: 'relative' },
  inputPaddingRight: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: Spacing.base,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  fieldError: { fontSize: Typography.xs, color: Colors.error },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  footerLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
})
