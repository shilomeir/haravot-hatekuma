'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { getRank } from '@/lib/ranks'
import Link from 'next/link'

export default function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const { score, xp, coins, correctCount, questions, answers, nickname, resetGame, phase } = useGameStore()
  const [displayScore, setDisplayScore] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  // Redirect if no game data
  useEffect(() => {
    if (phase === 'idle') {
      router.replace('/')
    }
  }, [phase, router])

  // Animate score count-up
  useEffect(() => {
    if (score === 0) return
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(interval)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [score])

  const rank = getRank(xp)
  const accuracy = questions.length > 0 ? Math.round((correctCount / Math.min(answers.length, questions.length)) * 100) : 0

  const handlePlayAgain = () => {
    resetGame()
    router.push('/game')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-3">{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🎯' : '📚'}</div>
        <h1 className="text-3xl font-black text-[#0d2d6e]">
          {accuracy >= 80 ? 'מעולה!' : accuracy >= 50 ? 'כל הכבוד!' : 'כדאי להתאמן!'}
        </h1>
        <p className="text-slate-500">{nickname && `${nickname}, `}המשחק הסתיים</p>
      </div>

      {/* Main stats card */}
      <div className="bg-[#0d2d6e] text-white rounded-2xl p-6 space-y-4">
        {/* Score */}
        <div className="text-center">
          <div className="text-5xl font-black">{displayScore.toLocaleString()}</div>
          <div className="text-white/60 text-sm mt-1">נקודות</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{correctCount}</div>
            <div className="text-xs text-white/60">תשובות נכונות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{accuracy}%</div>
            <div className="text-xs text-white/60">דיוק</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-300">{xp}</div>
            <div className="text-xs text-white/60">XP</div>
          </div>
        </div>

        {/* Rank */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10">
          <span className="text-3xl">{rank.emoji}</span>
          <div>
            <div className="font-bold">{rank.title}</div>
            <div className="text-xs text-white/60">{coins} מטבעות 🪙</div>
          </div>
        </div>
      </div>

      {/* Per-question review */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <span>📋 סקירת שאלות ({answers.length})</span>
          <span>{showDetails ? '▲' : '▼'}</span>
        </button>
        {showDetails && (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {answers.map((answer, i) => {
              const q = questions.find((q) => q.id === answer.questionId)
              if (!q) return null
              return (
                <div key={i} className={`px-4 py-3 text-sm ${answer.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">{answer.correct ? '✅' : '❌'}</span>
                    <div>
                      <p className="font-medium text-slate-700 leading-snug">{q.question}</p>
                      <p className="text-xs text-slate-500 mt-1">{q.options[q.correctIndex]}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePlayAgain}
          className="flex-1 bg-[#0d2d6e] hover:bg-[#1a4b9c] text-white font-bold py-3 rounded-xl transition-colors"
        >
          🔄 שחק שוב
        </button>
        <Link
          href="/"
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-center transition-colors"
        >
          🏠 בית
        </Link>
      </div>
    </div>
  )
}
