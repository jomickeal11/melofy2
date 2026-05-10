import Head from 'next/head'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getPublicSong, getDiscoverySongs } from '../../lib/song-service'
import { usePlayer } from '../../context/PlayerContext'

export async function getServerSideProps(context) {
  const { id } = context.params

  try {
    // On appelle la base de données DIRECTEMENT
    const song = await getPublicSong(id)

    if (!song) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      // Pour debug : on essaye de voir si la chanson existe sans les filtres
      const { data: rawSong, error: dbError } = await supabaseAdmin.from('songs').select('status, is_public').eq('id', id).single()
      
      let debugError = 'Chanson introuvable ou privée'
      if (dbError) {
        debugError = `Erreur base de données : ${dbError.message}`
      } else if (rawSong) {
        if (rawSong.status !== 'ready') debugError = `Chanson en préparation (Status: ${rawSong.status})`
        else if (rawSong.is_public === false) debugError = 'Cette chanson est marquée comme privée'
      }

      return {
        props: {
          error: debugError,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || ''
        }
      }
    }

    // On récupère aussi 2 chansons aléatoires pour la découverte (total 3 chansons)
    const recommendations = await getDiscoverySongs(id, 2)

    return {
      props: {
        song,
        recommendations,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || ''
      }
    }
  } catch (err) {
    console.error('SSR Error:', err)
    return {
      props: {
        error: 'Erreur de chargement',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || ''
      }
    }
  }
}

