import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
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
  title: {
    default:  'RestoPilot',
    template: '%s — RestoPilot',
  },
  description: 'Logiciel de gestion pour restaurateurs indépendants',
  icons: {
    icon:  '/favicon.png',
    apple: '/apple-touch-icon.png',
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
        {children}
      </body>
    </html>
  )
}
