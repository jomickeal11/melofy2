import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { targetUserId, credits } = req.body
  if (!targetUserId || typeof credits !== 'number') return res.status(400).json({ error: 'ID utilisateur ou crédits manquants' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization || '' } } }
  )

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return res.status(401).json({ error: 'Non autorisé' })

    const isAdmin = user.email && (user.email.includes('admin') || user.email.endsWith('@melofy.com') || user.email.endsWith('@melofy.africa'))
    if (!isAdmin) return res.status(403).json({ error: 'Accès refusé' })

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits })
      .eq('id', targetUserId)
      .select()
      .single()

    if (updateError) throw updateError

    return res.status(200).json({ success: true, profile: updatedProfile })

  } catch (error) {
    console.error('Erreur API Admin Update Credits:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
