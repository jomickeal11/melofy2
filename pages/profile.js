import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { translateError } from '../lib/error-translator'

const t = {
    FR: {
        title: 'Profil · Melofy', user: 'Utilisateur', credits: 'Crédits', songs: 'Chansons', member: 'Membre',
        invite: 'Inviter des amis', inviteSub: 'Partagez Melofy avec vos proches',
        lang: 'Langue', langName: 'Français',
        privacy: 'Confidentialité', privacySub: 'Politique de données',
        support: 'Aide & Support', supportSub: 'FAQ et contact',
        terms: "Conditions d'utilisation", termsSub: 'Mentions légales',
        logout: 'Se déconnecter', delete: 'Supprimer mon compte',
        quickActions: 'Actions rapides',
        account: 'Compte',
        logoutTitle: 'Déconnexion', logoutConfirm: 'Voulez-vous vraiment vous déconnecter ?',
        deleteTitle: 'Supprimer le compte', deleteConfirm: 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
        confirm: 'Confirmer', cancel: 'Annuler'
    },
    EN: {
        title: 'Profile · Melofy', user: 'User', credits: 'Credits', songs: 'Songs', member: 'Member',
        invite: 'Invite Friends', inviteSub: 'Share Melofy with your loved ones',
        lang: 'Language', langName: 'English',
        privacy: 'Privacy', privacySub: 'Data policy',
        support: 'Help & Support', supportSub: 'FAQ and contact',
        terms: 'Terms of Use', termsSub: 'Legal notices',
        logout: 'Sign out', delete: 'Delete my account',
        quickActions: 'Quick actions',
        account: 'Account',
        logoutTitle: 'Sign out', logoutConfirm: 'Are you sure you want to sign out?',
        deleteTitle: 'Delete account', deleteConfirm: 'Are you sure you want to delete your account? This action is irreversible.',
        confirm: 'Confirm', cancel: 'Cancel'
    }
}

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentLang, setCurrentLang] = useState('FR')
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('melofy_lang') || 'FR'
        setCurrentLang(saved)
        loadProfile()
    }, [])

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
        const { data: s } = await supabase.from('songs').select('id').eq('user_id', user.id)
        setSongs(s || [])
        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const handleDeleteAccount = async () => {
        setShowDeleteModal(false)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch('/api/delete-account', { method: 'POST', headers: { 'Authorization': `Bearer ${session?.access_token}` } })
            if (!res.ok) throw new Error("Erreur de l'API")
            await supabase.auth.signOut()
            router.push('/')
        } catch (err) { 
            toast.error(translateError(err.message, currentLang)) 
        }
    }

    const toggleLang = () => {
        const nextLang = currentLang === 'FR' ? 'EN' : 'FR'
        setCurrentLang(nextLang)
        localStorage.setItem('melofy_lang', nextLang)
        if (typeof window !== 'undefined') window.location.reload()
    }

    const initials = profile?.display_name
        ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() || 'U'

    const creationDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString(currentLang === 'FR' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' })
        : (currentLang === 'FR' ? 'Mai 2024' : 'May 2024')

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d14' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(108,99,255,0.2)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
        </div>
    )

    const langDict = t[currentLang] || t.FR

    return (
        <>
            <Head><title>{langDict.title}</title></Head>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
                <Sidebar user={user} profile={profile} />

                <main className="pb-player-safe" style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
                    <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px' }}>
                        
                        {/* ── Header ── */}
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                                <div style={{
                                    width: 100, height: 100, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 36, fontWeight: 800, color: '#fff',
                                    boxShadow: '0 10px 30px rgba(108,99,255,0.3)',
                                    border: '4px solid rgba(255,255,255,0.05)'
                                }}>
                                    {initials}
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: 4, right: 4, width: 26, height: 26,
                                    background: '#10B981', borderRadius: '50%', border: '3px solid #0F172A',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                            </div>
                            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                                {profile?.display_name || 'User'}
                            </h1>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{user?.email}</p>
                        </div>

                        {/* ── Stats Grid ── */}
                        <div style={{ 
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 
                        }}>
                            {[
                                { label: langDict.credits, value: profile?.credits ?? 0, color: '#FBBF24', icon: '💎' },
                                { label: langDict.songs, value: songs.length, color: '#6C63FF', icon: '🎵' },
                                { label: langDict.member, value: creationDate, color: '#fff', icon: '✨', isDate: true },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '16px 10px',
                                    border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* ── Quick Actions ── */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
                            <Link href="/pricing" style={{
                                flex: 1.5, height: 52, background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 8, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                                boxShadow: '0 4px 15px rgba(108,99,255,0.3)'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                {currentLang === 'FR' ? 'Prendre un pack' : 'Buy Credits'}
                            </Link>
                            <Link href="/songs" style={{
                                flex: 1, height: 52, background: 'rgba(255,255,255,0.05)',
                                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 8, color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                {songs.length}
                            </Link>
                        </div>

                        {/* ── Menu List ── */}
                        <h2 style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px 12px', letterSpacing: 1 }}>{langDict.account}</h2>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 24 }}>
                            {[
                                { label: langDict.invite, sub: langDict.inviteSub, href: '/invite', color: '#10B981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg> },
                                { label: langDict.lang, sub: langDict.langName, badge: currentLang, onClick: toggleLang, color: '#6C63FF', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg> },
                                { label: langDict.privacy, sub: langDict.privacySub, href: '/privacy', color: '#A78BFA', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
                                { label: langDict.terms, sub: langDict.termsSub, href: '/terms', color: '#60A5FA', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
                            ].map((item, i, arr) => (
                                <Link key={i} href={item.href || '#'} onClick={item.onClick} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
                                    textDecoration: 'none', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    transition: 'background 0.2s'
                                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 12, background: item.color + '15', color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{item.label}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{item.sub}</div>
                                        </div>
                                    </div>
                                    {item.badge ? <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, fontSize: 11, color: '#fff', fontWeight: 700 }}>{item.badge}</span> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>}
                                </Link>
                            ))}
                        </div>

                        {/* ── Danger Zone ── */}
                        <div style={{ background: 'rgba(239,68,68,0.03)', borderRadius: 24, border: '1px solid rgba(239,68,68,0.1)', overflow: 'hidden' }}>
                            <button onClick={() => setShowLogoutModal(true)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                                background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(239,68,68,0.05)'
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F87171' }}>{langDict.logout}</div>
                                </div>
                            </button>
                            <button onClick={() => setShowDeleteModal(true)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                                background: 'none', border: 'none', cursor: 'pointer'
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239,68,68,0.05)', color: 'rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(239,68,68,0.4)' }}>{langDict.delete}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </main>

                <Modal 
                    isOpen={showLogoutModal} 
                    onClose={() => setShowLogoutModal(false)} 
                    onConfirm={handleLogout}
                    title={langDict.logoutTitle}
                    message={langDict.logoutConfirm}
                    confirmText={langDict.logout}
                    cancelText={langDict.cancel}
                    type="primary"
                />

                <Modal 
                    isOpen={showDeleteModal} 
                    onClose={() => setShowDeleteModal(false)} 
                    onConfirm={handleDeleteAccount}
                    title={langDict.deleteTitle}
                    message={langDict.deleteConfirm}
                    confirmText={langDict.delete}
                    cancelText={langDict.cancel}
                    type="danger"
                />
            </div>
        </>
    )
}

// Icons
function HomeIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> }
function PlusIcon({ accent }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={accent ? '#6C63FF' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg> }
function MusicIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg> }
function ListIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg> }
function CreditCardIcon({ active }) { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22D3EE' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> }