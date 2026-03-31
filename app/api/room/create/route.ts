import { NextRequest, NextResponse } from 'next/server'
import { createRoom } from '@/lib/room'

export async function POST(request: NextRequest) {
  const { nickname } = await request.json()
  if (!nickname) {
    return NextResponse.json({ error: 'nickname required' }, { status: 400 })
  }
  const state = await createRoom(nickname)
  return NextResponse.json({ code: state.code })
}
