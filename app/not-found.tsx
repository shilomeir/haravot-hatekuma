import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      <div className="text-6xl">⚔️</div>
      <div>
        <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--color-navy-mid)' }}>404</h1>
        <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>העמוד לא נמצא</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          הדף שחיפשת אינו קיים או שהקישור שגוי.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #071A44, #1D4ED8)' }}
      >
        🏠 חזור לדף הבית
      </Link>
    </div>
  )
}
