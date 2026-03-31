interface StatsRowProps {
  score: number
  combo: number
  correctCount: number
  currentIndex: number
  total: number
  streak: number
}

export function StatsRow({ score, combo, correctCount, currentIndex, total, streak }: StatsRowProps) {
  return (
    <div className="flex items-center justify-between bg-[#0d2d6e] text-white rounded-xl px-4 py-2.5">
      {/* Score */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/60">ניקוד</span>
        <span className="font-black text-lg leading-none">{score.toLocaleString()}</span>
      </div>

      {/* Combo */}
      {combo > 1 && (
        <div className="flex flex-col items-center">
          <span className="text-xs text-yellow-400">קומבו</span>
          <span className="font-black text-lg text-yellow-400 leading-none">×{combo}</span>
        </div>
      )}

      {/* Streak */}
      {streak >= 2 && (
        <div className="flex items-center gap-1">
          <span className="text-orange-400 font-bold text-sm">🔥 {streak}</span>
        </div>
      )}

      {/* Progress */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/60">שאלה</span>
        <span className="font-bold leading-none">{currentIndex + 1}/{total}</span>
      </div>

      {/* Correct */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/60">נכון</span>
        <span className="font-bold text-green-400 leading-none">{correctCount}</span>
      </div>
    </div>
  )
}
