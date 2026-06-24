'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'מסך בית',          href: '/',               icon: <HomeIcon />,      disabled: false },
  { label: 'התחל ניתוח',       href: '/?selectGender=1', icon: <PlayIcon />,      disabled: false },
  { label: 'מדריך שימוש',      href: '/guide',           icon: <BookIcon />,      disabled: false },
  { label: 'הוראות ופורמטים',  href: '/formats',         icon: <ClipboardIcon />, disabled: false },
  { label: 'היסטוריית דוחות',  href: '/history',         icon: <ClockIcon />,     disabled: false },
] as const

export function Sidebar() {
  const { data: session } = useSession()
  const router   = useRouter()
  const pathname = usePathname()

  if (!session) return null
  if (pathname.startsWith('/results')) return null

  return (
    <aside
      dir="rtl"
      className="w-60 flex-shrink-0 sticky top-0 h-screen
        bg-white dark:bg-slate-900
        border-l border-slate-100 dark:border-slate-800
        flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5
        border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image src="/logo.png" alt="Shard AI" fill unoptimized className="object-contain rounded-lg" />
        </div>
        <span className="font-black text-slate-800 dark:text-white text-sm tracking-wide">SHARD AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="ניווט ראשי">
        <ul className="space-y-1" role="list">
          {NAV_ITEMS.map(item => {
            const isActive = !item.disabled && (
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href as string)
            )
            return (
              <li key={item.label} role="listitem">
                <button
                  onClick={() => !item.disabled && router.push(item.href)}
                  disabled={item.disabled}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl
                    text-right transition-all duration-200
                    ${item.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white dark:text-slate-900' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  {item.disabled && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md
                      bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      בקרוב
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

    </aside>
  )
}
