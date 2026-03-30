import { describe, it, expect } from 'vitest'
import { getRank, getNextRank, RANKS } from '@/lib/ranks'

describe('getRank', () => {
  it('returns טירון for 0 XP', () => {
    expect(getRank(0).title).toBe('טירון')
    expect(getRank(0).emoji).toBe('🧒')
  })
  it('returns טוראי for 150 XP', () => {
    expect(getRank(150).title).toBe('טוראי')
  })
  it('returns רב אלוף for max XP', () => {
    expect(getRank(20000).title).toBe('רב אלוף')
  })
})

describe('getNextRank', () => {
  it('returns next rank for non-max XP', () => {
    const next = getNextRank(0)
    expect(next?.title).toBe('טוראי')
    expect(next?.xpRequired).toBe(100)
  })
  it('returns null at max rank', () => {
    expect(getNextRank(20000)).toBeNull()
  })
})

describe('RANKS', () => {
  it('has 13 ranks', () => { expect(RANKS).toHaveLength(13) })
  it('is sorted ascending by xpRequired', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].xpRequired).toBeGreaterThan(RANKS[i-1].xpRequired)
    }
  })
})
