import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const GenerationContext = createContext()
const MAX_POLL_ATTEMPTS = 480

export function GenerationProvider({ children }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [songId, setSongId] = useState(null)
  const [status, setStatus] = useState('idle') // idle, pending, success, failed
  const [tracks, setTracks] = useState([])
  const [metadata, setMetadata] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  
  const pollingRef = useRef(null)
  const attemptsRef = useRef(0)

  // 1. Reprise automatique au chargement de l'app
  useEffect(() => {
    const savedGen = localStorage.getItem('melofy_pending_gen')
    if (savedGen) {
      try {
        const { id, meta } = JSON.parse(savedGen)
        setSongId(id)
        setMetadata(meta)
        setIsGenerating(true)
        setStatus('pending')
        pollTask(id)
      } catch (e) {
        localStorage.removeItem('melofy_pending_gen')
      }
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const startGeneration = (id, meta) => {
    // Sauvegarder pour la persistance
    localStorage.setItem('melofy_pending_gen', JSON.stringify({ id, meta }))
    setSongId(id)
    setMetadata(meta)
    setIsGenerating(true)
    setProgress(0)
    setStatus('pending')
    setError(null)
    attemptsRef.current = 0
    
    // Commencer le polling
    pollTask(id)
  }

  const pollTask = (id) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    
    const progInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        const inc = prev < 50 ? 1 : (prev < 80 ? 0.5 : 0.1)
        return Math.min(95, prev + inc)
      })
    }, 1000)

    const checkStatus = async () => {
      attemptsRef.current++
      
      // Laisse jusqu'à ~40 minutes avant d'abandonner côté client
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(progInterval)
        handleGenerationError("La génération prend plus de temps que prévu. Votre chanson apparaîtra dans votre Dashboard une fois terminée.")
        return
      }

      try {
        console.log(`[CONTEXT] Fetching status for songId: ${id}...`)
        const res = await fetch(`/api/poll-task?songId=${id}&t=${Date.now()}`)
        const data = await res.json()
        
        console.log(`[CONTEXT] Status for ${id}: ${data?.status}`, { db: data?.dbStatus, ai: data?.aiStatus, aiId: data?.hasTaskId })

        // Si la chanson n'existe plus (supprimée par l'utilisateur) ou erreur fatale
        if (res.status === 404 || res.status === 400 || (data && data.error === 'Chanson introuvable')) {
          console.warn('[POLL] La chanson est introuvable ou a été supprimée, arrêt de la génération.');
          resetGeneration();
          return;
        }

        if (data && data.status === 'success') {
          console.log('[CONTEXT] Success! Tracks found:', data.tracks?.length)
          clearInterval(progInterval)
          if (pollingRef.current) clearInterval(pollingRef.current)
          
          setProgress(100)
          setTracks(data.tracks || [])
          setStatus('success')
          setIsGenerating(false)
          localStorage.removeItem('melofy_pending_gen')
          
          if (router.pathname !== '/create') {
            toast.success('✨ Votre chanson est prête !', {
              duration: 6000,
              onClick: () => router.push(`/create?songId=${id}`)
            })
          }
        } else if (data && data.status === 'failed') {
          console.error('[CONTEXT] Generation failed:', data.error)
          clearInterval(progInterval)
          if (pollingRef.current) clearInterval(pollingRef.current)
          handleGenerationError(data.error || "Erreur lors de la génération IA.")
        }
      } catch (e) {
        console.error('Polling error:', e)
        // Optionnel : Si l'erreur persiste trop longtemps, on reset
      }
    }

    pollingRef.current = setInterval(checkStatus, 5000)
    checkStatus()
  }

  const handleGenerationError = (msg) => {
    setError(msg)
    setStatus('failed')
    setIsGenerating(false)
    localStorage.removeItem('melofy_pending_gen')
    if (pollingRef.current) clearInterval(pollingRef.current)
    toast.error(msg)
  }

  const resetGeneration = () => {
    setIsGenerating(false)
    setProgress(0)
    setSongId(null)
    setStatus('idle')
    setTracks([])
    setError(null)
    localStorage.removeItem('melofy_pending_gen')
    if (pollingRef.current) clearInterval(pollingRef.current)
  }

  return (
    <GenerationContext.Provider value={{
      isGenerating,
      progress,
      songId,
      status,
      tracks,
      metadata,
      setMetadata,
      error,
      startGeneration,
      resetGeneration
    }}>
      {children}
    </GenerationContext.Provider>
  )
}

export const useGeneration = () => useContext(GenerationContext)
