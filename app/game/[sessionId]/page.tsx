'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { GameCard } from '@/components/game/GameCard'
import { AudioController } from '@/components/game/AudioController'
import Link from 'next/link'

export default function GameSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const { phase, sessionId: storeSessionId } = useGameStore()
  const [sessionChecked, setSessionChecked] = useState(false)

  // Give store time to hydrate before checking session
  useEffect(() => {
    const t = setTimeout(() => setSessionChecked(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Navigate to results when finished
  useEffect(() => {
    if (phase === 'finished') {
      router.replace(`/game/${sessionId}/results`)
    }
  }, [phase, sessionId, router])

  if (sessionChecked && (!storeSessionId || storeSessionId !== sessionId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-bold text-slate-700 text-center">המשחק לא נמצא</h2>
        <p className="text-slate-500 text-center text-sm">העמוד רוענן או שהסשן פג תוקף.</p>
        <Link href="/game" className="bg-[#0d2d6e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a4b9c] transition-colors">
          ← חזור לבחירת משחק
        </Link>
      </div>
    )
  }

  if (!sessionChecked) {
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
