import { supabase } from '../lib/supabaseClient'

const MESSAGE_SELECT = `
  id, conversation_id, sender_id, content, read_at, created_at
`

// Fetch profiles for a list of IDs and return a map id → profile
async function fetchProfiles(ids: string[]) {
  if (ids.length === 0) return {}
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, company_name, avatar_url')
    .in('id', ids)
  if (error) throw new Error(error.message)
  const map: Record<string, any> = {}
  for (const p of data ?? []) map[p.id] = p
  return map
}

// Attach owner + pro profile objects to each conversation row
async function withParticipants(rows: any[]) {
  const ids = [...new Set(rows.flatMap((r) => [r.owner_id, r.pro_id]))]
  const profiles = await fetchProfiles(ids)
  return rows.map((r) => ({
    ...r,
    owner: profiles[r.owner_id] ?? null,
    pro:   profiles[r.pro_id]   ?? null,
  }))
}

export const messageService = {

  // ── Récupérer ou créer une conversation entre owner et pro ──
  async getOrCreate(ownerId: string, proId: string) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, owner_id, pro_id, created_at, updated_at')
      .eq('owner_id', ownerId)
      .eq('pro_id', proId)
      .maybeSingle()

    const row = existing ?? await (async () => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ owner_id: ownerId, pro_id: proId })
        .select('id, owner_id, pro_id, created_at, updated_at')
        .single()
      if (error) throw new Error(error.message)
      return data
    })()

    const [withP] = await withParticipants([row])
    return withP
  },

  // ── Liste des conversations de l'utilisateur connecté ──
  async listForUser(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, owner_id, pro_id, created_at, updated_at')
      .or(`owner_id.eq.${userId},pro_id.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return []
    return await withParticipants(data)
  },

  // ── Messages d'une conversation ──
  async getMessages(conversationId: string, userId: string) {
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

  // ── Nombre de messages non lus ──
  async unreadCount(userId: string) {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`owner_id.eq.${userId},pro_id.eq.${userId}`)

    if (!convs || convs.length === 0) return 0

    const convIds = convs.map((c) => c.id)
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .is('read_at', null)
      .in('conversation_id', convIds)

    if (error) throw new Error(error.message)
    return count ?? 0
  },
}
