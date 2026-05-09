import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { songId, title } = req.body
  if (!songId || !title) return res.status(400).json({ error: 'ID de la chanson ou titre manquant' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization || '' } } }
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return res.status(401).json({ error: 'Non autorisé' })

    const { data, error } = await supabase
      .from('songs')
      .update({ title })
      .eq('id', songId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ success: true, song: data })

  } catch (error) {
    console.error('Erreur API update song title:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
