'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { GameCard } from '@/components/game/GameCard'
import { AudioController } from '@/components/game/AudioController'

export default function GameSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const { phase, sessionId: storeSessionId, mode, lives, nickname } = useGameStore()

  // Record streak in localStorage when game starts
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const raw = localStorage.getItem('streak-data')
      const data = raw ? JSON.parse(raw) : { dates: [], currentStreak: 0 }
      if (!data.dates.includes(today)) {
        data.dates.push(today)
        // Calculate current streak
        let streak = 0
        const d = new Date()
        while (true) {
          const key = d.toISOString().split('T')[0]
          if (data.dates.includes(key)) {
            streak++
            d.setDate(d.getDate() - 1)
          } else {
            break
          }
        }
        data.currentStreak = streak
        localStorage.setItem('streak-data', JSON.stringify(data))
      }
    } catch {}
  }, [])

  // Redirect if session mismatch
  useEffect(() => {
    if (storeSessionId && storeSessionId !== sessionId) {
      router.replace('/game')
    }
  }, [storeSessionId, sessionId, router])

  // Navigate to results when finished
  useEffect(() => {
    if (phase === 'finished') {
      router.replace(`/game/${sessionId}/results`)
    }
  }, [phase, sessionId, router])

  if (!storeSessionId || storeSessionId !== sessionId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-slate-400">⏳ טוען...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <AudioController />
      <GameCard />
    </div>
  )
}
