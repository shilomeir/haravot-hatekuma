import allQuestions from '@/data/questions.json'

export interface Question {
  id: string
  question: string
  type: 'date' | 'figure' | 'location' | 'organization' | 'sequence' | 'goal' | 'result' | 'logic'
  difficulty: 'easy' | 'medium' | 'hard'
  options: string[]
  correctIndex: number
  explanation: string
}

const QUESTIONS: Question[] = allQuestions as Question[]

export function selectQuestions(params: {
  difficulty?: 'easy' | 'medium' | 'hard'
  n?: number
  excludeIds?: string[]
}): Question[] {
  const { difficulty, n = 10, excludeIds = [] } = params
  let pool = QUESTIONS.filter((q) => !excludeIds.includes(q.id))
  if (difficulty) {
    const byDiff = pool.filter((q) => q.difficulty === difficulty)
    // Fall back to full pool if difficulty filter produces too few questions
    if (byDiff.length >= Math.min(n, 5)) pool = byDiff
  }
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

export function getQuestionsByType(type: Question['type']): Question[] {
  return QUESTIONS.filter((q) => q.type === type)
}

export function getAllQuestions(): Question[] {
  return QUESTIONS
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getDailyQuestions(): Question[] {
  const today = new Date().toISOString().slice(0, 10)
  const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = mulberry32(seed)
  const shuffled = [...QUESTIONS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 10)
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}
