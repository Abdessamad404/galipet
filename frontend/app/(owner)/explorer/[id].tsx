import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Linking, Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import {
  ChevronLeft, MapPin, Phone, Mail, Clock,
  Award, MessageCircle, Star, Calendar, MessageSquare,
} from 'lucide-react-native'
import { professionalService, ProfessionalFull } from '@/services/professional.service'
import { reviewService, Review, ProRating } from '@/services/review.service'
import { messageService } from '@/services/message.service'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

const ACTIVITY_LABELS: Record<string, string> = {
  grooming: 'Toilettage',
  sitting:  'Pet-sitting',
  training: 'Éducation',
  vet:      'Vétérinaire',
  walking:  'Promenade',
  boarding: 'Pension',
}

const DAY_LABELS: Record<string, string> = {
  lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi',
  jeu: 'Jeudi', ven: 'Vendredi', sam: 'Samedi', dim: 'Dimanche',
}

// ─────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────
export default function ProProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [pro, setPro]         = useState<ProfessionalFull | null>(null)
  const [rating, setRating]   = useState<ProRating | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [contacting, setContacting] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    if (!id) return
    setError(null)
    try {
      const [data, ratingData, reviewsData] = await Promise.all([
        professionalService.getById(id),
        reviewService.getProRating(id),
        reviewService.getProReviews(id),
      ])
      setPro(data)
      setRating(ratingData)
      setReviews(reviewsData)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Professionnel introuvable.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (error || !pro) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Professionnel introuvable.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const initials = `${pro.first_name[0]}${pro.last_name[0]}`

  async function handleContact() {
    setContacting(true)
    try {
      const conv   = await messageService.getOrCreate(pro.id)
      const name   = pro.company_name || `${pro.first_name} ${pro.last_name}`
      const avatar = pro.avatar_url ?? ''
      router.push({ pathname: '/(owner)/messages/[id]' as any, params: { id: conv.id, otherName: name, otherAvatar: avatar } })
    } catch {}
    finally { setContacting(false) }
  }

  return (
    <View style={styles.container}>
      {/* Header fixe */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pro.company_name || `${pro.first_name} ${pro.last_name}`}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero — avatar + nom + tags */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            {pro.avatar_url ? (
              <Image source={{ uri: pro.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <Text style={styles.heroName}>{pro.first_name} {pro.last_name}</Text>
          {pro.title && <Text style={styles.heroTitle}>{pro.title}</Text>}
          {pro.company_name && <Text style={styles.heroCompany}>{pro.company_name}</Text>}

          {pro.city && (
            <View style={styles.heroLocation}>
              <MapPin size={13} color={Colors.textMuted} />
              <Text style={styles.heroLocationText}>{pro.city}</Text>
            </View>
          )}

          {/* Note moyenne */}
          {rating && rating.review_count > 0 && (
            <View style={styles.ratingRow}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{rating.average_rating}</Text>
              <Text style={styles.ratingCount}>({rating.review_count} avis)</Text>
            </View>
          )}

          {/* Tags services */}
          {pro.activity_types.length > 0 && (
            <View style={styles.tagsRow}>
              {pro.activity_types.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{ACTIVITY_LABELS[t] ?? t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTAs */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.bookBtn, { flex: 1 }]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(owner)/explorer/booking', params: { proId: pro.id, proName: pro.company_name || `${pro.first_name} ${pro.last_name}` } })}
            >
              <Calendar size={16} color={Colors.textInverse} />
              <Text style={styles.bookBtnText}>Réserver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, { flex: 1 }]}
              activeOpacity={0.85}
              onPress={handleContact}
              disabled={contacting}
            >
              {contacting
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <>
                    <MessageSquare size={16} color={Colors.primary} />
                    <Text style={styles.contactBtnText}>Contacter</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        {pro.company_description && (
          <Section title="À propos">
            <Text style={styles.description}>{pro.company_description}</Text>
          </Section>
        )}

        {/* Q&A */}
        {pro.about_qa.length > 0 && (
          <Section title="Questions fréquentes">
            {pro.about_qa.map((qa) => (
              <View key={qa.id} style={styles.qaItem}>
                <View style={styles.qaIconRow}>
                  <MessageCircle size={14} color={Colors.primary} />
                  <Text style={styles.qaQuestion}>{qa.question}</Text>
                </View>
                <Text style={styles.qaAnswer}>{qa.answer}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Photos d'activité */}
        {pro.activity_photos.length > 0 && (
          <Section title="Photos">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {pro.activity_photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.activityPhoto} />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Horaires */}
        {pro.working_hours && Object.keys(pro.working_hours).length > 0 && (
          <Section title="Horaires">
            {Object.entries(pro.working_hours).map(([day, schedule]) => (
              <View key={day} style={styles.hoursRow}>
                <View style={styles.hoursIconRow}>
                  <Clock size={13} color={Colors.textMuted} />
                  <Text style={styles.hoursDay}>{DAY_LABELS[day] ?? day}</Text>
                </View>
                <Text style={styles.hoursTime}>
                  {schedule === 'closed'
                    ? 'Fermé'
                    : `${(schedule as any).open} – ${(schedule as any).close}`}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {pro.certifications.length > 0 && (
          <Section title="Certifications & diplômes">
            {pro.certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <View style={styles.certIconRow}>
                  <Award size={14} color={Colors.primary} />
                  <Text style={styles.certTitle}>{cert.title}</Text>
                </View>
                {cert.description && <Text style={styles.certDesc}>{cert.description}</Text>}
                {cert.issued_date && (
                  <Text style={styles.certDate}>
                    {new Date(cert.issued_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
                  </Text>
                )}
              </View>
            ))}
          </Section>
        )}

        {/* Avis */}
        {reviews.length > 0 && (
          <Section title={`Avis (${reviews.length})`}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </Section>
        )}

        {/* Contact */}
        {(pro.company_email || pro.phone) && (
          <Section title="Contact">
            {pro.company_email && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${pro.company_email}`)}
                activeOpacity={0.7}
              >
                <Mail size={15} color={Colors.primary} />
                <Text style={styles.contactText}>{pro.company_email}</Text>
              </TouchableOpacity>
            )}
            {pro.phone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${pro.phone}`)}
                activeOpacity={0.7}
              >
                <Phone size={15} color={Colors.primary} />
                <Text style={styles.contactText}>{pro.phone}</Text>
              </TouchableOpacity>
            )}
          </Section>
        )}

        {/* Boutons en bas aussi */}
        <View style={[styles.ctaRow, { marginHorizontal: Spacing['2xl'], marginBottom: Spacing['2xl'] }]}>
          <TouchableOpacity
            style={[styles.bookBtn, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/(owner)/explorer/booking', params: { proId: pro.id, proName: pro.company_name || `${pro.first_name} ${pro.last_name}` } })}
          >
            <Calendar size={16} color={Colors.textInverse} />
            <Text style={styles.bookBtnText}>Réserver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactBtn, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={handleContact}
            disabled={contacting}
          >
            {contacting
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <>
                  <MessageSquare size={16} color={Colors.primary} />
                  <Text style={styles.contactBtnText}>Contacter</Text>
                </>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────
// ReviewCard
// ─────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const owner    = review.owner
  const initials = owner ? `${owner.first_name[0]}${owner.last_name[0]}` : '?'
  const date     = new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <View style={reviewStyles.card}>
      {/* Author */}
      <View style={reviewStyles.header}>
        <View style={reviewStyles.avatar}>
          {owner?.avatar_url ? (
            <Image source={{ uri: owner.avatar_url }} style={reviewStyles.avatarImg} />
          ) : (
            <Text style={reviewStyles.initials}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={reviewStyles.name}>
            {owner ? `${owner.first_name} ${owner.last_name}` : 'Anonyme'}
          </Text>
          <Text style={reviewStyles.date}>{date}</Text>
        </View>
        {/* Stars */}
        <View style={reviewStyles.stars}>
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={13} color="#F59E0B" fill={s <= review.rating ? '#F59E0B' : 'transparent'} />
          ))}
        </View>
      </View>
      {review.comment ? (
        <Text style={reviewStyles.comment}>{review.comment}</Text>
      ) : null}
    </View>
  )
}

const reviewStyles = StyleSheet.create({
  card: { gap: Spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 36, height: 36 },
  initials:  { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primaryDark },
  name:      { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  date:      { fontSize: Typography.xs, color: Colors.textMuted },
  stars:     { flexDirection: 'row', gap: 2 },
  comment:   { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, paddingLeft: 44 },
})

// ─────────────────────────────────────────────
// Composant Section réutilisable
// ─────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={section.container}>
      <Text style={section.title}>{title.toUpperCase()}</Text>
      <View style={section.card}>{children}</View>
    </View>
  )
}

const section = StyleSheet.create({
  container: { paddingHorizontal: Spacing['2xl'], gap: Spacing.sm },
  title: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, gap: Spacing.md, ...Shadow.sm,
  },
})

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['2xl'] },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },

  content: { gap: Spacing.xl, paddingBottom: Spacing['3xl'] },

  // Hero
  hero: {
    backgroundColor: Colors.surface, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  avatarImg:      { width: 88, height: 88 },
  avatarInitials: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.primaryDark },
  heroName:       { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  heroTitle:      { fontSize: Typography.base, color: Colors.textSecondary },
  heroCompany:    { fontSize: Typography.sm, color: Colors.textMuted },
  heroLocation:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocationText: { fontSize: Typography.sm, color: Colors.textMuted },

  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  ratingText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  ratingCount: { fontSize: Typography.sm, color: Colors.textMuted },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  tag: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, backgroundColor: Colors.primaryLight,
  },
  tagText: { fontSize: Typography.sm, color: Colors.primaryDark, fontWeight: Typography.semibold },

  ctaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, width: '100%' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  bookBtnText: { color: Colors.textInverse, fontSize: Typography.sm, fontWeight: Typography.semibold },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  contactBtnText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },

  // Description
  description: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22 },

  // Q&A
  qaItem:     { gap: Spacing.xs },
  qaIconRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  qaQuestion: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  qaAnswer:   { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, paddingLeft: 22 },

  // Photos
  photosRow:    { gap: Spacing.sm, paddingVertical: Spacing.xs },
  activityPhoto: { width: 140, height: 100, borderRadius: Radius.md },

  // Horaires
  hoursRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hoursIconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  hoursDay:    { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  hoursTime:   { fontSize: Typography.sm, color: Colors.textSecondary },

  // Certifications
  certItem:    { gap: 4 },
  certIconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  certTitle:   { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  certDesc:    { fontSize: Typography.sm, color: Colors.textSecondary, paddingLeft: 22 },
  certDate:    { fontSize: Typography.xs, color: Colors.textMuted, paddingLeft: 22 },

  // Contact
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  contactText: { fontSize: Typography.base, color: Colors.primary },

  // Erreur
  errorText:    { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  backLink:     { marginTop: Spacing.sm },
  backLinkText: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.semibold },
})
