import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import SongCard from '../components/ui/SongCard'
import { supabase } from '../lib/supabase'
import { BLOG_POSTS } from '../lib/posts'

const OCCASIONS = [
  { id: 'anniversaire', labelKey: 'anniversaire', emoji: '🎂' },
  { id: 'amour', labelKey: 'amour', emoji: '❤️' },
  { id: 'diplome', labelKey: 'diplome', emoji: '🎓' },
  { id: 'mariage', labelKey: 'mariage', emoji: '💍' },
  { id: 'remerciement', labelKey: 'remerciement', emoji: '🙏' },
  { id: 'motivation', labelKey: 'motivation', emoji: '🚀' },
]

const DASH_T = {
  FR: {
    title: "Melofy — Crée ta chanson avec l'IA",
    credit: "Crédit", credits: "Crédits",
    heroTitle1: "Crée ta chanson", heroTitle2: "avec l'IA",
    heroSubtitle: "Transforme tes mots en musique personnalisée en quelques secondes ✨",
    createBtn: "+ Créer une chanson",
    quickIdeas: "Idées rapides", seeAll: "Voir tout",
    recentSongs: "Vos chansons récentes",
    noSongs: "Vous n'avez pas encore généré de chanson.",
    startHere: "Commencer ici →",
    conseilsInspiration: "Conseils & Inspiration",
    lireArticle: "Lire l'article",
    occasions: {
      anniversaire: 'Anniversaire', amour: 'Amour', diplome: 'Diplôme',
      mariage: 'Mariage', remerciement: 'Remerciements', motivation: 'Motivation'
    }
  },
  EN: {
    title: "Melofy — Create your song with AI",
    credit: "Credit", credits: "Credits",
    heroTitle1: "Create your song", heroTitle2: "with AI",
    heroSubtitle: "Turn your words into personalized music in seconds ✨",
    createBtn: "+ Create a song",
    quickIdeas: "Quick ideas", seeAll: "See all",
    recentSongs: "Your recent songs",
    noSongs: "You haven't generated any songs yet.",
    startHere: "Start here →",
    conseilsInspiration: "Tips & Inspiration",
    lireArticle: "Read article",
    occasions: {
      anniversaire: 'Birthday', amour: 'Love', diplome: 'Graduation',
      mariage: 'Wedding', remerciement: 'Thanks', motivation: 'Motivation'
    }
  }
}

