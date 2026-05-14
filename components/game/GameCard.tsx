'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { StatsRow } from './StatsRow'
import { TimerBar } from './TimerBar'
import { AnswerOption } from './AnswerOption'
import { FeedbackBanner } from './FeedbackBanner'
import { LivesIndicator } from './LivesIndicator'
import { MODES } from '@/lib/modes'
import { MemoryBoard } from './MemoryBoard'
import { getTypeLabel } from '@/lib/questionLabels'
import Link from 'next/link'

export function GameCard() {
  const {
    mode,
    questions,
    currentIndex,
    score,
    streak,
    combo,
    correctCount,
    lives,
    phase,
    feedbackCorrect,
    answers,
    submitAnswer,
    nextQuestion,
  } = useGameStore()

  const question = questions[currentIndex]
  const modeConfig = MODES.find((m) => m.id === mode)
  const timerSeconds = modeConfig?.timerSeconds ?? 20
  const isFeedback = phase === 'feedback'
  const isLastQuestion = currentIndex >= questions.length - 1 || (mode === 'survival' && lives <= 0)
  const lastAnswer = answers.at(-1)

  const questionStartRef = useRef<number>(0)

  useEffect(() => {
    if (phase === 'playing') questionStartRef.current = Date.now()
  }, [phase, currentIndex])

  const handleAnswer = useCallback(
    (index: number) => {
      if (phase !== 'playing') return
      const timeTakenMs = Date.now() - questionStartRef.current
      submitAnswer(index, timeTakenMs)
    },
    [phase, submitAnswer]
  )

  const handleTimeout = useCallback(() => {
    if (phase !== 'playing') return
    submitAnswer(-1, timerSeconds * 1000)
  }, [phase, submitAnswer, timerSeconds])

  if (mode === 'memory') return <MemoryBoard />

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
        <div className="text-4xl">😕</div>
        <p className="font-bold" style={{ color: 'var(--color-text)' }}>לא נמצאו שאלות</p>
        <Link href="/game" className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: 'var(--color-navy-mid)' }}>
          חזור לבחירת משחק
        </Link>
      </div>
    )
  }

  function getAnswerState(index: number): 'idle' | 'selected' | 'correct' | 'wrong' {
    if (phase !== 'feedback') return 'idle'
    if (index === question.correctIndex) return 'correct'
    if (lastAnswer && lastAnswer.selectedIndex === index) return 'wrong'
    return 'idle'
  }

  const difficultyConfig = {
    easy: { label: 'קל', bg: 'rgba(34,197,94,0.12)', color: '#16A34A' },
    medium: { label: 'בינוני', bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
    hard: { label: 'קשה', bg: 'rgba(239,68,68,0.12)', color: '#DC2626' },
  }
  const diff = difficultyConfig[question.difficulty] ?? difficultyConfig.medium

  return (
    <div className="space-y-3">
      {/* Stats HUD */}
      <StatsRow
        score={score}
        combo={combo}
        correctCount={correctCount}
        currentIndex={currentIndex}
        total={questions.length >= 100 ? currentIndex + 1 : questions.length}
        streak={streak}
      />

      {/* Lives (survival mode) */}
      {mode === 'survival' && <LivesIndicator lives={lives} />}

      {/* Timer */}
      {!isFeedback && timerSeconds > 0 && (
        <TimerBar
          key={`timer-${currentIndex}`}
          totalSeconds={timerSeconds}
          onExpire={handleTimeout}
          paused={isFeedback}
        />
      )}

      {/* Question card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{ background: diff.bg, color: diff.color }}
          >
            {diff.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-soft)', color: 'var(--color-text-muted)' }}>
            {getTypeLabel(question.type)}
          </span>
        </div>

        <p
          className="text-lg font-bold leading-relaxed"
          style={{ color: 'var(--color-text)', lineHeight: 'var(--leading-hebrew-relaxed)' }}
          dir="rtl"
        >
          {question.question}
        </p>
      </div>

      {/* Answer options */}
      <div className="space-y-2">
        {question.options.map((option, i) => (
          <AnswerOption
            key={i}
            index={i}
            text={option}
            state={getAnswerState(i)}
            disabled={isFeedback}
            onClick={() => handleAnswer(i)}
          />
        ))}
      </div>

      {/* Feedback panel */}
      {isFeedback && feedbackCorrect !== null && (
        <FeedbackBanner
          correct={feedbackCorrect}
          explanation={question.explanation}
          scoreGained={lastAnswer?.scoreGained ?? 0}
          onNext={nextQuestion}
          isLastQuestion={isLastQuestion}
        />
      )}
    </div>
  )
}
