import { createClient } from '@supabase/supabase-js'
import { getMusicProvider } from '../../lib/music-provider'

function extractTaskId(payload) {
  return payload?.task_id || payload?.data?.task_id || payload?.data?.id || payload?.id || payload?.taskId || payload?.data?.taskId || ''
}

function isSuccessfulResponse(payload) {
  if (typeof payload?.success === 'boolean') return payload.success
  if (typeof payload?.data?.success === 'boolean') return payload.data.success
  return !!extractTaskId(payload)
}

function toArray(value) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function normalizeAi33Tracks(taskData, fallbackMeta = {}) {
  const meta = taskData?.metadata || fallbackMeta || {}
  const candidates = [meta?.music_result?.data, taskData?.music_result?.data, taskData?.result?.data, meta?.result?.data, meta?.result, taskData?.result, meta?.data?.result, taskData?.data?.result]
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      const tracks = candidate.map((item, idx) => ({
        id: item?.music_id || item?.id || `${extractTaskId(taskData) || 'track'}-${idx}`,
        title: item?.title || '',
        audio_url: item?.audio_url || item?.audio || item?.url || '',
        image_url: item?.cover_url || item?.image_url || item?.image || '',
        duration: item?.duration || 0,
        lyrics: item?.lyrics || meta?.lyrics || fallbackMeta?.lyrics || '',
      })).filter(track => track.audio_url)
      if (tracks.length > 0) return tracks
    }
  }
  const audioUrls = [...toArray(meta?.audio_url), ...toArray(taskData?.audio_url), ...toArray(meta?.audio?.url), ...toArray(taskData?.audio?.url)].filter(Boolean)
  if (audioUrls.length === 0) return []
  const titles = [...toArray(meta?.title), ...toArray(taskData?.title)]
  const covers = [...toArray(meta?.cover_url), ...toArray(taskData?.cover_url), ...toArray(meta?.image_url), ...toArray(taskData?.image_url)]
  return audioUrls.map((audioUrl, idx) => ({ id: `${extractTaskId(taskData) || 'track'}-${idx}`, title: titles[idx] || titles[0] || '', audio_url: audioUrl, image_url: covers[idx] || covers[0] || '', duration: 0, lyrics: meta?.lyrics || fallbackMeta?.lyrics || '' }))
}

