import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'חרבות התקומה — משחק טריוויה',
  description: 'בחן את הידע שלך על מבצע חרבות ברזל עם שאלות, דרגות ואתגרים יומיים',
  metadataBase: new URL('https://haravot-hatekuma.vercel.app'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D2D6E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ minHeight: '100dvh' }}>
        {/* Background decorative layer */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'var(--color-bg)',
            pointerEvents: 'none',
          }}
        />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
