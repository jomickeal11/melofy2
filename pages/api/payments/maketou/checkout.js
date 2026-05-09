import { createClient } from '@supabase/supabase-js'

const PRICES = {
  pack_2: 100,
  pack_6: 1200,
  pack_15: 2500
}

const CREDITS = {
  pack_2: 2,
  pack_6: 6,
  pack_15: 15
}

const PROMO_PACK_ENV_KEYS = {
  pack_2: ['PACK_DUO_PROMO', 'PACK_DUO_350'],
  pack_6: ['PACK_TRIO_PROMO', 'PACK_TRIO_840'],
  pack_15: ['PACK_FETE_PROMO', 'PACK_FETE_1750']
}

function getFirstEnv(keys) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key]
  }
  return ''
}

// ✅ Extrait l'ID de session depuis n'importe quelle structure de réponse Maketou
function extractSessionId(data) {
  return (
    data?.id ||
    data?.cartId ||
    data?.cart_id ||
    data?.session_id ||
    data?.sessionId ||
    data?.checkoutId ||
    data?.checkout_id ||
    data?.data?.id ||
    data?.data?.cartId ||
    data?.data?.cart_id ||
    data?.data?.session_id ||
    data?.data?.sessionId ||
    data?.data?.checkoutId ||
    data?.data?.checkout_id ||
    null
  )
}

// ✅ Extrait l'URL de paiement depuis n'importe quelle structure de réponse Maketou
function extractPaymentUrl(data) {
  return (
    data?.redirectUrl ||
    data?.redirect_url ||
    data?.url ||
    data?.paymentUrl ||
    data?.payment_url ||
    data?.checkoutUrl ||
    data?.checkout_url ||
    data?.link ||
    data?.data?.redirectUrl ||
    data?.data?.redirect_url ||
    data?.data?.url ||
    data?.data?.paymentUrl ||
    data?.data?.payment_url ||
    data?.data?.checkoutUrl ||
    data?.data?.checkout_url ||
    data?.data?.link ||
    null
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { packId, userId, userEmail } = req.body
  const tag = `[Checkout][${packId}]`

  if (!packId || !userId) {
    return res.status(400).json({ error: 'Parametres manquants' })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('has_invited, created_at, email, display_name')
      .eq('id', userId)
      .single()

    const now = Date.now()
    const creation = new Date(profile?.created_at || now).getTime()
    const isPromoActive = (now - creation) % (7 * 24 * 60 * 60 * 1000) < (30 * 60 * 1000)
    const hasDiscount = isPromoActive && profile?.has_invited

    const baseAmount = PRICES[packId]
    if (!baseAmount) return res.status(400).json({ error: 'Pack invalide' })
    const finalAmount = hasDiscount ? Math.round(baseAmount * 0.7) : baseAmount

    const packMap = {
      pack_2: hasDiscount ? getFirstEnv(PROMO_PACK_ENV_KEYS.pack_2) : process.env.PACK_DUO_500,
      pack_6: hasDiscount ? getFirstEnv(PROMO_PACK_ENV_KEYS.pack_6) : process.env.PACK_TRIO_1200,
      pack_15: hasDiscount ? getFirstEnv(PROMO_PACK_ENV_KEYS.pack_15) : process.env.PACK_FETE_2500
    }

    const productDocumentId = packMap[packId]
    if (!productDocumentId) {
      console.error(`${tag} ID Maketou manquant pour le pack ${packId} (Promo: ${hasDiscount})`)
      return res.status(500).json({ error: 'Configuration produit manquante' })
    }

    console.log(`${tag} Creation panier - user=${userId}, final=${finalAmount} FCFA`)

    const response = await fetch('https://api.maketou.net/api/v1/stores/cart/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MAKETOU_API}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productDocumentId,
        email: profile?.email || userEmail || 'client@melofy.com',
        firstName: profile?.display_name || 'Client',
        lastName: 'Melofy',
        customerPrice: finalAmount,
        // ✅ Plus de {CHECKOUT_SESSION_ID} — Maketou ne supporte pas cette syntaxe Stripe
        // L'ID est récupéré via la réponse et stocké dans localStorage côté client
        redirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/payment-confirmation?status=success`,
        meta: {
          user_id: userId,
          pack_id: packId,
          credits: CREDITS[packId],
          is_promo: hasDiscount,
          expected_amount: finalAmount
        }
      })
    })

    const data = await response.json()

    // ✅ Log complet pour diagnostiquer la structure de réponse Maketou
    console.log(`${tag} Réponse Maketou complète :`, JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error(`${tag} Erreur Maketou:`, data)
      return res.status(response.status).json({ error: data.message || 'Erreur Maketou' })
    }

    const paymentUrl = extractPaymentUrl(data)
    const sessionId = extractSessionId(data)

    // ✅ Log des valeurs extraites pour vérification
    console.log(`${tag} URL extraite : ${paymentUrl}`)
    console.log(`${tag} Session ID extrait : ${sessionId}`)

    if (!paymentUrl) {
      console.error(`${tag} Impossible de trouver l'URL dans :`, data)
      return res.status(500).json({ error: 'URL de paiement introuvable. Vérifie les logs serveur.' })
    }

    if (!sessionId) {
      // ⚠️ On continue quand même — le confirm utilisera le fallback localStorage si possible
      console.warn(`${tag} Session ID introuvable dans la réponse Maketou. Le confirm devra utiliser un autre mécanisme.`)
    } else {
      // ✅ Pré-enregistrement du panier en BD pour servir de fallback serveur
      // (au cas où le localStorage du client serait perdu à la redirection)
      const { error: preLogError } = await supabaseAdmin.from('payment_logs').insert({
        cart_id: sessionId,
        user_id: userId,
        tier: packId,
        status: 'pending',
        processed_at: new Date().toISOString()
      })
      if (preLogError && preLogError.code !== '23505') {
        console.warn(`${tag} Echec pre-enregistrement payment_logs:`, preLogError)
      }
    }

    return res.status(200).json({ success: true, url: paymentUrl, sessionId })
  } catch (error) {
    console.error('Checkout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}