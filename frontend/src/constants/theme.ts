// Tokens de design — référence unique pour toute l'UI
// Chaque couleur, taille, radius utilisé dans l'app vient d'ici.
// Jamais de valeur hardcodée dans les composants.

export const Colors = {
  // Primaire — orange Gali'Pet
  primary: '#F97316',
  primaryLight: '#FED7AA',
  primaryDark: '#C2500A',

  // Secondaire — teal (tags pet-sitting, toilettage)
  teal: '#14B8A6',
  tealLight: '#99F6E4',

  // Fond
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',

  // Texte
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Statuts
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',

  // Bordures
  border: '#E5E7EB',
  borderFocus: '#F97316',

  // Tags services
  tagSante: '#F97316',       // orange
  tagPetSitting: '#14B8A6',  // teal
  tagToilettage: '#14B8A6',  // teal
  tagEducation: '#F97316',   // orange
} as const

export const Typography = {
  // Tailles
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,

  // Graisses
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const
