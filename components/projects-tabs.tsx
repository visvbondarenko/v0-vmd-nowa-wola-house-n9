'use client'

import { useState, type ReactNode } from 'react'

type Props = {
  activeTab: ReactNode
  completedTab: ReactNode
  completedCount: number
}

export function ProjectsTabs({ activeTab, completedTab, completedCount }: Props) {
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  return (
    <div className="mt-16">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setTab('active')}
          className={`px-5 py-2.5 text-sm font-semibold uppercase tracking-widest transition-all duration-300 ${
            tab === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Aktualne inwestycje
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-5 py-2.5 text-sm font-semibold uppercase tracking-widest transition-all duration-300 ${
            tab === 'completed'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Zakończone{completedCount > 0 && ` (${completedCount})`}
        </button>
      </div>

      <div className="mt-12">
        {tab === 'active' ? activeTab : completedTab}
      </div>
    </div>
  )
}
