import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { MessageCircle } from 'lucide-react-native'
import { messageService, Conversation } from '@/services/message.service'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'

interface Props {
  role: 'owner' | 'pro'
}

export default function ConversationsList({ role }: Props) {
  const { profile: user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => { load() }, [])
  )

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await messageService.listConversations()
      setConversations(data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function openChat(conversation: Conversation) {
    const other    = user?.id === conversation.owner_id ? conversation.pro : conversation.owner
    const name     = (other as any).company_name || `${other.first_name} ${other.last_name}`
    const avatar   = other.avatar_url ?? ''
    const base     = role === 'owner' ? '/(owner)/messages' : '/(pro)/messages'
    router.push({ pathname: `${base}/[id]` as any, params: { id: conversation.id, otherName: name, otherAvatar: avatar } })
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, conversations.length === 0 && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
              {role === 'owner'
                ? 'Contactez un professionnel depuis sa fiche.'
                : 'Vos échanges avec les propriétaires apparaîtront ici.'}
            </Text>
          </View>
        ) : (
          conversations.map((conv) => {
            const other    = user?.id === conv.owner_id ? conv.pro : conv.owner
            if (!other) return null
            const name     = (other as any).company_name || `${other.first_name} ${other.last_name}`
            const initials = other.first_name?.[0] && other.last_name?.[0]
              ? `${other.first_name[0]}${other.last_name[0]}`
              : '?'
            const time     = new Date(conv.updated_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short',
            })

            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.row}
                onPress={() => openChat(conv)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  {other.avatar_url ? (
                    <Image source={{ uri: other.avatar_url }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  )}
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.rowTime}>{time}</Text>
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>Appuyer pour ouvrir la conversation</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  list:      { paddingVertical: Spacing.sm },
  listEmpty: { flex: 1 },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['3xl'] },
  emptyTitle:    { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg:      { width: 48, height: 48 },
  avatarInitials: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primaryDark },

  rowContent: { flex: 1 },
  rowTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName:    { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, flex: 1 },
  rowTime:    { fontSize: Typography.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  rowSub:     { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
})
