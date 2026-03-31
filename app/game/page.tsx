'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { MODES, type GameMode, type Difficulty } from '@/lib/modes'
import { useGameStore } from '@/store/gameStore'

const DIFFICULTIES: { value: Difficulty; label: string; emoji: string }[] = [
  { value: 'easy', label: 'קל', emoji: '🟢' },
  { value: 'medium', label: 'בינוני', emoji: '🟡' },
  { value: 'hard', label: 'קשה', emoji: '🔴' },
]

function GameSetupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const startGame = useGameStore((s) => s.startGame)

  const initialMode = (searchParams.get('mode') as GameMode) ?? 'standard'
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isMulti = selectedMode === 'multi'
  const isMemory = selectedMode === 'memory'
  const showDifficulty = !isMulti && !isMemory && selectedMode !== 'daily'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('שם כינוי חייב להכיל לפחות 2 תווים')
      return
    }
    if (nickname.trim().length > 20) {
      setError('שם כינוי לא יכול לעלות על 20 תווים')
      return
    }
    setError('')
    setLoading(true)

    try {
      if (isMulti) {
        router.push(`/room/create?nickname=${encodeURIComponent(nickname.trim())}`)
        return
      }

      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode, difficulty, nickname: nickname.trim() }),
      })

      if (!res.ok) throw new Error('שגיאה בהתחלת המשחק')
      const { sessionId, questions } = await res.json()

      startGame({
        mode: selectedMode,
        difficulty,
        nickname: nickname.trim(),
        sessionId,
        questions,
      })

      router.push(`/game/${sessionId}`)
    } catch {
      setError('שגיאה בהתחלת המשחק. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0d2d6e] mb-2">⚔️ הגדרות משחק</h1>
        <p className="text-slate-500">בחר את המצב שלך והתחל לשחק</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nickname */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            👤 שם כינוי
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="הכנס שם כינוי..."
            maxLength={20}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-[#1a4b9c] focus:border-transparent"
            dir="rtl"
            required
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Mode selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="block text-sm font-bold text-slate-700 mb-3">
            🎮 מצב משחק
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id as GameMode)}
                className={`p-3 rounded-lg border-2 text-right transition-all ${
                  selectedMode === mode.id
                    ? 'border-[#1a4b9c] bg-[#1a4b9c]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">{mode.emoji}</div>
                <div className="font-bold text-sm text-slate-700">{mode.label}</div>
                <div className="text-xs text-slate-400 leading-tight mt-0.5">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty — only for standard/blitz/survival */}
        {showDifficulty && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              🎯 רמת קושי
            </label>
            <div className="flex gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 py-2.5 rounded-lg border-2 font-bold text-sm transition-all ${
                    difficulty === d.value
                      ? 'border-[#1a4b9c] bg-[#1a4b9c]/5 text-[#0d2d6e]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multiplayer info */}
        {isMulti && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <strong>🌐 מרובה משתתפים:</strong> אחרי שתלחץ על "התחל", תיצור חדר ותקבל קוד 6 ספרות לשיתוף עם חברים.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !nickname.trim()}
          className="w-full bg-[#0d2d6e] hover:bg-[#1a4b9c] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-lg transition-colors shadow-lg"
        >
          {loading ? '⏳ טוען...' : isMulti ? '🌐 צור חדר' : '▶ התחל משחק'}
        </button>
      </form>
    </div>
  )
}

export default function GameSetupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl text-slate-400">⏳ טוען...</div>
      </div>
    }>
      <GameSetupContent />
    </Suspense>
  )
}
