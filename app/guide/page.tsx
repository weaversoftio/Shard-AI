'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { UserMenu } from '@/components/UserMenu'
import Image from 'next/image'

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

// ── SVG Illustrations ─────────────────────────────────────────────────────────

function IllustrationLinedCorrect() {
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="2" y="2" width="60" height="76" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="7" y="7" width="50" height="66" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1"/>
      {[13,17,21,25,29,33,37,41,45,49,53,57,61,65].map(y =>
        <line key={y} x1="11" y1={y} x2="53" y2={y} stroke="#cbd5e1" strokeWidth="1"/>
      )}
      <path d="M22 68 Q26 63 30 68 Q34 72 38 67" stroke="#475569" strokeWidth="1.5" fill="none"/>
      <line x1="22" y1="70" x2="40" y2="70" stroke="#e2e8f0" strokeWidth="0.8"/>
    </svg>
  )
}

function IllustrationCutFrame() {
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="2" y="2" width="60" height="76" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="7" y="7" width="62" height="62" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2"/>
      {[17,24,31,38,45,52].map(y =>
        <line key={y} x1="11" y1={y} x2="53" y2={y} stroke="#e2e8f0" strokeWidth="1"/>
      )}
      <line x1="62" y1="0" x2="62" y2="80" stroke="#ef4444" strokeWidth="2.5"/>
      <path d="M55 5 L61 11 M55 11 L61 5" stroke="#ef4444" strokeWidth="1.5"/>
    </svg>
  )
}

function IllustrationFewLines() {
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="2" y="2" width="60" height="76" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="7" y="7" width="50" height="66" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1"/>
      {[17,25,33].map(y =>
        <line key={y} x1="11" y1={y} x2="53" y2={y} stroke="#94a3b8" strokeWidth="1.5"/>
      )}
      <text x="32" y="60" textAnchor="middle" fontSize="6.5" fill="#ef4444" fontFamily="sans-serif" fontWeight="bold">רק 3 שורות!</text>
    </svg>
  )
}

function IllustrationNoSignature() {
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="2" y="2" width="60" height="76" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="7" y="7" width="50" height="66" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1"/>
      {[13,17,21,25,29,33,37,41,45,49,53,57].map(y =>
        <line key={y} x1="11" y1={y} x2="53" y2={y} stroke="#e2e8f0" strokeWidth="1"/>
      )}
      <line x1="22" y1="67" x2="42" y2="67" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1"/>
      <line x1="25" y1="62" x2="39" y2="72" stroke="#ef4444" strokeWidth="1.8"/>
      <line x1="39" y1="62" x2="25" y2="72" stroke="#ef4444" strokeWidth="1.8"/>
    </svg>
  )
}

function IllustrationBlankCorrect() {
  const rows = [0,1,2,3,4,5,6,7,8,9]
  const cols = [0,1,2]
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="2" y="2" width="60" height="76" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="6" y="7" width="52" height="66" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1"/>
      {cols.map(col =>
        rows.map(row => (
          <text key={`${col}-${row}`}
            x={13 + col * 17} y={16 + row * 6}
            fontSize="5" fill="#475569" fontFamily="sans-serif">
            {col * 10 + row + 1}
          </text>
        ))
      )}
    </svg>
  )
}

function IllustrationWrongColumns() {
  // 2 columns instead of 3 — wrong count, 10 rows each, all within frame
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="2" y="2" width="60" height="76" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="6" y="7" width="52" height="66" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1"/>
      {[0,1].map(col =>
        [0,1,2,3,4,5,6,7,8,9].map(row => (
          <text key={`${col}-${row}`}
            x={14 + col * 26} y={16 + row * 5}
            fontSize="5" fill="#475569" fontFamily="sans-serif">
            {col * 10 + row + 1}
          </text>
        ))
      )}
      <text x="32" y="68" textAnchor="middle" fontSize="5" fill="#f97316" fontFamily="sans-serif" fontWeight="bold">
        {'2 טורים בלבד'}
      </text>
    </svg>
  )
}

// ── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50
      border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3">
      <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700
        flex items-center justify-center flex-shrink-0 text-white mt-0.5">
        <span className="text-[11px] font-black">{num}</span>
      </div>
      <div className="pt-0.5">
        <p className="font-semibold text-slate-800 dark:text-white text-sm">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{body}</p>
      </div>
    </div>
  )
}

// ── Example Card ──────────────────────────────────────────────────────────────

type ExampleVariant = 'ok' | 'error' | 'warning'

