import { createClient } from '@supabase/supabase-js'
import { getMusicProvider } from '../../lib/music-provider'

const STYLE_IDEAS = {
  'Afrobeat': 'Afrobeat rhythm, African percussion, upbeat, vibrant, drums and bass, joyful vocals',
  'Amapiano': 'Amapiano, South African house, log drum bass, piano keys, smooth and groovy',
  'CoupÃ©-dÃ©calÃ©': 'CoupÃ©-dÃ©calÃ©, West African dance music, energetic, festive, Ivorian rhythms',
  'Zouk': 'Zouk, Caribbean romantic ballad, soft guitar, sensual rhythm, smooth vocals',
  'Rap': 'French rap, hip-hop beat, 808 bass, trap hi-hats, rhythmic flow',
  'Gospel': 'Gospel music, choir, uplifting, spiritual, piano and organ, powerful vocals',
  'RnB': 'R&B, smooth soul, warm bass, emotional vocals, romantic mood',
  'Acoustique': 'Acoustic guitar, intimate, soft vocals, folk, warm and personal'
}

const OCCASION_MOODS = {
  'Anniversaire': 'celebratory birthday mood, warm and joyful',
  'Amour': 'romantic, passionate, deeply emotional',
  'DiplÃ´me': 'proud, triumphant, hopeful for the future',
  'Mariage': 'romantic, celebratory, lifelong commitment',
  'Remerciements': 'grateful, sincere, heartwarming',
  'Motivation': 'inspiring, energetic, uplifting'
}

function extractAi33TaskId(payload) {
  return payload?.task_id || payload?.data?.task_id || payload?.data?.id || payload?.id || payload?.taskId || payload?.data?.taskId || ''
}

function isAi33Success(payload) {
  if (typeof payload?.success === 'boolean') return payload.success
  if (typeof payload?.data?.success === 'boolean') return payload.data.success
  return !!extractAi33TaskId(payload)
}

function getSunoCallbackUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return ''
  return `${appUrl.replace(/\/$/, '')}/api/suno-callback`
}

function buildAi33Body({ mode, occasion, paroles, style, titre, langue, genreVocal, inspiration }) {
  const vocalTag = genreVocal === 'Homme' ? 'male vocals' : genreVocal === 'Femme' ? 'female vocals' : ''
  const inspiTag = inspiration ? `, inspired by ${inspiration}` : ''

  if (mode === 'simple') {
    const styleDesc = STYLE_IDEAS[style] || style
    const occasionDesc = OCCASION_MOODS[occasion] || occasion
    const idea = `${styleDesc}. Mood: ${occasionDesc}. Topic: ${paroles}. Language: ${langue}. ${vocalTag ? `[${vocalTag}]` : ''}`
    const body = { model: 'music-2.5+', generation_type: 1, idea, n: 2, rewrite_idea_switch: false, instrumental: false }
    if (titre) body.title = titre.substring(0, 39)
    return body
  }

  const idea = `${style}${inspiTag} ${vocalTag ? `, ${vocalTag}` : ''}`
  const body = { model: 'music-2.5+', generation_type: 1, idea, lyrics: paroles, n: 2, rewrite_idea_switch: false, instrumental: false }
  if (titre) body.title = titre.substring(0, 39)
  return body
}

