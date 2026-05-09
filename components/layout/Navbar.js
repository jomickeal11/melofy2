import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const NAVBAR_T = {
  FR: {
    balance: 'crédits',
    profile: 'Profil',
    stats: 'Statistiques',
    myMusic: 'Ma Musique',
    logout: 'Déconnexion',
    logoutConfirm: 'Voulez-vous vraiment vous déconnecter ?'
  },
  EN: {
    balance: 'credits',
    profile: 'Profile',
    stats: 'Statistics',
    myMusic: 'My Music',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to sign out?'
  }
}

export default function Navbar({ user, profile }) {
  const router = useRouter()
  const [lang, setLang] = useState('FR')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const menuRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
    
    const storedNotifs = localStorage.getItem('melofy_notifications')
    if (storedNotifs) {
      try { setNotifications(JSON.parse(storedNotifs)) } catch (e) { console.error(e) }
    }
  }, [])

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const t = NAVBAR_T[lang] || NAVBAR_T.FR
  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleLogout = async () => {
    if (!window.confirm(t.logoutConfirm)) return
    const { supabase } = await import('../../lib/supabase')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleLang = () => {
    const nextLang = lang === 'FR' ? 'EN' : 'FR'
    setLang(nextLang)
    localStorage.setItem('melofy_lang', nextLang)
    if (typeof window !== 'undefined') window.location.reload()
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header style={{
      height: 72,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Left: Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, fontWeight: 'bold'
        }}>♪</div>
        <span style={{ 
          fontFamily: 'Syne, sans-serif', 
          fontWeight: 800, 
          fontSize: 20, 
          color: '#fff',
          letterSpacing: '-0.02em'
        }}>melofy</span>
      </Link>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        
        {/* Credits Pill */}
        <Link href="/pricing" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(108, 99, 255, 0.1)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
          padding: '6px 12px',
          borderRadius: 100,
          textDecoration: 'none',
          transition: 'all 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.15)'}
           onMouseLeave={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.1)'}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#FBBF24', fontWeight: 800 }}>©</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {profile?.credits || 0} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t.balance}</span>
          </span>
          <div style={{ 
            width: 20, height: 20, borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 4
          }}>+</div>
        </Link>

        {/* Notifications */}
        <button style={{ 
          background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
          width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
           onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#EF4444', borderRadius: '50%', border: '2px solid #0F172A' }} />
          )}
        </button>

        {/* User Profile */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen) }}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', 
              padding: '4px 4px 4px 12px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.4)'}
               onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', display: 'none', md: 'flex' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{profile?.display_name?.split(' ')[0] || 'User'}</span>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700
            }}>{initials}</div>
            <svg style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 220,
              background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16,
              padding: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              display: 'flex', flexDirection: 'column', gap: 2, zIndex: 110
            }}>
              <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{profile?.display_name || 'User'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{user?.email}</div>
              </div>
              
              <MenuLink href="/profile" icon="👤" label={t.profile} onClick={() => setIsMenuOpen(false)} />
              <MenuLink href="/dashboard" icon="📊" label={t.stats} onClick={() => setIsMenuOpen(false)} />
              <MenuLink href="/songs" icon="🎵" label={t.myMusic} onClick={() => setIsMenuOpen(false)} />
              
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              
              <button onClick={toggleLang} style={menuButtonStyle}>
                <span style={{ fontSize: 16 }}>🌐</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{lang === 'FR' ? 'English' : 'Français'}</span>
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>{lang}</span>
              </button>

              <button onClick={handleLogout} style={{ ...menuButtonStyle, color: '#EF4444' }}>
                <span style={{ fontSize: 16 }}>↪</span>
                <span>{t.logout}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuLink({ href, icon, label, onClick }) {
  return (
    <Link href={href} onClick={(e) => { e.stopPropagation(); onClick(); }} style={menuButtonStyle}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

const menuButtonStyle = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
  borderRadius: 10, color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
  fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
  cursor: 'pointer', transition: 'all 0.15s'
}
