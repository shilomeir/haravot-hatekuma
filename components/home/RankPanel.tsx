'use client'

import { useEffect, useState } from 'react'
import { RANKS } from '@/lib/ranks'
import { loadProgress } from '@/lib/storage'
import { getRank, getNextRank, getXpProgress } from '@/lib/ranks'

export function RankPanel() {
  const [xp, setXp] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = loadProgress()
    setXp(p.totalXP)
  }, [])

  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const progress = getXpProgress(xp)

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
    >
      {/* Current rank header */}
      <div
        className="px-4 py-4"
        style={{ background: 'linear-gradient(135deg, #071A44, #0D2D6E)' }}
      >
        {mounted ? (
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-xs opacity-70 mb-1">הדרגה שלך</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{rank.emoji}</span>
                <span className="font-bold text-base">{rank.title}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">{xp.toLocaleString()} XP</p>
              {nextRank && (
                <p className="text-xs opacity-50">עד {nextRank.title}: {(nextRank.xpRequired - xp).toLocaleString()}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-10 rounded-lg animate-pulse bg-white/10" />
        )}
        {/* XP progress bar */}
        {mounted && nextRank && (
          <div className="mt-3">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-progress-fill"
                style={{ width: `${progress.pct}%`, background: '#FACC15' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ranks list */}
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        <p className="px-4 py-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
          🏅 סולם הדרגות
        </p>
        <div className="max-h-52 overflow-y-auto">
          {RANKS.map((r) => {
            const isCurrentRank = mounted && r.title === rank.title
            return (
              <div
                key={r.title}
                className="flex items-center justify-between px-4 py-2.5 transition-colors"
                style={{
                  background: isCurrentRank ? 'var(--color-primary-soft)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.emoji}</span>
                  <span
                    className="font-medium text-sm"
                    style={{ color: isCurrentRank ? 'var(--color-primary)' : 'var(--color-text)' }}
                  >
                    {r.title}
                  </span>
                  {isCurrentRank && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--color-primary)', color: 'white' }}>
                      אתה
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {r.xpRequired === 0 ? 'התחלה' : `${r.xpRequired.toLocaleString()} XP`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
