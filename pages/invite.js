import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function InvitePage() {
  const [user, setUser] = useState(null)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      } else {
        window.location.href = '/login'
      }
    }
    load()
  }, [])

  const baseUrl = 'https://melofy-inky.vercel.app'
  const inviteLink = user ? `${baseUrl}/signup?ref=${user.id}` : ''

  const markAsInvited = async () => {
    if (!user) return
    try {
      await supabase.from('profiles').update({ has_invited: true }).eq('id', user.id)
    } catch (err) {
      console.error('Error updating invite status:', err)
    }
  }

  const handleCopy = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    markAsInvited()
    toast.success(lang === 'FR' ? "Lien copié !" : "Link copied!")
    setTimeout(() => setCopied(false), 3000)
  }

  const shareText = lang === 'FR'
    ? "Hey ! Rejoins Melofy pour créer des chansons personnalisées avec l'IA en quelques secondes. C'est magique !"
    : "Hey! Join Melofy to create personalized songs with AI in seconds. It's magical!"

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + inviteLink)}`

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? 'Inviter des amis • Melofy' : 'Invite Friends • Melofy'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
        <Sidebar user={user} />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-10 pb-player-safe">
          <div className="max-w-[800px] mx-auto">

            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 6vw, 28px)', color: '#fff', margin: '0 0 6px 0', lineHeight: 1.2 }}>
                {lang === 'FR' ? 'Inviter des amis' : 'Invite Friends'}
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
                {lang === 'FR' ? 'Partagez Melofy avec vos proches et faites découvrir la magie de la génération musicale !' : 'Share Melofy with your loved ones and introduce them to the magic of AI music generation!'}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 md:p-10 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.2)]">

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                }}>
                  🎉
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#fff', fontWeight: 700 }}>
                    {lang === 'FR' ? "Votre lien d'invitation" : 'Your Invitation Link'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                    {lang === 'FR' ? 'Copiez et partagez ce lien avec vos amis.' : 'Copy and share this link with your friends.'}
                  </p>
                </div>
              </div>

              {/* Link Input + Action */}
              <div className="flex flex-col sm:flex-row gap-3 bg-black/20 border border-white/[0.08] p-3 rounded-2xl sm:items-center mb-6">
                <input
                  type="text"
                  readOnly
                  value={inviteLink || (lang === 'FR' ? 'Génération du lien...' : 'Generating link...')}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none',
                    fontFamily: 'monospace', letterSpacing: -0.2
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? '#10b981' : 'rgba(255,255,255,0.05)',
                    color: '#fff', border: `1px solid ${copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {copied ? (lang === 'FR' ? 'Copié !' : 'Copied!') : (lang === 'FR' ? 'Copier' : 'Copy')}
                </button>
              </div>

              {/* Alternative social share */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {lang === 'FR' ? 'Ou partagez directement sur les réseaux sociaux' : 'Or share directly on social media'}
                </p>

                <a
                  href={whatsappUrl}
                  onClick={markAsInvited}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: '#25D366', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 24px',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <span>{lang === 'FR' ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}</span>
                </a>
              </div>

            </div>

          </div>
        </main>
      </div>
    </>
  )
}
