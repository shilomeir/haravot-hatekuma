import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'חרבות התקומה',
  description: 'משחק טריוויה על ניצחונות חרבות ברזל',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
