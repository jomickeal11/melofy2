import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useGeneration } from '../context/GenerationContext'

const STYLES = [
  { id: 'Afrobeat', emoji: '🥁', name_fr: 'Afrobeat', name_en: 'Afrobeat' },
  { id: 'Amapiano', emoji: '🎹', name_fr: 'Amapiano', name_en: 'Amapiano' },
  { id: 'Coupé-décalé', emoji: '🌴', name_fr: 'Coupé-décalé', name_en: 'Coupe Decale' },
  { id: 'Zouk', emoji: '💃', name_fr: 'Zouk', name_en: 'Zouk' },
  { id: 'Rap', emoji: '🎤', name_fr: 'Rap', name_en: 'Rap' },
  { id: 'Gospel', emoji: '✝️', name_fr: 'Gospel', name_en: 'Gospel' },
  { id: 'RnB', emoji: '🎶', name_fr: 'RnB', name_en: 'RnB' },
  { id: 'Acoustique', emoji: '🎸', name_fr: 'Acoustique', name_en: 'Acoustic' },
  { id: 'Autre', emoji: '✨', name_fr: 'Autre', name_en: 'Other' },
]

const OCCASIONS = [
  { id: 'Anniversaire', emoji: '🎂', name_fr: 'Anniversaire', name_en: 'Birthday' },
  { id: 'Amour', emoji: '❤️', name_fr: 'Amour', name_en: 'Love' },
  { id: 'Diplôme', emoji: '🎓', name_fr: 'Diplôme', name_en: 'Graduation' },
  { id: 'Mariage', emoji: '💍', name_fr: 'Mariage', name_en: 'Wedding' },
  { id: 'Remerciements', emoji: '🙏', name_fr: 'Remerciements', name_en: 'Thank you' },
  { id: 'Motivation', emoji: '🚀', name_fr: 'Motivation', name_en: 'Motivation' },
  { id: 'Autre', emoji: '✨', name_fr: 'Autre', name_en: 'Other' },
]

const INSPIRATION_TEMPLATES = [
  { occasion: 'Anniversaire', title: '🎂 Anniversaire Maman', title_en: '🎂 Mother Birthday', style: 'Acoustique', inspiration: 'piano mélodique, doux et touchant', paroles: "Je t'écris cette chanson maman pour te dire merci d'être toujours là pour moi. Joyeux anniversaire !" },
  { occasion: 'Amour', title: "❤️ Déclaration d'amour", title_en: '❤️ Love Declaration', style: 'RnB', inspiration: 'romantique, soulful vibe', paroles: "Depuis le premier jour où je t'ai vu, mon cœur ne bat que pour toi. Tu es mon amour." },
  { occasion: 'Diplôme', title: '🎓 Félicitations Diplôme', title_en: '🎓 Congratulations Graduation', style: 'Rap', inspiration: 'énergique, inspirant', paroles: "Bravo pour ton diplôme ! Tous ces efforts ont enfin payé, tu peux être fier de toi." },
  { occasion: 'Mariage', title: '💍 Vœux de mariage', title_en: '💍 Wedding Vows', style: 'Zouk', inspiration: 'romantique, rythme chalouté', paroles: "Que notre amour dure pour toujours. Aujourd'hui nous unissons nos vies devant nos proches." },
  { occasion: 'Remerciements', title: '🙏 Merci à un ami', title_en: '🙏 Thank you to a friend', style: 'Afrobeat', inspiration: 'joyeux, chaleureux', paroles: "Merci d'avoir été là dans les moments difficiles. Tu es un véritable ami." },
  { occasion: 'Motivation', title: '🚀 Succès & Force', title_en: '🚀 Success & Strength', style: 'Amapiano', inspiration: 'rythmé, entraînant', paroles: "N'abandonne jamais ! Continue d'avancer, le succès est au bout du chemin." },
]

const CREATE_T = {
  FR: { credit: "Crédit", credits: "Crédits" },
  EN: { credit: "Credit", credits: "Credits" }
}

