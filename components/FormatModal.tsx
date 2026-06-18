'use client'

import { useState, useEffect } from 'react'

type ModalView = 'instructions' | 'pdf'

interface FormatModalProps {
  onClose: () => void
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

export function FormatModal({ onClose }: FormatModalProps) {
  const [view, setView] = useState<ModalView>('instructions')

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
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'instructions' ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 text-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">הוראות ופורמט</h2>
            </div>

            {/* Instructions */}
            <div className="p-8 flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="font-bold text-slate-800 dark:text-white mb-1">פורמט שורות:</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  יש לכתוב כ20 שורות ולחתום בשורה הקצרה למטה
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="font-bold text-slate-800 dark:text-white mb-1">פורמט חלק:</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  יש לכתוב 3 טורים מספריים שבכל טור יש את הספרות 1-30
                </p>
              </div>

              {/* Show format button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setView('pdf')}
                  className="inline-flex items-center justify-center px-10 py-3.5
                    bg-gradient-to-r from-blue-600 to-violet-600
                    hover:from-blue-500 hover:to-violet-500
                    text-white font-bold text-base rounded-2xl
                    shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                    transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  הצג פורמט
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* PDF Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <a
                  href="/formats.pdf"
                  download="formats.pdf"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl
                    bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <DownloadIcon />
                  הורד
                </a>
                <button
                  onClick={() => window.open('/formats.pdf', '_blank')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl
                    bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <PrintIcon />
                  הדפס
                </button>
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">פורמטים</h2>
            </div>

            {/* PDF viewer */}
            <iframe
              src="/formats.pdf"
              className="w-full"
              style={{ height: '72vh' }}
              title="פורמטים"
            />
          </>
        )}
      </div>
    </div>
  )
}
