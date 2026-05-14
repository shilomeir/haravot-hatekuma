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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? data.message ?? 'שגיאה בהצטרפות')
      setRoom(code.toUpperCase(), joinNickname.trim(), false)
      setPlayers(data.state.players)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהצטרפות לחדר')
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

  // Join form
  if (!hasJoined) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌐</div>
          <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--color-navy-mid)' }}>הצטרף לחדר</h1>
          <div
            className="text-4xl font-black tracking-widest rounded-2xl px-6 py-3 inline-block mt-2"
            style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-navy-mid)',
              color: 'var(--color-navy-mid)',
            }}
          >
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
            className="w-full rounded-xl px-4 py-3 text-right focus:outline-none transition-all"
            style={{
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
            dir="rtl"
          />
          {error && <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>⚠️ {error}</p>}
          <button
            type="submit"
            disabled={joining}
            className="w-full py-3.5 rounded-2xl font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'var(--color-navy-mid)' }}
          >
            {joining ? '⏳ מצטרף...' : 'הצטרף ▶'}
          </button>
        </form>
      </div>
    )
  }

  // Lobby
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

  // Results
  if (phase === 'results') {
    const sorted = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-black text-center" style={{ color: 'var(--color-navy-mid)' }}>🏆 תוצאות</h1>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <PlayerScore key={p.nickname} player={p} isLocal={p.nickname === nickname} rank={i} />
          ))}
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--color-navy-mid)' }}
        >
          🏠 חזור לבית
        </button>
      </div>
    )
  }

  // Playing phase — Coming Soon
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      <div className="text-6xl">🚧</div>
      <h2 className="text-2xl font-black" style={{ color: 'var(--color-navy-mid)' }}>
        משחק מרובה — בקרוב
      </h2>
      <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
        ממשק המשחק המרובה בפיתוח פעיל. <br />
        הלובי כבר עובד — חזור בקרוב לגרסה המלאה!
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90"
        style={{ background: 'var(--color-navy-mid)' }}
      >
        🏠 חזור לבית
      </button>
    </div>
  )
}
