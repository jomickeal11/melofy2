import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const diagnostics = {
    supabase: {
      url_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_role_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      is_service_role_format: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('service_role') || process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('sb_secret') || false,
      connection_ok: false,
      error: null
    },
    maketou: {
      api_key_present: !!process.env.MAKETOU_API,
      pack_mapping_ok: !!process.env.PACK_DUO_500,
      api_check_ok: false,
      error: null
    },
    env: {
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    }
  }

  // Test Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    // On essaie de récupérer une vraie chanson pour tester la lecture
    const { data, error } = await supabase.from('songs').select('id').limit(1)
    if (error) throw error
    diagnostics.supabase.connection_ok = true
    diagnostics.supabase.sample_song_id = data?.[0]?.id || 'NO_SONGS_FOUND'
  } catch (e) {
    diagnostics.supabase.error = e.message
  }

  // Test Maketou
  try {
    const resM = await fetch('https://api.maketou.net/api/v1/stores/cart/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAKETOU_API}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) 
    })
    const dataM = await resM.json()
    // Si Maketou répond (même une erreur de paramètre), c'est que la clé est vue
    diagnostics.maketou.api_check_ok = resM.status !== 401 && resM.status !== 403 && resM.status !== 404
    diagnostics.maketou.error = dataM.message || `Status: ${resM.status}`
  } catch (e) {
    diagnostics.maketou.error = e.message
  }

  res.status(200).json(diagnostics)
}
