'use client'

import { useSession, signIn } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import Image from 'next/image'

// ── Icons ──────────────────────────────────────────────────────────────────────

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

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function BookOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.1-2.48Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.1-2.48Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Gender Modal ───────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { id: 'male',   label: 'גבר',   sub: 'הדוח יכתב בלשון זכר' },
  { id: 'female', label: 'אישה',  sub: 'הדוח יכתב בלשון נקבה' },
  { id: 'other',  label: 'אחר',   sub: 'הדוח יכתב בלשון נייטרלית' },
] as const

function GenderModal({
  onSelect,
  onClose,
}: {
  onSelect: (gender: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl
        border border-slate-100 dark:border-slate-800 shadow-2xl shadow-black/20 p-8 space-y-6">

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {'פנייה בדוח'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {'כיצד תרצה/י שנתייחסו אליך?'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="p-2 -mt-1 rounded-full text-slate-400
              hover:text-white hover:bg-red-500 dark:hover:bg-red-500
              transition-colors duration-200 flex-shrink-0"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100
                dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600
                hover:bg-slate-50 dark:hover:bg-slate-800/60
                text-right transition-all duration-200 focus:outline-none
                focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span className="block text-base font-semibold text-slate-800 dark:text-slate-100">
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

// ── Feature Card ───────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800
      rounded-2xl p-5 text-right shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700/60
        border border-slate-100 dark:border-slate-700
        flex items-center justify-center mb-3 text-slate-600 dark:text-slate-300">
        {icon}
      </div>
      <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (searchParams.get('selectGender') === '1') {
      setShowGenderModal(true)
      window.history.replaceState({}, '', '/')
    }
  }, [status, searchParams])

  const isLoggedIn = status === 'authenticated'
  const isLoading  = status === 'loading'

  const handleGenderSelect = (gender: string) => {
    setShowGenderModal(false)
    router.push(`/analysis?gender=${gender}`)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-slate-950 transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-4
        bg-[var(--background)]/95 dark:bg-slate-950/95 backdrop-blur-sm
        border-b border-slate-100/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/logo.png" alt="Shard AI" fill unoptimized
              className="object-contain rounded-xl" priority />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-sm tracking-wide hidden sm:block">
            SHARD AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="toggle theme"
              className="w-9 h-9 rounded-full flex items-center justify-center
                bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm
                border border-slate-200/80 dark:border-slate-700/80
                text-slate-500 dark:text-slate-400
                hover:text-slate-700 dark:hover:text-slate-200
                hover:bg-white dark:hover:bg-slate-700
                transition-all duration-200 shadow-sm focus:outline-none"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center justify-center
        min-h-[calc(100vh-65px)] px-5 py-12" dir="rtl">

        {/* Hero */}
        <section className="w-full max-w-lg mx-auto text-center mb-14 animate-slide-up">

          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Shard AI" width={280} height={280}
              unoptimized className="drop-shadow-xl" priority />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white
            tracking-tight leading-tight mb-4">
            {'אבחון גרפולוגי'}
            <br />
            <span className="text-slate-400 dark:text-slate-500 font-light">
              {'מבוסס בינה מלאכותית'}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400
            leading-relaxed max-w-sm mx-auto mb-8">
            {'כלי מתקדם לאבחון גרפולוגי אקדמי — מנתח את כתב היד שלך ומפיק דוח אישיות מפורט ומקצועי.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
              'מבוסס מחקר אקדמי',
              'פרטיות מלאה',
              'תוצאות בדקות',
            ].map(badge => (
              <span key={badge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700
                  text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {badge}
              </span>
            ))}
          </div>

          {/* CTA */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
            </div>
          ) : isLoggedIn ? (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {'שלום,'}{' '}
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {session?.user?.name?.split(' ')[0] ?? 'משתמש'}
                </span>
              </p>
              <button
                onClick={() => setShowGenderModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                  px-10 py-4 rounded-2xl
                  bg-slate-900 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-100
                  text-white dark:text-slate-900 font-bold text-base
                  shadow-md hover:shadow-lg
                  transition-all duration-200 hover:-translate-y-0.5 active:scale-95
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {'התחל ניתוח'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <button
                onClick={() => signIn('google')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3
                  px-7 py-4 rounded-2xl
                  bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                  font-semibold text-base
                  border border-slate-200 dark:border-slate-700
                  shadow-md hover:shadow-lg
                  transition-all duration-200 hover:-translate-y-0.5 active:scale-95
                  focus:outline-none"
              >
                <span>{'כניסה עם Google'}</span>
                <GoogleIcon />
              </button>
              <button
                onClick={() => router.push('/guide')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl
                  text-sm font-medium text-slate-400 hover:text-slate-600
                  dark:text-slate-500 dark:hover:text-slate-300
                  transition-colors duration-200 focus:outline-none"
              >
                <BookOpenIcon />
                {'כיצד זה עובד?'}
              </button>
            </div>
          )}
        </section>

        {/* Feature cards */}
        <section className="w-full max-w-lg mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FeatureCard
              icon={<BrainIcon />}
              title={'אקדמי ומדויק'}
              body={'מתודולוגיה גרפולוגית מבוססת מחקר עם ניתוח AI מתקדם.'}
            />
            <FeatureCard
              icon={<ClockIcon />}
              title={'מהיר ופשוט'}
              body={'תהליך ידידותי — מהגשה לדוח אישי תוך מספר דקות.'}
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title={'פרטי ומאובטח'}
              body={'הנתונים שלך נשמרים רק לצורך הניתוח ולא מועברים לגורם שלישי.'}
            />
          </div>
        </section>

      </main>

      {/* Modals */}
      {showGenderModal && (
        <GenderModal
          onSelect={handleGenderSelect}
          onClose={() => setShowGenderModal(false)}
        />
      )}
    </div>
  )
}
