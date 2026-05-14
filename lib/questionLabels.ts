import type { Question } from './questions'

export const QUESTION_TYPE_LABELS: Record<Question['type'], string> = {
  date: 'תאריך',
  figure: 'דמות',
  location: 'מקום',
  organization: 'ארגון',
  sequence: 'רצף',
  goal: 'מטרה',
  result: 'תוצאה',
  logic: 'היגיון',
}

export function getTypeLabel(type: Question['type']): string {
  return QUESTION_TYPE_LABELS[type] ?? type
}
