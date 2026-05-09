import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [lang, setLang] = useState('FR')
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [currency, setCurrency] = useState('XOF')
  const [curDropdownOpen, setCurDropdownOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  useEffect(() => {
    async function detectGeo() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        if (data?.country_code) {
          if (['FR', 'BE', 'DE', 'IT', 'ES'].includes(data.country_code)) setCurrency('EUR')
          else if (['US', 'CA', 'GB'].includes(data.country_code)) setCurrency('USD')
          else setCurrency('XOF')
        }
      } catch (err) { console.error(err) }
    }
    detectGeo()
  }, [])

  const formatPrice = (priceInXof, cur) => {
    const rates = { XOF: 1, EUR: 1 / 655.957, USD: 1 / 600 }
    const syms = { XOF: 'FCFA', EUR: '€', USD: '$' }
    const val = priceInXof * (rates[cur] || 1)
    return cur === 'XOF' ? `${Math.round(val)} ${syms[cur]}` : `${val.toFixed(2)} ${syms[cur]}`
  }

  const handlePlayDemo = () => {
    const audio = document.getElementById('demo-audio')
    if (audio) {
      if (isPlaying) { audio.pause() } else { audio.play() }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? "Melofy — L'émotion en musique par IA" : 'Melofy — Music Emotion powered by AI'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={lang === 'FR' ? "Crée une musique inoubliable avec l'IA." : 'Create unforgettable music with AI.'} />
      </Head>

      <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Navbar */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5 sticky top-0 z-[100] bg-[#0F172A]/85 backdrop-blur-lg border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 md:gap-3 no-underline">
            <span style={{ fontSize: 24, color: '#6C63FF' }}>♪</span>
            <span className="font-syne font-extrabold text-xl text-white tracking-tight">melofy</span>
          </Link>

          <div className="flex items-center gap-3 md:gap-8">
            <div style={{ position: 'relative' }}>
              <button onClick={(e) => { e.stopPropagation(); setLangDropdownOpen(!langDropdownOpen) }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '6px 12px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{lang}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, transition: 'transform 0.2s', transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              {langDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '6px 0', minWidth: 100, zIndex: 120, backdropFilter: 'blur(16px)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
                  {['FR', 'EN'].map((l) => (
                    <button key={l} onClick={() => { setLang(l); localStorage.setItem('melofy_lang', l); setLangDropdownOpen(false) }} style={{ padding: '10px 16px', background: 'none', border: 'none', color: lang === l ? '#6C63FF' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: lang === l ? 700 : 500, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; if (lang !== l) e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; if (lang !== l) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
                      <span>{l === 'FR' ? 'Français' : 'English'}</span>
                      {lang === l && <span style={{ color: '#6C63FF', fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/blog" style={{ color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500, opacity: 0.8 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
              Blog
            </Link>
            <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500, opacity: 0.8 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
              {lang === 'FR' ? 'Connexion' : 'Log in'}
            </Link>
            <Link href="/signup" className="hidden sm:flex" style={{ background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 50, alignItems: 'center', gap: 6, transition: 'transform 0.2s, opacity 0.2s', boxShadow: '0 4px 14px rgba(108,99,255,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {lang === 'FR' ? 'Commencer' : 'Start'} <span style={{ fontSize: 16 }}>→</span>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, position: 'relative' }}>

          {/* Hero */}
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 60px', position: 'relative', textAlign: 'center', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 30, marginBottom: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a78bfa', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C63FF', display: 'inline-block', boxShadow: '0 0 10px #6C63FF' }} />
              {lang === 'FR' ? "✨ L'ÉMOTION EN MUSIQUE PAR IA" : '✨ MUSIC EMOTION BY AI'}
            </div>

            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 6vw, 76px)', color: '#fff', lineHeight: 1.2, margin: '0 0 24px', maxWidth: 900, zIndex: 1 }}>
              {lang === 'FR' ? (
                <>Créez une musique <br /><span style={{ background: 'linear-gradient(135deg,#6C63FF,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>unique & inoubliable</span></>
              ) : (
                <>Create <br /><span style={{ background: 'linear-gradient(135deg,#6C63FF,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>unique & unforgettable</span> music</>
              )}
            </h1>

            <p style={{ fontSize: 'clamp(16px, 1.8vw, 21px)', color: 'rgba(255,255,255,0.55)', marginBottom: 44, lineHeight: 1.6, maxWidth: 680, zIndex: 1 }}>
              {lang === 'FR' ? "Anniversaires, Mariages, Remerciements... Transformez vos messages en chansons personnalisées en quelques secondes grâce à l'IA." : 'Birthdays, Weddings, Gratitude... Transform your messages into personalized songs in seconds with AI.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 42px', borderRadius: 50, background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18, boxShadow: '0 8px 32px rgba(108,99,255,0.35)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                {lang === 'FR' ? 'Créer ma chanson' : 'Create my song'} <span style={{ fontSize: 20 }}>→</span>
              </Link>
              <a href="#demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 36px', borderRadius: 50, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 17, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                {lang === 'FR' ? 'Écouter une démo' : 'Listen to a demo'}
              </a>
            </div>

            {/* Social Proof */}
            <div style={{ marginTop: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 1 }}>
              <div style={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                ))}
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 500 }}>
                {lang === 'FR' ? <><strong>10 000 chansons</strong> générées pour surprendre des proches.</> : <><strong>10,000 songs</strong> generated to surprise loved ones.</>}
              </p>
            </div>
          </section>

          {/* Demo Player */}
          <section id="demo" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
            <div style={{ textAlign: 'center', maxWidth: 640 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 32, color: '#fff', margin: '0 0 12px' }}>
                {lang === 'FR' ? 'Écoutez un aperçu' : 'Hear a sample'}
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                {lang === 'FR' ? "Voici ce que l'IA peut composer pour vous en quelques instants." : 'Here is what AI can compose for you in just a few moments.'}
              </p>
            </div>
            <div style={{ width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px 32px', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 24 }}>
              <button onClick={handlePlayDemo} style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#a855f7)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(108,99,255,0.4)', flexShrink: 0, transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><polygon points="5,3 19,12 5,21" /></svg>
                )}
              </button>
              <audio id="demo-audio" src="https://cdn.suno.ai/078d4a97-9e79-4bb4-ae3c-53f09bf2160d.mp3" onEnded={() => setIsPlaying(false)} />
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#fff' }}>Kazaro, L'Enfant Lumière</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                  {lang === 'FR' ? 'Style Acoustique / Pop' : 'Acoustic / Pop Style'}
                </p>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" style={{ padding: '80px 20px 120px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
            <div style={{ textAlign: 'center', maxWidth: 640 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 32, color: '#fff', margin: '0 0 12px' }}>
                {lang === 'FR' ? 'Tarifs simples et transparents' : 'Simple and transparent pricing'}
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', lineHeight: 1.6 }}>
                {lang === 'FR' ? 'Créez une chanson dès maintenant avec nos packs de crédits sans abonnement.' : 'Create a song right now with our credit packs without subscription.'}
              </p>

              {/* Currency Switcher (Moved near pricing) */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button onClick={(e) => { e.stopPropagation(); setCurDropdownOpen(!curDropdownOpen) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 50, padding: '8px 20px', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{lang === 'FR' ? 'Devise :' : 'Currency:'}</span>
                  <span style={{ color: '#fff' }}>
                    {currency === 'XOF' ? '🇹🇬 FCFA' : (currency === 'EUR' ? '🇫🇷 EUR' : '🇺🇸 USD')}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, transition: 'transform 0.2s', transform: curDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {curDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 10, background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '8px 0', minWidth: 120, zIndex: 120, backdropFilter: 'blur(20px)', boxShadow: '0 15px 45px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                    {[
                      { id: 'XOF', flag: '🇹🇬', label: 'FCFA' },
                      { id: 'EUR', flag: '🇫🇷', label: 'EUR' },
                      { id: 'USD', flag: '🇺🇸', label: 'USD' }
                    ].map((c) => (
                      <button key={c.id} onClick={() => { setCurrency(c.id); setCurDropdownOpen(false) }} style={{ padding: '12px 20px', background: 'none', border: 'none', color: currency === c.id ? '#6C63FF' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: currency === c.id ? 700 : 500, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; if (currency !== c.id) e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; if (currency !== c.id) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
                        <span>{c.flag} {c.label}</span>
                        {currency === c.id && <span style={{ color: '#6C63FF', fontSize: 12 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, width: '100%' }}>
              {/* Pack Duo */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {lang === 'FR' ? 'Pack Duo' : 'Duo Pack'}
                  </h3>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{formatPrice(500, currency)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
                  <li>✨ <strong>{lang === 'FR' ? '2 crédits' : '2 credits'}</strong> {lang === 'FR' ? 'de génération' : 'of generation'}</li>
                  <li>🎵 {lang === 'FR' ? 'Chansons en haute qualité' : 'High quality songs'}</li>
                  <li>📱 {lang === 'FR' ? 'Partage public dédié' : 'Dedicated public sharing'}</li>
                </ul>
                <Link href="/signup" style={{ padding: '14px 24px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 14, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                  {lang === 'FR' ? 'Choisir ce pack' : 'Choose this pack'}
                </Link>
              </div>
              {/* Pack Trio+ */}
              <div style={{ background: 'rgba(108,99,255,0.04)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 24, padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 16, right: 24, background: '#6C63FF', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>
                  {lang === 'FR' ? 'Plus Populaire' : 'Most Popular'}
                </span>
                <div>
                  <h3 style={{ fontSize: 12, color: '#a78bfa', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {lang === 'FR' ? 'Pack Trio+' : 'Trio+ Pack'}
                  </h3>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{formatPrice(1200, currency)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
                  <li>✨ <strong>{lang === 'FR' ? '6 crédits' : '6 credits'}</strong> {lang === 'FR' ? 'de génération' : 'of generation'}</li>
                  <li>🎵 {lang === 'FR' ? 'Chansons en haute qualité' : 'High quality songs'}</li>
                  <li>📱 {lang === 'FR' ? 'Partage public dédié' : 'Dedicated public sharing'}</li>
                  <li>🎁 {lang === 'FR' ? 'Économie par chanson' : 'Save per song'}</li>
                </ul>
                <Link href="/signup" style={{ padding: '14px 24px', borderRadius: 40, background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 14, transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  {lang === 'FR' ? 'Prendre ce pack' : 'Get this pack'}
                </Link>
              </div>
              {/* Pack Fête */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {lang === 'FR' ? 'Pack Fête' : 'Party Pack'}
                  </h3>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{formatPrice(2500, currency)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
                  <li>✨ <strong>{lang === 'FR' ? '15 crédits' : '15 credits'}</strong> {lang === 'FR' ? 'de génération' : 'of generation'}</li>
                  <li>🎵 {lang === 'FR' ? 'Idéal pour grands événements' : 'Ideal for large events'}</li>
                  <li>📱 {lang === 'FR' ? 'Meilleur tarif / chanson' : 'Best price per song'}</li>
                </ul>
                <Link href="/signup" style={{ padding: '14px 24px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 14, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                  {lang === 'FR' ? 'Prendre ce pack' : 'Get this pack'}
                </Link>
              </div>
            </div>
          </section>

          {/* Scrolling Banner */}
          <div style={{ width: '100%', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 0', marginTop: 'auto' }}>
            <div className="scrolling-content">
              {[...Array(2)].map((_, i) => (
                <span key={i} style={{ display: 'inline-flex', gap: 40 }}>
                  {(lang === 'FR' ? ['✨ ANNIVERSAIRE', '✨ MARIAGE', '✨ BAPTÊME', '✨ HOMMAGE', '✨ DÉCLARATION', '✨ ENCOURAGEMENT', '✨ RÉUSSITE'] : ['✨ BIRTHDAY', '✨ WEDDING', '✨ BAPTISM', '✨ TRIBUTE', '✨ PROPOSAL', '✨ ENCOURAGEMENT', '✨ ACHIEVEMENT']).map(t => (
                    <span key={t} style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 2, marginRight: 40 }}>{t}</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>© {new Date().getFullYear()} Melofy. {lang === 'FR' ? 'Tous droits réservés.' : 'All rights reserved.'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{lang === 'FR' ? 'Mentions légales' : 'Terms of Use'}</Link>
            <Link href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{lang === 'FR' ? 'Confidentialité' : 'Privacy Policy'}</Link>
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.scrolling-content{display:flex;gap:0;white-space:nowrap;animation:scroll 35s linear infinite;}@keyframes scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}` }} />
    </>
  )
}