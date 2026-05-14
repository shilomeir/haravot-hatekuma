import { NextRequest, NextResponse } from 'next/server'
import { getDailyQuestions, selectQuestions } from '@/lib/questions'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, difficulty } = body

    let questions
    if (mode === 'daily') {
      questions = getDailyQuestions()
    } else if (mode === 'survival') {
      questions = selectQuestions({ n: 105 })
    } else if (mode === 'memory') {
      questions = selectQuestions({ n: 16 })
    } else {
      questions = selectQuestions({ difficulty, n: 10 })
    }

    if (!questions.length) {
      return NextResponse.json({ ok: false, code: 'NO_QUESTIONS', message: 'אין שאלות זמינות' }, { status: 400 })
    }

    const sessionId = randomUUID()
    return NextResponse.json({ ok: true, sessionId, questions })
  } catch (err) {
    console.error('[api/game]', err)
    return NextResponse.json({ ok: false, code: 'SERVER_ERROR', message: 'שגיאת שרת' }, { status: 500 })
  }
}
