import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'

export default function TermsPage() {
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

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? "Conditions d'utilisation • Melofy" : 'Terms of Use • Melofy'}</title>
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        {user ? (
          <Sidebar user={user} />
        ) : (
          <header style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            padding: '20px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, 
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', 
            borderBottom: '1px solid rgba(255,255,255,0.06)' 
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ color: '#6C63FF', fontSize: 24 }}>♪</span>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: '#fff' }}>melofy</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Link href="/signup" style={{ 
                background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', 
                textDecoration: 'none', fontSize: 13, fontWeight: 600, 
                padding: '10px 24px', borderRadius: 50, boxShadow: '0 4px 14px rgba(108,99,255,0.25)' 
              }}>
                {lang === 'FR' ? 'Commencer gratuitement' : 'Start for free'}
              </Link>
            </div>
          </header>
        )}

        <main style={{ 
          flex: 1, 
          padding: user ? '40px 32px 80px' : '100px 24px 80px', 
          overflowY: 'auto' 
        }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>

            {/* Page Title Header */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)',
                color: '#22D3EE', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                width: 'fit-content', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
              }}>
                {lang === 'FR' ? 'Conditions' : 'Terms'}
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#fff', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                {lang === 'FR' ? "Conditions d'Utilisation" : 'Terms of Use'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                {lang === 'FR' ? 'Dernière mise à jour : 4 mai 2026' : 'Last updated: May 4, 2026'}
              </p>
            </div>

            {/* Content Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '20px 24px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 12 }}>
                  {lang === 'FR' ? '1. Acceptation des conditions' : '1. Acceptance of terms'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                  {lang === 'FR'
                    ? 'En utilisant les services de Melofy, vous acceptez d\'être lié par les présentes Conditions d\'Utilisation. Si vous n\'êtes pas d\'accord, veuillez cesser d\'utiliser nos services.'
                    : 'By using the services of Melofy, you agree to be bound by these Terms of Use. If you do not agree, please stop using our services.'}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '2. Utilisation du service & Propriété' : '2. Use of the service & Ownership'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                  {lang === 'FR'
                    ? 'Vous êtes entièrement propriétaire des chansons que vous générez avec Melofy. Cependant, vous êtes seul responsable du texte et du contenu fourni lors de l\'envoi des prompts. Vous vous engagez à ne pas envoyer de contenus haineux, diffamatoires ou enfreignant des droits de propriété intellectuelle existants.'
                    : 'You fully own the songs you generate with Melofy. However, you are solely responsible for the text and content provided when sending prompts. You agree not to submit hateful, defamatory content, or content that violates existing intellectual property rights.'}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '3. Achats de crédits' : '3. Credit purchases'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                  {lang === 'FR'
                    ? 'Tous les achats de crédits sont définitifs et non remboursables, sauf en cas de dysfonctionnement technique avéré de la plateforme ou d\'erreur système.'
                    : 'All purchases of credits are final and non-refundable, except in the event of a proven technical malfunction of the platform or system error.'}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '4. Modification des conditions' : '4. Modification of terms'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                  {lang === 'FR'
                    ? 'Nous nous réservons le droit de modifier ces conditions à tout moment. Toute mise à jour sera notifiée par la modification de la date de "Dernière mise à jour".'
                    : 'We reserve the right to modify these terms at any time. Any update will be notified by modifying the "Last updated" date.'}
                </p>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}
