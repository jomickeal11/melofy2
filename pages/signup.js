import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { translateError } from '../lib/error-translator'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  const handleNextStep = (e) => {
    e.preventDefault()
    if (email !== confirmEmail) {
      toast.error(lang === 'FR' ? 'Les adresses email ne correspondent pas' : 'Emails do not match')
      return
    }
    setStep(2)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error(lang === 'FR' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { full_name: name } } 
      })
      if (error) throw error
      toast.success(lang === 'FR' ? 'Compte créé avec succès !' : 'Account created successfully!')
      router.push('/dashboard')
    } catch (err) {
      toast.error(translateError(err.message, lang))
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (err) {
      toast.error(translateError(err.message, lang))
    }
  }

  const getPasswordStrength = (pwd) => {
    let score = 0
    if (!pwd) return 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strength = getPasswordStrength(password)
  const strengthColors = ['#ef4444', '#f59e0b', '#10b981', '#059669']
  const strengthLabels = {
    FR: ['Très faible', 'Faible', 'Moyen', 'Fort'],
    EN: ['Very weak', 'Weak', 'Medium', 'Strong']
  }

  const inputStyle = {
    width: '100%', borderRadius: 14, padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#e8e8f0', fontSize: 16, outline: 'none', transition: 'all 0.2s', marginBottom: 16
  }

  return (
    <>
      <Head><title>{lang === 'FR' ? 'Inscription • Melofy' : 'Sign up • Melofy'}</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>

        <div className="mobile-top-right" style={{ position: 'absolute', top: 24, right: 32, zIndex: 10 }}>
          <button onClick={() => { const n = lang === 'FR' ? 'EN' : 'FR'; setLang(n); localStorage.setItem('melofy_lang', n); window.location.reload() }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '8px 16px', color: '#fff', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 }}>{lang}</span>
          </button>
        </div>

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
              {lang === 'FR' ? 'Créer un compte ✨' : 'Create account ✨'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
              {step === 1 
                ? (lang === 'FR' ? 'Commençons par ton adresse email.' : "Let's start with your email address.")
                : (lang === 'FR' ? 'Choisis un mot de passe sécurisé.' : 'Choose a secure password.')
              }
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '36px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            
            {step === 1 && (
              <div style={{ marginBottom: 24 }}>
                <button onClick={handleGoogleLogin} style={{ 
                  width: '100%', padding: '14px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', 
                  background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: 600, fontSize: 14, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s' 
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  {lang === 'FR' ? "S'inscrire avec Google" : 'Sign up with Google'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>OU</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
            )}

            {/* Step Indicator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: step >= 1 ? '#6C63FF' : 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: step >= 2 ? '#6C63FF' : 'rgba(255,255,255,0.1)' }} />
            </div>

            {step === 1 ? (
              <form onSubmit={handleNextStep}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Prénom ou Pseudo' : 'First name or Username'}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'FR' ? 'Ex: Alex' : 'e.g., Alex'} required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Adresse email' : 'Email address'}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Confirmer l\'adresse email' : 'Confirm email address'}</label>
                  <input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="ton@email.com" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
                </div>

                <button type="submit" disabled={!name || !email || !confirmEmail} style={{ marginTop: 8, width: '100%', padding: '14px', borderRadius: 50, border: 'none', cursor: (!name || !email || !confirmEmail) ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', fontWeight: 600, fontSize: 15, opacity: (!name || !email || !confirmEmail) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(108,99,255,0.25)', transition: 'transform 0.15s, opacity 0.15s' }}>
                  {lang === 'FR' ? 'Suivant' : 'Next'} →
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Mot de passe' : 'Password'}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
                  
                  {/* Password Strength */}
                  {password && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: strengthColors[strength - 1], fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {strengthLabels[lang][strength - 1]}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{lang === 'FR' ? 'Confirmer le mot de passe' : 'Confirm password'}</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                    {lang === 'FR' ? 'Retour' : 'Back'}
                  </button>
                  <button type="submit" disabled={loading || !password || !confirmPassword} style={{ flex: 2, padding: '14px', borderRadius: 50, border: 'none', cursor: (loading || !password || !confirmPassword) ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#6C63FF,#a855f7)', color: '#fff', fontWeight: 600, fontSize: 15, opacity: (loading || !password || !confirmPassword) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(108,99,255,0.25)', transition: 'transform 0.15s, opacity 0.15s' }}>
                    {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /></> : (lang === 'FR' ? 'S\'inscrire' : 'Sign up')}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              {lang === 'FR' ? 'Déjà un compte ?' : 'Already have an account?'}{' '}
              <Link href="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>{lang === 'FR' ? 'Se connecter' : 'Sign in'}</Link>
            </p>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 640px) {
          .mobile-top-right { top: 12px !important; right: 12px !important; }
          .auth-logo { margin-top: 32px !important; }
        }
      ` }} />
    </>
  )
}