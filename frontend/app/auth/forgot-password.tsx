import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { ChevronLeft, CheckCircle } from 'lucide-react-native'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

export default function ForgotPasswordScreen() {
  const { forgotPassword, isLoading, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    clearError()
    if (!email.trim()) { setEmailError('Email requis'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Email invalide'); return }
    setEmailError('')

    try {
      await forgotPassword(email.trim().toLowerCase())
      setSent(true)
    } catch {
      // Erreur silencieuse — on affiche toujours "envoyé" pour ne pas exposer l'existence du compte
      setSent(true)
    }
  }

  // Confirmation envoyée
  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <CheckCircle size={56} color={Colors.success} />
          <Text style={styles.sentTitle}>Email envoyé !</Text>
          <Text style={styles.sentText}>
            Si un compte existe avec l'adresse {email}, vous recevrez un email avec un lien de
            réinitialisation.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={20} color={Colors.textSecondary} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Entrez votre email, on vous envoie un lien pour réinitialiser votre mot de passe.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <Text style={styles.buttonText}>Envoyer le lien</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing['2xl'] },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  backText: { fontSize: Typography.sm, color: Colors.textSecondary },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.base },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22 },
  sentTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sentText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
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
})
