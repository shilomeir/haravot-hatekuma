import { NextRequest, NextResponse } from 'next/server'
import { getDailyQuestions, selectQuestions } from '@/lib/questions'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { mode, difficulty, nickname } = body

  let questions
  if (mode === 'daily') {
    questions = getDailyQuestions()
  } else if (mode === 'survival') {
    questions = selectQuestions({ n: 999 })
  } else {
    questions = selectQuestions({ difficulty, n: 10 })
  }

  const sessionId = randomUUID()
  return NextResponse.json({ sessionId, questions })
}
