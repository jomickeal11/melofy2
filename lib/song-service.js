import { createClient } from '@supabase/supabase-js'

export async function getPublicSong(id) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuration Supabase manquante (URL ou Service Key)')
  }

  // On utilise la Service Key pour contourner le RLS et être sûr de trouver la chanson
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: song, error } = await supabase
    .from('songs')
    .select('id, title, style, lyrics, audio_url, image_url, created_at, user_id, is_public, status')
    .eq('id', id)
    .single()

  if (error) return null
  if (!song) return null
  
  // La chanson doit être prête pour être vue publiquement
  if (song.status !== 'ready') return null

  // Sécurité : on ne bloque que si is_public est EXPLICITEMENT à false
  // Si c'est null ou true, on autorise l'accès
  if (song.is_public === false) return null

  return song
}

export async function getDiscoverySongs(excludeId, limit = 5) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('songs')
    .select('id, title, style, lyrics, audio_url, image_url, created_at, user_id, is_public, status')
    .eq('status', 'ready')
    .neq('is_public', false)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}