export default function Home() {
  const [recentSongs, setRecentSongs] = useState([])
  const [profile, setProfile] = useState(null)
  const [lang, setLang] = useState('FR')
  const [giftActive, setGiftActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData) {
        setProfile(profileData)
        // Check dismissal cycle
        const now = new Date().getTime()
        const creation = new Date(profileData.created_at).getTime()
        const cycleIndex = Math.floor((now - creation) / (7 * 24 * 60 * 60 * 1000))
        const savedCycle = localStorage.getItem('melofy_gift_dismissed_cycle')
        if (savedCycle === cycleIndex.toString()) {
          setDismissed(true)
        }
      }
      const { data } = await supabase.from('songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      if (data) setRecentSongs(data)
    }
    fetchData()
  }, [])

  // Système de cadeau (30 min toutes les 1 semaine)
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

  const t = DASH_T[lang] || DASH_T.FR

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100dvh', background: '#0F172A' }}>
        <Sidebar />

        <main className="flex-1 overflow-y-auto adaptive-px adaptive-py pb-player-safe relative">
          
          {/* Gift Banner */}
          {(giftActive && !dismissed) && (
            <div className="pt-6">
              <div style={{
                background: profile?.has_invited ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #6C63FF, #4F46E5)',
                color: '#fff', padding: '14px', borderRadius: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontWeight: 700, animation: 'pulse 2s infinite', textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative'
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
                  position: 'absolute', top: 8, right: 12, background: 'none', border: 'none',
                  color: '#fff', fontSize: 16, cursor: 'pointer', opacity: 0.6
                }}>✕</button>

                {profile?.has_invited ? (
                  <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🎁</span>
                    <span>{lang === 'FR' ? `CADEAU : -30% SUR TOUT ! Il vous reste ${timeLeft} • En profiter →` : `GIFT: -30% OFF EVERYTHING! ${timeLeft} left • Use it now →`}</span>
                  </Link>
                ) : (
                  <Link href="/invite" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <span>{lang === 'FR' ? `UN CADEAU VOUS ATTEND ! (${timeLeft})` : `A GIFT IS WAITING FOR YOU! (${timeLeft})`}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, opacity: 0.9 }}>
                      {lang === 'FR' 
                        ? 'Invitez un ami pour débloquer -30% sur tous les packs.' 
                        : 'Invite a friend to unlock -30% off all packs.'}
                    </p>
                  </Link>
                )}
                <style dangerouslySetInnerHTML={{ __html: `@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.01); } 100% { transform: scale(1); } }` }} />
              </div>
            </div>
          )}

          {/* Hero */}
          <section className="py-10 md:py-20 relative overflow-hidden text-center">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(ellipse at 30% 50%, rgba(108,99,255,0.15) 0%, rgba(108,99,255,0.05) 40%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 7vw, 32px)', color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
                {t.heroTitle1}<br />
                <span style={{ background: 'linear-gradient(135deg,#6C63FF,#F472B6,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t.heroTitle2}
                </span>
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 32px' }}>
                {t.heroSubtitle}
              </p>
              <Link href="/create" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 50,
                background: 'linear-gradient(135deg,#6C63FF,#a855f7)',
                color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 16,
                transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(108,99,255,0.3)'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(108,99,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,99,255,0.3)' }}>
                {t.createBtn}
              </Link>
            </div>
          </section>

          <div className="pb-10 max-w-[1000px] mx-auto">

            {/* Occasions */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.quickIdeas}</h2>
                <Link href="/create" style={{ fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 600 }}>{t.seeAll}</Link>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {OCCASIONS.map(o => (
                  <Link key={o.id} href={`/create?occasion=${o.id}`} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '20px 10px', borderRadius: 16, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; 
                      e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; 
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; 
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <span style={{ fontSize: 26 }}>{o.emoji}</span>
                    <span style={{ fontSize: 12, color: '#fff', textAlign: 'center', fontWeight: 600 }}>{t.occasions[o.labelKey]}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Récentes */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.recentSongs}</h2>
                <Link href="/songs" style={{ fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 600 }}>{t.seeAll}</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentSongs.length > 0 ? (
                  recentSongs.map(song => (
                    <SongCard key={song.id} song={song} playlist={recentSongs} isSelected={false} onSelect={() => window.location.href = '/songs'} compact={true} />
                  ))
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(108,99,255,0.2)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 16 }}>{t.noSongs}</p>
                    <Link href="/create" style={{ color: '#6C63FF', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>{t.startHere}</Link>
                  </div>
                )}
              </div>
            </section>

            {/* Blog */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.conseilsInspiration}</h2>
                <Link href="/blog" style={{ fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 600 }}>{t.seeAll}</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {BLOG_POSTS.slice(0, 2).map(post => {
                  const pTitle = lang === 'EN' && post.title_en ? post.title_en : post.title
                  const pCategory = lang === 'EN' && post.category_en ? post.category_en : post.category
                  const pDesc = lang === 'EN' && post.description_en ? post.description_en : post.description
                  return (
                    <div key={post.slug} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      transition: 'all 0.3s ease'
                    }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; 
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; 
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                      <div style={{ height: 160, overflow: 'hidden' }}>
                        <img src={post.image} alt={pTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(108,99,255,0.1)', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{pCategory}</span>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '12px 0 8px', fontFamily: 'Syne,sans-serif', lineHeight: 1.4 }}>{pTitle}</h3>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>{pDesc}</p>
                        </div>
                        <Link href={`/blog/${post.slug}`} style={{ display: 'inline-block', marginTop: 16, color: '#6C63FF', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                          {t.lireArticle} →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
            
            {/* Spacer for mobile nav/player */}
            <div className="pb-player-safe h-0" />
          </div>
        </main>
      </div>
    </>
  )
}