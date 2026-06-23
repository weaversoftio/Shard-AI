'use client'

import { useEffect } from 'react'

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

interface FormatModalProps {
  onClose: () => void
}

export function FormatModal({ onClose }: FormatModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl
          shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5
            border-b border-slate-100 dark:border-slate-800"
          dir="rtl"
        >
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">הוראות ופורמטים</h2>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4" dir="rtl">

          {/* Pen requirement */}
          <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30
            border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
            <span className="text-blue-500 mt-0.5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              עדיף להשתמש בעט כדורי בצבע שחור או כחול.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed mt-1">
              לתוצאות מדויקות יותר, מומלץ לסרוק דרך מדפסת.
            </p>
          </div>

          {/* Lined format */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-slate-800 dark:text-white">פורמט שורות:</p>
              <a
                href="/Lined.pdf"
                download="דף-שורות.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl
                  bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                  hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <DownloadIcon />
                הורד
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              יש לכתוב 20 שורות על נושא לבחירתכם ולחתום בשורה הקצרה בתחתית הדף.
            </p>
          </div>

          {/* Blank format */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-slate-800 dark:text-white">פורמט חלק:</p>
              <a
                href="/Blank.pdf"
                download="דף-חלק.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl
                  bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                  hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <DownloadIcon />
                הורד
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              כתבו את המספרים 1 עד 30 על הדף, מסודרים ב-3 טורים.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
