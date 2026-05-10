import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router' // ✅ FIX 1 : router importé
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const PACKS = (lang) => [
  {
    id: 'pack_2',
    name: lang === 'FR' ? 'Pack Duo' : 'Duo Pack',
    credits: 2, price: 100, pricePerSong: 50,
    description: lang === 'FR' ? 'Idéal pour créer 2 morceaux et surprendre vos proches.' : 'Ideal to create 2 tracks and surprise your loved ones.',
    features: lang === 'FR'
      ? ['2 crédits de génération', 'Accès au mode simple & avancé', 'Page de partage publique dédiée', 'Téléchargement MP3 direct']
      : ['2 generation credits', 'Access to simple & advanced mode', 'Dedicated public sharing page', 'Direct MP3 download']
  },
  {
    id: 'pack_6',
    name: lang === 'FR' ? 'Pack Trio+' : 'Trio+ Pack',
    credits: 6, price: 1200, pricePerSong: 200, popular: true,
    description: lang === 'FR' ? 'Le pack favori pour célébrer plusieurs occasions.' : 'The favorite pack to celebrate multiple occasions.',
    features: lang === 'FR'
      ? ['6 crédits de génération', 'Accès au mode simple & avancé', 'Page de partage publique dédiée', 'Téléchargement MP3 direct', 'Économisez par chanson']
      : ['6 generation credits', 'Access to simple & advanced mode', 'Dedicated public sharing page', 'Direct MP3 download', 'Save more per song']
  },
  {
    id: 'pack_15',
    name: lang === 'FR' ? 'Pack Fête' : 'Party Pack',
    credits: 15, price: 2500, pricePerSong: 166,
    description: lang === 'FR' ? 'Le pack idéal pour les mariages ou grands événements.' : 'The ideal pack for weddings or large events.',
    features: lang === 'FR'
      ? ['15 crédits de génération', 'Accès au mode simple & avancé', 'Page de partage publique dédiée', 'Téléchargement MP3 direct', 'Meilleur tarif par chanson']
      : ['15 generation credits', 'Access to simple & advanced mode', 'Dedicated public sharing page', 'Direct MP3 download', 'Best price per song']
  }
]

