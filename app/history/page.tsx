'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { UserMenu } from '@/components/UserMenu'
import Image from 'next/image'

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
      className="text-slate-300 dark:text-slate-600">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-slate-950 transition-colors duration-300" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5
        bg-[var(--background)]/95 dark:bg-slate-950/95 backdrop-blur-sm
        border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.back()}
            aria-label="חזרה"
            className="w-9 h-9 rounded-xl flex items-center justify-center
              text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
          >
            <ArrowRightIcon />
          </button>
          <h1 className="text-sm font-bold text-slate-800 dark:text-white">היסטוריית דוחות</h1>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="החלף מצב תצוגה"
              className="w-9 h-9 rounded-full flex items-center justify-center
                bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80
                text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                transition-all duration-200 shadow-sm focus:outline-none"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Empty state */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-5">
          <ClockIcon />
        </div>
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
          היסטוריית הדוחות
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed mb-6">
          פיצ'ר זה בפיתוח ויאפשר לכם לצפות בדוחות קודמים שהופקו עבורכם.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full
          bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
          בקרוב
        </span>
      </main>

    </div>
  )
}
