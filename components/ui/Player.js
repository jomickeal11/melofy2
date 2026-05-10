import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { usePlayer } from '../../context/PlayerContext'

export default function Player() {
  const { currentSong, isPlaying, progress, togglePlay, seek, stopPlayer, playNext, playlist } = usePlayer()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !currentSong) return null

  // Liste STRICTE des pages qui affichent la barre de navigation mobile
  const navPages = ['/dashboard', '/create', '/songs', '/payments', '/profile']
  const isMainPage = navPages.includes(router.pathname)

  // Si on n'est pas sur une page de l'application principale (avec BottomNav),
  // on masque l'interface visuelle du lecteur.
  if (!isMainPage) return null

  // Vérifier s'il y a une chanson suivante
  const hasNext = playlist && playlist.length > 0 && playlist.findIndex(s => s.id === currentSong.id) < playlist.length - 1

  return (
    <div className={`player-container ${isMainPage ? 'has-mobile-nav' : ''}`} style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '8px 16px 12px 16px', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
      transition: 'bottom 0.3s ease',
      overflow: 'hidden'
    }}>
      {/* Song Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: currentSong.image_url ? `url(${currentSong.image_url}) center/cover` : 'linear-gradient(135deg, #6C63FF, #a855f7)',
          flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.title || 'Melofy Track'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.style || 'AI Generated'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={togglePlay} style={{
          width: 38, height: 38, borderRadius: '50%', background: '#fff',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(108, 99, 255, 0.2)'
        }}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        {hasNext && (
          <button onClick={playNext} style={{
            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        )}

        <button onClick={stopPlayer} style={{
          background: 'transparent', border: 'none',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Progress Bar at the very BOTTOM of the player */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,255,255,0.05)', cursor: 'pointer'
      }} onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percent = (x / rect.width) * 100
        seek(percent)
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #6C63FF, #22D3EE)',
          transition: 'width 0.1s linear'
        }} />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .player-container.has-mobile-nav {
            bottom: calc(85px + env(safe-area-inset-bottom)) !important;
            margin: 0 10px 10px 10px;
            border-radius: 16px;
            padding: 8px 12px 12px 12px !important;
          }
        }
      ` }} />
    </div>
  )
}
