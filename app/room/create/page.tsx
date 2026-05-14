'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useRoomStore } from '@/store/roomStore'

function CreateRoomContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setRoom } = useRoomStore()
  const [nickname, setNickname] = useState(searchParams.get('nickname') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-create if nickname passed in URL
  useEffect(() => {
    const nick = searchParams.get('nickname')
    if (nick) {
      createRoom(nick)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createRoom(nick: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message ?? 'שגיאה ביצירת החדר')
      }
      setRoom(data.code, nick, true)
      router.push(`/room/${data.code}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה ביצירת החדר. נסה שוב.'
      setError(msg)
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('שם כינוי חייב להכיל לפחות 2 תווים')
      return
    }
    await createRoom(nickname.trim())
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl animate-pulse">🌐</div>
        <p className="text-slate-500">יוצר חדר...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0d2d6e] mb-2">🌐 יצירת חדר</h1>
        <p className="text-slate-500">הזן שם כינוי כדי ליצור חדר</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="שם כינוי..."
          maxLength={20}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-[#1a4b9c]"
          dir="rtl"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0d2d6e] hover:bg-[#1a4b9c] text-white font-bold py-3 rounded-xl transition-colors"
        >
          צור חדר ▶
        </button>
      </form>
    </div>
  )
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="text-2xl text-slate-400">⏳ טוען...</div></div>}>
      <CreateRoomContent />
    </Suspense>
  )
}
