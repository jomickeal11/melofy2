import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import { supabase } from '../../lib/supabase'
import { BLOG_POSTS } from '../../lib/posts'

export default function BlogPostPage({ post }) {
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

  if (!post) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#fff' }}>
        <h2>{lang === 'FR' ? 'Article introuvable' : 'Article not found'}</h2>
        <Link href="/blog" style={{ color: '#6C63FF' }}>{lang === 'FR' ? 'Retour au blog' : 'Back to blog'}</Link>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{post.title} • Melofy</title>
        <meta name="description" content={post.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`${post.title} • Melofy`} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={post.image} />
        <meta property="article:published_time" content={post.date} />
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
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Back button */}
            <div style={{ marginBottom: 32 }}>
              <Link href="/blog" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
                color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20,
                padding: '8px 16px', background: 'rgba(255,255,255,0.02)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                {lang === 'FR' ? 'Retour au blog' : 'Back to blog'}
              </Link>
            </div>

            {/* Meta */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {/* ← badge catégorie : #38bdf8 → #a78bfa, bg aligné sur landing */}
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.5,
                  background: 'rgba(108,99,255,0.12)', padding: '4px 10px', borderRadius: 20
                }}>
                  {lang === 'EN' && post.category_en ? post.category_en : post.category}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                  {lang === 'FR'
                    ? `Mis à jour le ${new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : `Updated on ${new Date(post.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </span>
              </div>

              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 7vw, 36px)', color: '#fff', margin: '0 0 18px 0', lineHeight: 1.2 }}>
                {lang === 'EN' && post.title_en ? post.title_en : post.title}
              </h1>

              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                {lang === 'EN' && post.description_en ? post.description_en : post.description}
              </p>
            </div>

            {/* Cover image */}
            <div style={{
              width: '100%', height: 380, borderRadius: 24,
              background: `url(${post.image}) center/cover no-repeat`,
              border: '1px solid rgba(255,255,255,0.05)', marginBottom: 40
            }} />

            {/* Content */}
            <div
              style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 60 }}
              dangerouslySetInnerHTML={{ __html: lang === 'EN' && post.content_en ? post.content_en : post.content }}
            />

            {/* CTA Banner */}
            <div style={{
              // ← gradient banner aligné sur landing (plus de #38bdf8)
              background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(168,85,247,0.08))',
              border: '1px solid rgba(108,99,255,0.15)', borderRadius: 24, padding: '36px',
              textAlign: 'center', backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>🎵</span>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, color: '#fff', margin: '0 0 6px 0', fontWeight: 800 }}>
                {lang === 'FR' ? 'Créez une chanson Melofy personnalisée' : 'Create a custom Melofy song'}
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                {lang === 'FR'
                  ? "Paroles uniques, style sur-mesure et voix captivante : l'intelligence artificielle au service de vos émotions."
                  : "Unique lyrics, tailored style and captivating voice: artificial intelligence at the service of your emotions."}
              </p>
              <Link href={user ? "/create" : "/signup"} style={{
                display: 'inline-block',
                // ← gradient CTA identique au landing
                background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 24,
                fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(108,99,255,0.25)'
              }}>
                {user
                  ? (lang === 'FR' ? "Composer ma chanson" : "Compose my song")
                  : (lang === 'FR' ? "Essayer gratuitement" : "Try for free")}
              </Link>
            </div>

          </div>
        </main>
      </div>

      <style jsx global>{`
        h2 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(20px, 5vw, 24px);
          color: #fff;
          margin-top: 32px;
          margin-bottom: 12px;
          font-weight: 700;
          line-height: 1.3;
        }
        h3 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(17px, 4vw, 18px);
          color: #fff;
          margin-top: 24px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        p { margin-bottom: 20px; color: rgba(255, 255, 255, 0.7); }
        ul { margin-bottom: 24px; padding-left: 20px; color: rgba(255, 255, 255, 0.7); }
        li { margin-bottom: 8px; }
        strong { color: #fff; }
        @media (max-width: 640px) {
          .mobile-hide-text { font-size: 12px !important; padding: 8px 16px !important; }
        }
      `}</style>
    </>
  )
}

export async function getStaticPaths() {
  const paths = BLOG_POSTS.map(p => ({ params: { slug: p.slug } }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const post = BLOG_POSTS.find(p => p.slug === params.slug) || null
  return { props: { post } }
}