'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { WarningModal } from '@/components/analysis/WarningModal'

// ── Icons ──────────────────────────────────────────────────────────────────

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

function PersonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2
type UploadStatus = 'idle' | 'uploading' | 'ok' | 'warning' | 'error'

interface ValidationResult {
  status: 'ok' | 'warning' | 'error'
  error_type?: string
  line_count?: number
  message?: string
  cropFiles?: string[]   // filenames present in both normalized/ and segmentation/
}

// ── Error message map ──────────────────────────────────────────────────────

function getErrorMessage(result: ValidationResult | null, step: Step): string {
  if (!result) return ''
  const { error_type, line_count } = result

  if (error_type === 'PARTIAL_FRAME')
    return 'המסגרת לא זוהתה במלואה. אנא סרקו מחדש ווודאו שהמסגרת המלאה נראית בסריקה.'

  if (step === 1) {
    if (error_type === 'MISSING_SIGNATURE')
      return 'לא זוהתה חתימה. אנא חתמו על הדף בשורה הקצרה בתחתית ועלו מחדש.'
    if (error_type === 'TOO_FEW_LINES')
      return `זוהו ${line_count ?? 0} שורות כתיבה. לניתוח תקין יש לכתוב בין 15-20 שורות. אנא סרקו ועלו מחדש.`
    if (error_type === 'INVALID_TYPE')
      return 'יש להעלות קובץ PDF בלבד.'
    if (error_type === 'PROCESSING_ERROR')
      return 'שגיאה בעיבוד הקובץ. אנא נסו שוב.'
  }

  if (error_type === 'INVALID_TYPE') return 'יש להעלות קובץ PDF בלבד.'
  if (error_type === 'PROCESSING_ERROR') return 'שגיאה בעיבוד הקובץ. אנא נסו שוב.'
  return 'אירעה שגיאה. אנא נסו שוב.'
}

// ── Upload Zone Component ──────────────────────────────────────────────────

interface UploadZoneProps {
  status: UploadStatus
  fileName: string | null
  onFile: (file: File) => void
}

