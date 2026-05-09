import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function PaymentConfirmation() {
  const router = useRouter()
  const { session_id } = router.query
  const [cartId, setCartId] = useState(null)
  const [cartIdResolved, setCartIdResolved] = useState(false)
  const [status, setStatus] = useState('loading') // loading | success | error
  const [attempts, setAttempts] = useState(0)
  const [errorDetail, setErrorDetail] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (session_id && session_id !== '{CHECKOUT_SESSION_ID}') {
      console.log('[PaymentConfirmation] cart_id from URL:', session_id)
      setCartId(session_id)
      setCartIdResolved(true)
      return
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('melofy_last_cart_id') : null
    if (saved) {
      console.log('[PaymentConfirmation] cart_id from localStorage:', saved)
      setCartId(saved)
      setCartIdResolved(true)
      return
    }
    // Fallback serveur : on demande au backend le dernier paiement en attente pour ce user
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setCartIdResolved(true)
          return
        }
        const res = await fetch('/api/payments/maketou/find-pending', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()
        if (data?.cart_id) {
          console.log('[PaymentConfirmation] cart_id from server fallback:', data.cart_id)
          setCartId(data.cart_id)
        }
      } catch (e) {
        console.error('[PaymentConfirmation] fallback find-pending failed:', e)
      } finally {
        setCartIdResolved(true)
      }
    })()
  }, [router.isReady, session_id])

  useEffect(() => {
    if (!cartId) {
      if (cartIdResolved && status === 'loading') {
        // Aucun cart_id trouvé : on ne peut rien vérifier
        setErrorDetail('Aucun ID de transaction retrouvé. Si tu as été débité, contacte le support.')
        setStatus('error')
      }
      return
    }

    let cancelled = false

    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`/api/payments/maketou/confirm?session_id=${cartId}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}
        })
        const data = await res.json()
        console.log(`[PaymentConfirmation] confirm response (attempt ${attempts}):`, res.status, data)

        if (cancelled) return

        if (data.success) {
          setStatus('success')
          return
        }

        // Erreurs définitives : on arrête de retry
        if (res.status === 401 || res.status === 403 || res.status === 400) {
          setErrorDetail(data.error || data.message || `Erreur ${res.status}`)
          setStatus('error')
          return
        }

        // Sinon on retry (paiement pas encore confirmé côté Maketou par ex)
        if (attempts < 20) {
          setTimeout(() => { if (!cancelled) setAttempts(prev => prev + 1) }, 3000)
        } else {
          setErrorDetail(data.error || data.message || 'Délai dépassé')
          setStatus('error')
        }
      } catch (err) {
        console.error('[PaymentConfirmation] network error:', err)
        if (cancelled) return
        if (attempts < 20) {
          setTimeout(() => { if (!cancelled) setAttempts(prev => prev + 1) }, 3000)
        } else {
          setErrorDetail(err.message || 'Erreur réseau')
          setStatus('error')
        }
      }
    }

    checkStatus()
    return () => { cancelled = true }
  }, [cartId, cartIdResolved, attempts])

  return (
    <div style={{
      minHeight: '100vh', background: '#0F172A', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20
    }}>
      <Head>
        <title>Confirmation du paiement • Melofy</title>
      </Head>

      <div style={{
        maxWidth: 500, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)',
        padding: '60px 40px', borderRadius: 32, backdropFilter: 'blur(10px)'
      }}>
        
        {status === 'loading' && (
          <>
            <div className="spinner-box" style={{ marginBottom: 32 }}>
              <div style={{
                width: 60, height: 60, border: '4px solid rgba(108,99,255,0.1)',
                borderTop: '4px solid #6C63FF', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto'
              }}></div>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Validation en cours...</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Nous vérifions votre paiement avec Maketou. <br/>
              Cela peut prendre quelques secondes. Ne fermez pas cette page.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 80, height: 80, background: 'rgba(52,211,153,0.1)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px', color: '#34D399'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Paiement réussi !</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 40 }}>
              Félicitations ! Vos crédits ont été ajoutés à votre compte. 
              Vous pouvez maintenant générer vos chansons personnalisées.
            </p>
            <Link href="/dashboard" style={{
              display: 'block', background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
              color: '#fff', padding: '16px 32px', borderRadius: 16, fontWeight: 700,
              textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 8px 24px rgba(108,99,255,0.3)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              Aller au Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 80, height: 80, background: 'rgba(248,113,113,0.1)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px', color: '#F87171'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Oups !</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>
              La validation prend plus de temps que prévu ou une erreur est survenue.
              Ne vous inquiétez pas, si vous avez été débité, vos crédits seront ajoutés prochainement.
            </p>
            {errorDetail && (
              <p style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                color: '#FCA5A5', fontSize: 12, padding: '10px 14px', borderRadius: 12,
                marginBottom: 24, fontFamily: 'monospace', wordBreak: 'break-word'
              }}>
                Détail technique : {errorDetail}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => {
                setStatus('loading')
                setAttempts(0)
              }} style={{
                background: '#6C63FF', color: '#fff', padding: '14px', borderRadius: 12,
                border: 'none', fontWeight: 600, cursor: 'pointer'
              }}>
                Réessayer la vérification
              </button>
              <Link href="/pricing" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none' }}>
                Retour aux tarifs
              </Link>
            </div>
          </>
        )}

      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
