'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoomStore } from '@/store/roomStore'
import { RoomLobby } from '@/components/multiplayer/RoomLobby'
import { PlayerScore } from '@/components/multiplayer/PlayerScore'
import type { RoomPlayer } from '@/lib/room'
import type { Question } from '@/lib/questions'

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const router = useRouter()
  const { nickname, isHost, phase, players, setRoom, setPlayers, setPhase, setQuestions } = useRoomStore()

  const [joinNickname, setJoinNickname] = useState('')
  const [joining, setJoining] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [pusherReady, setPusherReady] = useState(false)

  const hasJoined = !!nickname

  // Setup Pusher when joined
  useEffect(() => {
    if (!hasJoined || pusherReady) return
    const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
    const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!PUSHER_KEY || !PUSHER_CLUSTER) return

    let pusherInstance: import('pusher-js').default | null = null

    import('pusher-js').then(({ default: Pusher }) => {
      pusherInstance = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
        auth: { params: { nickname } },
      })

      const channel = pusherInstance.subscribe(`presence-room-${code}`)

      channel.bind('player-joined', (data: { players: Record<string, RoomPlayer> }) => {
        setPlayers(data.players)
      })

      channel.bind('game-started', (data: { questions: Question[] }) => {
        setQuestions(data.questions)
        setPhase('playing')
      })

      channel.bind('score-update', (data: { players: Record<string, RoomPlayer> }) => {
        setPlayers(data.players)
      })

      channel.bind('game-over', () => {
        setPhase('results')
      })

      setPusherReady(true)
    })

    return () => {
      pusherInstance?.disconnect()
    }
  }, [hasJoined, nickname, code, setPlayers, setPhase, setQuestions, pusherReady])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinNickname.trim() || joinNickname.trim().length < 2) {
      setError('שם כינוי חייב להכיל לפחות 2 תווים')
      return
    }
    setJoining(true)
    setError('')
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), nickname: joinNickname.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'שגיאה בהצטרפות')
      }
      const { state } = await res.json()
      setRoom(code.toUpperCase(), joinNickname.trim(), false)
      setPlayers(state.players)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בהצטרפות לחדר'
      setError(message)
    } finally {
      setJoining(false)
    }
  }

  async function handleStart() {
    setStarting(true)
    try {
      await fetch('/api/room/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), nickname }),
      })
    } catch {
      setStarting(false)
    }
  }

  // Join form (not yet joined)
  if (!hasJoined) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0d2d6e] mb-2">🌐 הצטרף לחדר</h1>
          <div className="text-5xl font-black tracking-widest text-[#0d2d6e] bg-white border-2 border-[#0d2d6e] rounded-2xl px-6 py-3 inline-block mt-2">
            {code.toUpperCase()}
          </div>
        </div>
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={joinNickname}
            onChange={(e) => setJoinNickname(e.target.value)}
            placeholder="שם כינוי..."
            maxLength={20}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-[#1a4b9c]"
            dir="rtl"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={joining}
            className="w-full bg-[#0d2d6e] hover:bg-[#1a4b9c] text-white font-bold py-3 rounded-xl transition-colors"
          >
            {joining ? '⏳ מצטרף...' : 'הצטרף ▶'}
          </button>
        </form>
      </div>
    )
  }

  // Lobby phase
  if (phase === 'lobby' || phase === null) {
    return (
      <RoomLobby
        code={code.toUpperCase()}
        players={players}
        localNickname={nickname}
        isHost={isHost}
        onStart={handleStart}
        starting={starting}
      />
    )
  }

  // Results phase
  if (phase === 'results') {
    const sorted = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-black text-[#0d2d6e] text-center">🏆 תוצאות</h1>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <PlayerScore
              key={p.nickname}
              player={p}
              isLocal={p.nickname === nickname}
              rank={i}
            />
          ))}
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-[#0d2d6e] text-white font-bold py-3 rounded-xl hover:bg-[#1a4b9c] transition-colors"
        >
          🏠 חזור לבית
        </button>
      </div>
    )
  }

  // Playing phase
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center py-8 text-slate-500">
        <div className="text-4xl mb-4">🎮</div>
        <p>המשחק המרובה בתהליך פיתוח נוסף...</p>
        <p className="text-sm mt-2">ניקוד מתעדכן בזמן אמת</p>
      </div>
    </div>
  )
}
