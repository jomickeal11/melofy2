export default async function handler(req, res) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 6000)

    const probe = await fetch('https://api.ai33.pro/v1/task/1', {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.AI33_API_KEY || ''
      },
      signal: controller.signal
    })
    clearTimeout(id)

    // Maintenance are usually 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    if (probe.status === 502 || probe.status === 503 || probe.status === 504) {
      return res.status(200).json({ isMaintenance: true })
    }

    return res.status(200).json({ isMaintenance: false })
  } catch (err) {
    console.error('Erreur maintenance check:', err)
    // Seul un timeout ou une erreur réseau arrive ici, mais on ne veut pas 
    // effrayer l'utilisateur si c'est juste une micro-coupure locale.
    return res.status(200).json({ isMaintenance: false })
  }
}
