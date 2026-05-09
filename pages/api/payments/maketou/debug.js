import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { session_id } = req.query

  if (!session_id) return res.status(400).json({ error: 'Missing session_id' })

  try {
    const maketouRes = await fetch(`https://api.maketou.net/api/v1/stores/cart/${session_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MAKETOU_API}`,
        'Content-Type': 'application/json'
      }
    })

    const sessionData = await maketouRes.json()
    
    // On renvoie tout pour analyse
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status_code: maketouRes.status,
      raw_data: sessionData,
      extracted_meta: sessionData.data?.meta || sessionData.meta || 'NOT_FOUND',
      instruction: "Vérifie si tu vois 'user_id' et 'credits' dans 'raw_data' ou 'extracted_meta'"
    })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
