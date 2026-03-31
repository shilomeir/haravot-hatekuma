'use client'

import Link from 'next/link'
import { RankBadge } from './RankBadge'

export function Navbar() {
  return (
    <nav className="bg-[#0d2d6e] h-16 flex items-center px-4 md:px-8 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity">
          <span className="text-2xl">⚔️</span>
          <span className="hidden sm:inline">חרבות התקומה</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            בית
          </Link>
          <Link href="/game" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            שחק
          </Link>
          <Link
            href="/game"
            className="bg-white text-[#0d2d6e] px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors"
          >
            ▶ שחק עכשיו
          </Link>
          <RankBadge xp={0} />
        </div>
      </div>
    </nav>
  )
}
