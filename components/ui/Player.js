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
      {/* Progress Bar at the very top of the player */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
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
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)'
        }} />
      </div>

      {/* Song Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, paddingRight: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 6,
          background: currentSong.image_url ? `url(${currentSong.image_url}) center/cover` : 'linear-gradient(135deg, #6C63FF, #a855f7)',
          flexShrink: 0
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

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={togglePlay} style={{
          width: 40, height: 40, borderRadius: '50%', background: '#fff',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        <button onClick={stopPlayer} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none',
          width: 32, height: 32, borderRadius: '50%',
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
            bottom: calc(90px + env(safe-area-inset-bottom)) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 6px 12px !important;
            margin: 0 12px 10px 12px;
            border-radius: 16px;
            background: rgba(15, 23, 42, 0.9) !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            border: 1px solid rgba(108, 99, 255, 0.15);
          }
        }
      ` }} />
    </div>
  )
}
