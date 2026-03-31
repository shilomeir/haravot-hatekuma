import { NextRequest, NextResponse } from 'next/server'
import { getRoomState, setPhase, setQuestions } from '@/lib/room'
import { selectQuestions } from '@/lib/questions'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const { code, nickname } = await request.json()
  const state = await getRoomState(code.toUpperCase())
  if (!state) {
    return NextResponse.json({ error: 'room not found' }, { status: 404 })
  }
  if (state.hostNickname !== nickname) {
    return NextResponse.json({ error: 'only host can start' }, { status: 403 })
  }
  const questions = selectQuestions({ n: 10 })
  await setQuestions(code.toUpperCase(), questions)
  await setPhase(code.toUpperCase(), 'playing')
  await pusherServer.trigger(`presence-room-${code}`, 'game-started', { questions })
  return NextResponse.json({ ok: true })
}
