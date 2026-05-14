'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      <div className="text-6xl">😕</div>
      <div>
        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--color-navy-mid)' }}>משהו השתבש</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          אירעה שגיאה בלתי צפויה. אנו מתנצלים על אי הנוחות.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          נסה שוב
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl font-bold transition-all hover:opacity-80"
          style={{ background: 'var(--color-bg-soft)', color: 'var(--color-text)' }}
        >
          🏠 בית
        </Link>
      </div>
    </div>
  )
}
