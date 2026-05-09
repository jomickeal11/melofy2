import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = req.body
  console.log('Maketou Webhook Payload:', payload)

  // Maketou peut envoyer les données directement ou dans un objet 'data'
  const data = payload.data || payload
  const status = (data.status || data.event || payload.status || payload.event || '').toUpperCase()
  
  const meta = data.meta || data.metadata || payload.meta || payload.metadata
  const userId = meta?.user_id
  const creditsToAdd = parseInt(meta?.credits || 0)

  console.log('Webhook evaluation:', { status, userId, creditsToAdd })

  const isSuccess = ['SUCCESS', 'COMPLETED', 'PAYMENT_SUCCESS', 'PAYMENT_COMPLETED'].includes(status)

  if (isSuccess && userId && creditsToAdd > 0) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // 1. Récupérer le profil actuel pour voir combien de crédits il a
      const { data: profile, error: getError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (getError) throw getError

      const newCredits = (profile?.credits || 0) + creditsToAdd

      // 2. Mettre à jour les crédits
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          credits: newCredits,
          plan: 'premium'
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // 3. Enregistrer la transaction dans la table 'orders'
      await supabaseAdmin.from('orders').insert({
        user_id: userId,
        amount: payload.amount || 0,
        currency: payload.currency || 'XOF',
        status: 'paid',
        payment_ref: payload.transaction_id || payload.id
      })

      return res.status(200).json({ received: true })
    } catch (error) {
      console.error('Webhook processing error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // Si le statut n'est pas succès, on acquitte quand même la réception
  return res.status(200).json({ received: true, status: 'ignored' })
}
