'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { MODES, type GameMode, type Difficulty } from '@/lib/modes'
import { useGameStore } from '@/store/gameStore'

const DIFFICULTIES: { value: Difficulty; label: string; emoji: string; color: string }[] = [
  { value: 'easy', label: 'קל', emoji: '🟢', color: '#16A34A' },
  { value: 'medium', label: 'בינוני', emoji: '🟡', color: '#D97706' },
  { value: 'hard', label: 'קשה', emoji: '🔴', color: '#DC2626' },
]

const MODE_SUMMARY: Record<string, string> = {
  standard: '10 שאלות • 20 שניות לשאלה',
  blitz: '10 שאלות • 8 שניות לשאלה',
  survival: 'שאלות בלתי מוגבלות • 3 חיים',
  memory: '8 זוגות להתאמה',
  daily: '10 שאלות יומיות • ללא טיימר',
  multi: 'עד 8 שחקנים • 10 שאלות',
}

const MODE_COLORS: Record<string, string> = {
  standard: '#2563EB',
  blitz: '#EA580C',
  survival: '#DC2626',
  memory: '#7C3AED',
  daily: '#D97706',
  multi: '#059669',
}

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
  const isDaily = selectedMode === 'daily'
  const showDifficulty = !isMulti && !isMemory && !isDaily

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isMulti) {
      if (!nickname.trim() || nickname.trim().length < 2) {
        setError('שם כינוי חייב להכיל לפחות 2 תווים')
        return
      }
      if (nickname.trim().length > 20) {
        setError('שם כינוי לא יכול לעלות על 20 תווים')
        return
      }
    }
    setError('')
    setLoading(true)

    try {
      if (isMulti) {
        router.push(`/room/create?nickname=${encodeURIComponent(nickname.trim())}`)
        return
      }

      const effectiveNickname = 'שחקן'
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode, difficulty, nickname: effectiveNickname }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'שגיאה בהתחלת המשחק')

      startGame({
        mode: selectedMode,
        difficulty,
        nickname: effectiveNickname,
        sessionId: data.sessionId,
        questions: data.questions,
      })

      router.push(`/game/${data.sessionId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהתחלת המשחק. נסה שוב.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const selectedColor = MODE_COLORS[selectedMode] ?? '#2563EB'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--color-navy-mid)' }}>
          ⚔️ הגדרות משחק
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>בחר מצב וקושי ולחץ התחל</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mode selection */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>🎮 מצב משחק</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODES.map((mode) => {
              const color = MODE_COLORS[mode.id] ?? '#2563EB'
              const isSelected = selectedMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => { setSelectedMode(mode.id as GameMode); setError('') }}
                  className="p-3 rounded-xl text-right transition-all duration-200 hover:scale-105"
                  style={{
                    border: `2px solid ${isSelected ? color : 'var(--color-border)'}`,
                    background: isSelected ? `${color}12` : 'var(--color-bg-soft)',
                    boxShadow: isSelected ? `0 0 0 1px ${color}40` : 'none',
                  }}
                >
                  <div className="text-2xl mb-1">{mode.emoji}</div>
                  <div className="font-bold text-sm" style={{ color: isSelected ? color : 'var(--color-text)' }}>
                    {mode.label}
                  </div>
                  <div className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                    {mode.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        {showDifficulty && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
          >
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>🎯 רמת קושי</p>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => {
                const isSelected = difficulty === d.value
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      border: `2px solid ${isSelected ? d.color : 'var(--color-border)'}`,
                      background: isSelected ? `${d.color}12` : 'var(--color-bg-soft)',
                      color: isSelected ? d.color : 'var(--color-text-muted)',
                    }}
                  >
                    {d.emoji} {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Nickname (multiplayer only) */}
        {isMulti && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}
          >
            <label htmlFor="nickname-input" className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              👤 שם כינוי
            </label>
            <input
              id="nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="הכנס שם כינוי..."
              maxLength={20}
              className="w-full rounded-xl px-4 py-3 text-right focus:outline-none transition-all"
              style={{
                border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                background: 'var(--color-bg-soft)',
                color: 'var(--color-text)',
              }}
              dir="rtl"
            />
            {error && (
              <p className="text-sm mt-2 font-medium" style={{ color: 'var(--color-danger)' }}>
                ⚠️ {error}
              </p>
            )}
          </div>
        )}

        {/* Game summary */}
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium text-center"
          style={{ background: `${selectedColor}10`, color: selectedColor, border: `1px solid ${selectedColor}30` }}
        >
          {MODES.find((m) => m.id === selectedMode)?.emoji} {MODE_SUMMARY[selectedMode]}
          {showDifficulty && ` • ${DIFFICULTIES.find(d => d.value === difficulty)?.label}`}
        </div>

        {/* Non-multi errors */}
        {!isMulti && error && (
          <p className="text-sm font-medium text-center" style={{ color: 'var(--color-danger)' }}>⚠️ {error}</p>
        )}

        {/* Multiplayer info */}
        {isMulti && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: '#065F46' }}
          >
            <strong>🌐 מרובה משתתפים:</strong> לאחר הלחיצה תיצור חדר ותקבל קוד לשיתוף עם חברים.
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || (isMulti && !nickname.trim())}
          className="w-full py-4 rounded-2xl text-lg font-black text-white transition-all hover:opacity-90 active:scale-98 disabled:opacity-50"
          style={{ background: loading ? '#94A3B8' : `linear-gradient(135deg, ${selectedColor}, ${selectedColor}CC)`, boxShadow: loading ? 'none' : `0 4px 20px ${selectedColor}40` }}
        >
          {loading ? '⏳ מתחיל...' : isMulti ? '🌐 צור חדר' : '▶ התחל משחק'}
        </button>
      </form>
    </div>
  )
}

export default function GameSetupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl" style={{ color: 'var(--color-text-muted)' }}>⏳ טוען...</div>
      </div>
    }>
      <GameSetupContent />
    </Suspense>
  )
}
