'use client'

import { useEffect } from 'react'

interface WarningModalProps {
  lineCount: number
  onContinue: () => void
  onUpdate: () => void
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function WarningModal({ lineCount, onContinue, onUpdate }: WarningModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onUpdate()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onUpdate])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onUpdate} />

      <div
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-5 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center
              bg-amber-50 dark:bg-amber-900/30
              border border-amber-200 dark:border-amber-700/50
              text-amber-500 dark:text-amber-400">
              <WarningIcon />
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">שורות לא מספיקות</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            זוהו {lineCount} שורות כתיבה
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40
            rounded-2xl p-4 mb-6 text-center">
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
              על מנת לבצע ניתוח מדויק יש לכתוב בין 15-20 שורות, האם בכל זאת להמשיך?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onContinue}
              className="w-full py-3.5 rounded-2xl font-bold text-base
                bg-gradient-to-r from-amber-500 to-orange-500
                hover:from-amber-400 hover:to-orange-400
                text-white shadow-lg shadow-amber-500/25
                transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              המשך בכל זאת
            </button>
            <button
              onClick={onUpdate}
              className="w-full py-3.5 rounded-2xl font-semibold text-base
                bg-slate-100 dark:bg-slate-800
                text-slate-700 dark:text-slate-200
                hover:bg-slate-200 dark:hover:bg-slate-700
                transition-all duration-200 active:scale-95"
            >
              עדכן טופס
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
