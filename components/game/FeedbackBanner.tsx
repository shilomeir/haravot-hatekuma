'use client'

interface FeedbackBannerProps {
  correct: boolean
  explanation: string
  scoreGained?: number
  onNext: () => void
  isLastQuestion: boolean
}

export function FeedbackBanner({ correct, explanation, scoreGained = 0, onNext, isLastQuestion }: FeedbackBannerProps) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3 animate-slide-up"
      style={{
        background: correct ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
        border: `2px solid ${correct ? 'var(--color-success)' : 'var(--color-danger)'}`,
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{correct ? '✅' : '❌'}</span>
        <div className="flex-1">
          <span className="font-black text-lg" style={{ color: correct ? '#15803D' : '#DC2626' }}>
            {correct ? 'נכון!' : 'לא נכון'}
          </span>
          {correct && scoreGained > 0 && (
            <span
              className="mr-2 text-sm font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-success)', color: 'white' }}
            >
              +{scoreGained}
            </span>
          )}
        </div>
      </div>

      {explanation && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)', lineHeight: 'var(--leading-hebrew-relaxed)' }} dir="rtl">
          {explanation}
        </p>
      )}

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: correct ? 'var(--color-success)' : '#64748B' }}
      >
        {isLastQuestion ? '🏁 סיום המשחק' : 'הבא ←'}
      </button>
    </div>
  )
}
