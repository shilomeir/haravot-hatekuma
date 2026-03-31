'use client'

import { getRank, getXpProgress } from '@/lib/ranks'

interface RankBadgeProps {
  xp: number
  showProgress?: boolean
}

export function RankBadge({ xp, showProgress = true }: RankBadgeProps) {
  const rank = getRank(xp)
  const progress = getXpProgress(xp)

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{rank.emoji}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-white leading-none">{rank.title}</span>
        {showProgress && (
          <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
