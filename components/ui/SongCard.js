import { useState, useEffect } from 'react'
import { usePlayer } from '../../context/PlayerContext'
import toast from 'react-hot-toast'
import Modal from './Modal'

export default function SongCard({ song, onDelete, isSelected, onSelect, onDownload, isDownloaded, compact = false, playlist = [] }) {
  const [localSong, setLocalSong] = useState(song)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(song.title || 'Nouvelle chanson')
  const [savingTitle, setSavingTitle] = useState(false)
  const [lang, setLang] = useState('FR')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const { currentSong, isPlaying, progress, duration, currentTime, playSong, seek: globalSeek } = usePlayer()
  const isThisPlaying = currentSong?.id === localSong.id && isPlaying

  // ... (existing effects)

  const toggle = () => {
    if (!localSong.audio_url) return
    playSong(localSong, playlist || [])
  }

  const handleSaveTitle = async () => {
    if (!titleInput.trim()) return
    setSavingTitle(true)
    try {
      const { data: { session } } = await import('../../lib/supabase').then(m => m.supabase.auth.getSession())
      const res = await fetch('/api/save-song', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          songId: localSong.id, 
          titre: titleInput 
        })
      })
      if (!res.ok) throw new Error('Erreur')
      setLocalSong({ ...localSong, title: titleInput })
      setIsEditingTitle(false)
      toast.success(lang === 'FR' ? 'Titre mis à jour' : 'Title updated')
    } catch (e) {
      toast.error(lang === 'FR' ? 'Erreur lors de la mise à jour' : 'Update error')
    } finally {
      setSavingTitle(false)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time) || !time) return '0:00'
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const handleDelete = async () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      const { data: { session } } = await import('../../lib/supabase').then(m => m.supabase.auth.getSession());
      const res = await fetch('/api/delete-songs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ songIds: [localSong.id] })
      });
      if (!res.ok) throw new Error('Erreur API');
      if (onDelete) onDelete();
      toast.success(lang === 'FR' ? 'Chanson supprimée' : 'Song deleted');
    } catch (e) {
      console.error('Erreur suppression:', e);
      toast.error(lang === 'FR' ? 'Erreur lors de la suppression.' : 'Error while deleting.');
      setIsDeleting(false);
    }
  }

  const handleShare = () => {
    window.open('/s/' + localSong.id, '_blank')
  }

  const handleRegenerate = () => {
    window.location.href = '/create?songId=' + localSong.id
  }

  const isGenerating = localSong.status === 'generating' || localSong.status === 'pending'
  const isFailed = localSong.status === 'error' || localSong.status === 'failed'

  return (
    <div className={`song-card ${compact ? 'compact' : ''} ${isSelected ? 'selected' : ''}`}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#22D3EE'; if(compact) e.currentTarget.style.transform = 'translateX(4px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; if(compact) e.currentTarget.style.transform = 'translateX(0)' }}>


      {/* --- Top Container: Image & Info --- */}
      <div className="card-header-row">
        {!compact && (
          <input type="checkbox" checked={isSelected || false} onChange={onSelect} style={{
            width: 18, height: 18, cursor: 'pointer', accentColor: '#22D3EE', flexShrink: 0,
            appearance: 'none', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 4,
            background: isSelected ? '#fff' : 'transparent', 
            position: 'relative'
          }} />
        )}

        {(() => {
          let rawLyrics = localSong.lyrics || '';
          let imageUrl = localSong.image_url || '';
          if (typeof rawLyrics === 'string' && rawLyrics.startsWith('[IMAGE:')) {
            const closingIdx = rawLyrics.indexOf(']');
            if (closingIdx !== -1) {
              if (!imageUrl) imageUrl = rawLyrics.substring(7, closingIdx);
            }
          }
          return (
            <div style={{
              width: compact ? 48 : 68, height: compact ? 48 : 68, borderRadius: 10, flexShrink: 0,
              background: imageUrl ? `url(${imageUrl}) center/cover` : 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(56,189,248,0.1))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative'
            }}>
              {!imageUrl && <div style={{ fontSize: compact ? 18 : 24 }}>🎵</div>}
              {isGenerating && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          )
        })()}

        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditingTitle ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={titleInput} onChange={e => setTitleInput(e.target.value)} style={{
                background: '#0d0d14', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, padding: '4px 8px', borderRadius: 6, width: '100%', outline: 'none'
              }} />
              <button onClick={handleSaveTitle} disabled={savingTitle} style={{ background: '#22D3EE', border: 'none', color: '#0d0d14', fontWeight: 700, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                {savingTitle ? '...' : 'OK'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: compact ? 14 : 15, fontWeight: 600, color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {localSong.title || 'Nouvelle chanson'}
              </div>
              {!compact && (
                <button onClick={() => setIsEditingTitle(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0 }} title="Modifier le titre">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              )}
            </div>
          )}
          <div style={{ fontSize: compact ? 11 : 13, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {localSong.style || 'Génération AI'}
          </div>
        </div>
      </div>

      {/* --- Middle: Player --- */}
      <div className="card-player-row" style={{ opacity: isGenerating || isFailed ? 0.3 : 1, pointerEvents: isGenerating || isFailed ? 'none' : 'auto', marginTop: compact ? 0 : 4 }}>
        <button onClick={toggle} style={{
          width: 34, height: 34, borderRadius: '50%', background: isThisPlaying ? 'rgba(108,99,255,0.1)' : 'rgba(255,255,255,0.05)', 
          border: `1.5px solid ${isThisPlaying ? '#6C63FF' : 'rgba(255,255,255,0.2)'}`,
          color: isThisPlaying ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
        }}>
          {isThisPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        <div onClick={(e) => {
          if (!isThisPlaying) return;
          const bounds = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - bounds.left;
          const percentage = (x / bounds.width) * 100;
          globalSeek(percentage);
        }} style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, cursor: isThisPlaying ? 'pointer' : 'default', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', 
            background: isThisPlaying ? 'linear-gradient(90deg, #6C63FF, #22D3EE)' : 'rgba(255,255,255,0.1)', 
            borderRadius: 10, width: `${isThisPlaying ? progress : 0}%`,
            transition: isThisPlaying ? 'width 0.1s linear' : 'none'
          }} />
        </div>

        <div className="song-time-display" style={{ 
          fontSize: 10, 
          color: isThisPlaying ? '#6C63FF' : 'rgba(255,255,255,0.3)', 
          fontWeight: 600, 
          minWidth: 'fit-content', 
          textAlign: 'right', 
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap'
        }}>
          {isThisPlaying ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '0:00 / 0:00'}
        </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/s/${localSong.id}`;
              }}
              style={{ 
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDownloaded ? '#34D399' : 'rgba(255,255,255,0.4)', cursor: 'pointer', border: 'none'
              }}
              title={lang === 'FR' ? 'Télécharger & Partager' : 'Download & Share'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
      </div>

      {/* --- Bottom: Actions --- */}
      {!compact && (
        <div className="card-actions-row" style={{ 
          display: 'flex', 
          paddingTop: 12, 
          borderTop: '1px solid rgba(255,255,255,0.04)' 
        }}>
          <div className="card-date-desktop" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 110 }}>
            {formatDate(localSong.created_at)}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={handleRegenerate} disabled={isGenerating || isFailed} title="Regénérer" 
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: isGenerating || isFailed ? 0.3 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>

            <button onClick={handleDelete} disabled={isDeleting} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .song-card {
          display: flex; flex-direction: column; gap: clamp(10px, 3vw, 16px); padding: clamp(12px, 3vw, 16px) clamp(14px, 4vw, 24px); border-radius: 20px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s ease; margin-bottom: 12px; position: relative;
        }
        .song-card.compact { padding: 10px 14px; gap: 8px; }
        .song-card:hover { background: rgba(255,255,255,0.05); }
        
        .card-header-row { display: flex; align-items: center; gap: clamp(10px, 3vw, 16px); }
        .card-player-row { display: flex; align-items: center; gap: clamp(10px, 3vw, 14px); }
        .card-actions-row { display: flex; align-items: center; gap: clamp(10px, 3vw, 16px); padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.04); }

        @media (min-width: 769px) {
          .song-card { flex-direction: row; align-items: center; gap: 32px; padding: 16px 28px; }
          .card-header-row { flex: 4; min-width: 300px; }
          .card-player-row { flex: 3; min-width: 0; }
          .card-actions-row { flex: 3; border: none; padding: 0; }
          
          /* Ajustements spécifiques pour le mode compact */
          .song-card.compact .card-header-row { flex: 5; }
          .song-card.compact .card-player-row { flex: 2; }
        }

        @media (max-width: 768px) {
          .card-date-desktop, .card-cost-desktop { display: none !important; }
          .song-card { gap: 12px; padding: 12px 14px; }
          .card-player-row { gap: 8px; }
          .card-actions-row { gap: 10px; }
        }
      ` }} />

      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
        title={lang === 'FR' ? 'Supprimer la chanson' : 'Delete song'}
        message={lang === 'FR' ? 'Voulez-vous vraiment supprimer cette chanson ?' : 'Are you sure you want to delete this song?'}
        confirmText={lang === 'FR' ? 'Supprimer' : 'Delete'}
        cancelText={lang === 'FR' ? 'Annuler' : 'Cancel'}
        type="danger"
      />
    </div>
  )
}
