import { getPublicSong } from '../../lib/song-service'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID manquant' })

  try {
    const song = await getPublicSong(id)

    if (!song) {
      return res.status(404).json({ error: 'Chanson introuvable ou privée' })
    }

    return res.status(200).json(song)
  } catch (err) {
    console.error('API share-data error:', err)
    return res.status(500).json({ error: 'Erreur serveur lors de la récupération' })
  }
}
