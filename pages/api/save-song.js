import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { track, metadata } = req.body;
  if (!track || !metadata) return res.status(400).json({ error: 'Données manquantes' })

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Non autorisé')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // --- STRATÉGIE DE RÉTENTION & QUOTA ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await supabaseAdmin
      .from('songs')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', thirtyDaysAgo.toISOString());

    const { data: existingSongs } = await supabaseAdmin
      .from('songs')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (existingSongs && existingSongs.length >= 10) {
      const songsToDelete = existingSongs.slice(9).map(s => s.id);
      await supabaseAdmin
        .from('songs')
        .delete()
        .in('id', songsToDelete);
    }
    // --------------------------------------

    const { track, metadata, titre } = req.body;
    const finalTitle = titre || track?.title || metadata?.titre || "Chanson générée";

    const songId = req.body.songId;
    let song, dbError;

    const imageUrl = track?.image_url || '';
    const finalLyrics = imageUrl ? `[IMAGE:${imageUrl}]${metadata?.paroles || ''}` : (metadata?.paroles || '');

    if (songId) {
      let res = await supabaseAdmin
        .from('songs')
        .update({
          title: finalTitle,
          status: 'ready',
          audio_url: track.audio_url,
          lyrics: finalLyrics,
          image_url: imageUrl,
          suno_job_id: track.id || '',
          is_public: true,
        })
        .eq('id', songId)
        .select()
        .single();
        
      if (res.error && res.error.message?.includes('column')) {
        res = await supabaseAdmin
          .from('songs')
          .update({
            title: finalTitle,
            status: 'ready',
            audio_url: track.audio_url,
            lyrics: finalLyrics,
            suno_job_id: track.id || '',
          })
          .eq('id', songId)
          .select()
          .single();
      }
      song = res.data;
      dbError = res.error;
    } else {
      let res = await supabaseAdmin
        .from('songs')
        .insert({
          user_id: user.id,
          title: finalTitle,
          style: metadata?.style || '',
          lyrics: finalLyrics,
          image_url: imageUrl,
          status: 'ready',
          audio_url: track.audio_url,
          suno_job_id: track.id || '',
          is_public: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (res.error && res.error.message?.includes('column')) {
        res = await supabaseAdmin
          .from('songs')
          .insert({
            user_id: user.id,
            title: finalTitle,
            style: metadata?.style || '',
            lyrics: finalLyrics,
            status: 'ready',
            audio_url: track.audio_url,
            suno_job_id: track.id || '',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }
      song = res.data;
      dbError = res.error;
    }

    if (dbError) throw new Error(dbError.message)
    if (!song) throw new Error('Erreur lors de la sauvegarde du morceau')

    return res.status(200).json({ songId: song.id })

  } catch (error) {
    console.error('Erreur save-song:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
}
