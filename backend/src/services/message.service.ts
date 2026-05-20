import { supabase } from '../lib/supabaseClient'

const CONVERSATION_SELECT = `
  id, owner_id, pro_id, created_at, updated_at,
  owner:profiles!conversations_owner_id_fkey (
    id, first_name, last_name, avatar_url
  ),
  pro:profiles!conversations_pro_id_fkey (
    id, first_name, last_name, company_name, avatar_url
  )
`

const MESSAGE_SELECT = `
  id, conversation_id, sender_id, content, read_at, created_at
`

export const messageService = {

  // ── Récupérer ou créer une conversation entre owner et pro ──
  async getOrCreate(ownerId: string, proId: string) {
    // Chercher d'abord
    const { data: existing } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('owner_id', ownerId)
      .eq('pro_id', proId)
      .maybeSingle()

    if (existing) return existing

    // Créer si absente
    const { data, error } = await supabase
      .from('conversations')
      .insert({ owner_id: ownerId, pro_id: proId })
      .select(CONVERSATION_SELECT)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // ── Liste des conversations de l'utilisateur connecté ──
  async listForUser(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT + `, last_message:messages(content, created_at, sender_id)`)
      .or(`owner_id.eq.${userId},pro_id.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Messages d'une conversation ──
  async getMessages(conversationId: string, userId: string) {
    // Vérifier que l'user est participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, owner_id, pro_id')
      .eq('id', conversationId)
      .maybeSingle()

    if (!conv) throw new Error('Conversation introuvable')
    if (conv.owner_id !== userId && conv.pro_id !== userId) throw new Error('Accès refusé')

    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Envoyer un message ──
  async send(conversationId: string, senderId: string, content: string) {
    // Vérifier que l'user est participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, owner_id, pro_id')
      .eq('id', conversationId)
      .maybeSingle()

    if (!conv) throw new Error('Conversation introuvable')
    if (conv.owner_id !== senderId && conv.pro_id !== senderId) throw new Error('Accès refusé')

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select(MESSAGE_SELECT)
      .single()

    if (error) throw new Error(error.message)

    // Broadcast Realtime pour le destinataire
    await supabase.channel(`conversation:${conversationId}`).send({
      type:    'broadcast',
      event:   'new_message',
      payload: data,
    })

    return data
  },

  // ── Marquer les messages comme lus ──
  async markRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null)

    if (error) throw new Error(error.message)
  },

  // ── Nombre de messages non lus (toutes conversations) ──
  async unreadCount(userId: string) {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .is('read_at', null)
      .in('conversation_id',
        supabase
          .from('conversations')
          .select('id')
          .or(`owner_id.eq.${userId},pro_id.eq.${userId}`)
      )

    if (error) throw new Error(error.message)
    return count ?? 0
  },
}
