export default async function handler(req, res) {
  const { url, title } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du fichier (${response.status})`);
    }

    // Nettoyage du titre pour éviter les caractères bizarres sur mobile
    const safeTitle = (title || 'Melofy-Chanson')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents (é -> e)
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Enlever tout sauf lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, ' '); // Éviter les doubles espaces
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // On repasse sur 'audio/mpeg' (standard Apple pour la durée)
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Erreur download:', error);
    res.status(500).json({ error: 'Impossible de télécharger la chanson' });
  }
}
