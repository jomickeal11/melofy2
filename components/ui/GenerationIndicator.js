import React from 'react'
import { useRouter } from 'next/router'
import { useGeneration } from '../../context/GenerationContext'

export default function GenerationIndicator() {
  const { isGenerating, progress, songId, status } = useGeneration()
  const router = useRouter()

  // On n'affiche rien si rien ne se passe ou si on est déjà sur la page de création à l'étape d'attente
  if (!isGenerating && status !== 'success' && status !== 'failed') return null
  
  // Si on est déjà sur la page de création en mode attente, on peut cacher l'indicateur flottant pour éviter les doublons
  if (router.pathname === '/create' && (router.query.songId || isGenerating)) return null

  const handleClick = () => {
    if (songId) {
      router.push(`/create?songId=${songId}`)
    }
  }

  const getStatusText = () => {
    if (status === 'success') return '✨ Prêt !'
    if (status === 'failed') return '❌ Échec'
    if (progress >= 95) return '⏳ Finalisation...'
    return '⚙️ Création...'
  }

  const getSubText = () => {
    if (status === 'success') return 'Cliquez pour choisir'
    if (status === 'failed') return 'Réessayez plus tard'
    if (progress >= 95) return 'L\'IA peaufine le mix...'
    return 'En cours de mixage...'
  }

  return (
    <div 
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 100, // Au dessus du lecteur audio
        right: 20,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(108, 99, 255, 0.4)',
        borderRadius: '16px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        animation: 'slideIn 0.3s ease-out',
        maxWidth: '280px',
        transition: 'all 0.3s'
      }}
    >
      <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
        <svg style={{ transform: 'rotate(-90deg)' }} width="36" height="36" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <circle 
            cx="20" cy="20" r="18" fill="none" stroke="#6C63FF" strokeWidth="3" 
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 18} 
            strokeDashoffset={2 * Math.PI * 18 * (1 - progress / 100)} 
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
          {Math.round(progress)}%
        </div>
      </div>
      
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getStatusText()}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
          {getSubText()}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
