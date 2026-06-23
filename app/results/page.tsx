'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Stepper } from '@/components/Stepper'
import { UserMenu } from '@/components/UserMenu'

// ── Types ──────────────────────────────────────────────────────────────────────
type Stage = 'analyzing' | 'words' | 'personality' | 'report' | 'done' | 'error'

interface ProgressEvent {
  stage:        Stage
  message?:     string
  scores?:      Record<string, Record<string, number>>
  report?:      string
  line_count?:  number
  num_columns?: number
}

const LOADING_STAGES: { id: Stage; label: string }[] = [
  { id: 'analyzing',   label: 'מאבחן כתב...' },
  { id: 'words',       label: 'מנתח מילים...' },
  { id: 'personality', label: 'מנתח אישיות...' },
  { id: 'report',      label: 'מפיק דוח...' },
]

const SCORE_LABELS: Record<string, string> = {
  slant:                 'נטיית כתב',
  baseline:              'קו בסיס',
  stroke_thickness:      'עובי קו',
  baseline_slope:        'נטיית קו בסיס',
  roundness:             'עגלות',
  word_spacing:          'מרווח בין מילים',
  letter_size_regular:   'גודל אותיות רגיל',
  letter_size_signature: 'גודל חתימה',
  right_margin:          'שוליים ימין',
  left_margin:           'שוליים שמאל',
  top_margin:            'שוליים עליון',
  bottom_margin:         'שוליים תחתון',
  column_spacing:        'מרווח בין עמודות',
}

const CATEGORY_LABELS: Record<string, string> = {
  spacing:  'מרווח ופריסה',
  pressure: 'קו ולחץ',
  position: 'בסיס ומיקום',
  slant:    'נטייה',
  shape:    'צורה',
}

// ── Icon components ────────────────────────────────────────────────────────────
function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
  )
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
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
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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

// ── Markdown → JSX ────────────────────────────────────────────────────────────
function renderReport(text: string) {
  return text.split('\n').map((line, i) => {
    const t = line.trim()
    if (!t) return null
    if (t === '---') return <hr key={i} className="border-slate-200 dark:border-slate-700 my-5" />
    if (t.startsWith('### ')) return (
      <h4 key={i} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-5 mb-1.5">{t.slice(4)}</h4>
    )
    if (t.startsWith('## ')) return (
      <h3 key={i} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">{t.slice(3)}</h3>
    )
    if (t.startsWith('# ')) return (
      <h2 key={i} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-7 mb-3">{t.slice(2)}</h2>
    )
    return <p key={i} className="leading-relaxed">{t}</p>
  })
}

