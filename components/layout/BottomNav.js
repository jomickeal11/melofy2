import Link from 'next/link'
import { useRouter } from 'next/router'

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)
const MusicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const tabs = [
  { href: '/',        label: 'Accueil',     Icon: HomeIcon  },
  { href: '/create',  label: 'Créer',       Icon: PlusIcon  },
  { href: '/songs',   label: 'Mes chansons',Icon: MusicIcon },
  { href: '/profile', label: 'Profil',      Icon: UserIcon  },
]

export default function BottomNav() {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex justify-around items-center px-2 py-2 safe-area-bottom fixed-stable"
      style={{ background: 'rgba(13,13,20,0.6)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)', bottom: 0 }}>
      {tabs.map(({ href, label, Icon }) => {
        const active = router.pathname === href
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
            style={{ color: active ? '#6C63FF' : 'rgba(255,255,255,0.4)' }}>
            <Icon />
            <span style={{ fontSize: 10, fontWeight: active ? 500 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
