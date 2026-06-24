'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function PersonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

interface UserMenuProps {
  onBeforeSignOut?: () => Promise<void> | void
}

export function UserMenu({ onBeforeSignOut }: UserMenuProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    if (onBeforeSignOut) await onBeforeSignOut()
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => session && setOpen(v => !v)}
        aria-label="תפריט משתמש"
        className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
          border border-slate-200/80 dark:border-slate-700/80
          text-slate-400 dark:text-slate-500 shadow-sm transition-all duration-200
          ${session ? 'cursor-pointer hover:ring-2 hover:ring-blue-400/50' : 'cursor-default'}`}
      >
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? 'משתמש'}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <PersonIcon />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl
            border border-slate-200 dark:border-slate-700 shadow-lg shadow-black/10 overflow-hidden z-50"
          dir="rtl"
        >
          {session?.user && (
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
              {session.user.name && (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {session.user.name}
                </p>
              )}
              {session.user.email && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {session.user.email}
                </p>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-right px-4 py-2.5 text-sm font-medium
              text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            התנתקות
          </button>
        </div>
      )}
    </div>
  )
}
