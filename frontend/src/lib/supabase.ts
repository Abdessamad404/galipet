import { createClient } from '@supabase/supabase-js'
import { storage } from './storage'

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // On gère l'auth via notre propre JWT — on désactive l'auth Supabase
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// Injecter le JWT dans le client Supabase pour que les RLS s'appliquent
// Appeler cette fonction après le login
export async function setSupabaseAuth() {
  const token = await storage.get('auth_token')
  if (token) {
    await supabase.auth.setSession({ access_token: token, refresh_token: '' })
  }
}