function buildSunoBody({ mode, occasion, paroles, style, titre, langue, genreVocal, inspiration }) {
  const finalTitle = (titre || (mode === 'simple' ? `Chanson pour ${occasion}` : `Chanson ${style}`)).slice(0, 100)
  const styleDesc = STYLE_IDEAS[style] || style
  const occasionDesc = OCCASION_MOODS[occasion] || occasion || ''
  const vocalHint = genreVocal === 'Homme' ? 'male vocals' : genreVocal === 'Femme' ? 'female vocals' : ''
  const inspirationHint = inspiration ? `, inspired by ${inspiration}` : ''

  if (mode === 'avance') {
    return {
      customMode: true,
      instrumental: false,
      model: 'V4_5ALL',
      callBackUrl: getSunoCallbackUrl(),
      prompt: paroles,
      style: `${langue} lyrics, ${styleDesc}${inspirationHint}${vocalHint ? `, ${vocalHint}` : ''}`.slice(0, 1000),
      title: finalTitle
    }
  }

  return {
    customMode: true,
    instrumental: false,
    model: 'V4_5ALL',
    callBackUrl: getSunoCallbackUrl(),
    prompt: `${paroles}\n\nLanguage: ${langue}. Style: ${styleDesc}. Mood: ${occasionDesc}.${vocalHint ? ` ${vocalHint}.` : ''}`.slice(0, 5000),
    style: `${styleDesc}${inspirationHint}. Mood: ${occasionDesc}`.slice(0, 1000),
    title: finalTitle
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'MÃ©thode non autorisÃ©e' })

  const { mode, occasion, paroles, style, titre, langue = 'FranÃ§ais', genreVocal = 'Auto', inspiration = '' } = req.body
  const provider = getMusicProvider()

  if (mode === 'simple' && (!occasion || !style)) return res.status(400).json({ error: 'Informations incomplÃ¨tes pour le mode simple' })
  if (mode === 'avance' && (!paroles || !style)) return res.status(400).json({ error: 'Paroles et style requis' })
  if (provider === 'ai33' && !process.env.AI33_API_KEY) return res.status(500).json({ error: 'ClÃ© API ai33.pro manquante' })
  if (provider === 'suno' && !process.env.SUNO_API_KEY) return res.status(500).json({ error: 'ClÃ© API Suno manquante' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization || '' } } }
  )

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return res.status(401).json({ error: 'Session expirÃ©e, veuillez vous reconnecter.' })

  const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('credits').eq('id', user.id).single()
  if (profileError || !profile) return res.status(400).json({ error: 'Profil introuvable. Veuillez contacter le support.' })
  if ((profile.credits ?? 0) <= 0) return res.status(403).json({ error: 'Vous n\'avez plus de crÃ©dits. Veuillez en acheter pour continuer.' })

  const { error: updateError } = await supabaseAdmin.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id)
  if (updateError) return res.status(500).json({ error: 'Erreur lors de l\'utilisation de votre crÃ©dit.' })

  try {
    const finalTitle = titre || (mode === 'simple' ? `Chanson pour ${occasion}` : `Chanson ${style}`)
    const payloadMetadata = { provider, paroles, mode, occasion, style, langue, genreVocal, inspiration, titre: finalTitle }
    let taskId = ''

    if (provider === 'suno') {
      const sunoRes = await fetch('https://api.sunoapi.org/api/v1/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SUNO_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSunoBody({ mode, occasion, paroles, style, titre, langue, genreVocal, inspiration }))
      })
      const sunoData = await sunoRes.json()
      taskId = sunoData?.data?.taskId || ''
      if (!sunoRes.ok || sunoData?.code !== 200 || !taskId) throw new Error(sunoData?.msg || sunoData?.error || 'Erreur service Suno')
    } else {
      const ai33Res = await fetch('https://api.ai33.pro/v1m/task/music-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.AI33_API_KEY },
        body: JSON.stringify(buildAi33Body({ mode, occasion, paroles, style, titre, langue, genreVocal, inspiration }))
      })
      const ai33Data = await ai33Res.json()
      taskId = extractAi33TaskId(ai33Data)
      if (!ai33Res.ok || !isAi33Success(ai33Data) || !taskId) throw new Error(ai33Data?.error || ai33Data?.message || 'Erreur service IA')
    }

    const { data: insertedSong, error: insertError } = await supabaseAdmin
      .from('songs')
      .insert({
        user_id: user.id,
        title: finalTitle,
        style,
        lyrics: JSON.stringify(payloadMetadata),
        status: 'generating',
        suno_job_id: taskId,
        is_public: true,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return res.status(200).json({ status: 'generating', songId: insertedSong.id, metadata: { titre: finalTitle, style, paroles, occasion, provider } })
  } catch (error) {
    try {
      const { data: currentProfile } = await supabaseAdmin.from('profiles').select('credits').eq('id', user.id).single()
      if (currentProfile) await supabaseAdmin.from('profiles').update({ credits: currentProfile.credits + 1 }).eq('id', user.id)
    } catch (refundError) {
      console.error('Erreur lors du remboursement du crÃ©dit:', refundError)
    }
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}

