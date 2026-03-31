'use client'

import { useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { StatsRow } from './StatsRow'
import { TimerBar } from './TimerBar'
import { AnswerOption } from './AnswerOption'
import { FeedbackBanner } from './FeedbackBanner'
import { LivesIndicator } from './LivesIndicator'
import { MODES } from '@/lib/modes'

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

  const handleAnswer = useCallback(
    (index: number) => {
      if (phase !== 'playing') return
      submitAnswer(index, 0)
    },
    [phase, submitAnswer]
  )

  const handleTimeout = useCallback(() => {
    if (phase !== 'playing') return
    submitAnswer(-1, timerSeconds * 1000)
  }, [phase, submitAnswer, timerSeconds])

  if (!question) return null

  function getAnswerState(index: number): 'idle' | 'selected' | 'correct' | 'wrong' {
    if (phase !== 'feedback') return 'idle'
    if (index === question.correctIndex) return 'correct'
    if (lastAnswer && lastAnswer.selectedIndex === index) return 'wrong'
    return 'idle'
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <StatsRow
        score={score}
        combo={combo}
        correctCount={correctCount}
        currentIndex={currentIndex}
        total={questions.length === 999 ? currentIndex + 1 : questions.length}
        streak={streak}
      />

      {/* Lives (survival mode) */}
      {mode === 'survival' && (
        <LivesIndicator lives={lives} />
      )}

      {/* Timer */}
      {!isFeedback && timerSeconds > 0 && (
        <TimerBar
          key={`timer-${currentIndex}`}
          totalSeconds={timerSeconds}
          onExpire={handleTimeout}
          paused={isFeedback}
        />
      )}

      {/* Question */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {question.difficulty === 'easy' ? 'קל' : question.difficulty === 'medium' ? 'בינוני' : 'קשה'}
          </span>
          <span className="text-xs text-slate-400">{question.type}</span>
        </div>
        <p className="text-lg font-bold text-slate-800 leading-relaxed mt-2">
          {question.question}
        </p>
      </div>

      {/* Answers */}
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

      {/* Feedback */}
      {isFeedback && feedbackCorrect !== null && (
        <FeedbackBanner
          correct={feedbackCorrect}
          explanation={question.explanation}
          onNext={nextQuestion}
          isLastQuestion={isLastQuestion}
        />
      )}
    </div>
  )
}
