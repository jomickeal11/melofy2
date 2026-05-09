import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { translateError } from '../lib/error-translator'

export default function RecoverPage() {
  const router = useRouter()
  const { email: emailQuery } = router.query
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  useEffect(() => {
    if (emailQuery) setEmail(emailQuery)
  }, [emailQuery])

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    const code = otp.join('')
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email || emailQuery,
        token: code,
        type: 'recovery'
      })
      if (error) throw error
      router.push('/reset-password')
    } catch (err) {
      toast.error(lang === 'FR' ? "Code invalide ou expiré." : "Invalid or expired code.")
      setLoading(false)
    }
  }

  const handleChange = (value, index) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus()
    }
  }

  const handlePaste = (e) => {
    const data = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(data)) return
    
    const newOtp = data.split('').concat(new Array(6 - data.length).fill(''))
    setOtp(newOtp)
    
    // Focus last filled or next
    const lastIdx = Math.min(data.length, 5)
    document.getElementById(`otp-${lastIdx}`).focus()
  }

  const inputStyle = {
    width: '100%', borderRadius: 14, padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#e8e8f0', fontSize: 16, outline: 'none', transition: 'all 0.2s', marginBottom: 16
  }

  return (
    <>
      <Head><title>{lang === 'FR' ? 'Vérification • Melofy' : 'Verification • Melofy'}</title></Head>
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
              {lang === 'FR' ? 'Vérification' : 'Verification'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
              {lang === 'FR' ? 'Saisis le code reçu par email.' : 'Enter the code received by email.'}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '36px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleVerifyOtp}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={e => handleChange(e.target.value, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    style={{
                      width: 44, height: 54, borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 20,
                      fontWeight: 700, textAlign: 'center', outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.background = 'rgba(108,99,255,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, #6C63FF, #a855f7)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: 10, boxShadow: '0 8px 24px rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}>
                {loading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : (lang === 'FR' ? 'Vérifier' : 'Verify')}
              </button>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>
                {lang === 'FR' ? 'Retour à la connexion' : 'Back to login'}
              </Link>
            </form>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
    </>
  )
}
