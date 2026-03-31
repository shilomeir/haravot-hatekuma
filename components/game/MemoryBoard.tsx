'use client'

import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Question } from '@/lib/questions'

interface MemoryCard {
  id: string         // unique card id
  questionId: string // pair identifier
  type: 'question' | 'answer'
  text: string
}

function buildCards(questions: Question[]): MemoryCard[] {
  const cards: MemoryCard[] = []
  questions.slice(0, 8).forEach((q) => {
    cards.push({
      id: `q-${q.id}`,
      questionId: q.id,
      type: 'question',
      text: q.question,
    })
    cards.push({
      id: `a-${q.id}`,
      questionId: q.id,
      type: 'answer',
      text: q.options[q.correctIndex],
    })
  })
  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export function MemoryBoard() {
  const { questions, submitAnswer } = useGameStore()
  const [cards] = useState<MemoryCard[]>(() => buildCards(questions))
  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [blocked, setBlocked] = useState(false)
  const [moves, setMoves] = useState(0)

  const handleFlip = useCallback(
    (cardId: string) => {
      if (blocked || flipped.includes(cardId) || matched.includes(cardId)) return

      const newFlipped = [...flipped, cardId]
      setFlipped(newFlipped)

      if (newFlipped.length === 2) {
        setBlocked(true)
        setMoves((m) => m + 1)

        const [first, second] = newFlipped.map((id) => cards.find((c) => c.id === id)!)

        if (first.questionId === second.questionId && first.type !== second.type) {
          // Match!
          const newMatched = [...matched, ...newFlipped]
          setTimeout(() => {
            setMatched(newMatched)
            setFlipped([])
            setBlocked(false)
            // If all pairs matched → finish game
            if (newMatched.length === cards.length) {
              // Submit a correct answer for bookkeeping then finish
              const store = useGameStore.getState()
              submitAnswer(store.questions[store.currentIndex]?.correctIndex ?? 0, 5000)
              setTimeout(() => {
                // Advance to finished phase
                useGameStore.setState({ phase: 'finished' })
              }, 100)
            }
          }, 400)
        } else {
          // No match — flip back
          setTimeout(() => {
            setFlipped([])
            setBlocked(false)
          }, 1000)
        }
      }
    },
    [blocked, flipped, matched, cards, submitAnswer]
  )

  const isFlipped = (id: string) => flipped.includes(id) || matched.includes(id)
  const isMatched = (id: string) => matched.includes(id)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0d2d6e] text-white rounded-xl px-4 py-2.5">
        <span className="text-sm font-bold">🃏 מצב זיכרון</span>
        <span className="text-sm">
          {matched.length / 2}/8 זוגות · {moves} מהלכים
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const face = isFlipped(card.id)
          const done = isMatched(card.id)
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`
                aspect-square rounded-xl border-2 p-1.5 text-xs font-medium transition-all duration-300 leading-tight text-center
                ${done
                  ? 'bg-green-100 border-green-400 text-green-800 cursor-default'
                  : face
                  ? card.type === 'question'
                    ? 'bg-blue-50 border-[#1a4b9c] text-slate-700'
                    : 'bg-yellow-50 border-yellow-400 text-slate-700'
                  : 'bg-[#0d2d6e] border-[#0d2d6e] text-[#0d2d6e] hover:bg-[#1a4b9c] hover:border-[#1a4b9c] cursor-pointer'
                }
              `}
            >
              {face || done ? (
                <span className="line-clamp-3">{card.text}</span>
              ) : (
                <span className="text-white text-lg">?</span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-center text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-100 border border-[#1a4b9c] rounded inline-block" /> שאלה
          &nbsp;
          <span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded inline-block" /> תשובה
        </span>
      </p>
    </div>
  )
}
