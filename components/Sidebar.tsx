'use client'

import { useState } from 'react'
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

function HamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'מסך בית',          href: '/',        icon: <HomeIcon />,      disabled: false },
  { label: 'התחל ניתוח',       href: '/analysis', icon: <PlayIcon />,      disabled: false },
  { label: 'מדריך שימוש',      href: '/guide',   icon: <BookIcon />,      disabled: false },
  { label: 'הורדת פורמטים',    href: '/formats', icon: <ClipboardIcon />, disabled: false },
  { label: 'היסטוריית דוחות',  href: '/history', icon: <ClockIcon />,     disabled: false },
] as const

export function Sidebar() {
  const { data: session } = useSession()
  const router   = useRouter()
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!session) return null
  if (pathname.startsWith('/results')) return null

  const onAnalysisPage = pathname.startsWith('/analysis')

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    if (onAnalysisPage && href !== '/analysis') {
      setPendingHref(href)
    } else {
      router.push(href)
    }
  }

  const confirmLeave = () => {
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  return (
    <>
      {/* Mobile hamburger — fixed top-right, only when sidebar is closed */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="פתח תפריט"
          className="print:hidden fixed top-3.5 right-3.5 z-[60] md:hidden
            w-9 h-9 rounded-xl flex items-center justify-center
            bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm
            border border-slate-200/80 dark:border-slate-700
            text-slate-600 dark:text-slate-300 shadow-sm
            transition-colors duration-200
            hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <HamburgerIcon />
        </button>
      )}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="print:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        dir="rtl"
        className={`
          print:hidden
          fixed inset-y-0 right-0 z-50 w-72
          transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:inset-y-auto md:right-auto md:z-auto
          md:h-screen md:w-60 md:flex-shrink-0 md:transition-none
          bg-white dark:bg-slate-900
          border-l border-slate-100 dark:border-slate-800
          flex flex-col overflow-hidden
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4
          border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image src="/logo.png" alt="Shard AI" fill unoptimized className="object-contain rounded-xl" />
            </div>
            <span className="font-black text-slate-800 dark:text-white text-lg tracking-wide">SHARD AI</span>
          </div>
          {/* X — mobile only, on left edge of sidebar */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="סגור תפריט"
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center
              bg-slate-900 text-white dark:bg-white dark:text-slate-900
              hover:bg-slate-700 dark:hover:bg-slate-100 active:bg-slate-800
              transition-all duration-200"
          >
            <XIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="ניווט ראשי">
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
                    onClick={() => !item.disabled && handleNavClick(item.href)}
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

      {/* Confirmation dialog — only shown when on analysis page */}
      {pendingHref && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl
            border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {'לצאת מהניתוח?'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {'היציאה תמחק את ההתקדמות הנוכחית ותצטרך להתחיל מחדש.'}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmLeave}
                className="flex-1 py-2.5 rounded-xl
                  bg-slate-900 dark:bg-white
                  text-white dark:text-slate-900
                  text-sm font-bold
                  hover:bg-slate-700 dark:hover:bg-slate-100
                  transition-colors duration-200"
              >
                {'כן, צא'}
              </button>
              <button
                onClick={() => setPendingHref(null)}
                className="flex-1 py-2.5 rounded-xl
                  border border-slate-200 dark:border-slate-700
                  text-slate-600 dark:text-slate-300
                  text-sm font-semibold
                  hover:bg-slate-50 dark:hover:bg-slate-800
                  transition-colors duration-200"
              >
                {'לא, חזור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
