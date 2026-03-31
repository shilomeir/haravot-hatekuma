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
  const color =
    pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>⏱ {remaining}s</span>
      </div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
