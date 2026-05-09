import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  const accentColor = type === 'danger' ? '#F87171' : '#6C63FF'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: 20, animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: '32px', maxWidth: 400, width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{
          width: 60, height: 60, borderRadius: '50%', background: accentColor + '15',
          color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 20px'
        }}>
          {type === 'danger' ? '⚠️' : '❓'}
        </div>

        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
          {title}
        </h3>
        
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 32px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '14px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {cancelText || 'Annuler'}
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '14px', borderRadius: 50, border: 'none',
            background: accentColor, color: '#fff', fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 8px 20px ${accentColor}30`, transition: 'transform 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {confirmText || 'Confirmer'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>
  )
}
