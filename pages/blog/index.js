import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import { supabase } from '../../lib/supabase'
import { BLOG_POSTS } from '../../lib/posts'

export default function BlogIndexPage() {
  const [user, setUser] = useState(null)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }
    load()
  }, [])

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? 'Blog & Conseils musicaux • Melofy' : 'Blog & Music Tips • Melofy'}</title>
        <meta name="description" content="Découvrez nos articles, conseils et astuces pour créer les meilleures chansons personnalisées avec l'intelligence artificielle de Melofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={lang === 'FR' ? 'Blog & Conseils musicaux • Melofy' : 'Blog & Music Tips • Melofy'} />
        <meta property="og:description" content="Découvrez nos articles, conseils et astuces pour créer les meilleures chansons personnalisées." />
        <meta property="og:type" content="website" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        {user ? (
          <Sidebar user={user} />
        ) : (
          <header style={{ 
            padding: '16px 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, 
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', 
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ color: '#6C63FF', fontSize: 24 }}>♪</span>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: '#fff' }}>melofy</span>
            </Link>
            <Link href="/signup" className="mobile-hide-text" style={{ 
              background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', 
              textDecoration: 'none', fontSize: 13, fontWeight: 700, 
              padding: '10px 20px', borderRadius: 50, boxShadow: '0 4px 14px rgba(108,99,255,0.25)' 
            }}>
              {lang === 'FR' ? 'Commencer' : 'Start'}
            </Link>
          </header>
        )}

        <main style={{ 
          flex: 1, 
          padding: user ? '40px 32px 80px' : '100px 24px 80px', 
          overflowY: 'auto' 
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: 48 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#6C63FF', textTransform: 'uppercase', letterSpacing: 1.5,
                background: 'rgba(108,99,255,0.08)', padding: '4px 12px', borderRadius: 20
              }}>
                {lang === 'FR' ? 'Blog & Conseils' : 'Blog & Tips'}
              </span>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 7vw, 36px)', color: '#fff', margin: '14px 0 12px 0', lineHeight: 1.2 }}>
                {lang === 'FR' ? 'Guide de la génération musicale par IA' : 'AI Music Generation Guide'}
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                {lang === 'FR'
                  ? 'Apprenez à composer des morceaux uniques et touchants pour toutes vos occasions spéciales.'
                  : 'Learn to compose unique and touching tracks for all your special occasions.'}
              </p>
            </div>

            {/* Posts grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28, marginBottom: 60 }}>
              {BLOG_POSTS.map((post) => {
                const pTitle = lang === 'EN' && post.title_en ? post.title_en : post.title
                const pCategory = lang === 'EN' && post.category_en ? post.category_en : post.category
                const pDesc = lang === 'EN' && post.description_en ? post.description_en : post.description
                return (
                  <article key={post.slug} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

                    <div style={{ height: 180, background: `url(${post.image}) center/cover no-repeat`, width: '100%' }} />

                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        {/* ← catégorie : #38bdf8 → #a78bfa */}
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {pCategory}
                        </span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{post.readingTime}</span>
                      </div>

                      <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, color: '#fff', margin: '0 0 10px 0', lineHeight: 1.4, fontWeight: 700 }}>
                        <Link href={`/blog/${post.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>{pTitle}</Link>
                      </h2>

                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px 0', flex: 1, lineHeight: 1.6 }}>
                        {pDesc}
                      </p>

                      <div style={{ marginTop: 'auto' }}>
                        <Link href={`/blog/${post.slug}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 13, color: '#6C63FF', fontWeight: 600, textDecoration: 'none'
                        }}>
                          {lang === 'FR' ? "Lire l'article" : "Read article"}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* CTA Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(168,85,247,0.1))',
              border: '1px solid rgba(108,99,255,0.2)', borderRadius: 24, padding: '36px',
              textAlign: 'center', backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, color: '#fff', margin: '0 0 8px 0', fontWeight: 800 }}>
                {lang === 'FR' ? 'Prêt à créer votre propre chanson ?' : 'Ready to create your own song?'}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px 0' }}>
                {lang === 'FR'
                  ? "Rejoignez des milliers d'utilisateurs et offrez un cadeau d'exception."
                  : "Join thousands of users and offer an exceptional gift."}
              </p>
              <Link href={user ? "/create" : "/signup"} style={{
                display: 'inline-block',
                // ← gradient CTA aligné sur landing
                background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 24,
                fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(108,99,255,0.25)'
              }}>
                {user
                  ? (lang === 'FR' ? 'Composer ma chanson' : 'Compose my song')
                  : (lang === 'FR' ? 'Commencer gratuitement' : 'Start for free')}
              </Link>
            </div>

          </div>
        </main>
      </div>
      <style jsx global>{`
        @media (max-width: 640px) {
          .mobile-hide-text { font-size: 12px !important; padding: 8px 16px !important; }
        }
      `}</style>
    </>
  )
}