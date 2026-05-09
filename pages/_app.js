import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import { PlayerProvider } from '../context/PlayerContext'
import Player from '../components/ui/Player'
import { supabase } from '../lib/supabase'
import { GenerationProvider } from '../context/GenerationContext'
import GenerationIndicator from '../components/ui/GenerationIndicator'

// Liste des pages qui nécessitent une connexion
const PROTECTED_ROUTES = ['/dashboard', '/songs', '/create', '/profile', '/settings', '/payment-confirmation']

export default function App({ Component, pageProps }) {
  const [showSplash, setShowSplash] = useState(true)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Désactiver le splash screen pour les pages de partage publiques
    if (router.pathname.startsWith('/s/')) {
      setShowSplash(false)
      setAuthLoading(false)
      return
    }

    // 1. Vérification initiale de la session
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setAuthLoading(false)
      
      // Cache le splash screen après un délai minimal pour le branding
      setTimeout(() => setShowSplash(false), 2000)
    }
    
    checkUser()

    // 2. Écouter les changements d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 3. Logique de redirection
  useEffect(() => {
    if (!authLoading && !showSplash) {
      const isProtectedRoute = PROTECTED_ROUTES.includes(router.pathname)
      if (isProtectedRoute && !user) {
        router.push('/')
      }
    }
  }, [user, authLoading, showSplash, router.pathname])

  return (
    <GenerationProvider>
      <PlayerProvider>
      <Head>
        <title>Melofy — IA Musicale</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Melofy" />
        <link rel="apple-touch-icon" href="/logo-square.png" />
      </Head>

      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: '#1E293B',
          color: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }} />
      <Component {...pageProps} />
      {router.pathname !== '/create' && router.pathname !== '/' && <Player />}
      <GenerationIndicator />
    </PlayerProvider>
    </GenerationProvider>
  )
}
