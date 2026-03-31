interface LivesIndicatorProps {
  lives: number
  maxLives?: number
}

export function LivesIndicator({ lives, maxLives = 3 }: LivesIndicatorProps) {
  return (
    <div className="flex items-center gap-1 justify-center">
      {Array.from({ length: maxLives }, (_, i) => (
        <span key={i} className={`text-2xl transition-all ${i < lives ? '' : 'opacity-20 grayscale'}`}>
          ❤️
        </span>
      ))}
    </div>
  )
}
