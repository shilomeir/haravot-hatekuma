import { NextRequest, NextResponse } from 'next/server'
import { getRoomState, updatePlayerScore } from '@/lib/room'
import { calcScore, calcXP, calcCoins } from '@/lib/scoring'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const { code, nickname, questionId, selectedIndex, timeTakenMs, streak } = await request.json()
  const state = await getRoomState(code.toUpperCase())
  if (!state) {
    return NextResponse.json({ error: 'room not found' }, { status: 404 })
  }
  const question = state.questions.find((q) => q.id === questionId)
  if (!question) {
    return NextResponse.json({ error: 'question not found' }, { status: 404 })
  }
  const correct = selectedIndex === question.correctIndex
  const scoreGained = correct ? calcScore({ correct, timeTakenMs, streak: streak ?? 0 }) : 0
  const xpGained = calcXP(question.difficulty, correct)
  const coinsGained = correct ? calcCoins({ correct, streak: streak ?? 0 }) : 0

  const updated = await updatePlayerScore(code.toUpperCase(), nickname, scoreGained, xpGained, coinsGained)
  if (updated) {
    await pusherServer.trigger(`presence-room-${code}`, 'score-update', {
      players: updated.players,
    })
  }
  return NextResponse.json({ ok: true, correct, scoreGained })
}