export default function PricingPage() {
  const router = useRouter() // ✅ FIX 1 : router initialisé
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [currency, setCurrency] = useState('XOF')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState('TG')
  const [lang, setLang] = useState('FR')
  const [isProcessing, setIsProcessing] = useState(false)
  const [giftActive, setGiftActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [dismissed, setDismissed] = useState(false)

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
          setDetectedCountry(data.country_code)
          if (['FR', 'BE'].includes(data.country_code)) setCurrency('EUR')
          else if (['US', 'CA'].includes(data.country_code)) setCurrency('USD')
          else setCurrency('XOF')
        }
      } catch (err) { console.error(err) }
    }
    detectGeo()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (data) {
            setProfile({ ...data, email: user.email })
            const now = new Date().getTime()
            const creation = new Date(data.created_at).getTime()
            const cycleIndex = Math.floor((now - creation) / (7 * 24 * 60 * 60 * 1000))
            const savedCycle = localStorage.getItem('melofy_gift_dismissed_cycle')
            if (savedCycle === cycleIndex.toString()) {
              setDismissed(true)
            }
          }
        }
      } catch (e) { console.error(e) }
      finally { setLoadingProfile(false) }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!profile?.created_at) return

    const checkGift = () => {
      const now = new Date().getTime()
      const creation = new Date(profile.created_at).getTime()
      const diff = now - creation

      const oneWeek = 7 * 24 * 60 * 60 * 1000
      const thirtyMin = 30 * 60 * 1000

      const timeInCycle = diff % oneWeek
      const active = timeInCycle < thirtyMin

      setGiftActive(active)

      if (active) {
        const remaining = Math.max(0, thirtyMin - timeInCycle)
        const mins = Math.floor(remaining / 60000)
        const secs = Math.floor((remaining % 60000) / 1000)
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`)
      }
    }

    const timer = setInterval(checkGift, 1000)
    checkGift()
    return () => clearInterval(timer)
  }, [profile])

  const handleBuy = async (pack) => {
    if (isProcessing) return
    setIsProcessing(true)

    // ✅ FIX 4 : loadingToast déclaré avant le try pour être accessible dans finally
    const loadingToast = toast.loading(lang === 'FR' ? 'Initialisation du paiement...' : 'Initializing payment...')

    try {
      if (!profile) {
        toast.error(lang === 'FR' ? 'Veuillez vous reconnecter' : 'Please log in again')
        router.push('/login') // ✅ FIX 1 : router maintenant disponible
        return
      }

      const res = await fetch('/api/payments/maketou/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          currency: currency,
          userId: profile.id,
          userEmail: profile.email
        })
      })

      const data = await res.json()

      // ✅ FIX 3 : log pour diagnostiquer la structure de réponse Maketou
      console.log('[Checkout] Réponse Maketou complète :', data)

      if (data.url) {
        if (data.sessionId) localStorage.setItem('melofy_last_cart_id', data.sessionId)
        window.location.assign(data.url)
      } else {
        // ✅ FIX 3 : message d'erreur plus précis si l'URL est absente
        console.error('[Checkout] URL absente dans la réponse :', data)
        throw new Error(data.error || (lang === 'FR' ? 'URL de paiement introuvable dans la réponse' : 'Payment URL not found in response'))
      }
    } catch (err) {
      toast.error(err.message || (lang === 'FR' ? 'Une erreur est survenue' : 'An error occurred'))
      console.error('Checkout error:', err)
    } finally {
      // ✅ FIX 4 : toast.dismiss ET setIsProcessing toujours exécutés, même en cas d'erreur
      toast.dismiss(loadingToast)
      setIsProcessing(false)
    }
  }

  const formatPrice = (priceInXof, cur) => {
    const rates = { XOF: 1, EUR: 1 / 655.957, USD: 1 / 600 }
    const syms = { XOF: 'FCFA', EUR: '€', USD: '$' }
    const val = priceInXof * (rates[cur] || 1)
    return cur === 'XOF' ? `${Math.round(val)} ${syms[cur]}` : `${val.toFixed(2)} ${syms[cur]}`
  }

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? 'Tarification • Melofy' : 'Pricing • Melofy'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-10 pb-player-safe">
          <div className="max-w-[1100px] mx-auto text-center">

            {/* Header */}
            <div style={{ marginBottom: 48 }}>
              {/* Gift Banner */}
              {(giftActive && !dismissed) && (
                <div style={{
                  background: profile?.has_invited ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #6C63FF, #4F46E5)',
                  color: '#fff', padding: '16px', borderRadius: 16, marginBottom: 32,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontWeight: 700, animation: 'pulse 2s infinite', textAlign: 'center', position: 'relative'
                }}>
                  <button onClick={() => {
                    setDismissed(true)
                    if (profile?.created_at) {
                      const now = new Date().getTime()
                      const creation = new Date(profile.created_at).getTime()
                      const cycleIndex = Math.floor((now - creation) / (7 * 24 * 60 * 60 * 1000))
                      localStorage.setItem('melofy_gift_dismissed_cycle', cycleIndex.toString())
                    }
                  }} style={{
                    position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
                    color: '#fff', fontSize: 18, cursor: 'pointer', opacity: 0.6, padding: 4
                  }}>✕</button>

                  {profile?.has_invited ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>🎁</span>
                        <span>{lang === 'FR' ? `CADEAU DÉBLOQUÉ : -30% SUR TOUT ! Il vous reste ${timeLeft}` : `GIFT UNLOCKED: -30% OFF EVERYTHING! ${timeLeft} left`}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>🔒</span>
                        <span>{lang === 'FR' ? `UN CADEAU VOUS ATTEND ! (${timeLeft})` : `A GIFT IS WAITING FOR YOU! (${timeLeft})`}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
                        {lang === 'FR'
                          ? 'Invitez au moins un ami pour débloquer -30% sur tous les packs.'
                          : 'Invite at least one friend to unlock -30% off all packs.'}
                      </p>
                      <Link href="/invite" style={{
                        background: '#fff', color: '#6C63FF', padding: '6px 16px', borderRadius: 10,
                        fontSize: 12, textDecoration: 'none', marginTop: 4, display: 'inline-block'
                      }}>
                        {lang === 'FR' ? 'Inviter des amis maintenant' : 'Invite friends now'}
                      </Link>
                    </>
                  )}
                  <style dangerouslySetInnerHTML={{ __html: `@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.01); } 100% { transform: scale(1); } }` }} />
                </div>
              )}

              <div style={{
                background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)',
                color: '#a78bfa', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                width: 'fit-content', textTransform: 'uppercase', letterSpacing: 1, margin: '0 auto 16px'
              }}>
                {lang === 'FR' ? 'Tarification transparente' : 'Transparent pricing'}
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 6vw, 28px)', color: '#fff', margin: '0 0 12px 0', lineHeight: 1.2 }}>
                {lang === 'FR' ? 'Achetez des crédits' : 'Buy credits'} <br />
                <span style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {lang === 'FR' ? 'sans engagement' : 'no commitment'}
                </span>
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
                {lang === 'FR'
                  ? "1 crédit = 1 chanson générée. Pas d'abonnement caché, payez uniquement ce que vous utilisez."
                  : "1 credit = 1 generated song. No hidden subscription, pay only what you use."}
              </p>

              {/* Currency selector */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{lang === 'FR' ? 'Devise :' : 'Currency:'}</span>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', padding: '8px 16px', borderRadius: 40, outline: 'none',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6C63FF'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                    <span style={{ fontWeight: 600 }}>
                      {currency === 'XOF' && '🇹🇬 FCFA'}
                      {currency === 'EUR' && '🇫🇷 EUR'}
                      {currency === 'USD' && '🇺🇸 USD'}
                    </span>
                    <span style={{
                      display: 'inline-flex', padding: '2px 6px', background: 'rgba(108,99,255,0.15)',
                      borderRadius: 20, fontSize: 11, color: '#a78bfa', fontWeight: 600
                    }}>AUTO</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isMenuOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                      background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16, width: 260, padding: '8px', zIndex: 200,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 4
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)',
                        padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 4
                      }}>
                        <span>🌐</span>
                        <span>{lang === 'FR' ? `Détecté depuis : ${detectedCountry}` : `Detected from: ${detectedCountry}`}</span>
                      </div>
                      {[
                        { id: 'XOF', symbol: 'FCFA', short: 'XOF', flag: '🇹🇬', name: 'Franc CFA' },
                        { id: 'EUR', symbol: '€', short: 'EUR', flag: '🇫🇷', name: 'Euro' },
                        { id: 'USD', symbol: '$', short: 'USD', flag: '🇺🇸', name: 'Dollar US' }
                      ].map(opt => {
                        const active = currency === opt.id
                        return (
                          <div key={opt.id} onClick={() => { setCurrency(opt.id); setIsMenuOpen(false) }} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                            background: active ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.2s'
                          }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', minWidth: 20, fontWeight: 500 }}>{opt.short}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {opt.id} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{opt.symbol}</span>
                                </span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{opt.name}</span>
                              </div>
                            </div>
                            {active && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pack cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 items-center">
              {PACKS(lang).map(pack => (
                <div key={pack.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: pack.popular ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 24, padding: '40px 32px', display: 'flex', flexDirection: 'column',
                  gap: 32, backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: pack.popular ? '0 12px 40px rgba(108,99,255,0.15)' : '0 8px 32px rgba(0,0,0,0.3)'
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0px)'}>

                  {pack.popular && (
                    <div style={{
                      position: 'absolute', top: 16, right: -30,
                      background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                      color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 30px',
                      transform: 'rotate(45deg)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', letterSpacing: 0.5
                    }}>
                      {lang === 'FR' ? 'POPULAIRE' : 'POPULAR'}
                    </div>
                  )}

                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>{pack.name}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, minHeight: 40, lineHeight: 1.4 }}>{pack.description}</p>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      {(giftActive && profile?.has_invited) ? (
                        <>
                          <span style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>
                            {formatPrice(Math.round(pack.price * 0.7), currency)}
                          </span>
                          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                            {formatPrice(pack.price, currency)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>
                          {formatPrice(pack.price, currency)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#FBBF24', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '2px 8px', background: 'rgba(251,191,36,0.1)', borderRadius: 6 }}>
                        {pack.credits} {lang === 'FR' ? `crédit${pack.credits > 1 ? 's' : ''}` : `credit${pack.credits > 1 ? 's' : ''}`}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>•</span>
                      <span style={{ color: '#a78bfa' }}>
                        {formatPrice((giftActive && profile?.has_invited) ? Math.round(pack.pricePerSong * 0.7) : pack.pricePerSong, currency)} / {lang === 'FR' ? 'chanson' : 'song'}
                      </span>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', flex: 1 }}>
                    {pack.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => handleBuy(pack)} disabled={isProcessing} style={{
                    width: '100%', padding: '15px', borderRadius: 16, border: 'none',
                    background: pack.popular ? 'linear-gradient(135deg, #6C63FF, #a855f7)' : 'rgba(255,255,255,0.04)',
                    color: '#fff', fontWeight: 700, fontSize: 15, cursor: isProcessing ? 'not-allowed' : 'pointer',
                    boxShadow: pack.popular ? '0 8px 24px rgba(108,99,255,0.3)' : 'none',
                    border: pack.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    transition: 'transform 0.2s',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                    onMouseEnter={e => { if (!isProcessing) e.currentTarget.style.transform = 'scale(1.02)' }}
                    onMouseLeave={e => { if (!isProcessing) e.currentTarget.style.transform = 'scale(1)' }}>
                    {isProcessing ? (
                      lang === 'FR' ? 'Initialisation...' : 'Initializing...'
                    ) : (
                      lang === 'FR' ? 'Acheter ce pack' : 'Buy this pack'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Info box */}
            <div style={{
              background: 'rgba(108,99,255,0.04)', border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: 16, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20,
              textAlign: 'left', maxWidth: 800, margin: '0 auto'
            }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>ℹ️</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>
                  {lang === 'FR' ? 'À propos du fonctionnement des crédits' : 'How credits work'}
                </h4>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                  {lang === 'FR'
                    ? "Un crédit vous permet de lancer la génération complète d'une chanson via l'IA. Si la génération venait à échouer pour une raison technique, le crédit ne sera pas débité ou vous sera recrédité."
                    : "A credit allows you to start the complete generation of a song via AI. If generation fails for a technical reason, the credit will not be debited or will be credited back."}
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}