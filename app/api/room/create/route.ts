import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json()
    if (!nickname || String(nickname).trim().length < 2) {
      return NextResponse.json({ ok: false, code: 'INVALID_NICKNAME', message: 'שם כינוי נדרש' }, { status: 400 })
    }

    // Check for required environment variables
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({
        ok: false,
        code: 'REDIS_UNAVAILABLE',
        message: 'מצב מרובה משתתפים אינו זמין כרגע. נסה שוב מאוחר יותר.'
      }, { status: 503 })
    }

    const { createRoom } = await import('@/lib/room')
    const state = await createRoom(String(nickname).trim())
    return NextResponse.json({ ok: true, code: state.code })
  } catch (err) {
    console.error('[api/room/create]', err)
    return NextResponse.json({
      ok: false,
      code: 'CREATE_FAILED',
      message: 'שגיאה ביצירת החדר. נסה שוב.'
    }, { status: 500 })
  }
}