export default function SongSharePage({ song, recommendations, appUrl, error }) {
  const { currentSong, isPlaying, progress, duration, currentTime, playSong, seek, playNext, playPrevious, playlist, currentIndex } = usePlayer()
  const [hasMounted, setHasMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [volume, setVolume] = useState(1)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    setHasMounted(true)
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)

    // Initialiser la playlist si elle est vide ou si on arrive sur une nouvelle chanson de partage
    if (song && (!playlist.length || !playlist.find(s => s.id === song.id))) {
      const fullPlaylist = [song, ...(recommendations || [])]
      // On ne joue pas automatiquement pour ne pas surprendre l'utilisateur, 
      // mais on prépare la liste
      const { playSong: silentInit } = usePlayer.getState ? { playSong: () => {} } : { playSong: null } 
      // En fait on va juste utiliser playSong(song, fullPlaylist) au premier clic
    }
  }, [song])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 20 }}>😕</div>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Oups ! Cette chanson est introuvable</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>L'erreur signalée est : {error}</p>
          <Link href="/" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>Retour à l'accueil</Link>
        </div>
      </div>
    )
  }

  if (!song) return null

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    // Le volume global n'est pas encore dans le contexte, mais on pourra l'ajouter plus tard
  }

  let imageUrl = song?.image_url || '';
  let rawLyrics = song?.lyrics || '';
  if (typeof rawLyrics === 'string' && rawLyrics.startsWith('[IMAGE:')) {
    const closingIdx = rawLyrics.indexOf(']');
    if (closingIdx !== -1) {
      if (!imageUrl) imageUrl = rawLyrics.substring(7, closingIdx);
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleCopyLink = () => {
    const fullUrl = `${appUrl}/s/${song.id}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const fullUrl = `${appUrl}/s/${song.id}`
    const text = `Écoute cette chanson que j'ai créée avec Melofy : ${fullUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      <Head>
        <title>{song.title || 'Chanson'} • Melofy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={`Écoute "${song.title || 'cette chanson'}", créée avec Melofy.`} />
        <meta property="og:title" content={`${song.title || 'Chanson'} • Melofy`} />
        <meta property="og:description" content={`Écoute "${song.title || 'cette chanson'}". Style : ${song.style || 'AI generation'}. Crée la tienne dès maintenant !`} />
        <meta property="og:type" content="music.song" />
        <meta property="og:url" content={`${appUrl}/s/${song.id}`} />
        <meta property="og:image" content={imageUrl || 'https://melofy.com/melofy-preview.png'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${song.title || 'Chanson'} • Melofy`} />
        <meta name="twitter:description" content={`Écoute "${song.title || 'cette chanson'}". Style : ${song.style || 'AI generation'}.`} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      </Head>
      
      <div suppressHydrationWarning style={{
        minHeight: '100vh', background: '#0d0d14', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'relative', fontFamily: 'Inter, sans-serif', overflowX: 'hidden'
      }}>
        {/* CSS statique injecté une seule fois */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 20px rgba(108,99,255,0.2); transform: scale(1); }
            50% { box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 40px rgba(108,99,255,0.5); transform: scale(1.015); }
          }
          @keyframes rotatingCover {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        ` }} />

        {/* Header */}
        <header style={{
          padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.03)',
          background: 'rgba(13,13,20,0.7)', backdropFilter: 'blur(12px)'
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ color: '#6C63FF', fontSize: 24 }}>♪</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>melofy</span>
          </Link>
          <Link href="/signup" style={{
            fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 20px', borderRadius: 20, transition: 'background 0.2s'
          }}>
            Créer ma chanson
          </Link>
        </header>

        {/* Player UI - Toujours rendu mais logiquement inactif si pas monté */}
        <div style={{ flex: 1, display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', padding: '40px 32px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
            
            {/* Cover Art */}
            <div style={{
              width: '100%', maxWidth: 300, aspectRatio: '1/1', borderRadius: 24,
              background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1f1f2e, #111116)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)', overflow: 'hidden', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: playing ? 'pulseGlow 2.5s ease-in-out infinite' : 'none'
            }}>
              {!imageUrl && <div style={{ fontSize: 44, animation: playing ? 'rotatingCover 4s linear infinite' : 'none' }}>🎵</div>}
            </div>

            {/* Info Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {song.title ? song.title[0].toUpperCase() : 'M'}
              </div>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>Melofy</span>
            </div>

            <div style={{ textAlign: 'center', maxWidth: 600 }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                {song.title || 'Ma Chanson'}
              </h1>
              
              {/* Style below title - subtle version */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ 
                  fontSize: 9, 
                  color: 'rgba(255,255,255,0.3)', 
                  fontWeight: 500, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em'
                }}>
                  {song.style || 'Acoustique'}
                </span>
              </div>

              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
                Une création originale de Melofy basée sur vos idées.
              </p>
            </div>

            {/* Controls */}
            {hasMounted && (
              <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Scrubber */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</span>
                  <div onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percent = (x / rect.width) * 100
                    seek(percent)
                  }} style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#6C63FF', borderRadius: 2, width: `${progress}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatTime(duration)}</span>
                </div>

                {/* Play/Pause & Navigation & Volume */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    {/* Previous Button */}
                    <button 
                      onClick={playPrevious}
                      disabled={!playlist || currentIndex <= 0}
                      style={{ 
                        width: 48, height: 48, borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: (playlist && currentIndex > 0) ? '#fff' : 'rgba(255,255,255,0.2)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: (playlist && currentIndex > 0) ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>

                    {/* Main Play/Pause */}
                    <button onClick={() => playSong(song, [song, ...(recommendations || [])])} style={{ 
                      width: 80, height: 80, borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #6C63FF, #a855f7)', 
                      border: 'none', color: '#fff', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', transition: 'transform 0.15s',
                      boxShadow: '0 10px 30px rgba(108, 99, 255, 0.3)'
                    }}>
                      {(isPlaying && currentSong?.id === song.id) ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4 }}><polygon points="5,3 19,12 5,21" /></svg>
                      )}
                    </button>

                    {/* Next Button */}
                    <button 
                      onClick={playNext}
                      disabled={!playlist || currentIndex >= playlist.length - 1}
                      style={{ 
                        width: 48, height: 48, borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: (playlist && currentIndex < playlist.length - 1) ? '#fff' : 'rgba(255,255,255,0.2)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: (playlist && currentIndex < playlist.length - 1) ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 20 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} style={{ WebkitAppearance: 'none', width: 100, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, outline: 'none' }} />
                  </div>
                </div>

                {/* Actions - Three small circular buttons on one line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 12 }}>
                  
                  {/* Download Button */}
                  <a 
                    href={song.audio_url}
                    download={`${song.title || 'Chanson'}.mp3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      width: 50, height: 50, borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    title={lang === 'FR' ? 'Télécharger' : 'Download'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </a>

                  {/* Share Button (using WhatsApp icon as requested) */}
                  <button 
                    onClick={async () => {
                      const shareUrl = window.location.href;
                      const fileName = `${song.title || 'Chanson'}.mp3`;
                      const { toast } = await import('react-hot-toast');
                      
                      if (navigator.share) {
                        toast.loading(lang === 'FR' ? 'Préparation...' : 'Preparing...', { id: 'share-toast' });
                        try {
                          const response = await fetch(song.audio_url);
                          const blob = await response.blob();
                          const file = new File([blob], fileName, { type: 'audio/mpeg' });
                          await navigator.share({ files: [file], title: song.title || 'Melofy', url: shareUrl });
                          toast.success(lang === 'FR' ? 'Prêt !' : 'Ready!', { id: 'share-toast' });
                        } catch (err) {
                          await navigator.share({ title: song.title || 'Melofy', url: shareUrl });
                          toast.dismiss('share-toast');
                        }
                      } else {
                        shareWhatsApp();
                      }
                    }}
                    style={{ 
                      width: 60, height: 60, borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #6C63FF, #a855f7)', 
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', border: 'none', boxShadow: '0 10px 20px rgba(108, 99, 255, 0.2)',
                      transition: 'all 0.2s'
                    }}
                    title={lang === 'FR' ? 'Partager' : 'Share'}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.742.95 3.71 1.453 5.71 1.457h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  </button>

                  {/* Copy Link Button */}
                  <button 
                    onClick={handleCopyLink}
                    style={{ 
                      width: 50, height: 50, borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      color: copied ? '#34D399' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    title={lang === 'FR' ? 'Copier le lien' : 'Copy link'}
                  >
                    {copied ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Accent */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(108,99,255,0.05) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />
      </div>
    </>
  )
}
