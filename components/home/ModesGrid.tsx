'use client'

import { useRouter } from 'next/navigation'
import { MODES } from '@/lib/modes'

export function ModesGrid() {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-[#0d2d6e]">בחר מצב משחק</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => router.push(`/game?mode=${mode.id}`)}
            className="bg-white rounded-xl p-4 text-right border border-slate-200 hover:border-[#1a4b9c] hover:shadow-md transition-all hover:scale-105 cursor-pointer group"
          >
            <div className="text-3xl mb-2">{mode.emoji}</div>
            <div className="font-bold text-[#0d2d6e] text-sm">{mode.label}</div>
            <div className="text-xs text-slate-500 mt-1 leading-snug">{mode.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
