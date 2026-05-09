import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })

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

    // Sécurité : Seuls les admins ou emails admin autorisés
    const isAdmin = user.email && (user.email.includes('admin') || user.email.endsWith('@melofy.com') || user.email.endsWith('@melofy.africa'))
    if (!isAdmin) return res.status(403).json({ error: 'Accès refusé. Vous devez être administrateur.' })

    // 1. Chansons
    const { data: songsData } = await supabaseAdmin
      .from('songs')
      .select('id, status, created_at')

    // 2. Commandes/Paiements
    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('id, amount, currency, status, created_at')

    // 3. Profils
    const { data: profilesData } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, credits, plan, created_at')

    // Calculer les statistiques
    const songsCount = songsData ? songsData.length : 0
    const pendingSongs = songsData ? songsData.filter(s => s.status === 'queued' || s.status === 'generating-suno' || s.status === 'generating').length : 0
    const readySongs = songsData ? songsData.filter(s => s.status === 'ready').length : 0

    const usersCount = profilesData ? profilesData.length : 0

    let totalRevenueXOF = 0
    if (ordersData) {
      ordersData.forEach(o => {
        if (o.status === 'paid') {
          totalRevenueXOF += o.amount || 0
        }
      })
    }

    return res.status(200).json({
      stats: {
        songsCount,
        pendingSongs,
        readySongs,
        usersCount,
        totalRevenue: (totalRevenueXOF / 100).toFixed(2),
      },
      profiles: profilesData || [],
      orders: ordersData || [],
      songs: songsData || []
    })

  } catch (error) {
    console.error('Erreur API Admin Stats:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
