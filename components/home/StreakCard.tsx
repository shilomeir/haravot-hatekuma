'use client'

import { useEffect, useState } from 'react'

interface StreakData {
  dates: string[]
  currentStreak: number
}

function getDateKey(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

export function StreakCard() {
  const [streakData, setStreakData] = useState<StreakData>({ dates: [], currentStreak: 0 })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('streak-data')
      if (raw) setStreakData(JSON.parse(raw))
    } catch {}
  }, [])

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const key = getDateKey(6 - i)
    return streakData.dates.includes(key)
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-slate-700">🔥 רצף יומי</h2>
        <span className="text-2xl font-black text-orange-500">{streakData.currentStreak}</span>
      </div>
      <div className="flex gap-1.5 justify-between">
        {last7.map((played, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                played
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {played ? '🔥' : '○'}
            </div>
          </div>
        ))}
      </div>
      {streakData.currentStreak === 0 && (
        <p className="text-xs text-slate-400 mt-2 text-center">שחק היום כדי להתחיל רצף!</p>
      )}
    </div>
  )
}
