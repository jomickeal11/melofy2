import { createClient } from '@supabase/supabase-js'
import { getMusicProvider } from '../../lib/music-provider'

const SOFT_TIMEOUT_MINUTES = 10
const HARD_TIMEOUT_MINUTES = 30

function toArray(value) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function extractAi33TaskId(payload) {
  return payload?.task_id || payload?.data?.task_id || payload?.data?.id || payload?.id || payload?.taskId || payload?.data?.taskId || ''
}

function normalizeAi33Tracks(taskData, fallbackMeta = {}) {
  const meta = taskData?.metadata || fallbackMeta || {}
  const taskId = extractAi33TaskId(taskData) || fallbackMeta?.taskId || 'track'
  const candidates = [meta?.music_result?.data, taskData?.music_result?.data, taskData?.result?.data, meta?.result?.data, meta?.result, taskData?.result]
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      const tracks = candidate.map((item, idx) => ({
        id: item?.music_id || item?.id || `${taskId}-${idx}`,
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
  return audioUrls.map((audioUrl, idx) => ({ id: `${taskId}-${idx}`, title: titles[idx] || titles[0] || '', audio_url: audioUrl, image_url: covers[idx] || covers[0] || '', duration: 0, lyrics: meta?.lyrics || fallbackMeta?.lyrics || '' }))
}

function summarizeAi33Payload(payload) {
  const taskData = payload?.data || payload || {}
  const meta = taskData?.metadata || {}
  return {
    rootKeys: Object.keys(payload || {}).slice(0, 20),
    dataKeys: Object.keys(taskData || {}).slice(0, 20),
    metadataKeys: Object.keys(meta || {}).slice(0, 20),
    status: taskData?.status || payload?.status || null,
    taskId: extractAi33TaskId(payload) || null,
    hasMusicResultData: Array.isArray(meta?.music_result?.data) ? meta.music_result.data.length : 0,
    hasTaskMusicResultData: Array.isArray(taskData?.music_result?.data) ? taskData.music_result.data.length : 0,
    hasResultArray: Array.isArray(taskData?.result) ? taskData.result.length : (Array.isArray(meta?.result) ? meta.result.length : 0),
    audioUrlCount: [...toArray(meta?.audio_url), ...toArray(taskData?.audio_url), ...toArray(meta?.audio?.url), ...toArray(taskData?.audio?.url)].filter(Boolean).length,
  }
}

function safeParseJson(text) {
  if (!text || !text.trim()) return null
  try { return JSON.parse(text) } catch { return null }
}

function scoreAi33Payload(payload) {
  if (!payload) return -1
  const summary = summarizeAi33Payload(payload)
  let score = 0
  if (summary.audioUrlCount > 0) score += 100
  if (summary.hasMusicResultData > 0) score += 80
  if (summary.hasTaskMusicResultData > 0) score += 70
  if (summary.hasResultArray > 0) score += 50
  const normalizedStatus = String(summary.status || '').toLowerCase()
  if (['done', 'success', 'completed'].includes(normalizedStatus)) score += 40
  if (normalizedStatus === 'doing') score += 10
  return score
}

function normalizeSunoTracks(payload, fallbackMeta = {}) {
  const taskData = payload?.data || payload || {}
  const response = taskData?.response || {}
  const rawTracks = Array.isArray(response?.sunoData) ? response.sunoData : []
  return rawTracks.map((item, idx) => ({
    id: item?.id || `${taskData?.taskId || fallbackMeta?.taskId || 'suno'}-${idx}`,
    title: item?.title || fallbackMeta?.title || '',
    audio_url: item?.audioUrl || item?.streamAudioUrl || '',
    stream_audio_url: item?.streamAudioUrl || '',
    image_url: item?.imageUrl || '',
    duration: item?.duration || 0,
    lyrics: item?.prompt || fallbackMeta?.lyrics || ''
  })).filter(track => track.audio_url)
}

function summarizeSunoPayload(payload) {
  const taskData = payload?.data || payload || {}
  const response = taskData?.response || {}
  const rawTracks = Array.isArray(response?.sunoData) ? response.sunoData : []
  return {
    rootKeys: Object.keys(payload || {}).slice(0, 20),
    dataKeys: Object.keys(taskData || {}).slice(0, 20),
    responseKeys: Object.keys(response || {}).slice(0, 20),
    status: taskData?.status || null,
    taskId: taskData?.taskId || null,
    trackCount: rawTracks.length
  }
}

export default async function handler(req, res) {
  const { songId, taskId, debug } = req.query
  const debugMode = debug === '1'
  if (!songId && !taskId) return res.status(400).json({ error: 'songId ou taskId manquant' })

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const provider = getMusicProvider()

  try {
    const { data: song, error } = await supabaseAdmin.from('songs').select('*').eq('id', songId).single()
    if (error || !song) return res.status(404).json({ error: 'Chanson introuvable' })

    const currentTaskId = song.suno_job_id || ''
    let parsedLyrics = {}
    try {
      parsedLyrics = JSON.parse(song.lyrics || '{}')
      if (Array.isArray(parsedLyrics?.candidate_tracks) && parsedLyrics.candidate_tracks.length > 0) {
        return res.status(200).json({ status: 'success', tracks: parsedLyrics.candidate_tracks, dbStatus: song.status, hasTaskId: !!currentTaskId })
      }
    } catch {}

    if (!currentTaskId) return res.status(200).json({ status: 'pending', dbStatus: song.status, hasTaskId: false })

    const now = new Date()
    const createdAt = new Date(song.created_at || now)
    const diffMinutes = (now - createdAt) / (1000 * 60)

    if (diffMinutes > HARD_TIMEOUT_MINUTES) {
      await supabaseAdmin.from('songs').update({ status: 'failed' }).eq('id', songId)
      const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', song.user_id).single()
      if (profile) await supabaseAdmin.from('profiles').update({ credits: (profile.credits ?? 0) + 1 }).eq('id', song.user_id)
      return res.status(200).json({ status: 'failed', error: `Timeout : Le service ${provider === 'suno' ? 'Suno' : 'IA'} est trop lent. Crédit remboursé.` })
    }

    if (provider === 'suno') {
      const sunoRes = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${encodeURIComponent(currentTaskId)}`, {
        headers: { Authorization: `Bearer ${process.env.SUNO_API_KEY}` },
        cache: 'no-store'
      })
      const payload = await sunoRes.json()
      const payloadSummary = summarizeSunoPayload(payload)
      const taskData = payload?.data || {}
      const apiStatus = String(taskData?.status || '').toUpperCase()
      const tracks = normalizeSunoTracks(payload, { taskId: currentTaskId, lyrics: parsedLyrics?.paroles || '', title: song.title || '' })

      if (tracks.length > 0 && (apiStatus === 'FIRST_SUCCESS' || apiStatus === 'SUCCESS')) {
        await supabaseAdmin.from('songs').update({
          status: 'choices_ready',
          lyrics: JSON.stringify({ ...parsedLyrics, candidate_tracks: tracks, suno_polled_at: new Date().toISOString() })
        }).eq('id', songId)
        return res.status(200).json({ status: 'success', tracks, ...(debugMode ? { debug: payloadSummary } : {}) })
      }

      if (['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(apiStatus)) {
        await supabaseAdmin.from('songs').update({ status: 'failed' }).eq('id', songId)
        return res.status(200).json({ status: 'failed', error: taskData?.errorMessage || payload?.msg || 'Erreur Suno' })
      }

      return res.status(200).json({ status: 'pending', dbStatus: song.status, aiStatus: apiStatus || 'PENDING', hasTaskId: true, slow: diffMinutes > SOFT_TIMEOUT_MINUTES, ...(debugMode ? { debug: payloadSummary } : {}) })
    }

    let text = ''
    let chosenSource = 'none'
    let debugSources = null

    try {
      const resM = await fetch(`https://api.ai33.pro/v1m/task/music-generation/${currentTaskId.trim()}`, { headers: { 'xi-api-key': process.env.AI33_API_KEY }, cache: 'no-store' })
      const textM = await resM.text()
      const resCommon = await fetch(`https://api.ai33.pro/v1/task/${currentTaskId.trim()}`, { headers: { 'xi-api-key': process.env.AI33_API_KEY }, cache: 'no-store' })
      const textCommon = await resCommon.text()
      const parsedMusic = safeParseJson(textM)
      const parsedCommon = safeParseJson(textCommon)
      const scoreMusic = scoreAi33Payload(parsedMusic)
      const scoreCommon = scoreAi33Payload(parsedCommon)
      debugSources = {
        musicEndpoint: { statusCode: resM.status, score: scoreMusic, summary: parsedMusic ? summarizeAi33Payload(parsedMusic) : null, preview: textM?.slice(0, 300) || '' },
        commonEndpoint: { statusCode: resCommon.status, score: scoreCommon, summary: parsedCommon ? summarizeAi33Payload(parsedCommon) : null, preview: textCommon?.slice(0, 300) || '' }
      }
      if (scoreMusic >= scoreCommon && textM) { text = textM; chosenSource = 'music' }
      else if (textCommon) { text = textCommon; chosenSource = 'common' }
      else { text = textM || textCommon; chosenSource = textM ? 'music' : (textCommon ? 'common' : 'none') }
    } catch (e) {
      console.error('[POLL] Fetch error:', e.message)
    }

    if (!text || !text.trim()) return res.status(200).json({ status: 'pending', dbStatus: song.status, aiStatus: 'empty_response', hasTaskId: !!currentTaskId })

    let ai33Data
    try { ai33Data = JSON.parse(text) } catch { return res.status(200).json({ status: 'pending', dbStatus: song.status, aiStatus: 'non_json', hasTaskId: !!currentTaskId, raw: text.substring(0, 50) }) }

    const taskData = ai33Data.data || ai33Data
    const aiStatus = (taskData.status || ai33Data.status || 'unknown').toLowerCase()
    const payloadSummary = summarizeAi33Payload(ai33Data)
    const tracks = normalizeAi33Tracks(taskData, { taskId: currentTaskId, lyrics: song.lyrics || '' })

    if (tracks.length > 0) return res.status(200).json({ status: 'success', tracks, ...(debugMode ? { debug: { chosenSource, payloadSummary, sources: debugSources } } : {}) })
    if (aiStatus === 'failed' || aiStatus === 'error') {
      await supabaseAdmin.from('songs').update({ status: 'failed' }).eq('id', songId)
      return res.status(200).json({ status: 'failed' })
    }

    return res.status(200).json({ status: 'pending', dbStatus: song.status, aiStatus, hasTaskId: true, slow: diffMinutes > SOFT_TIMEOUT_MINUTES, ...(debugMode ? { debug: { chosenSource, payloadSummary, sources: debugSources } } : {}) })
  } catch (error) {
    console.error('Erreur poll-task:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
