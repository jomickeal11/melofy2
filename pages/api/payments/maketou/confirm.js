import { createClient } from '@supabase/supabase-js'

const PRICES = {
  pack_2: 100,
  pack_6: 1200,
  pack_15: 2500
}

export default async function handler(req, res) {
  const { session_id } = req.query
  const tag = `[Confirm][${session_id || 'unknown'}]`

  console.log(`${tag} === ENTREE handler === method=${req.method}`)

  if (!session_id) {
    console.warn(`${tag} session_id manquant`)
    return res.status(400).json({ error: 'Missing session_id' })
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: existingLog } = await supabaseAdmin
      .from('payment_logs')
      .select('status, user_id, tier')
      .eq('cart_id', session_id)
      .maybeSingle()

    if (existingLog) {
      if (existingLog.user_id !== user.id) {
        return res.status(403).json({ error: 'Transaction non autorisee' })
      }
      if (existingLog.status === 'processed') {
        return res.status(200).json({ success: true, already_processed: true, tier: existingLog.tier || null })
      }
    }

    // 1. On vérifie si une commande existe déjà
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('status, user_id, credits_awarded')
      .eq('payment_ref', session_id)
      .maybeSingle()

    if (existingOrder) {
      if (existingOrder.user_id && existingOrder.user_id !== user.id) {
        return res.status(403).json({ error: 'Transaction non autorisée' })
      }
      if (existingOrder.status === 'paid' && (existingOrder.credits_awarded || 0) > 0) {
        console.log(`${tag} Déjà traité et crédité (idempotence)`)
        return res.status(200).json({ success: true, already_processed: true })
      }
    }

    // 2. On interroge Maketou pour confirmer le statut du paiement
    const maketouRes = await fetch(`https://api.maketou.net/api/v1/stores/cart/${session_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.MAKETOU_API}`,
        'Content-Type': 'application/json'
      }
    })

    if (!maketouRes.ok) {
      console.error(`${tag} Erreur API Maketou (${maketouRes.status})`)
      return res.status(maketouRes.status).json({ error: 'Erreur de communication avec Maketou' })
    }

    const session = await maketouRes.json()
    const status = (session.status || session.data?.status || '').toLowerCase()
    const isPaid = ['completed', 'success', 'paid', 'finished', 'payment_success', 'paye'].includes(status)

    if (!isPaid) {
      return res.status(400).json({ success: false, status, message: 'Paiement non valide' })
    }

    // 3. On récupère les métadonnées
    let meta = session.meta || session.data?.meta
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta) } catch { meta = null }
    }

    const userId = meta?.user_id || meta?.userId
    const packId = meta?.pack_id
    const creditsToAdd = parseInt(meta?.credits || 0, 10)
    
    // 4. --- LOGIQUE DE CALCUL DU PRIX (FALLBACK LOCAL) ---
    const basePrice = PRICES[packId]
    if (!basePrice) {
      return res.status(400).json({ error: 'Pack invalide ou introuvable' })
    }
    const isPromo = meta?.is_promo === true
    const expectedAmount = isPromo ? Math.round(basePrice * 0.7) : basePrice

    if (!userId || creditsToAdd <= 0) {
      return res.status(400).json({ error: 'Métadonnées de session invalides' })
    }

    // --- PHASE DE TRAITEMENT ---
    try {
      // 1. On récupère le profil
      const { data: profile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (profileFetchError) throw profileFetchError

      // 2. Mise à jour atomique des crédits (ou fallback calculé)
      const newCredits = (profile?.credits || 0) + creditsToAdd
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: newCredits,
          plan: 'premium'
        })
        .eq('id', userId)

      if (updateError) throw updateError
      console.log(`${tag} Crédits ajoutés: ${profile?.credits || 0} -> ${newCredits}`)

      // 3. Enregistrement / Mise à jour de la commande
      // On utilise upsert pour marquer comme payé et enregistrer les crédits donnés
      const { error: orderError } = await supabaseAdmin.from('orders').upsert({
        payment_ref: session_id,
        user_id: userId,
        amount: expectedAmount, // On utilise notre prix calculé
        currency: session.currency || 'XOF',
        status: 'paid',
        credits_awarded: creditsToAdd // TRÈS IMPORTANT pour l'idempotence
      }, { onConflict: 'payment_ref' })

      if (orderError) {
        console.error(`${tag} Erreur upsert order:`, orderError)
      }

      // 4. Mise à jour du log technique
      await supabaseAdmin
        .from('payment_logs')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('cart_id', session_id)

      return res.status(200).json({ success: true, creditsAdded: creditsToAdd })
    } catch (processingError) {
      console.error(`${tag} Echec processing:`, processingError.message, processingError)
      await supabaseAdmin
        .from('payment_logs')
        .update({ status: 'failed', tier: packId })
        .eq('cart_id', session_id)
      throw processingError
    }
  } catch (error) {
    console.error(`${tag} Erreur:`, error.message, error)
    return res.status(500).json({ error: error.message || 'Internal server error', tag })
  }
}
