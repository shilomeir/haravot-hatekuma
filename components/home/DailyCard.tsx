'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { isDailyCompleted } from '@/lib/storage'

export function DailyCard() {
  const [completed, setCompleted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCompleted(isDailyCompleted())
  }, [])

  if (!mounted) return null

  return (
    <div
      className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{
        background: completed
          ? 'linear-gradient(135deg, #064E3B, #065F46)'
          : 'linear-gradient(135deg, #78350F, #92400E)',
        color: 'white',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{completed ? '✅' : '📅'}</span>
        <div>
          <p className="font-bold text-base">
            {completed ? 'השלמת את האתגר היומי!' : 'אתגר יומי מחכה לך'}
          </p>
          <p className="text-sm opacity-80">
            {completed ? 'חזור מחר לאתגר חדש' : '10 שאלות • הניקוד נשמר'}
          </p>
        </div>
      </div>
      <Link
        href="/game?mode=daily"
        className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        {completed ? 'שחק שוב ←' : 'שחק עכשיו ←'}
      </Link>
    </div>
  )
}
