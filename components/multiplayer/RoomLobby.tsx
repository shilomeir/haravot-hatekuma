'use client'

import { useState } from 'react'
import type { RoomPlayer } from '@/lib/room'
import { PlayerScore } from './PlayerScore'

interface RoomLobbyProps {
  code: string
  players: RoomPlayer[]
  localNickname: string
  isHost: boolean
  onStart: () => void
  starting: boolean
}

export function RoomLobby({ code, players, localNickname, isHost, onStart, starting }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Room code */}
      <div className="text-center space-y-2">
        <p className="text-slate-500 text-sm">קוד החדר</p>
        <div className="flex items-center justify-center gap-3">
          <div className="text-5xl font-black tracking-widest text-[#0d2d6e] bg-white border-2 border-[#0d2d6e] rounded-2xl px-6 py-3">
            {code}
          </div>
          <button
            onClick={copyCode}
            className="bg-slate-100 hover:bg-slate-200 p-3 rounded-xl transition-colors"
            title="העתק קוד"
          >
            {copied ? '✅' : '📋'}
          </button>
        </div>
        <p className="text-xs text-slate-400">שתף את הקוד עם חברים כדי שיצטרפו</p>
      </div>

      {/* Players */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0d2d6e] px-4 py-2.5">
          <span className="text-white font-bold text-sm">👥 שחקנים ({players.length})</span>
        </div>
        <div className="divide-y divide-slate-100">
          {players.map((p) => (
            <div key={p.nickname} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <span className="font-medium text-sm text-slate-700">
                  {p.nickname}
                  {p.nickname === localNickname && ' (אתה)'}
                </span>
              </div>
              <span className="text-xs text-slate-400">מוכן ✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start button (host only) */}
      {isHost ? (
        <div className="space-y-2">
          <button
            onClick={onStart}
            disabled={starting || players.length < 1}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-lg transition-colors"
          >
            {starting ? '⏳ מתחיל...' : '▶ התחל משחק'}
          </button>
          {players.length < 2 && (
            <p className="text-xs text-center text-slate-400">ממתין לשחקנים נוספים...</p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-slate-400 text-sm animate-pulse">⏳ ממתין למארח שיתחיל את המשחק...</div>
        </div>
      )}
    </div>
  )
}
