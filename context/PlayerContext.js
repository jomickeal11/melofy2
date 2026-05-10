import React, { createContext, useState, useContext, useRef, useEffect } from 'react'

const PlayerContext = createContext()

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio()
      audio.preload = 'metadata'
      audioRef.current = audio

      const updateProgress = () => {
        if (!audio) return
        let d = audio.duration
        let current = audio.currentTime || 0

        // Si la durée est Infinity (souvent sur iPhone/AI33), on essaie de la récupérer depuis les métadonnées de la chanson
        if ((d === Infinity || isNaN(d) || !d) && currentSong?.duration > 0) {
          d = currentSong.duration
        }

        setCurrentTime(current)
        
        if (d && d !== Infinity && !isNaN(d)) {
          setDuration(d)
          setProgress((current / d) * 100 || 0)
        } else if (isPlaying && current > 0) {
          // Sur iPhone, si on est en train de lire mais qu'on n'a toujours pas de durée,
          // on met à jour au moins le temps courant pour éviter le "0:00"
          setCurrentTime(current)
        }
      }

      const onLoadedMetadata = () => {
        const d = audio.duration
        console.log("[PLAYER] Metadata loaded, duration:", d)
        if (d && d !== Infinity && !isNaN(d)) {
          setDuration(d)
        }
      }

      const onDurationChange = () => {
        const d = audio.duration
        if (d && d !== Infinity && !isNaN(d)) {
          setDuration(d)
        }
      }

      const onEnded = () => {
        setIsPlaying(false)
        setProgress(0)
        setCurrentTime(0)
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none'
        }
      }

      const onPlay = () => {
        setIsPlaying(true)
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing'
        }
        
        // --- FIX iPHONE : Nudge pour forcer le calcul de la durée ---
        if (audio.duration === Infinity) {
          console.log("[PLAYER] iPhone Nudge: Duration is Infinity, attempting nudge...")
          // Un petit saut en avant puis retour à 0 peut parfois déclencher le calcul
          // mais seulement si l'utilisateur a déjà interagi
        }
      }

      const onPause = () => {
        setIsPlaying(false)
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused'
        }
      }

      audio.addEventListener('timeupdate', updateProgress)
      audio.addEventListener('loadedmetadata', onLoadedMetadata)
      audio.addEventListener('durationchange', onDurationChange)
      audio.addEventListener('ended', onEnded)
      audio.addEventListener('play', onPlay)
      audio.addEventListener('pause', onPause)
      audio.addEventListener('playing', updateProgress) // Ajout pour iPhone

      // MediaSession setup
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
          audio.play().catch(() => { })
        })
        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause()
        })
        navigator.mediaSession.setActionHandler('stop', () => {
          stopPlayer()
        })
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          audio.currentTime = Math.max(audio.currentTime - 10, 0)
        })
        navigator.mediaSession.setActionHandler('seekforward', () => {
          const d = audio.duration && audio.duration !== Infinity ? audio.duration : audio.currentTime + 60;
          audio.currentTime = Math.min(audio.currentTime + 10, d)
        })
      }

      return () => {
        audio.pause()
        audio.removeEventListener('timeupdate', updateProgress)
        audio.removeEventListener('loadedmetadata', onLoadedMetadata)
        audio.removeEventListener('durationchange', onDurationChange)
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('play', onPlay)
        audio.removeEventListener('pause', onPause)
        audio.removeEventListener('playing', updateProgress)
      }
    }
  }, [])

  // Timer de secours pour iPhone : force la mise à jour du temps toutes les 250ms (plus fréquent)
  useEffect(() => {
    let interval;
    if (isPlaying && audioRef.current) {
      interval = setInterval(() => {
        const audio = audioRef.current;
        let d = audio.duration;
        const c = audio.currentTime || 0;

        // Fallback pour durée Infinity
        if ((d === Infinity || isNaN(d) || !d) && currentSong?.duration > 0) {
          d = currentSong.duration
        }

        setCurrentTime(c);
        if (d && d !== Infinity && !isNaN(d)) {
          setDuration(d);
          setProgress((c / d) * 100 || 0);
        } else if (d === Infinity || isNaN(d)) {
           // Si toujours Infinity, on essaie de voir si ça a changé
           // Sur certains flux, la durée n'apparaît qu'après quelques secondes de lecture
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentSong && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Melofy Track',
        artist: currentSong.style || 'AI Generated',
        album: 'Melofy',
        artwork: [
          { src: currentSong.image_url || '/logo-square.png', sizes: '512x512', type: 'image/png' }
        ]
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [currentSong, isPlaying])

  const [volume, setVolume] = useState(1)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const changeVolume = (val) => {
    const v = Math.max(0, Math.min(1, val))
    setVolume(v)
  }

  const playSong = (song, currentPlaylist = []) => {
    if (!audioRef.current || !song) return

    if (currentPlaylist && Array.isArray(currentPlaylist) && currentPlaylist.length > 0) {
      setPlaylist(currentPlaylist)
      const index = currentPlaylist.findIndex(s => s.id === song.id)
      setCurrentIndex(index)
    }

    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e)
          setIsPlaying(false)
        })
      }
    } else {
      setCurrentSong(song)
      // Reset state for new song
      setDuration(0)
      setCurrentTime(0)
      setProgress(0)

      audioRef.current.src = song.audio_url || song.audio
      audioRef.current.load()
      // S'assurer que le volume est appliqué au nouvel audio
      audioRef.current.volume = volume
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e)
        setIsPlaying(false)
      })
    }
  }

  const playNext = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      const nextSong = playlist[nextIndex]
      setCurrentIndex(nextIndex)
      playSong(nextSong, playlist)
    }
  }

  const playPrevious = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prevSong = playlist[prevIndex]
      setCurrentIndex(prevIndex)
      playSong(prevSong, playlist)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e)
        setIsPlaying(false)
      })
    }
  }

  const stopPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setCurrentSong(null)
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setPlaylist([])
    setCurrentIndex(-1)
  }

  const seek = (percent) => {
    if (!audioRef.current || !audioRef.current.duration || audioRef.current.duration === Infinity) return
    const time = (percent / 100) * audioRef.current.duration
    audioRef.current.currentTime = time
    setProgress(percent)
    setCurrentTime(time)
  }

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, progress, duration, currentTime, playlist, currentIndex, volume,
      playSong, togglePlay, stopPlayer, seek, playNext, playPrevious, setVolume: changeVolume
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