function UploadZone({ status, fileName, onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  const isProcessing = status === 'uploading'

  return (
    <div
      onClick={() => !isProcessing && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer
        transition-all duration-200 select-none
        ${isProcessing ? 'cursor-wait opacity-70' : ''}
        ${dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : status === 'ok' || status === 'warning'
            ? 'border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20'
            : status === 'error'
              ? 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/30'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />

      {isProcessing ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">מעבד את הקובץ...</p>
        </div>
      ) : fileName ? (
        <div className="flex items-center justify-center gap-3 py-1">
          <span className={`flex-shrink-0 ${
            status === 'ok' || status === 'warning'
              ? 'text-green-500 dark:text-green-400'
              : status === 'error'
                ? 'text-red-500 dark:text-red-400'
                : 'text-slate-400'
          }`}>
            <FileIcon />
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
            {fileName}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            לחצו להחלפה
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <span className="text-slate-400 dark:text-slate-500">
            <UploadIcon />
          </span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            גררו קובץ לכאן או לחצו לבחירה
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">PDF בלבד</p>
        </div>
      )}
    </div>
  )
}

// ── Status Banner ─────────────────────────────────────────────────────────

function StatusBanner({ status, message }: { status: UploadStatus; message: string }) {
  if (status !== 'ok' && status !== 'warning' && status !== 'error') return null

  const styles = {
    ok:      'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    error:   'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  }

  const icons = {
    ok:      <CheckIcon />,
    warning: <AlertIcon />,
    error:   <AlertIcon />,
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${styles[status]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[status]}</span>
      <p className="leading-relaxed">{message}</p>
    </div>
  )
}

// ── Step Indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = ['פורמט שורות', 'פורמט חלק']
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => {
        const idx = (i + 1) as Step
        const done = idx < current
        const active = idx === current
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`h-px w-10 transition-colors duration-300
                ${done ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${done
                  ? 'bg-blue-600 text-white'
                  : active
                    ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}>
                {done ? <CheckIcon /> : idx}
              </div>
              <span className={`text-sm font-medium hidden sm:block
                ${active ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Crop Preview ──────────────────────────────────────────────────────────

function cropLabel(filename: string): string {
  if (filename.includes('_signature')) return 'חתימה'
  const m = filename.match(/_line_(\d+)/)
  return m ? `שורה ${parseInt(m[1], 10)}` : filename
}

interface CropPreviewProps {
  sessionId: string
  type: 'lined' | 'blank'
  files: string[]
}

function CropPreview({ sessionId, type, files }: CropPreviewProps) {
  const [activeFile, setActiveFile] = useState<string>(files[0] ?? '')

  const imgUrl = (file: string, view: 'normalized' | 'segmentation') =>
    `/api/session/image?sessionId=${encodeURIComponent(sessionId)}&type=${type}&view=${view}&file=${encodeURIComponent(file)}`

  if (files.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden
      bg-slate-50 dark:bg-slate-800/40">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700
        flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          תצוגה מקדימה — {files.length} חיתוכים
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {cropLabel(activeFile)}
        </span>
      </div>

      {/* Main viewer: normalized left, segmentation right */}
      {activeFile && type === 'lined' && (
        <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-700">
          <div className="bg-white dark:bg-slate-900 flex flex-col">
            <span className="text-[10px] font-medium text-center py-1
              text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              נרמול
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(activeFile, 'normalized')}
              alt="normalized"
              className="w-full object-contain bg-white dark:bg-slate-950"
              style={{ maxHeight: 100 }}
            />
          </div>
          <div className="bg-white dark:bg-slate-900 flex flex-col">
            <span className="text-[10px] font-medium text-center py-1
              text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              סגמנטציה
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(activeFile, 'segmentation')}
              alt="segmentation"
              className="w-full object-contain bg-white dark:bg-slate-950"
              style={{ maxHeight: 100 }}
            />
          </div>
        </div>
      )}

      {/* Blank page: single visualization */}
      {type === 'blank' && activeFile && (
        <div className="bg-white dark:bg-slate-900 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/session/image?sessionId=${encodeURIComponent(sessionId)}&type=blank&file=${encodeURIComponent(activeFile)}`}
            alt="blank page columns"
            className="w-full object-contain rounded"
            style={{ maxHeight: 200 }}
          />
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto p-2 bg-slate-100 dark:bg-slate-800/60"
        style={{ scrollbarWidth: 'thin' }}>
        {files.map(file => (
          <button
            key={file}
            onClick={() => setActiveFile(file)}
            title={cropLabel(file)}
            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150
              ${activeFile === file
                ? 'border-blue-500 shadow-md shadow-blue-500/20'
                : 'border-transparent opacity-60 hover:opacity-90 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={type === 'lined' ? imgUrl(file, 'normalized') : `/api/session/image?sessionId=${encodeURIComponent(sessionId)}&type=blank&file=${encodeURIComponent(file)}`}
              alt={cropLabel(file)}
              className="bg-white dark:bg-slate-950 object-contain"
              style={{ height: 36, width: 'auto', minWidth: 32, maxWidth: 80 }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { data: session, status: authStatus } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const gender = searchParams.get('gender') ?? 'other'
  const [mounted, setMounted] = useState(false)

  // One stable sessionId per page visit
  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )

  const [step, setStep]                         = useState<Step>(1)

  // Step 1 state
  const [linedFile, setLinedFile]               = useState<File | null>(null)
  const [linedStatus, setLinedStatus]           = useState<UploadStatus>('idle')
  const [linedResult, setLinedResult]           = useState<ValidationResult | null>(null)
  const [warningAccepted, setWarningAccepted]   = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  // Step 2 state
  const [blankFile, setBlankFile]               = useState<File | null>(null)
  const [blankStatus, setBlankStatus]           = useState<UploadStatus>('idle')
  const [blankResult, setBlankResult]           = useState<ValidationResult | null>(null)

  // Starting analysis
  const [isStarting, setIsStarting]             = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/')
  }, [authStatus, router])

  const cleanup = useCallback(async () => {
    try {
      await fetch(`/api/session/cleanup?sessionId=${sessionId}`, { method: 'DELETE' })
    } catch { /* best effort */ }
  }, [sessionId])

  // Cleanup on tab/window close
  useEffect(() => {
    window.addEventListener('beforeunload', cleanup)
    return () => window.removeEventListener('beforeunload', cleanup)
  }, [cleanup])

  const handleCancel = async () => {
    await cleanup()
    router.push('/')
  }

  // ── Step 1: lined upload ────────────────────────────────────────────────

  const handleLinedFile = async (file: File) => {
    setLinedFile(file)
    setLinedStatus('uploading')
    setLinedResult(null)
    setWarningAccepted(false)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('sessionId', sessionId)

    try {
      const res  = await fetch('/api/upload/lined', { method: 'POST', body: fd })
      const data = (await res.json()) as ValidationResult
      setLinedResult(data)

      if (data.status === 'warning') {
        setLinedStatus('warning')
        setShowWarningModal(true)
      } else if (data.status === 'ok') {
        setLinedStatus('ok')
      } else {
        setLinedStatus('error')
      }
    } catch {
      setLinedStatus('error')
      setLinedResult({ status: 'error', error_type: 'PROCESSING_ERROR' })
    }
  }

  const handleWarningContinue = () => {
    setShowWarningModal(false)
    setWarningAccepted(true)
  }

  const handleWarningUpdate = () => {
    setShowWarningModal(false)
    setLinedFile(null)
    setLinedStatus('idle')
    setLinedResult(null)
    setWarningAccepted(false)
  }

  const canContinue = linedStatus === 'ok' || (linedStatus === 'warning' && warningAccepted)

  // ── Step 2: blank upload ────────────────────────────────────────────────

  const handleBlankFile = async (file: File) => {
    setBlankFile(file)
    setBlankStatus('uploading')
    setBlankResult(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('sessionId', sessionId)

    try {
      const res  = await fetch('/api/upload/blank', { method: 'POST', body: fd })
      const data = (await res.json()) as ValidationResult
      setBlankResult(data)
      setBlankStatus(data.status === 'ok' ? 'ok' : 'error')
    } catch {
      setBlankStatus('error')
      setBlankResult({ status: 'error', error_type: 'PROCESSING_ERROR' })
    }
  }

  const canStartAnalysis = blankStatus === 'ok'

  // ── Start analysis ──────────────────────────────────────────────────────

  const handleStartAnalysis = () => {
    if (!canStartAnalysis || isStarting) return
    setIsStarting(true)
    router.push(`/results?sessionId=${sessionId}&gender=${gender}`)
  }

  // ── Shared layout values ────────────────────────────────────────────────

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60
        dark:from-gray-950 dark:via-slate-900 dark:to-blue-950/40">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
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

          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center
            bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
            border border-slate-200/80 dark:border-slate-700/80
            text-slate-400 dark:text-slate-500 shadow-sm">
            {session?.user?.image ? (
              <Image src={session.user.image} alt={session.user.name ?? 'משתמש'}
                width={36} height={36} className="w-full h-full object-cover" />
            ) : (
              <PersonIcon />
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pb-8 pt-24">
        <div className="w-full max-w-lg mx-auto animate-slide-up">

          {/* Step indicator */}
          <div className="mb-8">
            <StepIndicator current={step} />
          </div>

          {/* Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md
            border border-slate-200/60 dark:border-slate-700/60
            rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="p-6 flex flex-col gap-5">

                {/* Header */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    פורמט שורות
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    יש לכתוב 20 שורות על נושא לבחירתכם (באמת כל נושא שבא לכם!), ולחתום את שמכם
                    בשורה הקצרה בתחתית הדף.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <a
                    href="/formats.pdf"
                    download="דף-שורות.pdf"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5
                      text-sm font-medium rounded-xl
                      bg-slate-100 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-colors duration-200"
                  >
                    <DownloadIcon />
                    הורדת דף השורות
                  </a>
                  <button
                    onClick={() => window.open('/formats.pdf', '_blank')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5
                      text-sm font-medium rounded-xl
                      bg-slate-100 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-colors duration-200"
                  >
                    <EyeIcon />
                    לראות דוגמא
                  </button>
                </div>

                {/* Upload zone */}
                <UploadZone
                  status={linedStatus}
                  fileName={linedFile?.name ?? null}
                  onFile={handleLinedFile}
                />

                {/* Status banner */}
                {linedStatus !== 'idle' && linedStatus !== 'uploading' && (
                  <StatusBanner
                    status={linedStatus}
                    message={
                      linedStatus === 'ok'
                        ? `הקובץ הועלה בהצלחה — זוהו ${linedResult?.line_count ?? 0} שורות כתיבה.`
                        : linedStatus === 'warning' && warningAccepted
                          ? `ממשיכים עם ${linedResult?.line_count ?? 0} שורות כתיבה.`
                          : getErrorMessage(linedResult, 1)
                    }
                  />
                )}

                {/* Crop preview (debug) */}
                {(linedStatus === 'ok' || (linedStatus === 'warning' && warningAccepted)) &&
                  linedResult?.cropFiles && linedResult.cropFiles.length > 0 && (
                  <CropPreview
                    sessionId={sessionId}
                    type="lined"
                    files={linedResult.cropFiles}
                  />
                )}

                {/* Footer buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-2xl font-semibold text-sm
                      bg-slate-100 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-all duration-200 active:scale-95"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canContinue}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm
                      transition-all duration-200 active:scale-95
                      ${canContinue
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    המשך
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="p-6 flex flex-col gap-5">

                {/* Header */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    פורמט חלק
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    כתבו את המספרים 1 עד 30 על הדף, מסודרים ב-3 טורים.
                    לדוגמא טור אחד 1-10, טור שני 11-20, טור שלישי 21-30.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <a
                    href="/formats.pdf"
                    download="דף-חלק.pdf"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5
                      text-sm font-medium rounded-xl
                      bg-slate-100 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-colors duration-200"
                  >
                    <DownloadIcon />
                    הורדת דף החלק
                  </a>
                  <button
                    onClick={() => window.open('/formats.pdf', '_blank')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5
                      text-sm font-medium rounded-xl
                      bg-slate-100 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-colors duration-200"
                  >
                    <EyeIcon />
                    לראות דוגמא
                  </button>
                </div>

                {/* Upload zone */}
                <UploadZone
                  status={blankStatus}
                  fileName={blankFile?.name ?? null}
                  onFile={handleBlankFile}
                />

                {/* Status banner */}
                {blankStatus !== 'idle' && blankStatus !== 'uploading' && (
                  <StatusBanner
                    status={blankStatus}
                    message={
                      blankStatus === 'ok'
                        ? 'הקובץ הועלה בהצלחה.'
                        : getErrorMessage(blankResult, 2)
                    }
                  />
                )}

                {/* Blank page preview (debug) — shows the column-detection visualization */}
                {blankStatus === 'ok' && blankResult?.cropFiles && blankResult.cropFiles.length > 0 && (
                  <CropPreview
                    sessionId={sessionId}
                    type="blank"
                    files={blankResult.cropFiles}
                  />
                )}

                {/* Footer buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-2xl font-semibold text-sm
                      bg-slate-100 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-200 dark:hover:bg-slate-700
                      transition-all duration-200 active:scale-95"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleStartAnalysis}
                    disabled={!canStartAnalysis || isStarting}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm
                      transition-all duration-200 active:scale-95
                      ${canStartAnalysis && !isStarting
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    {isStarting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        מתחיל ניתוח...
                      </span>
                    ) : 'התחל ניתוח'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Warning modal */}
      {showWarningModal && linedResult && (
        <WarningModal
          lineCount={linedResult.line_count ?? 0}
          onContinue={handleWarningContinue}
          onUpdate={handleWarningUpdate}
        />
      )}
    </div>
  )
}
