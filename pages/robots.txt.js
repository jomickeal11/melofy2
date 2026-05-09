export async function getServerSideProps({ res }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://melofy.africa'

  const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /create
Disallow: /songs
Disallow: /profile
Disallow: /pricing

Sitemap: ${appUrl}/sitemap.xml
`

  res.setHeader('Content-Type', 'text/plain')
  res.write(robots)
  res.end()

  return {
    props: {},
  }
}

export default function Robots() {}
