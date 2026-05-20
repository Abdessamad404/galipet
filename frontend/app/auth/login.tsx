import { useState } from 'react'
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
import { Eye, EyeOff } from 'lucide-react-native'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {}
    if (!email) errors.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email invalide'
    if (!password) errors.password = 'Mot de passe requis'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleLogin() {
    clearError()
    if (!validate()) return
    try {
      await login({ email: email.trim().toLowerCase(), password })
      // La redirection est gérée par app/index.tsx qui lit le store
      router.replace('/')
    } catch {
      // L'erreur est déjà dans le store, on l'affiche
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo / titre */}
        <View style={styles.header}>
          <Text style={styles.logo}>gali'pet</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        {/* Erreur globale (vient du serveur) */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.form}>
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
              autoComplete="email"
              onFocus={clearError}
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
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                onFocus={clearError}
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

          {/* Mot de passe oublié */}
          <Link href="/auth/forgot-password" style={styles.forgotLink}>
            Mot de passe oublié ?
          </Link>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.textInverse} />
              : <Text style={styles.buttonText}>Se connecter</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Lien inscription */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/auth/register" style={styles.footerLink}>
            S'inscrire
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logo: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: Typography.sm,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.base,
  },
  field: {
    gap: Spacing.xs,
  },
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
  inputError: {
    borderColor: Colors.error,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputPaddingRight: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.base,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  fieldError: {
    fontSize: Typography.xs,
    color: Colors.error,
  },
  forgotLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    textAlign: 'right',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
})