export default function CreatePage() {
  const router = useRouter()
  const [lang, setLang] = useState('FR')
  const [mode, setMode] = useState('simple')
  const [step, setStep] = useState(1)
  const [occasion, setOccasion] = useState('')
  const [customOccasion, setCustomOccasion] = useState('')
  const [paroles, setParoles] = useState('')
  const [style, setStyle] = useState('')
  const [customStyle, setCustomStyle] = useState('')
  const [langue, setLangue] = useState('Français')
  const [customLangue, setCustomLangue] = useState('')
  const [titre, setTitre] = useState('')
  const [genreVocal, setGenreVocal] = useState('Auto')
  const [inspiration, setInspiration] = useState('')
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasGenerated, setHasGenerated] = useState(false)
  const {
    isGenerating, progress, songId: contextSongId, tracks: contextTracks,
    status: contextStatus, metadata, setMetadata, startGeneration, resetGeneration
  } = useGeneration()
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [showComposerHelper, setShowComposerHelper] = useState(false)
  const isSubmitting = useRef(false)

  const applyTemplate = (t) => {
    setOccasion(t.occasion)
    setStyle(t.style)
    setInspiration(t.inspiration)
    setParoles(t.paroles)
    setStep(3)
  }

  useEffect(() => {
    setMounted(true)
    const savedLang = localStorage.getItem('melofy_lang') || 'FR'
    setLang(savedLang)
  }, [])

  useEffect(() => {
    if (!mounted) return
    async function checkMaintenance() {
      try {
        const res = await fetch('/api/check-maintenance')
        const data = await res.json()
        if (data.isMaintenance) setIsMaintenance(true)
      } catch (err) { console.error(err) }
    }
    checkMaintenance()
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data)
      }
    }
    fetchProfile()
  }, [mounted])

  useEffect(() => {
    if (router.query.occasion) {
      const occ = OCCASIONS.find(o => o.id.toLowerCase() === router.query.occasion.toLowerCase())
      if (occ) { setOccasion(occ.id); setMode('simple') }
    }
  }, [router.query])

  useEffect(() => {
    async function loadSong() {
      if (router.query.songId) {
        try {
          const { data, error } = await supabase.from('songs').select('*').eq('id', router.query.songId).single()
          if (data && !error) {
            setParoles(data.lyrics || '')
            setStyle(data.style || '')
            setTitre(data.title || '')
            setMode('avance')
          }
        } catch (err) { console.error(err) }
      }
    }
    loadSong()
  }, [router.query.songId])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step === 4) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [step])

  const STEPS = lang === 'FR'
    ? (mode === 'simple' ? ['Occasion', 'Style', 'Message'] : ['Paroles', 'Style', 'Générer'])
    : (mode === 'simple' ? ['Occasion', 'Style', 'Message'] : ['Lyrics', 'Style', 'Generate'])

  // On utilise le contexte global pour la génération
  useEffect(() => {
    console.log('[CREATE] Context Status:', contextStatus)
    console.log('[CREATE] Context Tracks:', contextTracks)

    if (contextStatus === 'success' && contextTracks?.length > 0) {
      setTracks(contextTracks)
      setStep(5)
    } else if (contextStatus === 'failed') {
      setStep(3)
    }

    if (contextStatus === 'success' || contextStatus === 'failed' || contextStatus === 'idle') {
      isSubmitting.current = false
      setHasGenerated(false)
    }
  }, [contextStatus, contextTracks])

  // Si on revient sur la page avec un songId, et qu'une génération est en cours pour ce même ID
  useEffect(() => {
    if (router.query.songId && contextSongId === router.query.songId) {
      if (isGenerating) setStep(4)
      else if (contextStatus === 'success') setStep(5)
    }
  }, [router.query.songId, contextSongId, isGenerating, contextStatus])

  const handleGenerate = async () => {
    if (isSubmitting.current || hasGenerated) return
    if (mode === 'simple' && (!occasion || !style)) return
    if (mode === 'avance' && (!paroles || !style)) return
    isSubmitting.current = true
    setHasGenerated(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const finalOccasion = occasion === 'Autre' ? (customOccasion || 'Divers') : occasion
      const finalStyle = style === 'Autre' ? (customStyle || 'Style libre') : style
      const finalLangue = langue === 'Autre' ? (customLangue || 'Français') : langue
      const payload = { mode, occasion: finalOccasion, paroles, style: finalStyle, titre, langue: finalLangue, genreVocal, inspiration }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de génération')

      setMetadata(data.metadata)
      setStep(4)

      // Lancement de la génération globale
      startGeneration(data.songId, data.metadata)
      isSubmitting.current = false

    } catch (e) {
      toast.error(e.message)
      setHasGenerated(false)
      isSubmitting.current = false
    }
  }

  const handleSelectTrack = async (track) => {
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/save-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ track, metadata: { ...metadata, paroles: track.lyrics || metadata?.paroles || '' }, songId: contextSongId, titre })
      })
      const text = await res.text()
      let data = {}
      try { data = JSON.parse(text) } catch (err) { throw new Error(text.slice(0, 100) || 'Erreur lors de la sauvegarde') }
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde')

      // Réinitialiser la génération globale après sélection
      resetGeneration()

      router.push(`/songs?new=${data.songId}`)
    } catch (e) { toast.error(e.message) }
  }

  const handleNext = () => { if (step < 3) setStep(step + 1) }
  const handleBack = () => { if (step > 1) setStep(step - 1) }

  const inputStyle = {
    width: '100%', borderRadius: 12, padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8e8f0', fontFamily: 'DM Sans,sans-serif', fontSize: 14, outline: 'none',
  }

  // Couleurs Melofy
  const BRAND = '#6C63FF'
  const BRAND_GRAD = 'linear-gradient(135deg, #6C63FF, #F472B6, #a855f7)'
  const BRAND_BG = 'rgba(108,99,255,0.15)'
  const BRAND_BG_LIGHT = 'rgba(108,99,255,0.1)'
  const BRAND_BORDER = 'rgba(108,99,255,0.3)'
  const BRAND_HOVER_BG = 'rgba(108,99,255,0.15)'

  return (
    <>
      <Head><title>Créer · Melofy</title></Head>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F172A' }}>
        <header className="adaptive-px py-4 md:py-6 border-b border-white/5 bg-[#0F172A]/40 backdrop-blur-lg flex items-center justify-between sticky top-0 z-[100] w-full mx-auto">
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-10 pb-player-safe relative">
          <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>

            {isMaintenance && (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start', color: '#fbbf24' }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Service en maintenance</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>Le service de génération de musique est actuellement en maintenance. La création de musique peut temporairement échouer.</div>
                </div>
              </div>
            )}

            {/* Tabs Mode */}
            {step === 1 && (
              <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, marginBottom: 24, background: 'rgba(255,255,255,0.05)' }}>
                {['simple', 'avance'].map(m => (
                  <button key={m} onClick={() => { setMode(m); setParoles(''); setStyle(''); setOccasion(''); setLangue('Français'); setCustomLangue(''); setCustomStyle(''); setCustomOccasion(''); setGenreVocal('Auto'); setInspiration('') }} style={{
                    flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: mode === m ? BRAND_GRAD : 'transparent',
                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.15s',
                  }}>
                    {m === 'simple' ? (lang === 'FR' ? 'Mode Simple' : 'Simple Mode') : (lang === 'FR' ? 'Mode Avancé' : 'Advanced Mode')}
                  </button>
                ))}
              </div>
            )}

            {/* Stepper */}
            {step < 4 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
                {STEPS.map((s, i) => {
                  const n = i + 1; const done = step > n; const active = step === n
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, background: done || active ? BRAND_GRAD : 'rgba(255,255,255,0.08)', color: done || active ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                          {done ? '✓' : n}
                        </div>
                        <span className="hidden sm:inline" style={{ fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,0.3)' }}>{s}</span>
                      </div>
                      {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, margin: '0 8px', background: step > n ? BRAND : 'rgba(255,255,255,0.1)' }} />}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── MODE SIMPLE ── */}

            {/* Étape 1 : Occasion */}
            {mode === 'simple' && step === 1 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
                  {lang === 'FR' ? 'Pour quelle occasion ?' : 'For which occasion?'}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  {lang === 'FR' ? 'Choisis le thème principal de ta chanson.' : 'Choose the main theme of your song.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {OCCASIONS.map(o => (
                    <button key={o.id} onClick={() => setOccasion(o.id)} style={{
                      padding: '16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 12,
                      background: occasion === o.id ? BRAND_BG : 'rgba(255,255,255,0.08)',
                      outline: occasion === o.id ? `2.5px solid #22D3EE` : '1px solid rgba(255,255,255,0.15)',
                      boxShadow: occasion === o.id ? '0 0 20px rgba(34,211,238,0.2)' : 'none',
                    }}>
                      <div style={{ fontSize: 24 }}>{o.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{lang === 'FR' ? o.name_fr : o.name_en}</div>
                    </button>
                  ))}
                </div>
                {occasion === 'Autre' && (
                  <div style={{ marginBottom: 20 }}>
                    <input value={customOccasion} onChange={e => setCustomOccasion(e.target.value)}
                      placeholder={lang === 'FR' ? 'Quelle occasion ? (ex: Départ à la retraite)' : 'Which occasion? (e.g., Retirement)'}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                )}
                <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {lang === 'FR' ? 'Exemples & Modèles rapides' : 'Quick Examples & Templates'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {INSPIRATION_TEMPLATES.map((t, idx) => (
                      <button key={idx} type="button" onClick={() => applyTemplate(t)} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px',
                        color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.1)'; e.currentTarget.style.borderColor = '#F472B6' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                        {lang === 'FR' ? t.title : (t.title_en || t.title)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleNext} disabled={!occasion} style={{ marginTop: 8, width: '100%', padding: '13px', borderRadius: 50, border: 'none', cursor: !occasion ? 'not-allowed' : 'pointer', background: BRAND_GRAD, color: '#fff', fontWeight: 500, fontSize: 14, opacity: !occasion ? 0.35 : 1 }}>
                  {lang === 'FR' ? 'Continuer →' : 'Continue →'}
                </button>
              </div>
            )}

            {/* Étape 2 : Style (Simple) */}
            {mode === 'simple' && step === 2 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
                  {lang === 'FR' ? 'Quel style ?' : 'Which style?'}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  {lang === 'FR' ? "L'ambiance musicale de ta chanson." : 'The musical vibe of your song.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)} style={{
                      padding: '16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', border: 'none',
                      background: style === s.id ? BRAND_BG : 'rgba(255,255,255,0.08)',
                      outline: style === s.id ? `2.5px solid #22D3EE` : '1px solid rgba(255,255,255,0.15)',
                      boxShadow: style === s.id ? '0 0 20px rgba(34,211,238,0.2)' : 'none',
                    }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{lang === 'FR' ? s.name_fr : s.name_en}</div>
                    </button>
                  ))}
                </div>
                {style === 'Autre' && (
                  <div style={{ marginBottom: 20 }}>
                    <input value={customStyle} onChange={e => setCustomStyle(e.target.value)}
                      placeholder={lang === 'FR' ? 'Quel style ? (ex: Jazz, Synthwave...)' : 'Which style? (e.g., Jazz, Synthwave...)'}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {lang === 'FR' ? 'Genre Vocal' : 'Vocal Genre'}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Auto', lang === 'FR' ? 'Homme' : 'Male', lang === 'FR' ? 'Femme' : 'Female'].map(g => (
                      <button key={g} onClick={() => setGenreVocal(g)} style={{
                        flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none',
                        background: genreVocal === g ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.05)',
                        color: genreVocal === g ? '#22D3EE' : 'rgba(255,255,255,0.6)',
                        outline: genreVocal === g ? `1.5px solid #22D3EE` : '1px solid rgba(255,255,255,0.08)',
                        fontWeight: genreVocal === g ? 700 : 500, fontSize: 13, transition: 'all 0.2s'
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {lang === 'FR' ? 'Inspiration (optionnel)' : 'Inspiration (optional)'}
                  </label>
                  <input value={inspiration} onChange={e => setInspiration(e.target.value)}
                    placeholder={lang === 'FR' ? 'ex: progressive folk, piano mélancolique...' : 'e.g., progressive folk, melancholic piano...'}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {['progressive folk', 'dance-punk', 'soulful samples', 'stirring', 'house funk', 'lo-fi chill', 'piano vibe', 'chillwave'].map(chip => (
                      <button key={chip} type="button" onClick={() => setInspiration(inspiration ? `${inspiration}, ${chip}` : chip)} style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '4px 10px',
                        color: 'rgba(255,255,255,0.55)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = BRAND_BG; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = BRAND }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleBack} style={{ padding: '13px 20px', borderRadius: 50, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>
                    {lang === 'FR' ? '← Retour' : '← Back'}
                  </button>
                  <button onClick={handleNext} disabled={!style} style={{ flex: 1, padding: '13px', borderRadius: 50, border: 'none', cursor: !style ? 'not-allowed' : 'pointer', background: BRAND_GRAD, color: '#fff', fontWeight: 500, fontSize: 14, opacity: !style ? 0.35 : 1 }}>
                    {lang === 'FR' ? 'Continuer →' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3 : Message (Simple) */}
            {mode === 'simple' && step === 3 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
                  {lang === 'FR' ? 'Ton message (optionnel)' : 'Your message (optional)'}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  {lang === 'FR' ? "Tu peux laisser ce champ vide. Ajouter un message aide simplement l'IA à mieux personnaliser ta chanson." : 'You can leave this empty. Adding a message simply helps the AI personalize your song better.'}
                </p>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <textarea value={paroles} onChange={e => setParoles(e.target.value)}
                    maxLength={500} rows={5}
                    placeholder={lang === 'FR' ? 'Ex: Bonne fête maman, tu es la meilleure du monde...' : 'e.g., Happy birthday mom, you are the best in the world...'}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{paroles.length}/500</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
                      {lang === 'FR' ? 'Titre (optionnel)' : 'Title (optional)'}
                    </label>
                    <input value={titre} onChange={e => setTitre(e.target.value)}
                      placeholder={lang === 'FR' ? 'Ex: Joyeux anniversaire' : 'e.g., Happy birthday'}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
                      {lang === 'FR' ? 'Langue' : 'Language'}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={langue} onChange={e => setLangue(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', flex: langue === 'Autre' ? '0 0 45%' : 1 }}>
                        <option value="Français" style={{ background: '#0d0d14' }}>{lang === 'FR' ? 'Français 🇫🇷' : 'French 🇫🇷'}</option>
                        <option value="Anglais" style={{ background: '#0d0d14' }}>{lang === 'FR' ? 'Anglais 🇬🇧' : 'English 🇬🇧'}</option>
                        <option value="Lingala" style={{ background: '#0d0d14' }}>Lingala 🇨🇩</option>
                        <option value="Wolof" style={{ background: '#0d0d14' }}>Wolof 🇸🇳</option>
                        <option value="Swahili" style={{ background: '#0d0d14' }}>Swahili 🇰🇪</option>
                        <option value="Yoruba" style={{ background: '#0d0d14' }}>Yoruba 🇳🇬</option>
                        <option value="Bambara" style={{ background: '#0d0d14' }}>Bambara 🇲🇱</option>
                        <option value="Zoulou" style={{ background: '#0d0d14' }}>Zoulou 🇿🇦</option>
                        <option value="Espagnol" style={{ background: '#0d0d14' }}>{lang === 'FR' ? 'Espagnol 🇪🇸' : 'Spanish 🇪🇸'}</option>
                        <option value="Autre" style={{ background: '#0d0d14' }}>{lang === 'FR' ? 'Autre...' : 'Other...'}</option>
                      </select>
                      {langue === 'Autre' && (
                        <input value={customLangue} onChange={e => setCustomLangue(e.target.value)}
                          placeholder={lang === 'FR' ? 'Ta langue...' : 'Your language...'}
                          style={{ ...inputStyle, flex: 1 }}
                          onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      )}
                    </div>
                  </div>
                </div>
                {error && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleBack} disabled={loading} style={{ padding: '13px 20px', borderRadius: 50, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>
                    {lang === 'FR' ? '← Retour' : '← Back'}
                  </button>
                  <button onClick={handleGenerate} disabled={isGenerating} style={{ flex: 1, padding: '13px', borderRadius: 50, border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', background: BRAND_GRAD, color: '#fff', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isGenerating ? 0.7 : 1 }}>
                    {isGenerating ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />{lang === 'FR' ? 'Génération...' : 'Generating...'}</> : (lang === 'FR' ? '✨ Générer ma chanson' : '✨ Generate my song')}
                  </button>
                </div>
              </div>
            )}

            {/* ── MODE AVANCÉ ── */}

            {/* Étape 1 : Paroles */}
            {mode === 'avance' && step === 1 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>Écris tes paroles</h1>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Structure tes paroles avec [Verse], [Chorus], etc.</p>
                  <button
                    onClick={() => setShowComposerHelper(true)}
                    style={{
                      background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                      color: '#a78bfa', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.2)'; e.currentTarget.style.borderColor = '#6C63FF' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.2)' }}
                  >
                    <span>✨</span> {lang === 'FR' ? 'Besoin d\'aide ?' : 'Need help?'}
                  </button>
                </div>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <textarea value={paroles} onChange={e => setParoles(e.target.value)}
                    maxLength={1500} rows={7}
                    placeholder={"Ex: [Verse]\nBonne fête maman\nTu es la meilleure du monde..."}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{paroles.length}/1500</span>
                </div>
                <button onClick={handleNext} disabled={paroles.length < 10}
                  style={{ marginTop: 8, width: '100%', padding: '13px', borderRadius: 50, border: 'none', cursor: paroles.length < 10 ? 'not-allowed' : 'pointer', background: BRAND_GRAD, color: '#fff', fontWeight: 500, fontSize: 14, opacity: paroles.length < 10 ? 0.35 : 1 }}>
                  Continuer →
                </button>
              </div>
            )}

            {/* Étape 2 : Style (Avancé) */}
            {mode === 'avance' && step === 2 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>Choisis un style</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Quel genre musical pour ta chanson ?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)} style={{
                      padding: '16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', border: 'none',
                      background: style === s.id ? BRAND_BG : 'rgba(255,255,255,0.04)',
                      outline: style === s.id ? `1.5px solid ${BRAND}` : '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{s.id}</div>
                    </button>
                  ))}
                </div>
                {style === 'Autre' && (
                  <div style={{ marginBottom: 20 }}>
                    <input value={customStyle} onChange={e => setCustomStyle(e.target.value)}
                      placeholder="Quel style ? (ex: Jazz, Synthwave...)"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Genre Vocal</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Auto', 'Homme', 'Femme'].map(g => (
                      <button key={g} onClick={() => setGenreVocal(g)} style={{
                        flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none',
                        background: genreVocal === g ? BRAND_BG : 'rgba(255,255,255,0.05)',
                        color: genreVocal === g ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                        outline: genreVocal === g ? `1.5px solid ${BRAND}` : '1px solid rgba(255,255,255,0.08)',
                        fontWeight: genreVocal === g ? 600 : 500, fontSize: 13, transition: 'all 0.2s'
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Inspiration (optionnel)</label>
                  <input value={inspiration} onChange={e => setInspiration(e.target.value)}
                    placeholder="ex: progressive folk, piano mélancolique..."
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {['progressive folk', 'dance-punk', 'soulful samples', 'stirring', 'house funk', 'lo-fi chill', 'piano vibe', 'chillwave'].map(chip => (
                      <button key={chip} type="button" onClick={() => setInspiration(inspiration ? `${inspiration}, ${chip}` : chip)} style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '4px 10px',
                        color: 'rgba(255,255,255,0.55)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = BRAND_BG; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = BRAND }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Titre (optionnel)</label>
                    <input value={titre} onChange={e => setTitre(e.target.value)}
                      placeholder="Ex: Joyeux anniversaire maman"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Langue vocale</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={langue} onChange={e => setLangue(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', flex: langue === 'Autre' ? '0 0 45%' : 1 }}>
                        <option value="Français" style={{ background: '#0d0d14' }}>Français 🇫🇷</option>
                        <option value="Anglais" style={{ background: '#0d0d14' }}>Anglais 🇬🇧</option>
                        <option value="Lingala" style={{ background: '#0d0d14' }}>Lingala 🇨🇩</option>
                        <option value="Wolof" style={{ background: '#0d0d14' }}>Wolof 🇸🇳</option>
                        <option value="Swahili" style={{ background: '#0d0d14' }}>Swahili 🇰🇪</option>
                        <option value="Yoruba" style={{ background: '#0d0d14' }}>Yoruba 🇳🇬</option>
                        <option value="Bambara" style={{ background: '#0d0d14' }}>Bambara 🇲🇱</option>
                        <option value="Zoulou" style={{ background: '#0d0d14' }}>Zoulou 🇿🇦</option>
                        <option value="Espagnol" style={{ background: '#0d0d14' }}>Espagnol 🇪🇸</option>
                        <option value="Autre" style={{ background: '#0d0d14' }}>Autre...</option>
                      </select>
                      {langue === 'Autre' && (
                        <input value={customLangue} onChange={e => setCustomLangue(e.target.value)}
                          placeholder="Ta langue..."
                          style={{ ...inputStyle, flex: 1 }}
                          onFocus={e => e.target.style.borderColor = BRAND_BORDER}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleBack} style={{ padding: '13px 20px', borderRadius: 50, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>← Retour</button>
                  <button onClick={handleNext} disabled={!style} style={{ flex: 1, padding: '13px', borderRadius: 50, border: 'none', cursor: !style ? 'not-allowed' : 'pointer', background: BRAND_GRAD, color: '#fff', fontWeight: 500, fontSize: 14, opacity: !style ? 0.35 : 1 }}>Continuer →</button>
                </div>
              </div>
            )}

            {/* Étape 3 : Générer (Avancé) */}
            {mode === 'avance' && step === 3 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>Tout est prêt !</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Vérifie et lance la génération.</p>
                <div style={{ borderRadius: 16, padding: 16, marginBottom: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Paroles</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{paroles.slice(0, 120)}{paroles.length > 120 ? '...' : ''}</div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mode</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Avancé 🛠️</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Style</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{style === 'Autre' ? (customStyle || 'Non précisé') : style}</div>
                    </div>
                    {titre && <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Titre</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{titre}</div>
                    </div>}
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Langue</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{langue === 'Autre' ? (customLangue || 'Non précisée') : langue}</div>
                    </div>
                  </div>
                </div>
                {error && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleBack} disabled={isGenerating} style={{ padding: '13px 20px', borderRadius: 50, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>← Retour</button>
                  <button onClick={handleGenerate} disabled={isGenerating} style={{ flex: 1, padding: '13px', borderRadius: 50, border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', background: BRAND_GRAD, color: '#fff', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isGenerating ? 0.7 : 1 }}>
                    {isGenerating ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Démarrage...</> : '✨ Générer ma chanson'}
                  </button>
                </div>
              </div>
            )}

            {/* Étape 4 : Attente */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 32px' }}>
                  <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(108,99,255,0.1)', borderRadius: '50%' }} />
                  <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke={BRAND} strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: BRAND }}>
                    {Math.round(progress)}%
                  </div>
                </div>

                <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(18px, 5vw, 22px)', color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
                  {progress < 30 ? (lang === 'FR' ? "Initialisation de l'IA..." : "Initializing AI...") :
                    progress < 70 ? (lang === 'FR' ? "Composition des mélodies..." : "Composing melodies...") :
                      (lang === 'FR' ? "Finalisation du mixage..." : "Finalizing mix...")}
                </h2>

                <div style={{ width: '100%', maxWidth: 300, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, margin: '0 auto 24px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`, background: BRAND_GRAD, borderRadius: 10, transition: 'width 0.8s ease-out' }} />
                </div>

                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
                  {lang === 'FR'
                    ? "Cette étape peut prendre 2 à 10 min. Ton crédit est déjà utilisé. Tu peux quitter la page : si tu ne reviens pas choisir ta version, la première proposition sera automatiquement sauvegardée dans ton Dashboard."
                    : "This takes 2-10 min. Your credit is used. You can leave: if you don't return to choose, the first version will be automatically saved in your Dashboard."}
                </p>
              </div>
            )}

            {/* Étape 5 : Choix de la piste */}
            {step === 5 && (
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 6vw, 24px)', color: '#fff', marginBottom: 8, textAlign: 'center', lineHeight: 1.2 }}>Choisis ta version préférée</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center' }}>Écoute les deux propositions et sélectionne celle que tu souhaites conserver.</p>
                {error && <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>{error}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {tracks.map((track, idx) => (
                    <div key={track.id || idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: track.image_url ? `url(${track.image_url}) center/cover` : BRAND_BG }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Version {idx + 1}</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{track.title || metadata?.titre || 'Chanson générée'}</div>
                        </div>
                      </div>
                      <audio controls src={track.audio_url} style={{ width: '100%', height: 40, outline: 'none' }} />
                      <button onClick={() => handleSelectTrack(track)} style={{
                        width: '100%', padding: '14px', borderRadius: 50, border: `1px solid ${BRAND_BORDER}`, cursor: 'pointer',
                        background: BRAND_BG, color: '#a78bfa', fontWeight: 600, fontSize: 14, transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = BRAND_BG; e.currentTarget.style.color = '#a78bfa' }}>
                        🤝 Garder cette version
                      </button>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 24, textAlign: 'center' }}>
                  Attention : La version non sélectionnée sera supprimée pour libérer de l'espace sur ton quota.
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />

      {/* Modal Assistant de Composition */}
      {showComposerHelper && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }} onClick={() => setShowComposerHelper(false)}>
          <div style={{
            background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
            maxWidth: 500, width: '100%', padding: 32, position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowComposerHelper(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Assistant Compositeur</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Copie ce prompt et colle-le dans ChatGPT pour générer des paroles et un style de pro.
              </p>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.3)', border: '1px dotted rgba(255,255,255,0.1)',
              borderRadius: 16, padding: 16, marginBottom: 24, maxHeight: 200, overflowY: 'auto'
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {lang === 'FR'
                  ? `Tu es un compositeur expert pour Suno AI. Je veux que tu m'écrives une chanson complète prête à coller dans Suno. Avant de commencer, pose-moi ces questions une par une :
1. Quel est le sujet / l'histoire de la chanson ?
2. Quel genre musical ? (drill, afro, RnB, pop, rap, rock, reggaeton, etc.)
3. Quel mood ? (triste, motivant, festif, nostalgique, agressif, romantique...)
4. Un artiste de référence pour le style ?
5. Voix masculine, féminine ou duo ?
6. Une langue ou un mélange ? (français, anglais, wolof, lingala...)

Une fois mes réponses reçues, génère :
- Un prompt de style en anglais pour Suno (genre, mood, BPM, instruments)
- Les paroles complètes avec les balises [Intro] [Couplet] [Hook] [Bridge] [Outro]`
                  : `You are an expert composer for Suno AI. I want you to write me a complete song ready to paste into Suno. Before you start, ask me these questions one by one:
1. What is the subject / story of the song?
2. What musical genre? (drill, afro, RnB, pop, rap, rock, reggaeton, etc.)
3. What mood? (sad, motivating, festive, nostalgic, aggressive, romantic...)
4. A reference artist for the style?
5. Male, female or duo voice?
6. One language or a mix? (French, English, Wolof, Lingala...)

Once my answers are received, generate:
- A style prompt in English for Suno (genre, mood, BPM, instruments)
- The complete lyrics with Suno tags: [Intro] [Verse] [Hook] [Bridge] [Outro]`
                }
              </p>
            </div>

            <button
              onClick={() => {
                const text = lang === 'FR'
                  ? `Tu es un compositeur expert pour Suno AI...` // (version courte pour l'exemple, mais le code copiera le vrai texte)
                  : `You are an expert composer for Suno AI...`;

                const fullText = lang === 'FR'
                  ? "Tu es un compositeur expert pour Suno AI. Je veux que tu m'écrives une chanson complète prête à coller dans Suno. Avant de commencer, pose-moi ces questions une par une :\n1. Quel est le sujet / l'histoire de la chanson ?\n2. Quel genre musical ? (drill, afro, RnB, pop, rap, rock, reggaeton, etc.)\n3. Quel mood ? (triste, motivant, festif, nostalgique, agressif, romantique...)\n4. Un artiste de référence pour le style ?\n5. Voix masculine, féminine ou duo ?\n6. Une langue ou un mélange ? (français, anglais, wolof, lingala...)\n\nUne fois mes réponses reçues, génère :\n- Un prompt de style en anglais pour Suno (genre, mood, BPM, instruments)\n- Les paroles complètes avec les balises [Intro] [Couplet] [Hook] [Bridge] [Outro]"
                  : "You are an expert composer for Suno AI. I want you to write me a complete song ready to paste into Suno. Before you start, ask me these questions one by one:\n1. What is the subject / story of the song?\n2. What musical genre? (drill, afro, RnB, pop, rap, rock, reggaeton, etc.)\n3. What mood? (sad, motivating, festive, nostalgic, aggressive, romantic...)\n4. A reference artist for the style?\n5. Male, female or duo voice?\n6. One language or a mix? (French, English, Wolof, Lingala...)\n\nOnce my answers are received, generate:\n- A style prompt in English for Suno (genre, mood, BPM, instruments)\n- The complete lyrics with Suno tags: [Intro] [Verse] [Hook] [Bridge] [Outro]";

                navigator.clipboard.writeText(fullText);
                toast.success(lang === 'FR' ? 'Copié !' : 'Copied!');
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: 50, border: 'none',
                background: BRAND_GRAD, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >
              {lang === 'FR' ? 'Copier le Prompt Magique' : 'Copy Magic Prompt'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}