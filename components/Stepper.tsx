'use client'

const STEPS = [
  { id: 1, label: 'שורות' },
  { id: 2, label: 'חלק' },
  { id: 3, label: 'ניתוח' },
  { id: 4, label: 'דוח' },
] as const

function SmallCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function Stepper({ active }: { active: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((step, i) => {
        const done = step.id < active
        const isActive = step.id === active
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <div className={`h-px w-8 sm:w-12 mx-0.5 transition-colors duration-300
                ${done ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-xs font-bold transition-all duration-300
                ${done
                  ? 'bg-blue-600 text-white'
                  : isActive
                    ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}>
                {done ? <SmallCheckIcon /> : step.id}
              </div>
              <span className={`text-[11px] font-medium leading-none
                ${isActive
                  ? 'text-slate-800 dark:text-white'
                  : done
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
