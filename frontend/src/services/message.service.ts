import { api } from '../lib/axios'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ConversationParticipant {
  id:           string
  first_name:   string
  last_name:    string
  company_name?: string | null
  avatar_url:   string | null
}

export interface Conversation {
  id:         string
  owner_id:   string
  pro_id:     string
  created_at: string
  updated_at: string
  owner:      ConversationParticipant
  pro:        ConversationParticipant
}

export interface Message {
  id:              string
  conversation_id: string
  sender_id:       string
  content:         string
  read_at:         string | null
  created_at:      string
}

export const messageService = {

  // ── Liste des conversations ──
  async listConversations(): Promise<Conversation[]> {
    const { data } = await api.get('/conversations')
    return data.conversations
  },

  // ── Ouvrir/créer une conversation (owner → pro) ──
  async getOrCreate(proId: string): Promise<Conversation> {
    const { data } = await api.post(`/conversations/with/${proId}`)
    return data.conversation
  },

  // ── Messages d'une conversation ──
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await api.get(`/conversations/${conversationId}/messages`)
    return data.messages
  },

  // ── Envoyer un message ──
  async send(conversationId: string, content: string): Promise<Message> {
    const { data } = await api.post(`/conversations/${conversationId}/messages`, { content })
    return data.message
  },

  // ── Nombre de non lus ──
  async unreadCount(): Promise<number> {
    const { data } = await api.get('/conversations/unread')
    return data.count
  },

  // ── S'abonner aux nouveaux messages d'une conversation (Realtime) ──
  subscribeToConversation(
    conversationId: string,
    onMessage: (msg: Message) => void,
  ): RealtimeChannel {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        onMessage(payload as Message)
      })
      .subscribe()

    return channel
  },

  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel)
  },
}
