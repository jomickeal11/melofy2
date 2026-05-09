import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { songId } = req.query
  if (!songId) {
    return res.status(400).json({ error: 'songId manquant' })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: song, error } = await supabaseAdmin
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (error || !song) {
      return res.status(404).json({ error: 'Chanson introuvable' })
    }

    let parsedLyrics = null
    try {
      parsedLyrics = JSON.parse(song.lyrics || '{}')
    } catch {
      parsedLyrics = null
    }

    return res.status(200).json({
      song: {
        id: song.id,
        status: song.status,
        title: song.title,
        created_at: song.created_at,
        suno_job_id: song.suno_job_id || null,
        audio_url: song.audio_url || null,
      },
      callback: {
        received_at: parsedLyrics?.ai33_callback_received_at || null,
        status: parsedLyrics?.ai33_callback_status || null,
        candidate_tracks_count: Array.isArray(parsedLyrics?.candidate_tracks) ? parsedLyrics.candidate_tracks.length : 0,
        first_track: Array.isArray(parsedLyrics?.candidate_tracks) && parsedLyrics.candidate_tracks[0]
          ? {
              id: parsedLyrics.candidate_tracks[0].id || null,
              title: parsedLyrics.candidate_tracks[0].title || null,
              audio_url: parsedLyrics.candidate_tracks[0].audio_url || null,
            }
          : null
      }
    })
  } catch (error) {
    console.error('[DIAG-AI33] Error:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
