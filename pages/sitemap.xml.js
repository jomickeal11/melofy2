import { createClient } from '@supabase/supabase-js'
import { BLOG_POSTS } from '../lib/posts'

export async function getServerSideProps({ res }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: songs } = await supabaseAdmin
    .from('songs')
    .select('id, created_at')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(100)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://melofy.africa'

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${appUrl}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>${appUrl}/login</loc>
      <changefreq>monthly</changefreq>
      <priority>0.5</priority>
    </url>
    <url>
      <loc>${appUrl}/signup</loc>
      <changefreq>monthly</changefreq>
      <priority>0.5</priority>
    </url>
    <url>
      <loc>${appUrl}/blog</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
    ${
      BLOG_POSTS && BLOG_POSTS.length > 0
        ? BLOG_POSTS.map(post => `
    <url>
      <loc>${appUrl}/blog/${post.slug}</loc>
      <lastmod>${post.date || new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`).join('')
        : ''
    }
    ${
      songs && songs.length > 0
        ? songs
            .map((song) => {
              return `
    <url>
      <loc>${appUrl}/s/${song.id}</loc>
      <lastmod>${new Date(song.created_at || Date.now()).toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
            })
            .join('')
        : ''
    }
  </urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default function Sitemap() {}
