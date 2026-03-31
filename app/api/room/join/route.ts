import { NextRequest, NextResponse } from 'next/server'
import { joinRoom } from '@/lib/room'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const { code, nickname } = await request.json()
  if (!code || !nickname) {
    return NextResponse.json({ error: 'code and nickname required' }, { status: 400 })
  }
  const state = await joinRoom(code.toUpperCase(), nickname)
  if (!state) {
    return NextResponse.json({ error: 'room not found' }, { status: 404 })
  }
  await pusherServer.trigger(`presence-room-${code}`, 'player-joined', {
    players: state.players,
  })
  return NextResponse.json({ state })
}
