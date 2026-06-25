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
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

const FORMATS = [
  { badge: 'מבחן 1', title: 'פורמט שורות', filename: 'Lined.pdf', download: 'דף-שורות.pdf', preview: '/linedFormat.png' },
  { badge: 'מבחן 2', title: 'פורמט חלק',   filename: 'Blank.pdf', download: 'דף-חלק.pdf',   preview: '/blankFormat.png' },
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
          <h1 className="text-sm font-bold text-slate-800 dark:text-white">הורדת פורמטים</h1>
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

      <main className="pt-6 pb-12 px-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {FORMATS.map(fmt => (
            <div key={fmt.badge}
              className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800
                rounded-3xl overflow-hidden shadow-sm flex flex-col">

              {/* Card header */}
              <div className="px-4 py-4 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md flex-shrink-0
                    bg-slate-800 dark:bg-slate-700 text-white text-[11px] font-black">
                    {fmt.badge}
                  </span>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate">{fmt.title}</h2>
                </div>
                <a
                  href={`/${fmt.filename}`}
                  download={fmt.download}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0
                    bg-slate-900 dark:bg-white text-white dark:text-slate-900
                    text-xs font-bold
                    hover:bg-slate-700 dark:hover:bg-slate-100
                    transition-colors duration-200 shadow-sm"
                >
                  <DownloadIcon />
                  הורד
                </a>
              </div>

              {/* Format preview image */}
              <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={fmt.preview}
                    alt={fmt.title}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
