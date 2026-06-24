'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { UserMenu } from '@/components/UserMenu'

interface HistoryRecord {
  id:           string
  user_email:   string
  report_title: string
  created_at:   string
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function SortAscIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function SortDescIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const sorted = sortDesc ? records : [...records].reverse()

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

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5"><ClockIcon /></div>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">אין דוחות עדיין</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
              הדוחות שתפיקו יישמרו כאן אוטומטית לאחר כל ניתוח.
            </p>
          </div>
        )}

        {/* Report list */}
        {!loading && records.length > 0 && (
          <>
            {/* Sort control */}
            <div className="flex justify-start mb-4">
              <button
                onClick={() => setSortDesc(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                  text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                  hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm"
              >
                {sortDesc ? <SortDescIcon /> : <SortAscIcon />}
                {sortDesc ? 'מהחדש לישן' : 'מהישן לחדש'}
              </button>
            </div>

            <ul className="space-y-2.5">
              {sorted.map(rec => (
                <li key={rec.id}>
                  <button
                    onClick={() => router.push(`/report/${rec.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-right
                      bg-white dark:bg-slate-800/60
                      border border-slate-200/80 dark:border-white/10
                      hover:border-blue-300 dark:hover:border-blue-700
                      hover:shadow-sm transition-all duration-200 group"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                      bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400
                      group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                      <FileTextIcon />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {rec.report_title}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 text-slate-300 dark:text-slate-600
                      group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors">
                      <ChevronLeftIcon />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}
