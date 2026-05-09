import { createClient } from '@supabase/supabase-js'

function normalizeSunoTracks(payload) {
  const callbackData = payload?.data || {}
  const tracks = Array.isArray(callbackData?.data) ? callbackData.data : []
  return tracks.map((item, idx) => ({
    id: item?.id || `${callbackData?.task_id || 'suno'}-${idx}`,
    title: item?.title || '',
    audio_url: item?.audio_url || item?.stream_audio_url || '',
    stream_audio_url: item?.stream_audio_url || '',
    image_url: item?.image_url || '',
    duration: item?.duration || 0,
    lyrics: item?.prompt || ''
  })).filter(track => track.audio_url)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  try {
    const payload = req.body || {}
    const taskId = payload?.data?.task_id || ''
    if (!taskId) return res.status(400).json({ error: 'task_id manquant' })
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: song } = await supabaseAdmin.from('songs').select('*').eq('suno_job_id', taskId).single()
    if (!song) return res.status(404).json({ error: 'Chanson introuvable' })
    let parsedLyrics = {}
    try { parsedLyrics = JSON.parse(song.lyrics || '{}') } catch { parsedLyrics = { paroles: song.lyrics || '' } }
    const callbackType = payload?.data?.callbackType || ''
    const tracks = normalizeSunoTracks(payload)
    const isComplete = payload?.code === 200 && callbackType === 'complete' && tracks.length > 0
    const isError = callbackType === 'error' || payload?.code >= 400
    await supabaseAdmin.from('songs').update({
      status: isComplete ? 'choices_ready' : (isError ? 'failed' : song.status),
      lyrics: JSON.stringify({
        ...parsedLyrics,
        candidate_tracks: isComplete ? tracks : (parsedLyrics?.candidate_tracks || []),
        suno_callback_type: callbackType,
        suno_callback_received_at: new Date().toISOString(),
        suno_callback_message: payload?.msg || null
      })
    }).eq('id', song.id)
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[SUNO CALLBACK] Error:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
