import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, Send } from 'lucide-react-native'
import { messageService, Message, Conversation } from '@/services/message.service'
import { useAuthStore } from '@/store/authStore'
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function ChatScreen() {
  const { id, otherName: paramName, otherAvatar: paramAvatar } = useLocalSearchParams<{ id: string; otherName?: string; otherAvatar?: string }>()
  const { profile: user } = useAuthStore()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [loading, setLoading]           = useState(true)
  const [text, setText]                 = useState('')
  const [sending, setSending]           = useState(false)

  const flatRef    = useRef<FlatList>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Ref so the Realtime callback always reads the current user, even if profile
  // loaded after this effect's closure was created (stale closure guard).
  const userRef    = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  useEffect(() => {
    if (!id) return
    load()
    // Subscribe to realtime
    channelRef.current = messageService.subscribeToConversation(id, (msg) => {
      // Skip own messages — handled by optimistic update + send() resolution
      if (msg.sender_id === userRef.current?.id) return
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
    })

    return () => {
      if (channelRef.current) messageService.unsubscribe(channelRef.current)
    }
  }, [id])

  async function load() {
    if (!id) return
    try {
      const msgs = await messageService.getMessages(id)
      setMessages(msgs)
      // Multiple attempts — web needs a reflow before scrollToEnd works
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 50)
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 200)
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 500)
    } catch {}
    finally { setLoading(false) }
  }

  async function handleSend() {
    const content = text.trim()
    if (!content || sending || !id) return

    setText('')
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id:              `optimistic-${Date.now()}`,
      conversation_id: id,
      sender_id:       user!.id,
      content,
      read_at:         null,
      created_at:      new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50)

    try {
      const real = await messageService.send(id, content)
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? real : m))
    } catch {
      // Rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setText(content)
    } finally {
      setSending(false)
    }
  }

  // Use params immediately, refine from conversation once loaded
  const otherName = (() => {
    if (conversation && user) {
      const other = user.id === conversation.owner_id ? conversation.pro : conversation.owner
      return (other as any).company_name || `${other.first_name} ${other.last_name}`
    }
    return paramName || '...'
  })()

  const otherAvatar = (() => {
    if (conversation && user) {
      const other = user.id === conversation.owner_id ? conversation.pro : conversation.owner
      return other.avatar_url
    }
    return paramAvatar || null
  })()

  const otherInitials = (() => {
    const name = otherName
    if (!name || name === '...') return '?'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name[0]
  })()

  // Load conversation details (for header)
  useEffect(() => {
    if (!id) return
    messageService.listConversations().then((list) => {
      const conv = list.find((c) => c.id === id)
      if (conv) setConversation(conv)
    }).catch(() => {})
  }, [id])

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={styles.headerAvatarImg} />
          ) : (
            <Text style={styles.headerAvatarInitials}>{otherInitials}</Text>
          )}
        </View>
        <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const isMe      = item.sender_id === user?.id
          const prevMsg   = index > 0 ? messages[index - 1] : null
          const showDate  = !prevMsg || new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
          const time      = new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const isOptimistic = item.id.startsWith('optimistic-')

          return (
            <>
              {showDate && (
                <View style={styles.dateSep}>
                  <Text style={styles.dateSepText}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </View>
              )}
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.content}
                </Text>
                <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                  {isOptimistic ? '…' : time}
                </Text>
              </View>
            </>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>Commencez la conversation 👋</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Votre message…"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={Platform.OS !== 'web' ? handleSend : undefined}
          onKeyPress={Platform.OS === 'web' ? (e: any) => {
            if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          } : undefined}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Send size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing.base,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  headerAvatarImg:      { width: 36, height: 36 },
  headerAvatarInitials: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primaryDark },
  headerName: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },

  messagesList: { padding: Spacing.xl, gap: Spacing.xs, flexGrow: 1 },

  dateSep: { alignItems: 'center', marginVertical: Spacing.md },
  dateSepText: { fontSize: Typography.xs, color: Colors.textMuted, backgroundColor: Colors.background, paddingHorizontal: Spacing.sm },

  bubble: {
    maxWidth: '75%', borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: 2,
  },
  bubbleMe:   { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },

  bubbleText:     { fontSize: Typography.base, lineHeight: 20 },
  bubbleTextMe:   { color: '#fff' },
  bubbleTextThem: { color: Colors.textPrimary },

  bubbleTime:     { fontSize: 10, marginTop: 2, alignSelf: 'flex-end' },
  bubbleTimeMe:   { color: 'rgba(255,255,255,0.7)' },
  bubbleTimeThem: { color: Colors.textMuted },

  emptyChat:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatText: { fontSize: Typography.sm, color: Colors.textMuted },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, maxHeight: 100,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
})
