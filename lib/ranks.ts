export interface Rank {
  title: string
  emoji: string
  xpRequired: number
}

export const RANKS: Rank[] = [
  { title: 'טירון',      emoji: '🧒',     xpRequired: 0     },
  { title: 'טוראי',      emoji: '🧑‍🦱', xpRequired: 100   },
  { title: 'רב טוראי',  emoji: '👨',     xpRequired: 300   },
  { title: 'סמל',        emoji: '👨‍🦱', xpRequired: 600   },
  { title: 'רב סמל',    emoji: '🧔',     xpRequired: 1000  },
  { title: 'סגן',        emoji: '👮',     xpRequired: 1600  },
  { title: 'סרן',        emoji: '👨‍✈️',xpRequired: 2400  },
  { title: 'רב״ם',       emoji: '🧔‍♂️',xpRequired: 3500  },
  { title: 'סגן אלוף',  emoji: '👨‍💼', xpRequired: 5000  },
  { title: 'אלוף משנה', emoji: '🧓',     xpRequired: 7000  },
  { title: 'תת אלוף',   emoji: '👴',     xpRequired: 9500  },
  { title: 'אלוף',       emoji: '🎖️',   xpRequired: 12500 },
  { title: 'רב אלוף',   emoji: '🎖️',   xpRequired: 16000 },
]

export function getRank(xp: number): Rank {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (xp >= rank.xpRequired) current = rank
    else break
  }
  return current
}

export function getNextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (rank.xpRequired > xp) return rank
  }
  return null
}

export function getXpProgress(xp: number): { current: number; target: number; pct: number } {
  const rank = getRank(xp)
  const next = getNextRank(xp)
  if (!next) return { current: xp - rank.xpRequired, target: 1, pct: 100 }
  return {
    current: xp - rank.xpRequired,
    target: next.xpRequired - rank.xpRequired,
    pct: Math.round(((xp - rank.xpRequired) / (next.xpRequired - rank.xpRequired)) * 100),
  }
}
