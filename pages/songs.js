import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Sidebar from '../components/layout/Sidebar'
import SongCard from '../components/ui/SongCard'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { useGeneration } from '../context/GenerationContext'

const SONGS_T = {
  FR: {
    title: "Mes chansons · Melofy",
    heading: "Mes chansons",
    search: "Rechercher...",
    tip: "Afin de garantir des performances optimales, votre historique est limité à vos <b>10 dernières créations</b> et conservé pendant <b>30 jours</b>. N'oubliez pas de télécharger vos morceaux favoris !",
    tabs: { toutes: "Toutes", telechargees: "Téléchargées" },
    selectAll: "Tout sélectionner", selected: "sélectionnée(s)",
    download: "Télécharger", delete: "Supprimer",
    noResult: "Aucun résultat trouvé", noSongs: "Aucune chanson pour l'instant",
    tryOther: "Essayez d'autres mots-clés", createFirst: "Crée ta première chanson personnalisée",
    createBtn: "+ Créer une chanson", credit: "Crédit", credits: "Crédits",
  },
  EN: {
    title: "My songs · Melofy",
    heading: "My songs",
    search: "Search...",
    tip: "To ensure optimal performance, your history is limited to your <b>last 10 creations</b> and kept for <b>30 days</b>. Don't forget to download your favorite tracks!",
    tabs: { toutes: "All", telechargees: "Downloaded" },
    selectAll: "Select all", selected: "selected",
    download: "Download", delete: "Delete",
    noResult: "No results found", noSongs: "No songs yet",
    tryOther: "Try other keywords", createFirst: "Create your first custom song",
    createBtn: "+ Create a song", credit: "Credit", credits: "Credits",
  }
}

