'use client'

const STORAGE_KEY = 'haravot-progress-v1'

export interface UserProgress {
  totalXP: number
  totalCoins: number
  bestScores: Record<string, number>
  completedDailyDates: string[]
  currentStreak: number
  lastPlayedDate: string
  wrongQuestionIds: string[]
  onboardingDone: boolean
  theme: 'light' | 'dark' | 'system'
}

const DEFAULT_PROGRESS: UserProgress = {
  totalXP: 0,
  totalCoins: 0,
  bestScores: {},
  completedDailyDates: [],
  currentStreak: 0,
  lastPlayedDate: '',
  wrongQuestionIds: [],
  onboardingDone: false,
  theme: 'system',
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {}
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function calcStreak(progress: UserProgress, today: string): number {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yKey = yesterday.toISOString().slice(0, 10)

  if (progress.lastPlayedDate === today) return progress.currentStreak
  if (progress.lastPlayedDate === yKey) return progress.currentStreak + 1
  return 1
}

export function applyGameRewards(params: {
  xp: number
  coins: number
  mode: string
  score: number
  wrongIds: string[]
  isDaily: boolean
}): UserProgress {
  const progress = loadProgress()
  const today = getTodayKey()

  const newStreak = calcStreak(progress, today)
  const newDailyDates = params.isDaily && !progress.completedDailyDates.includes(today)
    ? [...progress.completedDailyDates, today]
    : progress.completedDailyDates

  const bestKey = params.mode
  const currentBest = progress.bestScores[bestKey] ?? 0
  const newBestScores = params.score > currentBest
    ? { ...progress.bestScores, [bestKey]: params.score }
    : progress.bestScores

  const uniqueWrong = Array.from(new Set([...progress.wrongQuestionIds, ...params.wrongIds]))

  const updated: UserProgress = {
    ...progress,
    totalXP: progress.totalXP + params.xp,
    totalCoins: progress.totalCoins + params.coins,
    bestScores: newBestScores,
    completedDailyDates: newDailyDates,
    currentStreak: newStreak,
    lastPlayedDate: today,
    wrongQuestionIds: uniqueWrong,
  }
  saveProgress(updated)
  return updated
}

export function isDailyCompleted(): boolean {
  const progress = loadProgress()
  const today = getTodayKey()
  return progress.completedDailyDates.includes(today)
}

export function setTheme(theme: UserProgress['theme']): void {
  const progress = loadProgress()
  saveProgress({ ...progress, theme })
}
