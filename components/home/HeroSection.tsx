import Link from 'next/link'

export function HeroSection() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 md:p-10 text-white"
      style={{ background: 'linear-gradient(135deg, #071A44 0%, #0D2D6E 60%, #1D4ED8 100%)' }}
    >
      {/* Decorative background glow */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        aria-hidden="true"
      />

      <div className="relative space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
            <span>🇮🇱</span>
            <span>משחק הטריוויה הרשמי</span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
            style={{ lineHeight: '1.15' }}
          >
            חרבות<br />
            <span style={{ color: '#FACC15' }}>התקומה</span>
          </h1>
          <p className="text-blue-200 text-base md:text-lg max-w-md leading-relaxed">
            בחן את הידע שלך על מבצע חרבות ברזל.
            ענה על שאלות, צבור XP ועלה בדרגות.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/game"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FACC15, #F59E0B)', color: '#071A44' }}
          >
            <span>▶</span>
            <span>התחל לשחק</span>
          </Link>
          <Link
            href="/game?mode=daily"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all bg-white/10 hover:bg-white/20 border border-white/20"
          >
            <span>📅</span>
            <span>אתגר יומי</span>
          </Link>
        </div>

        <div className="flex gap-5 text-sm text-blue-300">
          <span>🎯 105 שאלות</span>
          <span>🏆 13 דרגות</span>
          <span>⚡ 6 מצבי משחק</span>
        </div>
      </div>
    </div>
  )
}
