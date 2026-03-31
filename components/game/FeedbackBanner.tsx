'use client'

interface FeedbackBannerProps {
  correct: boolean
  explanation: string
  onNext: () => void
  isLastQuestion: boolean
}

export function FeedbackBanner({ correct, explanation, onNext, isLastQuestion }: FeedbackBannerProps) {
  return (
    <div className={`animate-slide-up rounded-xl border-2 p-4 space-y-3 ${
      correct
        ? 'bg-green-50 border-green-400'
        : 'bg-red-50 border-red-400'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{correct ? '🎉' : '❌'}</span>
        <span className={`font-black text-lg ${correct ? 'text-green-700' : 'text-red-700'}`}>
          {correct ? 'נכון!' : 'טעות!'}
        </span>
      </div>
      {explanation && (
        <p className="text-sm text-slate-600 leading-relaxed">{explanation}</p>
      )}
      <button
        onClick={onNext}
        className={`w-full py-2.5 rounded-lg font-bold text-white transition-colors ${
          correct ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-500 hover:bg-slate-600'
        }`}
      >
        {isLastQuestion ? '🏁 סיום' : 'הבא ←'}
      </button>
    </div>
  )
}
