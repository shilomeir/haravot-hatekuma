'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { SFX } from '@/lib/audio'

export function AudioController() {
  const phase = useGameStore((s) => s.phase)
  const feedbackCorrect = useGameStore((s) => s.feedbackCorrect)
  const streak = useGameStore((s) => s.streak)
  const prevPhaseRef = useRef<string>('')
  const prevStreakRef = useRef(0)

  useEffect(() => {
    if (phase === 'feedback' && prevPhaseRef.current === 'playing') {
      if (feedbackCorrect === true) {
        if (streak >= 5) {
          SFX.combo()
        } else {
          SFX.correct()
        }
      } else if (feedbackCorrect === false) {
        SFX.wrong()
      }
    }
    prevPhaseRef.current = phase
  }, [phase, feedbackCorrect, streak])

  useEffect(() => {
    prevStreakRef.current = streak
  }, [streak])

  return null
}
