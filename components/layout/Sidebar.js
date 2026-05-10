import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Modal from '../ui/Modal'

const SIDEBAR_T = {
  FR: {
    dashboard: 'Accueil',
    create: 'Créer',
    songs: 'Mes chansons',
    payments: 'Paiements',
    pricing: 'Tarification',
    balance: 'Mon solde',
    credits: 'crédits',
    buy: 'Acheter des crédits',
    logout: 'Déconnexion',
    language: 'English',
    langBadge: 'FR',
    logoutTitle: 'Déconnexion',
    logoutConfirm: 'Voulez-vous vraiment vous déconnecter ?',
    confirm: 'Confirmer',
    cancel: 'Annuler'
  },
  EN: {
    dashboard: 'Home',
    create: 'Create',
    songs: 'My songs',
    payments: 'Payments',
    pricing: 'Pricing',
    balance: 'Balance',
    credits: 'credits',
    buy: 'Buy credits',
    logout: 'Logout',
    language: 'Français',
    langBadge: 'EN',
    logoutTitle: 'Sign out',
    logoutConfirm: 'Are you sure you want to sign out?',
    confirm: 'Confirm',
    cancel: 'Cancel'
  }
}

export default function Sidebar({ user, profile }) {
  const router = useRouter()
  const [lang, setLang] = useState('FR')
  const [collapsed, setCollapsed] = useState(false)
  const [localProfile, setLocalProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('melofy_profile_cache') || 'null') } catch { return null }
    }
    return null
  })
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  
  const userMenuRef = useRef(null)
  const notifPanelRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  useEffect(() => {
    async function load() {
      if (profile) { setLocalProfile(profile); return }
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          const { data } = await supabase
            .from('profiles').select('*').eq('id', currentUser.id).single()
          const profileWithEmail = { ...(data || {}), email: currentUser.email }
          setLocalProfile(profileWithEmail)
          localStorage.setItem('melofy_profile_cache', JSON.stringify(profileWithEmail))
        }
      } catch (e) { console.error(e) }
    }
    load()
  }, [profile])

  useEffect(() => {
    const stored = localStorage.getItem('melofy_notifications')
    if (stored) { try { setNotifications(JSON.parse(stored)) } catch (err) { console.error(err) } }
  }, [])

  useEffect(() => {
    let channel
    async function initRealtime() {
      try {
        const { supabase } = await import('../../lib/supabase')
        channel = supabase.channel('songs_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new.status === 'ready' && payload.old.status !== 'ready') {
              const newNotif = {
                id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
                title: 'Chanson prête ! 🎵',
                message: `Ta chanson "${payload.new.title || 'Sans titre'}" est prête à l'écoute.`,
                isRead: false,
                createdAt: new Date().toISOString()
              }
              setNotifications(prev => {
                const updated = [newNotif, ...prev]
                localStorage.setItem('melofy_notifications', JSON.stringify(updated))
                return updated
              })
            }
          }).subscribe()
      } catch (err) { console.error(err) }
    }
    initRealtime()
    return () => { if (channel) import('../../lib/supabase').then(({ supabase }) => supabase.removeChannel(channel)) }
  }, [])

  useEffect(() => {
    const handleOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target)) {
        setShowNotifPanel(false)
      }
    }
    if (showUserDropdown || showNotifPanel) {
      document.addEventListener('mousedown', handleOutside)
    }
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showUserDropdown, showNotifPanel])

  const toggleLang = () => {
    const nextLang = lang === 'FR' ? 'EN' : 'FR'
    setLang(nextLang)
    localStorage.setItem('melofy_lang', nextLang)
    if (typeof window !== 'undefined') window.location.reload()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const initials = localProfile?.display_name
    ? localProfile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  const t = SIDEBAR_T[lang] || SIDEBAR_T.FR
  const isMainPage = ['/dashboard', '/songs', '/payments', '/profile', '/invite', '/pricing'].includes(router.pathname)

  const clearNotifications = () => {
    setNotifications([])
    localStorage.setItem('melofy_notifications', JSON.stringify([]))
  }

  const handleLogoutClick = () => {
    setShowUserDropdown(false)
    setShowLogoutModal(true)
  }
  const confirmLogout = async () => {
    setShowLogoutModal(false)
    const { supabase } = await import('../../lib/supabase')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      {isMainPage && (
        <aside className="desktop-sidebar" style={{
          width: collapsed ? 68 : 240, flexShrink: 0, background: 'rgba(255,255,255,0.04)',
          borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s ease', overflow: 'visible', position: 'sticky', top: 0, height: '100dvh',
          overscrollBehavior: 'none'
        }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            position: 'absolute', right: -16, top: 41, zIndex: 100, width: 32, height: 32, borderRadius: '50%',
            background: '#0d0d14', border: '1px solid rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6C63FF',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          }}>
            {collapsed ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>}
          </button>
          <div style={{ padding: '40px 16px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6C63FF, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>♪</div>
            {!collapsed && <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: '#fff' }}>melofy</span>}
          </div>
          <nav style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { href: '/dashboard', label: t.dashboard, icon: HomeIcon },
              { href: '/create', label: t.create, icon: PlusIcon, accent: true },
              { href: '/songs', label: t.songs, icon: MusicIcon },
              { href: '/payments', label: t.payments, icon: CreditCardIcon },
              { href: '/pricing', label: t.pricing, icon: CreditCardIcon },
            ].map(({ href, label, icon: Icon, accent }) => {
              const active = router.pathname === href
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 14, padding: collapsed ? '12px' : '12px 18px',
                  justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 14, textDecoration: 'none',
                  background: active ? 'rgba(108,99,255,0.12)' : accent ? 'rgba(108,99,255,0.06)' : 'transparent',
                  color: active ? '#fff' : accent ? '#6C63FF' : 'rgba(255,255,255,0.55)', transition: 'all 0.15s'
                }}>
                  <Icon active={active} accent={accent} />
                  {!collapsed && <span style={{ fontSize: 15, fontWeight: active || accent ? 600 : 500 }}>{label}</span>}
                </Link>
              )
            })}
          </nav>
          <div style={{ padding: '0 24px', marginBottom: 32 }}>
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #6C63FF, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{initials}</div>
              {!collapsed && <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{localProfile?.display_name || user?.email?.split('@')[0]}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{localProfile?.email || user?.email}</div>
              </div>}
            </Link>
          </div>
          <div style={{ padding: '0 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
              {!collapsed && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{t.language}</span><span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{lang}</span></div>}
            </div>
            <button onClick={handleLogoutClick} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 16, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>{!collapsed && <span>{t.logout}</span>}</button>
          </div>
        </aside>
      )}

      {/* ── Desktop Header ── */}
      <div className="top-header" style={{ position: 'fixed', top: 22, right: 32, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 16 }}>
          {!isMainPage && (
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Retour</span>
            </button>
          )}
          {isMainPage && (
            <>
              <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 6px 6px 16px', borderRadius: 40, color: '#fff', textDecoration: 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FBBF24' }}>{localProfile?.credits ?? 0} Credits</span>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' }}>+</div>
              </Link>
              <div style={{ position: 'relative' }} ref={notifPanelRef}>
                <button onClick={(e) => { e.stopPropagation(); setShowNotifPanel(!showNotifPanel) }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', position: 'relative' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 9, height: 9, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #0d0d14' }} />}
                </button>
                {showNotifPanel && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 320, background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(16px)', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10000, border: '1px solid rgba(255,255,255,0.08)', animation: 'dropdownFade 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Notifications</h3>
                      {notifications.length > 0 && <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: '#6C63FF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Effacer tout</button>}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
                      {notifications.length === 0 ? <div style={{ padding: '40px 20px', textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 10 }}>🔔</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucune notification pour le moment.</div></div> : notifications.map(n => (
                        <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.02)', background: n.isRead ? 'transparent' : 'rgba(108,99,255,0.05)', transition: 'background 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{n.title}</div>{!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C63FF', marginTop: 4 }} />}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/profile" style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{initials}</Link>
            </>
          )}
      </div>

      {/* ── Mobile Top Bar ── */}
      <div className="mobile-top-bar adaptive-px" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 64,
        background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 9999,
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMainPage && (
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Retour</span>
            </button>
          )}
          {isMainPage && (
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6C63FF, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 'bold' }}>♪</div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff' }}>melofy</span>
            </Link>
          )}
        </div>

        {isMainPage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(108, 99, 255, 0.12)', padding: '4px 4px 4px 10px', borderRadius: 100, textDecoration: 'none', border: '1px solid rgba(108, 99, 255, 0.2)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{localProfile?.credits || 0} <span className="hidden xs:inline" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{lang === 'FR' ? 'Crédits' : 'Credits'}</span></span>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' }}>+</div>
            </Link>
            <div style={{ position: 'relative' }} ref={notifPanelRef}>
              <button onClick={(e) => { e.stopPropagation(); setShowNotifPanel(!showNotifPanel) }} style={{ background: 'none', border: 'none', padding: 8, color: 'rgba(255,255,255,0.6)', position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                {unreadCount > 0 && <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: '#EF4444', borderRadius: '50%' }} />}
              </button>
              {showNotifPanel && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 320, background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(16px)', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10000, border: '1px solid rgba(255,255,255,0.08)', animation: 'dropdownFade 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Notifications</h3>
                        {notifications.length > 0 && <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: '#6C63FF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Effacer tout</button>}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
                        {notifications.length === 0 ? <div style={{ padding: '40px 20px', textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 10 }}>🔔</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucune notification pour le moment.</div></div> : notifications.map(n => (
                            <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.02)', background: n.isRead ? 'transparent' : 'rgba(108,99,255,0.05)', transition: 'background 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{n.title}</div>{!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C63FF', marginTop: 4 }} />}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <div onClick={(e) => { e.stopPropagation(); setShowUserDropdown(!showUserDropdown) }} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{initials}</div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" style={{ transform: showUserDropdown ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
              </div>
              {showUserDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 260, background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(16px)', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10000, border: '1px solid rgba(255,255,255,0.08)', animation: 'dropdownFade 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{localProfile?.display_name || 'Utilisateur'}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{localProfile?.email || user?.email}</div>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                        <Link href="/profile" onClick={() => setShowUserDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> <span>Profil</span>
                        </Link>
                        <Link href="/pricing" onClick={() => setShowUserDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> <span>Tarification</span>
                        </Link>
                    </div>
                    <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                                <span>{lang === 'FR' ? 'English' : 'Français'}</span>
                            </div>
                            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{lang}</span>
                        </div>
                        <div onClick={handleLogoutClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            <span>{t.logout}</span>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Nav ── */}
      {isMainPage && (
        <nav className="mobile-nav fixed-stable" style={{
          display: 'none', 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)', // Support Safari
          borderTop: '1px solid rgba(255,255,255,0.1)',
          justifyContent: 'space-around', 
          alignItems: 'center', 
          height: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          paddingLeft: 10,
          paddingRight: 10
        }}>
          {[
            { href: '/dashboard', label: t.dashboard, icon: HomeIcon },
            { href: '/songs', label: t.songs, icon: MusicIcon },
            { href: '/create', label: t.create, icon: PlusIcon, accent: true },
            { href: '/payments', label: t.payments, icon: ListIcon },
            { href: '/profile', label: 'Profil', icon: UserIcon },
          ].map(({ href, label, icon: Icon, accent }) => {
            const active = router.pathname === href
            if (accent) {
              return (
                <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', position: 'relative', top: -22 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 20px rgba(108,99,255,0.4)', border: '4px solid #0d0d14' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 4 }}>{label}</span>
                </Link>
              )
            }
            return (
              <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', color: active ? '#6C63FF' : 'rgba(255,255,255,0.4)', minWidth: 52 }}>
                <Icon active={active} />
                <span style={{ fontSize: 10, fontWeight: active ? 500 : 400 }}>{label}</span>
              </Link>
            )
          })}
        </nav>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-top-bar { display: flex !important; }
          .mobile-nav { display: flex !important; }
          main { padding-top: 84px !important; }
          .top-header { display: none !important; }
        }
        ${!isMainPage ? `
          .desktop-sidebar, .mobile-nav { display: none !important; }
          main { margin-left: 0 !important; padding-left: 16px !important; padding-right: 16px !important; }
          .top-header { left: 16px !important; right: auto !important; position: fixed !important; top: 22px !important; width: auto !important; }
        ` : ''}
        @keyframes dropdownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      ` }} />

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={confirmLogout} title={t.logoutTitle} message={t.logoutConfirm} confirmText={t.logout} cancelText={t.cancel} type="primary" />
    </>
  )
}

function HomeIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> }
function PlusIcon({ accent }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={accent ? '#6C63FF' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg> }
function MusicIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg> }
function CreditCardIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> }
function ListIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg> }
function UserIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> }