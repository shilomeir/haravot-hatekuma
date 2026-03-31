import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const socketId = formData.get('socket_id') as string
  const channelName = formData.get('channel_name') as string
  const nickname = formData.get('nickname') as string ?? 'anonymous'

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: nickname,
    user_info: { nickname },
  })
  return NextResponse.json(authResponse)
}
