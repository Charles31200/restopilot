import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import { ProgressBarProvider } from '@/components/ui/ProgressBarProvider'
import './globals.css'

// ── Polices ───────────────────────────────────────────────────

const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  variable: '--font-jakarta',
  weight:   ['500', '600', '700'],
  display:  'swap',
})

const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm',
  weight:   ['400', '500'],
  display:  'swap',
})

// ── Métadonnées ───────────────────────────────────────────────

export const metadata: Metadata = {
  title:       'PilotResto — Logiciel de gestion pour restaurateurs',
  description: 'PilotResto centralise stocks, planning et comptabilité en une seule plateforme. Conçu pour les restaurateurs indépendants français. Essai gratuit 14 jours.',
  metadataBase: new URL('https://restopilot.pro'),
  icons: {
    icon: [
      { url: '/favicon.ico',  sizes: '32x32',   type: 'image/x-icon' },
      { url: '/favicon.png',  sizes: '192x192',  type: 'image/png' },
    ],
    apple:    '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title:       'PilotResto — Logiciel de gestion restaurant',
    description: 'Centralisez stocks, planning et comptabilité. Essai gratuit 14 jours.',
    url:         'https://restopilot.pro',
    siteName:    'PilotResto',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'PilotResto — Logiciel de gestion restaurant',
      },
    ],
    locale: 'fr_FR',
    type:   'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'PilotResto — Logiciel de gestion restaurant',
    description: 'Centralisez stocks, planning et comptabilité. Essai gratuit 14 jours.',
    images:      ['/og-image.png'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:  true,
      follow: true,
    },
  },
}

export const viewport: Viewport = {
  width:               'device-width',
  initialScale:        1,
  maximumScale:        1,   // Désactive le zoom sur iOS (app native feel)
  userScalable:        false,
  viewportFit:         'cover', // Permet d'utiliser env(safe-area-inset-*)
  themeColor:          '#35404F', // Couleur de la status bar sur Android
}

// ── Layout racine ─────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-rp-page text-rp-navy font-body">
        <ProgressBarProvider>{children}</ProgressBarProvider>
      </body>
    </html>
  )
}
