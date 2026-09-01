import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Felt — Poker Cash Game Tracker',
  description: 'Track buy-ins, cashouts, and settlements for your poker group.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Felt',
  },
  openGraph: {
    title: 'Felt — Everyone\'s Table',
    description: 'Track buy-ins, cashouts, and settlements for your poker group.',
    images: ['/brand/lockup.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-surface-base text-slate-100 antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
