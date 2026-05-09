import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'

export default function SupportPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [lang, setLang] = useState('FR')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      }
    }
    load()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !message) {
      setStatus(lang === 'FR' ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.')
      return
    }
    setStatus(lang === 'FR' ? 'Merci pour votre message ! Notre équipe vous répondra dans les plus brefs délais.' : 'Thank you for your message! Our team will respond as soon as possible.')
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? 'Aide & Support • Melofy' : 'Help & Support • Melofy'}</title>
      </Head>
      <div style={{
        minHeight: '100vh', background: '#0F172A', color: '#fff',
        display: 'flex', fontFamily: 'Inter, sans-serif'
      }}>
        {user ? (
          <Sidebar user={user} profile={profile} />
        ) : (
          <header style={{
            padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)'
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ color: '#6C63FF', fontSize: 24 }}>♪</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>melofy</span>
            </Link>
          </header>
        )}

        <main style={{ 
          flex: 1, 
          padding: user ? '40px 32px 80px' : '100px 24px 80px',
          maxWidth: 1060, margin: user ? '0 auto' : '0 auto', 
          boxSizing: 'border-box', width: '100%',
          overflowY: 'auto'
        }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: '#fff', marginBottom: 12 }}>
            {lang === 'FR' ? 'Aide & Support' : 'Help & Support'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 40 }}>
            {lang === 'FR' ? "Vous avez une question ou besoin d'assistance ? Contactez-nous !" : 'Do you have a question or need assistance? Contact us!'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
            {/* Formulaire */}
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 16 }}>
                {lang === 'FR' ? 'Envoyez-nous un message' : 'Send us a message'}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                    {lang === 'FR' ? 'Votre nom' : 'Your name'}
                  </label>
                  <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="John Doe" style={{
                    width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none'
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                    {lang === 'FR' ? 'Votre email' : 'Your email'}
                  </label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="john@example.com" style={{
                    width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none'
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder={lang === 'FR' ? 'Comment pouvons-nous vous aider ?' : 'How can we help you?'} style={{
                    width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical'
                  }} />
                </div>
                <button type="submit" style={{
                  padding: '13px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg,#6C63FF,#a855f7)',
                  color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', marginTop: 8
                }}>
                  {lang === 'FR' ? 'Envoyer' : 'Send'}
                </button>
                {status && (
                  <p style={{ fontSize: 13, color: (status.startsWith('Veuillez') || status.startsWith('Please')) ? '#f87171' : '#10b981', margin: 0 }}>{status}</p>
                )}
              </form>
            </div>

            {/* FAQ rapide */}
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 16 }}>
                {lang === 'FR' ? 'Questions fréquentes (FAQ)' : 'Frequently Asked Questions (FAQ)'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>
                    {lang === 'FR' ? 'Comment utiliser mes crédits ?' : 'How to use my credits?'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                    {lang === 'FR'
                      ? 'Chaque création de chanson consomme 1 crédit de votre compte. Vous pouvez générer une chanson en utilisant le formulaire de création.'
                      : 'Each song creation consumes 1 credit from your account. You can generate a song using the creation form.'}
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>
                    {lang === 'FR' ? 'Puis-je réutiliser une chanson ?' : 'Can I reuse a song?'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                    {lang === 'FR'
                      ? 'Oui, vous êtes entièrement propriétaire des chansons créées et pouvez les écouter, les partager et les télécharger autant de fois que vous le souhaitez.'
                      : 'Yes, you fully own the songs created and can listen, share, and download them as many times as you wish.'}
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>
                    {lang === 'FR' ? 'Un problème technique ?' : 'A technical problem?'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                    {lang === 'FR'
                      ? 'Utilisez le formulaire ci-contre pour nous faire part de toute erreur. Nous ferons de notre mieux pour la résoudre rapidement.'
                      : 'Use the form on the left to let us know about any error. We will do our best to resolve it quickly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
