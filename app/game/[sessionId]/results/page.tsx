'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { getRank, getNextRank, getXpProgress } from '@/lib/ranks'
import { applyGameRewards } from '@/lib/storage'
import Link from 'next/link'

const MODE_LABELS: Record<string, string> = {
  standard: 'רגיל',
  blitz: 'בליץ',
  survival: 'הישרדות',
  memory: 'זיכרון',
  daily: 'אתגר יומי',
  multi: 'מרובה משתתפים',
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const { score, xp, coins, correctCount, questions, answers, nickname, mode, resetGame, phase } = useGameStore()
  const [displayScore, setDisplayScore] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [shared, setShared] = useState(false)

  // Redirect if no game data
  useEffect(() => {
    if (phase === 'idle') router.replace('/')
  }, [phase, router])

  // Persist progress once on mount
  useEffect(() => {
    if (phase !== 'finished' || !sessionId) return
    const wrongIds = answers
      .filter((a) => !a.correct)
      .map((a) => a.questionId)
      .filter(Boolean) as string[]
    applyGameRewards({
      xp,
      coins,
      mode: mode ?? 'standard',
      score,
      wrongIds,
      isDaily: mode === 'daily',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Score count-up animation
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

  const totalAnswered = Math.min(answers.length, questions.length) || 1
  const accuracy = Math.round((correctCount / totalAnswered) * 100)
  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const progress = getXpProgress(xp)

  const trophy = accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🥇' : accuracy >= 50 ? '🎯' : '📚'
  const headline = accuracy >= 90 ? 'מדהים!' : accuracy >= 70 ? 'כל הכבוד!' : accuracy >= 50 ? 'טוב מאוד!' : 'כדאי להתאמן!'

  const handlePlayAgain = () => {
    resetGame()
    router.push(`/game?mode=${mode ?? 'standard'}`)
  }

  async function handleShare() {
    const text = `השגתי ${correctCount}/${totalAnswered} בחרבות התקומה ⚔️🇮🇱\nניקוד: ${score.toLocaleString()} • דיוק: ${accuracy}%`
    try {
      if (navigator.share) {
        await navigator.share({ text, title: 'חרבות התקומה', url: 'https://haravot-hatekuma.vercel.app/' })
      } else {
        await navigator.clipboard.writeText(text)
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      }
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5 animate-fade-in">
      {/* Hero result */}
      <div
        className="rounded-2xl p-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #071A44, #0D2D6E, #1D4ED8)' }}
      >
        <div className="text-5xl mb-3 animate-spin-in">{trophy}</div>
        <h1 className="text-3xl font-black mb-1">{headline}</h1>
        {nickname && nickname !== 'שחקן' && (
          <p className="text-blue-200 text-sm mb-4">{nickname}</p>
        )}
        {mode && (
          <span className="inline-block text-xs px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
            {MODE_LABELS[mode] ?? mode}
          </span>
        )}

        {/* Score */}
        <div className="my-4">
          <div className="text-6xl font-black animate-count-up">{displayScore.toLocaleString()}</div>
          <div className="text-white/60 text-sm mt-1">נקודות</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div>
            <div className="text-2xl font-black text-green-400">{correctCount}/{totalAnswered}</div>
            <div className="text-xs text-white/60 mt-0.5">נכונות</div>
          </div>
          <div>
            <div className="text-2xl font-black text-yellow-400">{accuracy}%</div>
            <div className="text-xs text-white/60 mt-0.5">דיוק</div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-300">+{xp}</div>
            <div className="text-xs text-white/60 mt-0.5">XP</div>
          </div>
        </div>

        {/* Rank + XP progress */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{rank.emoji}</span>
            <span className="font-bold">{rank.title}</span>
            <span className="text-xs text-white/50 mr-1">• {coins} 🪙</span>
          </div>
          {nextRank && (
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>{rank.title}</span>
                <span>{nextRank.title}</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-progress-fill"
                  style={{ width: `${progress.pct}%`, background: '#FACC15' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question review */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text)' }}
        >
          <span>📋 סקירת שאלות ({answers.length})</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{showDetails ? '▲' : '▼'}</span>
        </button>
        {showDetails && (
          <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
            {answers.map((answer, i) => {
              const q = questions.find((q) => q.id === answer.questionId)
              if (!q) return null
              return (
                <div
                  key={i}
                  className="px-5 py-3 text-sm"
                  style={{ background: answer.correct ? 'var(--color-success-soft)' : 'var(--color-danger-soft)' }}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">{answer.correct ? '✅' : '❌'}</span>
                    <div>
                      <p className="font-medium leading-snug" style={{ color: 'var(--color-text)' }} dir="rtl">{q.question}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{q.options[q.correctIndex]}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Daily mode message */}
      {mode === 'daily' && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-center font-medium"
          style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)', color: '#92400E' }}
        >
          📅 סיימת את האתגר היומי! חזור מחר לאתגר חדש.
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePlayAgain}
          className="py-3.5 rounded-2xl font-bold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
        >
          🔄 שחק שוב
        </button>
        <button
          onClick={handleShare}
          className="py-3.5 rounded-2xl font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--color-gold)', color: '#071A44' }}
        >
          {shared ? '✅ הועתק!' : '📤 שתף תוצאה'}
        </button>
      </div>
      <Link
        href="/"
        className="block w-full py-3 rounded-2xl font-bold text-center transition-all hover:opacity-80"
        style={{ background: 'var(--color-bg-soft)', color: 'var(--color-text)' }}
      >
        🏠 חזור לדף הבית
      </Link>
    </div>
  )
}
