import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import {
  Heart,
  Settings,
  HelpCircle,
  ShoppingBag,
  LogOut,
  ChevronRight,
  Info,
} from 'lucide-react-native'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

export default function GalipetMenuProScreen() {
  const { logout, profile } = useAuthStore()

  async function handleLogout() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')
      : await new Promise<boolean>((resolve) =>
          Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Se déconnecter', style: 'destructive', onPress: () => resolve(true) },
            ]
          )
        )
    if (!confirmed) return
    await logout()
    router.replace('/auth/login')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{profile?.first_name} {profile?.last_name}</Text>
          <Text style={styles.userRole}>Professionnel</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>ACTION PRINCIPALE</Text>
        <Text style={styles.heroTitle}>Découvrir nos services</Text>
        <Text style={styles.heroSubtitle}>
          Trouvez les meilleurs professionnels pour votre compagnon : vétérinaires, toiletteurs, éducateurs...
        </Text>
        <TouchableOpacity style={styles.heroCta} activeOpacity={0.8}>
          <Text style={styles.heroCtaText}>Explorer maintenant →</Text>
        </TouchableOpacity>
      </View>

      <MenuSection label="À PROPOS DE GALI'PET">
        <MenuItem
          icon={<Heart size={20} color={Colors.primary} />}
          label="Notre mission"
          sublabel="Découvrez nos valeurs et l'équipe"
          onPress={() => {}}
        />
      </MenuSection>

      <MenuSection label="MON COMPTE">
        <MenuItem
          icon={<Settings size={20} color={Colors.textSecondary} />}
          label="Paramètres"
          sublabel="Préférences et sécurité"
          onPress={() => {}}
        />
      </MenuSection>

      <MenuSection label="AIDE & INFORMATIONS">
        <MenuItem
          icon={<HelpCircle size={20} color={Colors.textSecondary} />}
          label="FAQ & Support"
          sublabel="Besoin d'aide ?"
          onPress={() => {}}
        />
        <MenuItem
          icon={<Info size={20} color={Colors.textSecondary} />}
          label="Mentions légales"
          onPress={() => {}}
        />
      </MenuSection>

      <MenuSection label="BOUTIQUE">
        <MenuItem
          icon={<ShoppingBag size={20} color={Colors.primary} />}
          label="Boutique & WAFs"
          sublabel="Abonnements et monnaie virtuelle"
          labelStyle={{ color: Colors.primary }}
          onPress={() => {}}
        />
      </MenuSection>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <LogOut size={18} color={Colors.primary} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CGU · Mentions légales · Confidentialité</Text>
        <Text style={styles.footerText}>© 2026 Gali'Pet</Text>
      </View>
    </ScrollView>
  )
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  )
}

function MenuItem({
  icon, label, sublabel, labelStyle, onPress,
}: {
  icon: React.ReactNode; label: string; sublabel?: string; labelStyle?: object; onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuItemLeft}>
        {icon}
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemLabel, labelStyle]}>{label}</Text>
          {sublabel && <Text style={styles.menuItemSublabel}>{sublabel}</Text>}
        </View>
      </View>
      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  userHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textInverse, fontSize: Typography.lg, fontWeight: Typography.bold },
  userName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  userRole: { fontSize: Typography.sm, color: Colors.textSecondary },
  heroCard: {
    margin: Spacing['2xl'], backgroundColor: '#1B4D3E',
    borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.sm,
  },
  heroLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 1 },
  heroTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: '#FFFFFF' },
  heroSubtitle: { fontSize: Typography.sm, color: '#A7C4BB', lineHeight: 20 },
  heroCta: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  heroCtaText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary },
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted,
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  menuItemText: { flex: 1 },
  menuItemLabel: { fontSize: Typography.base, color: Colors.textPrimary },
  menuItemSublabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginHorizontal: Spacing['2xl'], marginTop: Spacing.md,
    paddingVertical: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  logoutText: { color: Colors.primary, fontSize: Typography.base, fontWeight: Typography.semibold },
  footer: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing['2xl'] },
  footerText: { fontSize: Typography.xs, color: Colors.textMuted },
})
