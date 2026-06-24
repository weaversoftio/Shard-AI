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

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

const FORMATS = [
  {
    badge: 'מבחן 1',
    title: 'פורמט שורות',
    filename: 'Lined.pdf',
    download: 'דף-שורות.pdf',
    description: 'הדף המיועד לכתיבת 20 שורות על נושא חופשי + חתימה בתחתית.',
    instructions: [
      'כתבו 20 שורות על נושא לבחירתכם בכתב יד טבעי',
      'חתמו בשורה הקצרה בתחתית הדף',
      'סרקו דרך מדפסת/סורק והעלו כ-PDF',
    ],
  },
  {
    badge: 'מבחן 2',
    title: 'פורמט חלק',
    filename: 'Blank.pdf',
    download: 'דף-חלק.pdf',
    description: 'הדף הריק המיועד לכתיבת המספרים 1 עד 30 בשלושה טורים.',
    instructions: [
      'כתבו את המספרים 1–30 בכתב יד, מסודרים ב-3 טורים',
      '10 מספרים בכל טור (1–10, 11–20, 21–30)',
      'סרקו דרך מדפסת/סורק והעלו כ-PDF',
    ],
  },
]

export default function FormatsPage() {
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
          <h1 className="text-sm font-bold text-slate-800 dark:text-white">הוראות ופורמטים</h1>
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

      <main className="pt-4 pb-12 px-4 max-w-lg mx-auto space-y-5">

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30
          border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3 mt-2">
          <span className="text-blue-500 flex-shrink-0 mt-0.5"><InfoIcon /></span>
          <div className="space-y-1">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              עדיף להשתמש בעט כדורי שחור או כחול.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              לתוצאות מדויקות יותר — סרקו דרך מדפסת/סורק, לא לצלם עם טלפון.
            </p>
          </div>
        </div>

        {/* Format cards */}
        {FORMATS.map(fmt => (
          <div key={fmt.badge}
            className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800
              rounded-3xl overflow-hidden shadow-sm">

            {/* Card header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md
                    bg-slate-800 dark:bg-slate-700 text-white text-[11px] font-black">
                    {fmt.badge}
                  </span>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">{fmt.title}</h2>
                </div>
                <a
                  href={`/${fmt.filename}`}
                  download={fmt.download}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                    bg-slate-900 dark:bg-white text-white dark:text-slate-900
                    text-xs font-bold
                    hover:bg-slate-700 dark:hover:bg-slate-100
                    transition-colors duration-200 shadow-sm flex-shrink-0"
                >
                  <DownloadIcon />
                  הורד PDF
                </a>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {fmt.description}
              </p>
            </div>

            {/* Instructions */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                הוראות
              </p>
              <ol className="space-y-2">
                {fmt.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700
                      text-slate-600 dark:text-slate-300 flex-shrink-0 flex items-center justify-center
                      text-[11px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {inst}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        ))}

        {/* Link to guide */}
        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/guide')}
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600
              dark:hover:text-slate-300 transition-colors duration-200 underline underline-offset-2"
          >
            למדריך שימוש מלא ←
          </button>
        </div>

      </main>
    </div>
  )
}
