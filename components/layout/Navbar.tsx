'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { RankBadge } from './RankBadge'
import { loadProgress, setTheme } from '@/lib/storage'

export function Navbar() {
  const pathname = usePathname()
  const [xp, setXp] = useState(0)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const p = loadProgress()
    setXp(p.totalXP)
    const savedTheme = p.theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark)
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
  }, [])

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    setTheme(next)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className="sticky top-0 z-50 h-16 border-b"
      style={{
        background: 'rgba(7, 26, 68, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-8 max-w-6xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-black text-lg hover:opacity-80 transition-opacity"
          aria-label="חרבות התקומה - דף הבית"
        >
          <span className="text-xl">⚔️</span>
          <span className="hidden sm:inline tracking-tight">חרבות התקומה</span>
        </Link>

        {/* Nav links + actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/"
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/') ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            aria-current={isActive('/') ? 'page' : undefined}
          >
            בית
          </Link>
          <Link
            href="/game"
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hidden sm:block ${
              isActive('/game') ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            aria-current={isActive('/game') ? 'page' : undefined}
          >
            שחק
          </Link>

          {/* Play CTA */}
          <Link
            href="/game"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
              color: '#071A44',
            }}
          >
            <span>▶</span>
            <span className="hidden xs:inline">שחק עכשיו</span>
          </Link>

          {/* Rank badge */}
          <RankBadge xp={xp} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  )
}
