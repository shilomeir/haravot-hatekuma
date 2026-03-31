import { RANKS } from '@/lib/ranks'

export function RankPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-[#0d2d6e] px-4 py-3">
        <h2 className="text-white font-bold text-sm">🏅 סולם הדרגות</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {RANKS.map((rank) => (
          <div key={rank.title} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">{rank.emoji}</span>
              <span className="font-medium text-sm text-slate-700">{rank.title}</span>
            </div>
            <span className="text-xs text-slate-400">
              {rank.xpRequired === 0 ? 'התחלה' : `${rank.xpRequired.toLocaleString()} XP`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