function ExampleCard({
  illustration,
  label,
  desc,
  variant,
}: {
  illustration: React.ReactNode
  label: string
  desc: string
  variant: ExampleVariant
}) {
  const colors = {
    ok:      { border: 'border-emerald-200 dark:border-emerald-900/40', bg: 'bg-emerald-50/60 dark:bg-emerald-950/20', badge: 'bg-emerald-500', label: 'text-emerald-700 dark:text-emerald-400', desc: 'text-emerald-600/80 dark:text-emerald-400/70' },
    error:   { border: 'border-red-200 dark:border-red-900/40',         bg: 'bg-red-50/60 dark:bg-red-950/20',         badge: 'bg-red-500',     label: 'text-red-700 dark:text-red-400',         desc: 'text-red-600/80 dark:text-red-400/70'         },
    warning: { border: 'border-orange-200 dark:border-orange-900/40',   bg: 'bg-orange-50/60 dark:bg-orange-950/20',   badge: 'bg-orange-400',  label: 'text-orange-700 dark:text-orange-400',   desc: 'text-orange-600/80 dark:text-orange-400/70'   },
  }
  const c = colors[variant]
  const icon = variant === 'ok'
    ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : variant === 'error'
      ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
      : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="5" y1="2" x2="5" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="8" r="0.8" fill="white"/></svg>

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-3 flex flex-col gap-2`}>
      <div className={`relative w-full aspect-[4/5] rounded-xl overflow-hidden
        bg-white dark:bg-slate-800 border ${c.border}`}>
        <div className="absolute inset-0 p-2">{illustration}</div>
        <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full ${c.badge}
          flex items-center justify-center`}>{icon}</div>
      </div>
      <div>
        <p className={`text-xs font-bold ${c.label}`}>{label}</p>
        <p className={`text-[11px] ${c.desc} leading-snug mt-0.5`}>{desc}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<1 | 2>(1)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const test1Steps = [
    { num: '01', title: 'הורדת הפורמט', body: 'הורידו את פורמט השורות.' },
    { num: '02', title: 'כתיבת 20 שורות', body: 'כתבו 20 שורות על נושא לבחירתכם.' },
    { num: '03', title: 'חתימה', body: 'חתמו בשורה הקצרה בתחתית הדף. החתימה חיונית לניתוח ואין לדלג עליה.' },
    { num: '04', title: 'סריקת הפורמט', body: 'לתוצאות מדוייקות יותר- לסרוק דרך מדפסת/ סורק. סריקה דרך טלפון עלולה לפגוע בתוצאות הניתוח.' },
    { num: '05', title: 'העלאת הקובץ', body: 'העלו את הקובץ הסרוק כ-PDF בלבד.' },
  ]

  const test2Steps = [
    { num: '01', title: 'הורדת הפורמט', body: 'הורידו את הפורמט החלק.' },
    { num: '02', title: 'כתיבת מספרים 1-30', body: 'כתבו את המספרים 1 עד 30 בכתב יד ברור, מסודרים ב-3 טורים.' },
    { num: '03', title: 'סריקת הפורמט', body: 'לתוצאות מדוייקות יותר- לסרוק דרך מדפסת/ סורק. סריקה דרך טלפון עלולה לפגוע בתוצאות הניתוח.' },
    { num: '04', title: 'העלאת הקובץ', body: 'העלו את הקובץ הסרוק כ-PDF בלבד.' },
  ]

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
          <h1 className="text-sm font-bold text-slate-800 dark:text-white">מדריך שימוש</h1>
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

      {/* Content */}
      <main className="pt-4 pb-12 px-4 max-w-lg mx-auto">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6 mt-2">
          {([1, 2] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200
                ${activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              {tab === 1 ? 'מבחן 1: פורמט שורות' : 'מבחן 2: פורמט חלק'}
            </button>
          ))}
        </div>

        {/* ── Tab 1 ── */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-fade-in">

            {/* Steps */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                שלבים ({test1Steps.length})
              </p>
              <div className="space-y-2">
                {test1Steps.map(s => <StepCard key={s.num} {...s} />)}
              </div>
            </div>

            {/* Visual examples */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                דוגמאות
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ExampleCard
                  illustration={<IllustrationLinedCorrect />}
                  label="דף תקין"
                  desc="מסגרת מלאה, 20 שורות, חתימה בתחתית"
                  variant="ok"
                />
                <ExampleCard
                  illustration={<IllustrationCutFrame />}
                  label="מסגרת חתוכה"
                  desc="המסגרת חייבת להופיע במלואה"
                  variant="error"
                />
                <ExampleCard
                  illustration={<IllustrationFewLines />}
                  label="פחות מדי שורות"
                  desc="יש לכתוב 20 שורות"
                  variant="error"
                />
                <ExampleCard
                  illustration={<IllustrationNoSignature />}
                  label="אין חתימה"
                  desc="חובה לחתום בשורה הקצרה בתחתית"
                  variant="error"
                />
              </div>
            </div>

          </div>
        )}

        {/* ── Tab 2 ── */}
        {activeTab === 2 && (
          <div className="space-y-6 animate-fade-in">

            {/* Steps */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                שלבים ({test2Steps.length})
              </p>
              <div className="space-y-2">
                {test2Steps.map(s => <StepCard key={s.num} {...s} />)}
              </div>
            </div>

            {/* Visual examples */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                דוגמאות
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ExampleCard
                  illustration={<IllustrationBlankCorrect />}
                  label="דף תקין - 3 טורים"
                  desc="בדיוק 3 טורים עם מספרים 1–30"
                  variant="ok"
                />
                <ExampleCard
                  illustration={<IllustrationCutFrame />}
                  label="מסגרת חתוכה"
                  desc="המסגרת חייבת להופיע במלואה בסריקה"
                  variant="error"
                />
                <ExampleCard
                  illustration={<IllustrationWrongColumns />}
                  label="יותר או פחות מ-3 טורים"
                  desc="יש לסדר בדיוק 3 טורים, לא פחות ולא יותר"
                  variant="warning"
                />
              </div>
            </div>

          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            לפורמטים להורדה עברו לעמוד הוראות ופורמטים
          </p>
          <button
            onClick={() => router.push('/formats')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-slate-900 dark:bg-white text-white dark:text-slate-900
              text-sm font-semibold
              hover:bg-slate-700 dark:hover:bg-slate-100
              transition-colors duration-200 shadow-sm"
          >
            עברו להורדת הפורמטים
          </button>
        </div>

      </main>
    </div>
  )
}
