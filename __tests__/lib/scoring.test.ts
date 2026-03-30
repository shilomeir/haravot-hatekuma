import { describe, it, expect } from 'vitest'
import { calcScore, calcCombo, calcCoins, calcXP, calcBlitzCoins, COMBO_MULTIPLIER } from '@/lib/scoring'

describe('calcCombo', () => {
  it('returns ×1 for streak < 3', () => expect(calcCombo(2)).toBe(1))
  it('returns ×1.5 for streak 3-4', () => expect(calcCombo(3)).toBe(1.5))
  it('returns ×2 for streak ≥ 5', () => expect(calcCombo(5)).toBe(2))
  it('returns ×2 for streak 10', () => expect(calcCombo(10)).toBe(2))
})

describe('calcScore', () => {
  it('returns 100 for correct, no speed bonus, combo 1', () => {
    expect(calcScore({ correct: true, timeTakenMs: 5000, streak: 1 })).toBe(100)
  })
  it('applies speed bonus for < 3s answer', () => {
    expect(calcScore({ correct: true, timeTakenMs: 2000, streak: 1 })).toBe(150)
  })
  it('applies combo multiplier', () => {
    expect(calcScore({ correct: true, timeTakenMs: 5000, streak: 3 })).toBe(150)
  })
  it('applies both speed + combo', () => {
    expect(calcScore({ correct: true, timeTakenMs: 2000, streak: 3 })).toBe(225)
  })
  it('returns 0 for wrong answer', () => {
    expect(calcScore({ correct: false, timeTakenMs: 1000, streak: 5 })).toBe(0)
  })
})

describe('calcXP', () => {
  it('returns 10 for easy correct', () => expect(calcXP('easy', true)).toBe(10))
  it('returns 15 for medium correct', () => expect(calcXP('medium', true)).toBe(15))
  it('returns 20 for hard correct', () => expect(calcXP('hard', true)).toBe(20))
  it('returns 0 for wrong', () => expect(calcXP('easy', false)).toBe(0))
})

describe('calcCoins', () => {
  it('returns 10 for correct, combo 1', () => {
    expect(calcCoins({ correct: true, streak: 1 })).toBe(10)
  })
  it('applies combo to coins', () => {
    expect(calcCoins({ correct: true, streak: 3 })).toBe(15)
  })
  it('returns 0 for wrong', () => {
    expect(calcCoins({ correct: false, streak: 5 })).toBe(0)
  })
})

describe('calcBlitzCoins', () => {
  it('returns streak×5 coins', () => {
    expect(calcBlitzCoins(1)).toBe(5)
    expect(calcBlitzCoins(3)).toBe(15)
    expect(calcBlitzCoins(5)).toBe(25)
  })
  it('returns 0 for streak 0', () => {
    expect(calcBlitzCoins(0)).toBe(0)
  })
})
