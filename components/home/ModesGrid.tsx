'use client'

import { useRouter } from 'next/navigation'
import { MODES } from '@/lib/modes'

const MODE_BADGES: Record<string, string> = {
  standard: 'קלאסי',
  blitz: 'מהיר',
  survival: 'אתגר',
  memory: 'זיכרון',
  daily: 'יומי',
  multi: 'עם חברים',
}

const MODE_COLORS: Record<string, string> = {
  standard: '#2563EB',
  blitz: '#EA580C',
  survival: '#DC2626',
  memory: '#7C3AED',
  daily: '#D97706',
  multi: '#059669',
}

export function ModesGrid() {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy-mid)' }}>
        🎮 מצבי משחק
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MODES.map((mode) => {
          const color = MODE_COLORS[mode.id] ?? '#2563EB'
          return (
            <button
              key={mode.id}
              onClick={() => router.push(`/game?mode=${mode.id}`)}
              className="group relative rounded-xl p-4 text-right border transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-soft)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = color
                el.style.boxShadow = `0 4px 20px ${color}33`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--color-border)'
                el.style.boxShadow = 'var(--shadow-soft)'
              }}
            >
              {/* Badge */}
              <span
                className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${color}22`, color }}
              >
                {MODE_BADGES[mode.id]}
              </span>

              <div className="text-3xl mb-2 mt-1">{mode.emoji}</div>
              <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                {mode.label}
              </div>
              <div className="text-xs mt-1 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {mode.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
