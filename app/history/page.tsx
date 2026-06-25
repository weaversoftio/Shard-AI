'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { UserMenu } from '@/components/UserMenu'
import { downloadReportAsPDF } from '@/lib/pdf-download'

interface HistoryRecord {
  id:           string
  user_email:   string
  report_title: string
  created_at:   string
}

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

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
      className="text-slate-300 dark:text-slate-600">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="currentColor">
      <circle cx="12" cy="5"  r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function SortAscIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function SortDescIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Delete confirmation modal ──────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel, deleting }: {
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl
        border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white">מחיקת דוח</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          האם אתה בטוח שברצונך למחוק את הדוח?<br />פעולה זו אינה ניתנת לביטול.
        </p>
        <div className="flex gap-2 pt-1">
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900
              text-sm font-bold disabled:opacity-60 hover:bg-slate-700 dark:hover:bg-slate-100
              transition-colors duration-200">
            {deleting ? '...' : 'כן, מחק'}
          </button>
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
              text-slate-600 dark:text-slate-300 text-sm font-semibold
              hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Rename modal ───────────────────────────────────────────────────────────────

function RenameModal({ current, onConfirm, onCancel, saving }: {
  current:   string
  onConfirm: (title: string) => void
  onCancel:  () => void
  saving:    boolean
}) {
  const [value, setValue] = useState(current)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const submit = () => {
    const trimmed = value.trim().slice(0, 100)
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl
        border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white">שינוי שם הדוח</h3>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value.slice(0, 100))}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }}
          maxLength={100}
          dir="rtl"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
            text-sm placeholder:text-slate-400 focus:outline-none
            focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500
            transition-colors"
          placeholder="שם הדוח"
        />
        <div className="flex gap-2">
          <button onClick={submit} disabled={saving || !value.trim()}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900
              text-sm font-bold disabled:opacity-50 hover:bg-slate-700 dark:hover:bg-slate-100
              transition-colors duration-200">
            {saving ? '...' : 'שינוי'}
          </button>
          <button onClick={onCancel} disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
              text-slate-600 dark:text-slate-300 text-sm font-semibold
              hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted,   setMounted]   = useState(false)
  const [records,   setRecords]   = useState<HistoryRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [sortDesc,  setSortDesc]  = useState(true)

  // Three-dot menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Delete
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  // Rename
  const [renameId,      setRenameId]      = useState<string | null>(null)
  const [renameTitle,   setRenameTitle]   = useState('')
  const [saving,        setSaving]        = useState(false)

  // Download
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  // Close three-dot menu on click outside
  useEffect(() => {
    if (!activeMenuId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activeMenuId])

  // DB order is already created_at DESC; UI toggle just reverses the array
  const sorted = sortDesc ? records : [...records].reverse()

  const handleDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/history/${confirmId}`, { method: 'DELETE' })
      if (res.ok) setRecords(prev => prev.filter(r => r.id !== confirmId))
    } finally {
      setDeleting(false)
      setConfirmId(null)
    }
  }

  const handleRename = async (newTitle: string) => {
    if (!renameId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/history/${renameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      if (res.ok) {
        setRecords(prev =>
          prev.map(r => r.id === renameId ? { ...r, report_title: newTitle } : r)
        )
      }
    } finally {
      setSaving(false)
      setRenameId(null)
    }
  }

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setActiveMenuId(prev => prev === id ? null : id)
  }

  const openDelete = (id: string) => { setActiveMenuId(null); setConfirmId(id) }

  const openRename = (rec: HistoryRecord) => {
    setActiveMenuId(null)
    setRenameId(rec.id)
    setRenameTitle(rec.report_title)
  }

  const openDownload = async (rec: HistoryRecord) => {
    setActiveMenuId(null)
    setDownloadingId(rec.id)
    try {
      const res = await fetch(`/api/history/${rec.id}`)
      if (!res.ok) return
      const record = await res.json()
      const { report } = JSON.parse(record.snapshot_data) as { report: string }
      await downloadReportAsPDF(rec.report_title, report)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-slate-950 transition-colors duration-300" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5
        bg-[var(--background)]/95 dark:bg-slate-950/95 backdrop-blur-sm
        border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.back()} aria-label="חזרה"
            className="w-9 h-9 rounded-xl flex items-center justify-center
              text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
            <ArrowRightIcon />
          </button>
          <h1 className="text-sm font-bold text-slate-800 dark:text-white">היסטוריית דוחות</h1>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="החלף מצב תצוגה"
              className="w-9 h-9 rounded-full flex items-center justify-center
                bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80
                text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                transition-all duration-200 shadow-sm focus:outline-none">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5"><ClockIcon /></div>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">אין דוחות עדיין</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
              הדוחות שתפיקו יישמרו כאן אוטומטית לאחר כל ניתוח.
            </p>
          </div>
        )}

        {/* Report list */}
        {!loading && records.length > 0 && (
          <>
            {/* Sort control */}
            <div className="flex justify-start mb-4">
              <button onClick={() => setSortDesc(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                  text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                  hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm">
                {sortDesc ? <SortDescIcon /> : <SortAscIcon />}
                {sortDesc ? 'מהחדש לישן' : 'מהישן לחדש'}
              </button>
            </div>

            <ul className="space-y-2.5">
              {sorted.map(rec => (
                <li key={rec.id} className="group">
                  <div
                    onClick={() => router.push(`/report/${rec.id}`)}
                    className="cursor-pointer flex items-center gap-4 px-6 py-5 rounded-2xl
                      bg-white dark:bg-slate-800/60
                      border border-slate-200/80 dark:border-white/10
                      hover:border-blue-300 dark:hover:border-blue-700
                      hover:shadow-sm transition-all duration-200"
                  >
                    {/* File icon */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                      bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400
                      group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                      <FileTextIcon />
                    </div>

                    {/* Title + created_at */}
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {rec.report_title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatDate(rec.created_at)}
                      </p>
                    </div>

                    {/* Three-dot menu */}
                    <div
                      ref={activeMenuId === rec.id ? menuRef : undefined}
                      className="relative flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      {downloadingId === rec.id ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                        </div>
                      ) : (
                      <button
                        onClick={e => openMenu(e, rec.id)}
                        aria-label="אפשרויות"
                        className="w-8 h-8 rounded-full flex items-center justify-center
                          text-slate-400 dark:text-slate-500
                          hover:bg-slate-100 dark:hover:bg-slate-700
                          hover:text-slate-700 dark:hover:text-slate-200
                          transition-all duration-200"
                      >
                        <DotsIcon />
                      </button>
                      )}

                      {/* Dropdown */}
                      {activeMenuId === rec.id && (
                        <div className="absolute left-0 top-full mt-1 z-30 min-w-[180px]
                          bg-white dark:bg-slate-800 rounded-2xl
                          border border-slate-200 dark:border-slate-700
                          shadow-lg shadow-black/10 overflow-hidden"
                          dir="rtl">

                          <button
                            onClick={() => openRename(rec)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-right
                              text-slate-700 dark:text-slate-200
                              hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                            <PencilIcon />
                            שינוי שם
                          </button>

                          <button
                            onClick={() => openDownload(rec)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-right
                              text-slate-700 dark:text-slate-200
                              hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                            <DownloadIcon />
                            הורדה כ-PDF
                          </button>

                          <div className="border-t border-slate-100 dark:border-slate-700" />

                          <button
                            onClick={() => openDelete(rec.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-right
                              text-red-600 dark:text-red-400
                              hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                            <TrashIcon />
                            מחיקת הדוח
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {/* Modals */}
      {confirmId && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          deleting={deleting}
        />
      )}

      {renameId && (
        <RenameModal
          current={renameTitle}
          onConfirm={handleRename}
          onCancel={() => setRenameId(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
