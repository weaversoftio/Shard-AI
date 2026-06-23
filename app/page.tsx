'use client'

import { useSession, signIn } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormatModal } from '@/components/FormatModal'
import { UserMenu } from '@/components/UserMenu'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function PenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

// ── Gender modal ───────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { id: 'male',   label: 'גבר',   sub: 'הדוח יכתב בלשון זכר' },
  { id: 'female', label: 'אישה',  sub: 'הדוח יכתב בלשון נקבה' },
  { id: 'other',  label: 'אחר',   sub: 'הדוח יכתב בלשון ניטרלית' },
] as const

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function GenderModal({
  onSelect,
  onClose,
}: {
  onSelect: (gender: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/40 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl
        border border-slate-200 dark:border-slate-700 shadow-2xl shadow-black/20 p-8 space-y-6">

        {/* Header with X */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">פנייה בדוח</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              כיצד תרצה/י שנתייחסו אליך בדוח הגרפולוגי?
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="p-2 -mt-1 -ml-1 rounded-xl text-slate-400 hover:text-slate-700
              dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700
              transition-colors flex-shrink-0"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="w-full py-4 px-5 rounded-2xl border-2 border-slate-200
                dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500
                hover:bg-blue-50/60 dark:hover:bg-blue-950/30
                text-right transition-all duration-150 group"
            >
              <span className="block text-base font-semibold text-slate-800 dark:text-slate-100
                group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {opt.label}
              </span>
              <span className="block text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                {opt.sub}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showFormatModal, setShowFormatModal] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Auto-open gender modal when navigating back from the upload page
  useEffect(() => {
    if (status !== 'authenticated') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('selectGender') === '1') {
      setShowGenderModal(true)
      window.history.replaceState({}, '', '/')
    }
  }, [status])

  const isLoggedIn = status === 'authenticated'
  const isLoading  = status === 'loading'

  const handleGenderSelect = (gender: string) => {
    setShowGenderModal(false)
    router.push(`/analysis?gender=${gender}`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500
      bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
      dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 dark:opacity-10
          bg-gradient-to-r from-blue-400 to-violet-400" />
      </div>

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-4">
        <div />
        <div className="flex items-center gap-2.5">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-full flex items-center justify-center
                bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
                border border-slate-200/80 dark:border-slate-700/80
                text-slate-500 dark:text-slate-400
                hover:text-slate-700 dark:hover:text-slate-200
                hover:bg-white dark:hover:bg-slate-700
                transition-all duration-200 shadow-sm"
              aria-label="החלף מצב תצוגה"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pb-8 pt-20">
        <div className="text-center w-full max-w-md mx-auto animate-slide-up">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center
              bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
              border border-slate-200/60 dark:border-slate-700/60
              shadow-lg shadow-blue-500/10">
              <PenIcon />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600
              dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400
              bg-clip-text text-transparent">
              SHARD
            </span>
            <span className="text-slate-800 dark:text-white"> AI</span>
          </h1>

          {/* Divider */}
          <div className="flex justify-center my-5">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          </div>

          <p className="text-2xl sm:text-3xl font-semibold text-slate-700 dark:text-slate-200 mb-2 leading-snug">
            דוח גרפולוגיה
          </p>
          <p className="text-base text-slate-400 dark:text-slate-500 mb-12 font-normal">
            ניתוח כתב יד חכם מבוסס בינה מלאכותית
          </p>

          {/* CTA */}
          {isLoading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : isLoggedIn ? (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                ברוך הבא,{' '}
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {session?.user?.name?.split(' ')[0] ?? 'משתמש'}
                </span>
              </p>
              <button
                onClick={() => setShowGenderModal(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                  bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600
                  hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500
                  text-white font-bold text-lg rounded-2xl
                  shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                  transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95
                  w-full sm:w-auto"
              >
                התחל ניתוח
              </button>
              {/* Instructions — visible to authenticated users only */}
              <button
                onClick={() => setShowFormatModal(true)}
                className="px-6 py-2.5 text-sm font-medium rounded-xl
                  bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
                  border border-slate-200 dark:border-slate-700
                  text-slate-500 dark:text-slate-400
                  hover:text-slate-700 dark:hover:text-slate-200
                  hover:bg-white dark:hover:bg-slate-700
                  transition-all duration-200 shadow-sm"
              >
                הוראות ופורמט
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="inline-flex items-center justify-center gap-3 px-6 py-3.5
                bg-white dark:bg-slate-800
                hover:bg-slate-50
                text-slate-700 dark:text-slate-200 font-semibold text-base
                rounded-2xl border border-slate-200 dark:border-slate-700
                shadow-md hover:shadow-lg
                transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95
                w-full sm:w-auto"
            >
              <span>כניסה עם Google</span>
              <GoogleIcon />
            </button>
          )}
        </div>
      </main>

      {showFormatModal && <FormatModal onClose={() => setShowFormatModal(false)} />}
      {showGenderModal && (
        <GenderModal
          onSelect={handleGenderSelect}
          onClose={() => setShowGenderModal(false)}
        />
      )}
    </div>
  )
}
