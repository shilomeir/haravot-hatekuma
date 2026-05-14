'use client'

import { useEffect, useState, useRef } from 'react'

interface TimerBarProps {
  totalSeconds: number
  onExpire: () => void
  paused?: boolean
}

export function TimerBar({ totalSeconds, onExpire, paused = false }: TimerBarProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    expiredRef.current = false
  }, [totalSeconds])

  useEffect(() => {
    if (paused || totalSeconds === 0) return
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining, paused, totalSeconds, onExpire])

  if (totalSeconds === 0) return null

  const pct = (remaining / totalSeconds) * 100
  const isWarning = pct <= 25
  const isDanger = pct <= 12

  const barColor = isDanger
    ? 'var(--color-danger)'
    : isWarning
    ? 'var(--color-warning)'
    : 'var(--color-success)'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>⏱</span>
        <span
          className="font-bold"
          style={{
            color: isDanger ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-text-muted)',
          }}
        >
          {remaining}s
        </span>
      </div>
      <div
        className="w-full h-2.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-bg-soft)' }}
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        aria-label={`נשארו ${remaining} שניות`}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000${isDanger ? ' animate-timer-pulse' : ''}`}
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}
