import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'

export default function PrivacyPage() {
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
        <title>{lang === 'FR' ? 'Politique de confidentialité • Melofy' : 'Privacy Policy • Melofy'}</title>
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
                {lang === 'FR' ? 'Confidentialité' : 'Privacy'}
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: '#fff', margin: '0 0 10px 0' }}>
                {lang === 'FR' ? 'Politique de Confidentialité' : 'Privacy Policy'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                {lang === 'FR' ? 'Dernière mise à jour : 4 mai 2026' : 'Last updated: May 4, 2026'}
              </p>
            </div>

            {/* Content Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '1. Collecte des données personnelles' : '1. Collection of personal data'}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  {lang === 'FR'
                    ? 'Nous collectons les informations que vous nous fournissez lors de votre inscription, telles que votre nom d\'utilisateur et votre adresse e-mail. Nous conservons également les chansons créées et les transactions liées à votre compte pour assurer le bon fonctionnement de Melofy.'
                    : 'We collect information that you provide to us upon registration, such as your username and email address. We also store generated songs and account-related transactions to ensure the proper functioning of Melofy.'}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '2. Utilisation de vos données' : '2. Use of your data'}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  {lang === 'FR' ? 'Vos données sont uniquement utilisées pour :' : 'Your data is only used to:'}
                </p>
                <ul style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginTop: 10, paddingLeft: 20 }}>
                  <li>{lang === 'FR' ? 'Gérer votre compte et vos crédits de création' : 'Manage your account and creation credits'}</li>
                  <li>{lang === 'FR' ? 'Traiter vos demandes d\'assistance' : 'Process your support requests'}</li>
                  <li>{lang === 'FR' ? 'Améliorer l\'expérience utilisateur et les fonctionnalités de Melofy' : 'Improve user experience and Melofy features'}</li>
                </ul>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '3. Protection des données' : '3. Data Protection'}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  {lang === 'FR'
                    ? 'Nous mettons en œuvre des mesures de sécurité pour protéger vos données contre tout accès non autorisé. Vos mots de passe et données personnelles sensibles sont stockés de manière chiffrée.'
                    : 'We implement security measures to protect your data against unauthorized access. Your passwords and sensitive personal data are stored in encrypted format.'}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: 18, padding: '28px 32px'
              }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 14 }}>
                  {lang === 'FR' ? '4. Vos droits' : '4. Your Rights'}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  {lang === 'FR'
                    ? 'Vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, vous pouvez nous contacter via notre page de Support ou supprimer votre compte directement depuis les paramètres de votre profil.'
                    : 'You have a right to access, rectify, and delete your personal data. To exercise these rights, you can contact us via our Support page or delete your account directly from your profile settings.'}
                </p>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}
