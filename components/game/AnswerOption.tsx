'use client'

const PREFIXES = ['א', 'ב', 'ג', 'ד']

type AnswerState = 'idle' | 'selected' | 'correct' | 'wrong'

interface AnswerOptionProps {
  index: number
  text: string
  state: AnswerState
  disabled?: boolean
  onClick: () => void
}

const STATE_STYLES: Record<AnswerState, string> = {
  idle: 'bg-white border-slate-200 hover:border-[#1a4b9c] hover:bg-slate-50',
  selected: 'bg-blue-50 border-[#1a4b9c]',
  correct: 'bg-green-50 border-green-500 text-green-800',
  wrong: 'bg-red-50 border-red-400 text-red-800',
}

const PREFIX_STYLES: Record<AnswerState, string> = {
  idle: 'bg-slate-100 text-slate-600',
  selected: 'bg-[#1a4b9c] text-white',
  correct: 'bg-green-500 text-white',
  wrong: 'bg-red-400 text-white',
}

export function AnswerOption({ index, text, state, disabled, onClick }: AnswerOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-right transition-all duration-200 ${STATE_STYLES[state]} ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${PREFIX_STYLES[state]}`}
      >
        {PREFIXES[index]}
      </span>
      <span className="flex-1 font-medium text-sm leading-snug">{text}</span>
      {state === 'correct' && <span className="text-green-500 text-lg">✓</span>}
      {state === 'wrong' && <span className="text-red-400 text-lg">✗</span>}
    </button>
  )
}
