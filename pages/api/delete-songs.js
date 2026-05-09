import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { songIds } = req.body
  if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
    return res.status(400).json({ error: 'Aucune chanson spécifiée' })
  }

  try {
    // 1. Vérifier l'identité de l'utilisateur avec son token
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: req.headers.authorization || '' } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error('Non autorisé')

    // 2. Utiliser la clé admin pour contourner les règles RLS potentiellement bloquantes
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 3. Supprimer UNIQUEMENT les chansons qui appartiennent à cet utilisateur
    const { error: deleteError } = await supabaseAdmin
      .from('songs')
      .delete()
      .in('id', songIds)
      .eq('user_id', user.id)

    if (deleteError) throw new Error(deleteError.message)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erreur de suppression en DB:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
