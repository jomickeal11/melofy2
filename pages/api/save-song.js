import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { track, metadata, songId } = req.body;
  if (!songId && (!track || !metadata)) return res.status(400).json({ error: 'Données manquantes' })

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

    const { titre } = req.body;
    
    // Déterminer si le titre actuel est un titre par défaut du système
    const defaultTitleSimple = metadata?.occasion ? `Chanson pour ${metadata.occasion}` : null;
    const defaultTitleAvance = metadata?.style ? `Chanson ${metadata.style}` : null;
    const isSystemDefault = !titre || titre === defaultTitleSimple || titre === defaultTitleAvance || titre === 'Chanson générée';

    // Si c'est un titre par défaut et qu'on a un titre de l'IA, on prend celui de l'IA
    let finalTitle = titre;
    if (isSystemDefault && track?.title && track.title !== 'Untitled' && track.title !== 'Nouvelle chanson' && track.title !== 'Chanson générée') {
      finalTitle = track.title;
    } else if (!finalTitle) {
      finalTitle = track?.title || metadata?.titre || "Chanson générée";
    }

    const imageUrl = track?.image_url || '';
    const finalLyrics = (track || metadata) 
      ? (imageUrl ? `[IMAGE:${imageUrl}]${metadata?.paroles || ''}` : (metadata?.paroles || ''))
      : undefined;

    let song, dbError;

    if (songId) {
      const updatePayload = {
        title: finalTitle,
        status: 'ready',
        is_public: true,
      };
      
      if (track?.audio_url) updatePayload.audio_url = track.audio_url;
      if (finalLyrics !== undefined) updatePayload.lyrics = finalLyrics;
      if (imageUrl) updatePayload.image_url = imageUrl;
      if (track?.id) updatePayload.suno_job_id = track.id;

      let res = await supabaseAdmin
        .from('songs')
        .update(updatePayload)
        .eq('id', songId)
        .select()
        .single();
        
      if (res.error && res.error.message?.includes('column')) {
        // Fallback si la colonne image_url n'existe pas
        delete updatePayload.image_url;
        res = await supabaseAdmin
          .from('songs')
          .update(updatePayload)
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
