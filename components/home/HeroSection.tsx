import Link from 'next/link'

export function HeroSection() {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="space-y-3">
        <div className="text-6xl mb-4">⚔️🇮🇱</div>
        <h1 className="text-4xl md:text-5xl font-black text-[#0d2d6e] leading-tight">
          חרבות התקומה
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
          בחן את הידע שלך על ניצחונות צה״ל במבצע חרבות ברזל.
          <br />
          <span className="font-semibold text-[#1a4b9c]">התחרה, הצלח, והפוך לרב אלוף!</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/game"
          className="bg-[#0d2d6e] hover:bg-[#1a4b9c] text-white font-bold px-8 py-3 rounded-xl text-lg transition-colors shadow-lg"
        >
          🎮 שחק עכשיו
        </Link>
        <Link
          href="/game?mode=daily"
          className="bg-yellow-400 hover:bg-yellow-500 text-[#0d2d6e] font-bold px-8 py-3 rounded-xl text-lg transition-colors shadow-lg"
        >
          📅 אתגר יומי
        </Link>
      </div>

      <div className="flex justify-center gap-6 text-sm text-slate-500">
        <span>🎯 40 שאלות</span>
        <span>🏆 13 דרגות</span>
        <span>⚡ 6 מצבי משחק</span>
      </div>
    </div>
  )
}
