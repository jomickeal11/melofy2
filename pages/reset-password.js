import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { translateError } from '../lib/error-translator'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error(lang === 'FR' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      toast.success(lang === 'FR' ? 'Mot de passe mis à jour !' : 'Password updated!')
      router.push('/login')
    } catch (err) {
      toast.error(translateError(err.message, lang))
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', borderRadius: 14, padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#e8e8f0', fontSize: 16, outline: 'none', transition: 'all 0.2s', marginBottom: 16
  }

  return (
    <>
      <Head><title>{lang === 'FR' ? 'Nouveau mot de passe • Melofy' : 'New Password • Melofy'}</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        
        {/* Blobs */}
        <div style={{ position: 'absolute', width: 300, height: 300, top: '15%', left: '10%', background: 'linear-gradient(135deg,#6C63FF,#F472B6,#a855f7)', opacity: 0.08, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 350, height: 350, bottom: '15%', right: '10%', background: 'linear-gradient(135deg,#6C63FF,#F472B6,#a855f7)', opacity: 0.08, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Link href="/" className="auth-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#6C63FF', fontSize: 24 }}>♪</span>
              </div>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28, color: '#fff' }}>melofy</span>
            </Link>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 6vw, 26px)', color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>
              {lang === 'FR' ? 'Nouveau mot de passe' : 'New password'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
              {lang === 'FR' ? 'Choisis un nouveau mot de passe sécurisé.' : 'Choose a new secure password.'}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '36px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleReset}>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Nouveau mot de passe' : 'New password'}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Confirmer' : 'Confirm'}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, #6C63FF, #a855f7)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: 10, boxShadow: '0 8px 24px rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}>
                {loading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : (lang === 'FR' ? 'Mettre à jour' : 'Update password')}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
    </>
  )
}
