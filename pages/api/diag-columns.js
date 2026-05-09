import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'songs' })
  
  if (error) {
    // Si la fonction RPC n'existe pas, on tente une requête directe sur une ligne
    const { data: song } = await supabase.from('songs').select('*').limit(1).single()
    return res.status(200).json({ columns: song ? Object.keys(song) : 'No data' })
  }

  return res.status(200).json({ columns: data })
}
