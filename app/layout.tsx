import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SHARD AI | ניתוח גרפולוגיה',
  description: 'ניתוח גרפולוגי חכם מבוסס בינה מלאכותית',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${heebo.variable} font-heebo antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