// ── Score bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">{value.toFixed(3)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Loading screen — no X, no profile icon, shows stepper at step 3 ────────────
function LoadingScreen({ currentStage }: { currentStage: string }) {
  const currentIdx = LOADING_STAGES.findIndex(s => s.id === currentStage)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center
      bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
      dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40
      px-4" dir="rtl">

      {/* Stepper — step 3 (ניתוח) is active */}
      <div className="mb-12">
        <Stepper active={3} />
      </div>

      {/* Stage steps */}
      <div className="w-full max-w-sm space-y-4">
        {LOADING_STAGES.map((stage, idx) => {
          const isDone    = idx < currentIdx
          const isActive  = idx === currentIdx
          const isPending = idx > currentIdx

          return (
            <div key={stage.id}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-sm'
                  : isDone
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                    : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-slate-800 opacity-40'
                }`}>

              <div className={`flex-shrink-0 ${isDone ? 'text-emerald-500' : isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                {isDone
                  ? <CheckCircleIcon />
                  : isActive
                    ? <SpinnerIcon />
                    : <div className="w-5 h-5 rounded-full border-2 border-current opacity-30" />
                }
              </div>

              <span className={`text-sm font-medium ${
                isActive  ? 'text-blue-700 dark:text-blue-300'
                : isDone  ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-600'
              }`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pulsing dots */}
      <div className="mt-10 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Report screen — has stepper (step 4), X button, and user menu ──────────────
function ReportScreen({
  report,
  scores,
  onDownload,
  onBack,
  onCleanup,
}: {
  report:     string
  scores:     Record<string, Record<string, number>> | null
  onDownload: () => void
  onBack:     () => void
  onCleanup:  () => Promise<void>
}) {
  const { theme, setTheme } = useTheme()
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen
      bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
      dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40
      transition-colors duration-300 print:bg-white" dir="rtl">

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-report { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          .print-report-body { padding: 0 !important; }
          body { background: white !important; color: #1e293b !important; }
          h2, h3, h4 { color: #0f172a !important; }
          p { color: #334155 !important; }
          hr { border-color: #e2e8f0 !important; }
        }
      `}</style>

      {/* Header — X right | stepper truly centered | theme+user left */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/10
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-3">
        <div className="relative flex items-center h-9">

          {/* X button — pinned to physical right */}
          <button
            onClick={onBack}
            aria-label="יציאה"
            className="absolute right-0 w-8 h-8 rounded-full flex items-center justify-center
              text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon />
          </button>

          {/* Stepper — truly centered regardless of side widths */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Stepper active={4} />
          </div>

          {/* Theme + user menu — pinned to physical left */}
          <div className="absolute left-0 flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400
                dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <UserMenu onBeforeSignOut={onCleanup} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8 print:max-w-none print:px-0 print:py-0">

        {/* Report card */}
        <div className="print-report bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200/80
          dark:border-white/10 shadow-sm overflow-hidden">

          {/* Card header — screen only */}
          <div className="no-print px-8 py-6 border-b border-slate-100 dark:border-white/10 bg-gradient-to-l
            from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">דוח גרפולוגי</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              הדוח הינו בגדר המלצה בלבד. התוצאות מדוייקות יותר עבור כותבים ביד ימין.
            </p>
          </div>

          {/* Print-only title */}
          <div className="hidden print:block px-8 pt-8 pb-4 border-b border-slate-200 text-center">
            <h1 className="text-2xl font-bold text-slate-900">דוח גרפולוגי</h1>
            <p className="text-xs text-slate-500 mt-1.5">
              הדוח הינו בגדר המלצה בלבד. התוצאות מדוייקות יותר עבור כותבים ביד ימין.
            </p>
          </div>

          {/* Report body */}
          <div className="print-report-body px-8 py-7 space-y-3 text-slate-700 dark:text-slate-300
            text-[15px]">
            {renderReport(report)}
          </div>
        </div>

        {/* Action buttons — hidden in print */}
        <div className="no-print flex gap-3 justify-start">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
              bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm">
            <DownloadIcon />
            הורד כ-PDF
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
              bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60
              transition-colors shadow-sm">
            <HomeIcon />
            חזרה לדף הבית
          </button>
        </div>

        {/* Debug scores — dev mode only */}
        {isDev && scores && (
          <details className="no-print group">
            <summary className="cursor-pointer text-xs text-slate-400 dark:text-slate-600
              hover:text-slate-600 dark:hover:text-slate-400 transition-colors select-none
              list-none flex items-center gap-1.5">
              <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
              פירוט ציונים (מצב פיתוח)
            </summary>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Object.entries(scores).map(([category, features]) => {
                if (Object.keys(features).length === 0) return null
                return (
                  <div key={category}
                    className="bg-white/70 dark:bg-slate-800/40 rounded-2xl border
                      border-slate-200/60 dark:border-white/10 p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {CATEGORY_LABELS[category] ?? category}
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(features).map(([key, val]) => (
                        <ScoreBar
                          key={key}
                          label={SCORE_LABELS[key] ?? key}
                          value={val}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </main>
    </div>
  )
}

// ── Error screen ───────────────────────────────────────────────────────────────
function ErrorScreen({
  error,
  onBack,
  onCleanup,
}: {
  error: string
  onBack: () => void
  onCleanup: () => Promise<void>
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col
      bg-gradient-to-br from-slate-50 to-red-50/30
      dark:from-gray-950 dark:to-red-950/10" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/10
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            aria-label="יציאה"
            className="w-8 h-8 rounded-full flex items-center justify-center
              text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400
                dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <UserMenu onBeforeSignOut={onCleanup} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-3xl border
          border-red-200 dark:border-red-900/60 shadow-sm p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center
            justify-center mx-auto text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">שגיאה בניתוח</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white
              dark:text-slate-900 font-medium text-sm hover:opacity-90 transition-opacity">
            חזרה לדף הבית
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page (wrapped in Suspense for useSearchParams) ────────────────────────
function ResultsContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const sessionId    = searchParams.get('sessionId') ?? ''
  const gender       = searchParams.get('gender') ?? 'other'

  const [currentStage, setCurrentStage] = useState<string>('analyzing')
  const [report,       setReport]       = useState<string>('')
  const [scores,       setScores]       = useState<Record<string, Record<string, number>> | null>(null)
  const [error,        setError]        = useState<string>('')
  const [isDone,       setIsDone]       = useState(false)
  const esRef = useRef<EventSource | null>(null)

  const cleanupSession = useCallback(async () => {
    if (!sessionId) return
    try {
      await fetch(`/api/session/cleanup?sessionId=${sessionId}`, { method: 'DELETE' })
    } catch { /* best effort */ }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) {
      setError('מזהה סשן חסר')
      return
    }

    const es = new EventSource(
      `/api/analysis/start?sessionId=${encodeURIComponent(sessionId)}&gender=${encodeURIComponent(gender)}`
    )
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data: ProgressEvent = JSON.parse(e.data)
        setCurrentStage(data.stage)

        if (data.stage === 'done') {
          setReport(data.report ?? '')
          setScores(data.scores ?? null)
          setIsDone(true)
          es.close()
        } else if (data.stage === 'error') {
          setError(data.message ?? 'שגיאה לא ידועה')
          es.close()
        }
      } catch { /* ignore parse errors */ }
    }

    es.onerror = () => {
      if (!isDone) {
        setError('שגיאה בחיבור לשרת הניתוח')
        es.close()
      }
    }

    return () => es.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Cleanup on tab close
  useEffect(() => {
    const cleanup = () => {
      if (sessionId) navigator.sendBeacon(`/api/session/cleanup?sessionId=${sessionId}`)
    }
    window.addEventListener('beforeunload', cleanup)
    return () => window.removeEventListener('beforeunload', cleanup)
  }, [sessionId])

  const handleBack = async () => {
    await cleanupSession()
    router.push('/')
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  if (error) {
    return <ErrorScreen error={error} onBack={handleBack} onCleanup={cleanupSession} />
  }

  if (!isDone) {
    return <LoadingScreen currentStage={currentStage} />
  }

  return (
    <ReportScreen
      report={report}
      scores={scores}
      onDownload={handleDownloadPDF}
      onBack={handleBack}
      onCleanup={cleanupSession}
    />
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
        dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
