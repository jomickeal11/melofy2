import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: pending } = await supabaseAdmin
      .from('payment_logs')
      .select('cart_id, status, processed_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('processed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!pending?.cart_id) {
      return res.status(200).json({ cart_id: null })
    }

    return res.status(200).json({ cart_id: pending.cart_id, status: pending.status })
  } catch (error) {
    console.error('[find-pending] error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
