'use client'

import { useEffect, useState } from 'react'
import { loadProgress } from '@/lib/storage'

function getDateKey(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

export function StreakCard() {
  const [streak, setStreak] = useState(0)
  const [lastPlayed, setLastPlayed] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = loadProgress()
    setStreak(p.currentStreak)
    setLastPlayed(p.lastPlayedDate)
  }, [])

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const key = getDateKey(6 - i)
    return { key, played: lastPlayed ? getDateKey(6 - i) <= lastPlayed : false }
  })

  const playedToday = lastPlayed === getDateKey(0)

  if (!mounted) {
    return (
      <div className="rounded-2xl p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', minHeight: '100px' }} />
    )
  }

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>🔥 רצף יומי</h2>
        <div className="text-right">
          <span className="text-2xl font-black" style={{ color: '#F59E0B' }}>{streak}</span>
          <span className="text-xs mr-1" style={{ color: 'var(--color-text-muted)' }}>ימים</span>
        </div>
      </div>
      <div className="flex gap-1.5 justify-between mb-3">
        {last7.map(({ played }, i) => (
          <div
            key={i}
            className="flex-1 h-6 rounded-full flex items-center justify-center text-xs transition-all"
            style={{
              background: played ? '#F59E0B' : 'var(--color-bg-soft)',
              color: played ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {played ? '🔥' : ''}
          </div>
        ))}
      </div>
      {streak === 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          שחק היום כדי להתחיל רצף!
        </p>
      )}
      {streak > 0 && playedToday && (
        <p className="text-xs text-center" style={{ color: '#F59E0B' }}>
          ✨ שיחקת היום! המשך כך
        </p>
      )}
    </div>
  )
}
