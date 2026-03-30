export const COMBO_MULTIPLIER = { 1: 1, 3: 1.5, 5: 2 } as const
const SPEED_BONUS_MS = 3000
const SPEED_BONUS_PTS = 50
const BASE_POINTS = 100
const BASE_COINS = 10

export function calcCombo(streak: number): number {
  if (streak >= 5) return 2
  if (streak >= 3) return 1.5
  return 1
}

export function calcScore(params: { correct: boolean; timeTakenMs: number; streak: number }): number {
  if (!params.correct) return 0
  const combo = calcCombo(params.streak)
  const speed = params.timeTakenMs < SPEED_BONUS_MS ? SPEED_BONUS_PTS : 0
  return Math.round((BASE_POINTS + speed) * combo)
}

export function calcXP(difficulty: 'easy' | 'medium' | 'hard', correct: boolean): number {
  if (!correct) return 0
  return { easy: 10, medium: 15, hard: 20 }[difficulty]
}

export function calcCoins(params: { correct: boolean; streak: number }): number {
  if (!params.correct) return 0
  return Math.round(BASE_COINS * calcCombo(params.streak))
}

export function calcBlitzCoins(streak: number): number {
  return streak * 5
}
