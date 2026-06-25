'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { UserMenu } from '@/components/UserMenu'
import { downloadReportAsPDF } from '@/lib/pdf-download'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SnapshotData {
  report: string
  scores: Record<string, Record<string, number>> | null
}

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

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
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

// ── Score bar ─────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PastReportPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { theme, setTheme } = useTheme()
  const isDev   = process.env.NODE_ENV === 'development'

  const [data,        setData]        = useState<SnapshotData | null>(null)
  const [title,       setTitle]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/history/${id}`)
      .then(r => {
        if (r.status === 401) { router.replace('/?toast=login');  return null }
        if (r.status === 404) { router.replace('/?toast=denied'); return null }
        if (!r.ok)            { throw new Error(String(r.status)) }
        return r.json()
      })
      .then(record => {
        if (!record) return
        setTitle(record.report_title)
        setData(JSON.parse(record.snapshot_data))
        setLoading(false)
      })
      .catch(() => {
        setError('לא ניתן לטעון את הדוח')
        setLoading(false)
      })
  }, [id, router])

  const handleBack     = () => router.push('/history')
  const handleDownload = async () => {
    if (!data) return
    setDownloading(true)
    try { await downloadReportAsPDF(title, data.report) }
    finally { setDownloading(false) }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
        dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40" dir="rtl">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-slate-50 to-red-50/30
        dark:from-gray-950 dark:to-red-950/10" dir="rtl">
        <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-3xl border
          border-red-200 dark:border-red-900/60 shadow-sm p-8 text-center space-y-5 mx-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">שגיאה בטעינת הדוח</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={handleBack}
            className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white
              dark:text-slate-900 font-medium text-sm hover:opacity-90 transition-opacity">
            חזרה להיסטוריה
          </button>
        </div>
      </div>
    )
  }

  // ── Report ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen
      bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
      dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40
      transition-colors duration-300 print:bg-white" dir="rtl">

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, nav, header, [role="navigation"] { display: none !important; }
          .print-report { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          .print-report-body { padding: 0 !important; }
          body { background: white !important; color: #1e293b !important; }
          h2, h3, h4 { color: #0f172a !important; }
          p { color: #334155 !important; }
          hr { border-color: #e2e8f0 !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/10
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-3">
        <div className="flex items-center justify-between h-9">

          {/* Back button — right side (RTL) */}
          <button
            onClick={handleBack}
            aria-label="חזרה להיסטוריה"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
              text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowRightIcon />
            <span>היסטוריה</span>
          </button>

          {/* Title */}
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">
            {title}
          </span>

          {/* Theme + user — left side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400
                dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8 print:max-w-none print:px-0 print:py-0">

        {/* Report card */}
        <div className="print-report bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200/80
          dark:border-white/10 shadow-sm overflow-hidden">

          {/* Card header */}
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
          <div className="print-report-body px-8 py-7 space-y-3 text-slate-700 dark:text-slate-300 text-[15px]">
            {renderReport(data.report)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="no-print flex gap-3 justify-start">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
              bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm
              disabled:opacity-60">
            {downloading
              ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <DownloadIcon />}
            {downloading ? 'יוצר PDF...' : 'הורד כ-PDF'}
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
              bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60
              transition-colors shadow-sm">
            <ArrowRightIcon />
            חזרה להיסטוריה
          </button>
        </div>

        {/* Debug scores — dev only */}
        {isDev && data.scores && (
          <details className="no-print group">
            <summary className="cursor-pointer text-xs text-slate-400 dark:text-slate-600
              hover:text-slate-600 dark:hover:text-slate-400 transition-colors select-none
              list-none flex items-center gap-1.5">
              <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
              פירוט ציונים (מצב פיתוח)
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Object.entries(data.scores).map(([category, features]) => {
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
                        <ScoreBar key={key} label={SCORE_LABELS[key] ?? key} value={val} />
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