export default function SongsPage() {
  const [songs, setSongs] = useState([])
  const [selectedSongs, setSelectedSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [downloadedIds, setDownloadedIds] = useState([])
  const [profile, setProfile] = useState(null)
  const [lang, setLang] = useState('FR')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const { songId: currentGeneratingId, resetGeneration } = useGeneration()

  const t = SONGS_T[lang] || SONGS_T.FR
  const [activeTab, setActiveTab] = useState(t.tabs.toutes)

  useEffect(() => {
    const savedLang = localStorage.getItem('melofy_lang') || 'FR'
    setLang(savedLang)
    setActiveTab(savedLang === 'FR' ? SONGS_T.FR.tabs.toutes : SONGS_T.EN.tabs.toutes)
    fetchSongs()
    const saved = localStorage.getItem('melofy_downloaded')
    if (saved) { try { setDownloadedIds(JSON.parse(saved)) } catch (e) { } }
  }, [])

  const markAsDownloaded = (idsToMark) => {
    setDownloadedIds(prev => {
      const updated = [...new Set([...prev, ...idsToMark])]
      localStorage.setItem('melofy_downloaded', JSON.stringify(updated))
      return updated
    })
  }

  const fetchSongs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: songsData } = await supabase.from('songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData) setProfile(profileData)
    setSongs(songsData || [])
    setSelectedSongs([])
    setLoading(false)

    // Lancer la vérification automatique des chansons en attente
    if (songsData) {
      checkPendingSongs(songsData)
    }
  }

  const isCheckingPending = useRef(false)

  const checkPendingSongs = async (allSongs) => {
    if (isCheckingPending.current) return
    const pending = allSongs.filter(s => s.status === 'generating' || s.status === 'queued' || s.status === 'generating-suno')
    if (pending.length === 0) return

    isCheckingPending.current = true
    let hasUpdates = false

    for (const song of pending) {
      try {
        const res = await fetch(`/api/poll-task?songId=${song.id}&t=${Date.now()}`)
        const data = await res.json()

        if (data && data.status === 'success' && data.tracks?.length > 0) {
          const firstTrack = data.tracks[0]
          let metadata = {}
          try { metadata = JSON.parse(song.lyrics) } catch (e) { }

          const { data: { session } } = await supabase.auth.getSession()
          await fetch('/api/save-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ 
              track: firstTrack, 
              metadata: { ...metadata, paroles: firstTrack.lyrics || metadata?.paroles || '' }, 
              songId: song.id, 
              titre: song.title 
            })
          })
          
          toast.success(lang === 'FR' ? `✨ "${song.title}" est prête !` : `✨ "${song.title}" is ready!`)
          hasUpdates = true
        }
      } catch (e) {
        console.error('Auto-check error:', e)
      }
    }

    if (hasUpdates) {
      fetchSongs()
    }
    isCheckingPending.current = false
  }

  const handleToggleSelectAll = () => {
    if (selectedSongs.length === songs.length && songs.length > 0) setSelectedSongs([])
    else setSelectedSongs(songs.map(s => s.id))
  }

  const handleBulkDelete = () => {
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = async () => {
    setShowBulkDeleteModal(false)
    setIsDeletingBulk(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/delete-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ songIds: selectedSongs })
      })
      if (!res.ok) throw new Error("Erreur de l'API")
      if (selectedSongs.includes(currentGeneratingId)) {
        resetGeneration()
      }
      setSongs(songs.filter(s => !selectedSongs.includes(s.id)))
      setSelectedSongs([])
      toast.success(lang === 'FR' ? "Chansons supprimées" : "Songs deleted")
    } catch {
      toast.error(lang === 'FR' ? "Erreur lors de la suppression" : "Error while deleting")
    }
    setIsDeletingBulk(false)
  }

  const handleBulkDownload = () => {
    const toDownload = songs.filter(s => selectedSongs.includes(s.id) && s.audio_url)
    if (toDownload.length === 0) return toast.error(lang === 'FR' ? "Aucune des chansons sélectionnées n'est prête au téléchargement." : "None of the selected songs are ready for download.")
    toDownload.forEach((s, index) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = `/api/download?url=${encodeURIComponent(s.audio_url)}&title=${encodeURIComponent(s.title || 'Chanson')}`
        a.download = `${(s.title || 'Chanson').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      }, index * 800)
    })
    markAsDownloaded(toDownload.map(s => s.id))
    setSelectedSongs([])
  }

  const displayedSongs = songs.filter(song => {
    if (activeTab === t.tabs.telechargees && !downloadedIds.includes(song.id)) return false
    if (searchQuery.trim() === '') return true
    const q = searchQuery.toLowerCase()
    return (song.title && song.title.toLowerCase().includes(q)) || (song.style && song.style.toLowerCase().includes(q))
  })

  return (
    <>
      <Head><title>{t.title}</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
        <Sidebar />

        <main className="flex-1 overflow-y-auto adaptive-px adaptive-py relative">
          <div className="max-w-[1000px] mx-auto relative z-[1]">

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{t.heading}</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {songs.length} {lang === 'FR' ? 'chanson(s) créée(s)' : 'song(s) created'}
                  </p>
                </div>
                <button
                  onClick={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery('') }}
                  style={{
                    background: isSearchOpen ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSearchOpen ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer', color: isSearchOpen ? '#22D3EE' : 'rgba(255,255,255,0.4)',
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  {isSearchOpen
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  }
                </button>
              </div>

              {/* Expandable search bar */}
              {isSearchOpen && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      type="text" placeholder={t.search} value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)} autoFocus
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', padding: '10px 14px 10px 40px', borderRadius: 12,
                        fontSize: 16, outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tip banner — #6C63FF base au lieu de #a855f7 */}
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.18)'
            }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div dangerouslySetInnerHTML={{ __html: t.tip }} style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.5 }} />
            </div>

            {/* Tabs & Bulk Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 min-h-[36px]">
              <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.05)', width: 'fit-content' }}>
                {[t.tabs.toutes, t.tabs.telechargees].map(tabItem => (
                  <button key={tabItem} onClick={() => setActiveTab(tabItem)} style={{
                    padding: '7px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: activeTab === tabItem ? 'linear-gradient(135deg, #6C63FF, #a855f7)' : 'transparent',
                    color: activeTab === tabItem ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.15s',
                  }}>{tabItem}</button>
                ))}
              </div>

              {selectedSongs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginLeft: 6 }}>{selectedSongs.length} {t.selected}</span>
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
                  <button onClick={handleBulkDownload} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    <span className="hidden sm:inline">{t.download}</span>
                  </button>
                  <button onClick={handleBulkDelete} disabled={isDeletingBulk} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: isDeletingBulk ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isDeletingBulk ? 0.5 : 1 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    <span className="hidden sm:inline">{t.delete}</span>
                  </button>
                </div>
              )}
            </div>

            {songs.length > 0 && !loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px 16px 24px' }}>
                <input
                  type="checkbox"
                  checked={selectedSongs.length === songs.length && songs.length > 0}
                  onChange={handleToggleSelectAll}
                  // ← accentColor aligné sur le nouveau Cyan (#22D3EE)
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22D3EE' }}
                />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{t.selectAll}</span>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : displayedSongs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.3 }}>🎵</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 6 }}>
                  {searchQuery ? t.noResult : t.noSongs}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
                  {searchQuery ? t.tryOther : t.createFirst}
                </div>
                {!searchQuery && (
                  <Link href="/create" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px', borderRadius: 50,
                    // ← gradient CTA aligné sur landing
                    background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                    color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500,
                    boxShadow: '0 4px 14px rgba(108,99,255,0.3)'
                  }}>
                    {t.createBtn}
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {displayedSongs.map(song => (
                  <SongCard
                    key={song.id} song={song}
                    playlist={displayedSongs}
                    isSelected={selectedSongs.includes(song.id)}
                    isDownloaded={downloadedIds.includes(song.id)}
                    onDownload={() => markAsDownloaded([song.id])}
                    onSelect={() => {
                      if (selectedSongs.includes(song.id)) setSelectedSongs(selectedSongs.filter(id => id !== song.id))
                      else setSelectedSongs([...selectedSongs, song.id])
                    }}
                    onDelete={() => {
                      if (song.id === currentGeneratingId) {
                        resetGeneration()
                      }
                      setSongs(songs.filter(s => s.id !== song.id))
                      setSelectedSongs(selectedSongs.filter(id => id !== song.id))
                    }}
                  />
                ))}
              </div>
            )}

          </div>
          {/* Spacer for mobile nav/player */}
          <div className="pb-player-safe h-0" />
        </main>

        <Modal 
            isOpen={showBulkDeleteModal} 
            onClose={() => setShowBulkDeleteModal(false)} 
            onConfirm={confirmBulkDelete}
            title={lang === 'FR' ? 'Supprimer les chansons' : 'Delete songs'}
            message={lang === 'FR' ? `Voulez-vous vraiment supprimer ${selectedSongs.length} chanson(s) ?` : `Are you sure you want to delete ${selectedSongs.length} song(s)?`}
            confirmText={lang === 'FR' ? 'Supprimer' : 'Delete'}
            cancelText={lang === 'FR' ? 'Annuler' : 'Cancel'}
            type="danger"
        />
      </div>
    </>
  )
}