function normalizeSunoTracks(payload, fallbackMeta = {}) {
  const taskData = payload?.data || payload || {}
  const response = taskData?.response || {}
  const rawTracks = Array.isArray(response?.sunoData) ? response.sunoData : []
  return rawTracks.map((item, idx) => ({
    id: item?.id || `${taskData?.taskId || fallbackMeta?.taskId || 'suno'}-${idx}`,
    title: item?.title || '',
    audio_url: item?.audioUrl || item?.streamAudioUrl || '',
    image_url: item?.imageUrl || '',
    duration: item?.duration || 0,
    lyrics: item?.prompt || fallbackMeta?.lyrics || ''
  })).filter(track => track.audio_url)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID manquant' })

  const provider = getMusicProvider()
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    const { data: song, error: dbError } = await supabaseAdmin.from('songs').select('*').eq('id', id).single()
    if (dbError || !song) throw new Error('Chanson introuvable')
    if (song.status === 'ready' || song.status === 'failed') return res.status(200).json({ status: song.status, song })

    if (provider === 'suno') {
      let parsedLyrics = {}
      try { parsedLyrics = JSON.parse(song.lyrics || '{}') } catch { parsedLyrics = { paroles: song.lyrics || '' } }
      if (!song.suno_job_id) return res.status(200).json({ status: song.status, song })
      const sunoRes = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${encodeURIComponent(song.suno_job_id.trim())}`, {
        headers: { Authorization: `Bearer ${process.env.SUNO_API_KEY}` },
        cache: 'no-store'
      })
      const payload = await sunoRes.json()
      const taskData = payload?.data || {}
      const sunoStatus = String(taskData?.status || '').toUpperCase()
      const tracks = normalizeSunoTracks(payload, { taskId: song.suno_job_id, lyrics: parsedLyrics?.paroles || '' })
      if (sunoStatus === 'SUCCESS' && tracks.length > 0) {
        const primaryTrack = tracks[0]
        const finalLyrics = primaryTrack.image_url ? `[IMAGE:${primaryTrack.image_url}]${primaryTrack.lyrics || parsedLyrics?.paroles || ''}` : (primaryTrack.lyrics || parsedLyrics?.paroles || '')
        const { data: updatedSong, error: updateError } = await supabaseAdmin.from('songs').update({
          status: 'ready',
          audio_url: primaryTrack.audio_url,
          image_url: primaryTrack.image_url,
          lyrics: finalLyrics,
          title: primaryTrack.title || song.title
        }).eq('id', id).select().single()
        if (updateError) throw new Error('Impossible de sauvegarder la chanson Suno')
        return res.status(200).json({ status: 'ready', song: updatedSong })
      }
      if (['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(sunoStatus)) {
        await supabaseAdmin.from('songs').update({ status: 'failed' }).eq('id', id)
        return res.status(200).json({ status: 'failed', song: { ...song, status: 'failed' } })
      }
      return res.status(200).json({ status: 'generating', song })
    }

    if (song.status === 'queued') {
      const { data: updatedLock } = await supabaseAdmin.from('songs').update({ status: 'generating-suno' }).eq('id', id).eq('status', 'queued').select().single()
      if (!updatedLock) return res.status(200).json({ status: 'generating', song })

      try {
        let metaObj
        try { metaObj = JSON.parse(song.lyrics) } catch { metaObj = { paroles: song.lyrics, mode: 'avance', style: song.style, title: song.title } }
        const STYLE_IDEAS = {
          'Afrobeat': 'Afrobeat rhythm, African percussion, upbeat, vibrant, drums and bass, joyful vocals',
          'Amapiano': 'Amapiano, South African house, log drum bass, piano keys, smooth and groovy',
          'Coupé-décalé': 'Coupé-décalé, West African dance music, energetic, festive, Ivorian rhythms',
          'Zouk': 'Zouk, Caribbean romantic ballad, soft guitar, sensual rhythm, smooth vocals',
          'Rap': 'French rap, hip-hop beat, 808 bass, trap hi-hats, rhythmic flow',
          'Gospel': 'Gospel music, choir, uplifting, spiritual, piano and organ, powerful vocals',
          'RnB': 'R&B, smooth soul, warm bass, emotional vocals, romantic mood',
          'Acoustique': 'Acoustic guitar, intimate, soft vocals, folk, warm and personal',
        }
        const OCCASION_MOODS = {
          'Anniversaire': 'celebratory birthday mood, warm and joyful',
          'Amour': 'romantic, passionate, deeply emotional',
          'Diplôme': 'proud, triumphant, hopeful for the future',
          'Mariage': 'romantic, celebratory, lifelong commitment',
          'Remerciements': 'grateful, sincere, heartwarming',
          'Motivation': 'inspiring, energetic, uplifting',
        }
        const { mode, occasion, paroles, style, titre, langue = 'Français', genreVocal = 'Auto', inspiration = '' } = metaObj
        const finalTitle = titre || (mode === 'simple' ? `Chanson pour ${occasion}` : `Chanson ${style}`)
        const ai33Title = titre ? finalTitle.substring(0, 39) : ''
        const vocalTag = genreVocal === 'Homme' ? 'male vocals' : genreVocal === 'Femme' ? 'female vocals' : ''
        const inspiTag = inspiration ? `, inspired by ${inspiration}` : ''
        let apiBody
        if (mode === 'simple') {
          const styleDesc = STYLE_IDEAS[style] || style
          const occasionDesc = OCCASION_MOODS[occasion] || occasion
          const idea = `Générer les paroles en ${langue.toUpperCase()} (${langue} lyrics only). Style: ${styleDesc}${inspiTag}. Ambiance: ${occasionDesc}. Le sujet de la chanson et le message à transmettre est : "${paroles}" ${vocalTag ? `[${vocalTag}]` : ''} [ref:${Date.now().toString(36)}]`
          apiBody = { model: 'music-2.5+', generation_type: 1, idea, n: 2, rewrite_idea_switch: false, instrumental: false }
          if (ai33Title) apiBody.title = ai33Title
        } else {
          const idea = `${langue} vocals, sung in ${langue}, ${STYLE_IDEAS[style] || style}${inspiTag} ${vocalTag ? `, ${vocalTag}` : ''} [ref:${Date.now().toString(36)}]`
          apiBody = { model: 'music-2.5+', generation_type: 1, idea, lyrics: paroles, n: 2, rewrite_idea_switch: false, instrumental: false }
          if (ai33Title) apiBody.title = ai33Title
        }
        const ai33Res = await fetch('https://api.ai33.pro/v1m/task/music-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.AI33_API_KEY },
          body: JSON.stringify(apiBody)
        })
        const text = await ai33Res.text()
        let ai33Data
        try { ai33Data = JSON.parse(text) } catch { throw new Error("L'API AI33 a renvoyé une réponse non-JSON") }
        const taskId = extractTaskId(ai33Data)
        if (!ai33Res.ok || !isSuccessfulResponse(ai33Data) || !taskId) throw new Error(ai33Data.error || ai33Data.message || 'Erreur ai33.pro')
        await supabaseAdmin.from('songs').update({ status: 'generating', suno_job_id: taskId }).eq('id', id)
        return res.status(200).json({ status: 'generating', song: { ...song, status: 'generating', suno_job_id: taskId } })
      } catch (err) {
        await supabaseAdmin.from('songs').update({ status: 'failed' }).eq('id', id)
        try {
          const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', song.user_id).single()
          if (profile) await supabaseAdmin.from('profiles').update({ credits: (profile.credits ?? 0) + 1 }).eq('id', song.user_id)
        } catch (refundError) {
          console.error('Erreur lors du remboursement du crédit:', refundError)
        }
        return res.status(200).json({ status: 'failed', song: { ...song, status: 'failed' } })
      }
    }

    if (!song.suno_job_id) return res.status(200).json({ status: song.status, song })
    const ai33Res = await fetch(`https://api.ai33.pro/v1/task/${song.suno_job_id.trim()}`, {
      headers: { 'xi-api-key': process.env.AI33_API_KEY },
      cache: 'no-store'
    })
    const text = await ai33Res.text()
    let ai33Data
    try { ai33Data = JSON.parse(text) } catch { throw new Error('Réponse invalide de l\'API') }
    const taskData = ai33Data.data || ai33Data
    const status = taskData.status?.toLowerCase() || 'pending'
    if (status === 'done' || status === 'success' || status === 'completed') {
      const meta = taskData.metadata || {}
      const tracks = normalizeAi33Tracks(taskData, { lyrics: song.lyrics })
      const primaryTrack = tracks[0] || {}
      const audioUrl = primaryTrack.audio_url || ''
      const imageUrl = primaryTrack.image_url || ''
      const finalLyrics = primaryTrack.lyrics || song.lyrics
      const generatedTitle = primaryTrack.title || meta.title
      let lyricsToSave = finalLyrics || ''
      if (imageUrl && !lyricsToSave.startsWith('[IMAGE:')) lyricsToSave = `[IMAGE:${imageUrl}]${lyricsToSave}`
      if (!audioUrl) return res.status(200).json({ status: 'generating', song })
      const updateData = { status: 'ready', audio_url: audioUrl, lyrics: lyricsToSave }
      if (generatedTitle && generatedTitle.trim() !== '') updateData.title = generatedTitle
      const { data: updatedSong, error: updateError } = await supabaseAdmin.from('songs').update(updateData).eq('id', id).select().single()
      if (updateError) throw new Error('Impossible de sauvegarder la chanson')
      return res.status(200).json({ status: 'ready', song: updatedSong })
    }
    if (status === 'failed' || status === 'error') {
      await supabaseAdmin.from('songs').update({ status: 'failed' }).eq('id', id)
      try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', song.user_id).single()
        if (profile) await supabaseAdmin.from('profiles').update({ credits: (profile.credits ?? 0) + 1 }).eq('id', song.user_id)
      } catch (refundError) {
        console.error('Erreur lors du remboursement du crédit:', refundError)
      }
      return res.status(200).json({ status: 'failed', song: { ...song, status: 'failed' } })
    }
    return res.status(200).json({ status: 'generating', song })
  } catch (error) {
    console.error('Erreur status:', error)
    return res.status(500).json({ error: error.message })
  }
}
