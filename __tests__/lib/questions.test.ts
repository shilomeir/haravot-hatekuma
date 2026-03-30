import { describe, it, expect } from 'vitest'
import { selectQuestions, getQuestionsByType, getDailyQuestions } from '@/lib/questions'

describe('selectQuestions', () => {
  it('returns exactly n questions', () => {
    const qs = selectQuestions({ difficulty: 'easy', n: 5 })
    expect(qs).toHaveLength(5)
  })
  it('filters by difficulty', () => {
    const qs = selectQuestions({ difficulty: 'hard', n: 5 })
    qs.forEach(q => expect(q.difficulty).toBe('hard'))
  })
  it('each question has exactly 4 options', () => {
    const qs = selectQuestions({ n: 10 })
    qs.forEach(q => expect(q.options).toHaveLength(4))
  })
  it('returns no duplicates', () => {
    const qs = selectQuestions({ n: 10 })
    const ids = qs.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getDailyQuestions', () => {
  it('returns exactly 10 questions', () => {
    expect(getDailyQuestions()).toHaveLength(10)
  })
  it('returns the same questions when called twice on same day', () => {
    const a = getDailyQuestions().map(q => q.id)
    const b = getDailyQuestions().map(q => q.id)
    expect(a).toEqual(b)
  })
  it('returns no duplicates', () => {
    const ids = getDailyQuestions().map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
