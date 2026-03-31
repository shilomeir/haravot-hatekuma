'use client'

import { create } from 'zustand'
import { calcScore, calcXP, calcCoins, calcCombo } from '@/lib/scoring'
import type { Question } from '@/lib/questions'
import type { GameMode, Difficulty } from '@/lib/modes'

export type GamePhase = 'idle' | 'playing' | 'feedback' | 'finished'

export interface AnswerRecord {
  questionId: string
  selectedIndex: number
  correct: boolean
  timeTakenMs: number
  scoreGained: number
}

interface GameState {
  // setup
  mode: GameMode | null
  difficulty: Difficulty
  nickname: string
  sessionId: string
  // questions
  questions: Question[]
  currentIndex: number
  // scoring
  score: number
  streak: number
  combo: number
  correctCount: number
  xp: number
  coins: number
  lives: number
  // feedback
  phase: GamePhase
  feedbackCorrect: boolean | null
  answers: AnswerRecord[]
  // actions
  startGame: (params: {
    mode: GameMode
    difficulty: Difficulty
    nickname: string
    sessionId: string
    questions: Question[]
  }) => void
  submitAnswer: (selectedIndex: number, timeTakenMs: number) => void
  nextQuestion: () => void
  resetGame: () => void
}

const INITIAL_LIVES = 3

export const useGameStore = create<GameState>((set, get) => ({
  mode: null,
  difficulty: 'medium',
  nickname: '',
  sessionId: '',
  questions: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
  combo: 1,
  correctCount: 0,
  xp: 0,
  coins: 0,
  lives: INITIAL_LIVES,
  phase: 'idle',
  feedbackCorrect: null,
  answers: [],

  startGame: ({ mode, difficulty, nickname, sessionId, questions }) => {
    set({
      mode,
      difficulty,
      nickname,
      sessionId,
      questions,
      currentIndex: 0,
      score: 0,
      streak: 0,
      combo: 1,
      correctCount: 0,
      xp: 0,
      coins: 0,
      lives: INITIAL_LIVES,
      phase: 'playing',
      feedbackCorrect: null,
      answers: [],
    })
  },

  submitAnswer: (selectedIndex, timeTakenMs) => {
    const state = get()
    const question = state.questions[state.currentIndex]
    if (!question || state.phase !== 'playing') return

    const correct = selectedIndex === question.correctIndex
    const newStreak = correct ? state.streak + 1 : 0
    const combo = calcCombo(newStreak)
    const scoreGained = correct
      ? calcScore({ correct, timeTakenMs, streak: newStreak })
      : 0
    const xpGained = calcXP(question.difficulty, correct)
    const coinsGained = correct ? calcCoins({ correct, streak: newStreak }) : 0
    const newLives =
      state.mode === 'survival' && !correct
        ? state.lives - 1
        : state.lives

    const record: AnswerRecord = {
      questionId: question.id,
      selectedIndex,
      correct,
      timeTakenMs,
      scoreGained,
    }

    set({
      streak: newStreak,
      combo,
      score: state.score + scoreGained,
      xp: state.xp + xpGained,
      coins: state.coins + coinsGained,
      correctCount: correct ? state.correctCount + 1 : state.correctCount,
      lives: newLives,
      phase: 'feedback',
      feedbackCorrect: correct,
      answers: [...state.answers, record],
    })
  },

  nextQuestion: () => {
    const state = get()
    const isLastQuestion = state.currentIndex >= state.questions.length - 1
    const outOfLives = state.mode === 'survival' && state.lives <= 0

    if (isLastQuestion || outOfLives) {
      set({ phase: 'finished' })
    } else {
      set({ currentIndex: state.currentIndex + 1, phase: 'playing', feedbackCorrect: null })
    }
  },

  resetGame: () => {
    set({
      mode: null,
      difficulty: 'medium',
      nickname: '',
      sessionId: '',
      questions: [],
      currentIndex: 0,
      score: 0,
      streak: 0,
      combo: 1,
      correctCount: 0,
      xp: 0,
      coins: 0,
      lives: INITIAL_LIVES,
      phase: 'idle',
      feedbackCorrect: null,
      answers: [],
    })
  },
}))
