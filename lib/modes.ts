export interface ModeConfig {
  id: string
  label: string
  emoji: string
  description: string
  timerSeconds: number
  questionCount: number
  blitz: boolean
  survival: boolean
}

export const MODES: ModeConfig[] = [
  { id: 'standard', label: 'רגיל',     emoji: '📚', description: '10 שאלות, טיימר סטנדרטי', timerSeconds: 20, questionCount: 10,  blitz: false, survival: false },
  { id: 'blitz',    label: 'בליץ',     emoji: '⚡', description: 'שאלות מהירות, 8 שניות',   timerSeconds: 8,  questionCount: 10,  blitz: true,  survival: false },
  { id: 'survival', label: 'הישרדות',  emoji: '❤️', description: 'טעות אחת = סיום',         timerSeconds: 20, questionCount: 999, blitz: false, survival: true  },
  { id: 'memory',   label: 'זיכרון',   emoji: '🃏', description: 'התאמת זוגות',             timerSeconds: 0,  questionCount: 8,   blitz: false, survival: false },
  { id: 'daily',    label: 'אתגר יומי',emoji: '📅', description: 'שאלות יומיות משותפות',    timerSeconds: 20, questionCount: 10,  blitz: false, survival: false },
  { id: 'multi',    label: 'מרובה',    emoji: '🌐', description: 'שחק עם חברים',            timerSeconds: 20, questionCount: 10,  blitz: false, survival: false },
]
