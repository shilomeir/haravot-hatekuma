'use client'

import { getRank } from '@/lib/ranks'
import type { RoomPlayer } from '@/lib/room'

interface PlayerScoreProps {
  player: RoomPlayer
  isLocal?: boolean
  rank?: number
}

export function PlayerScore({ player, isLocal, rank }: PlayerScoreProps) {
  const playerRank = getRank(player.xp)
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
      isLocal ? 'bg-[#0d2d6e] text-white' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center gap-2">
        {rank !== undefined && (
          <span className={`text-sm font-black w-5 ${isLocal ? 'text-yellow-400' : 'text-slate-400'}`}>
            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`}
          </span>
        )}
        <span className="text-lg">{playerRank.emoji}</span>
        <span className={`font-bold text-sm ${isLocal ? 'text-white' : 'text-slate-700'}`}>
          {player.nickname}
          {isLocal && ' (אתה)'}
        </span>
      </div>
      <div className="text-left">
        <div className={`font-black ${isLocal ? 'text-yellow-400' : 'text-[#0d2d6e]'}`}>
          {player.score.toLocaleString()}
        </div>
        <div className={`text-xs ${isLocal ? 'text-white/60' : 'text-slate-400'}`}>
          {player.coins} 🪙
        </div>
      </div>
    </div>
  )
}
