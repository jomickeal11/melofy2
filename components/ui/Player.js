import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { usePlayer } from '../../context/PlayerContext'

export default function Player() {
  const { currentSong, isPlaying, progress, togglePlay, seek, stopPlayer } = usePlayer()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !currentSong) return null

  const formatTime = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Détecter si on est sur une page qui affiche la barre de navigation mobile
  const isMainPage = ['/dashboard', '/create', '/songs', '/payments', '/profile', '/pricing'].includes(router.pathname)

  return (
    <div className={`player-container ${isMainPage ? 'has-mobile-nav' : ''}`} style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '10px 20px', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
      transition: 'bottom 0.3s ease'
    }}>
      {/* Song Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: currentSong.image_url ? `url(${currentSong.image_url}) center/cover` : 'linear-gradient(135deg, #6C63FF, #a855f7)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.title || 'Melofy Track'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.style || 'AI Generated'}
          </div>
        </div>
      </div>

      {/* Controls & Progress */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 10px' }}>
        <button onClick={togglePlay} style={{
          width: 34, height: 34, borderRadius: '50%', background: '#fff',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'transform 0.15s'
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        <div style={{ width: '100%', maxWidth: 300, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, height: 3, background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, position: 'relative', cursor: 'pointer'
          }} onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percent = (x / rect.width) * 100
            seek(percent)
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${progress}%`, background: '#6C63FF', borderRadius: 2
            }} />
          </div>
        </div>
      </div>

      {/* Close button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', order: 3 }}>
        <button onClick={stopPlayer} style={{
          background: 'rgba(255,255,255,0.05)', border: 'none',
          width: 28, height: 28, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .player-container.has-mobile-nav {
            bottom: calc(76px + env(safe-area-inset-bottom)) !important;
            border-top: 1px solid rgba(108, 99, 255, 0.2);
          }
          .player-container {
            padding: 8px 16px !important;
          }
        }
      ` }} />
    </div>
  )
}
