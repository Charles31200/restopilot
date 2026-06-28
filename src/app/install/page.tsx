'use client'

import Link from 'next/link'

type Step = { n: string; text: string }

function InstructionBlock({ title, icon, steps }: { title: string; icon: string; steps: Step[] }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <h3 className="font-bold text-white text-base">{title}</h3>
      </div>
      <ol className="space-y-2.5">
        {steps.map(s => (
          <li key={s.n} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#7798AB', color: 'white' }}
            >
              {s.n}
            </span>
            <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {s.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DownloadButton({
  href,
  icon,
  label,
  sub,
}: {
  href: string
  icon: string
  label: string
  sub: string
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-1.5 flex-1 rounded-2xl py-5 px-4 transition active:scale-95 hover:opacity-90"
      style={{
        background: '#0D1B1E',
        border: '1px solid rgba(255,255,255,0.15)',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: '28px', lineHeight: 1 }}>{icon}</span>
      <span className="font-semibold text-white text-sm text-center">{label}</span>
      <span className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</span>
    </a>
  )
}

export default function InstallPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: '#0D1B1E' }}
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.png" alt="PilotResto" style={{ height: '64px', width: 'auto' }} />
        <span
          className="font-bold text-white text-xl tracking-tight"
          style={{ fontFamily: 'var(--font-display, system-ui)' }}
        >
          PilotResto
        </span>
      </div>

      <div className="w-full max-w-lg">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 rounded-full text-xs font-semibold mb-4 px-4 py-1.5"
            style={{ background: 'rgba(119,152,171,0.2)', color: '#C3DBC5', border: '1px solid rgba(119,152,171,0.4)' }}
          >
            Étape requise
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            Installez PilotResto<br />pour continuer
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            L&rsquo;application est accessible uniquement depuis l&rsquo;app installée
            sur votre appareil. C&rsquo;est gratuit et prend moins de 30 secondes.
          </p>
        </div>

        {/* ── Application desktop ─────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: '18px' }}>💻</span>
            <h2 className="font-semibold text-white text-sm">Application desktop</h2>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col flex-1 gap-1.5">
              <DownloadButton
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0-arm64.dmg"
                icon="🍎"
                label="Télécharger pour Mac"
                sub="macOS M1 / M2 / M3 · Apple Silicon"
              />
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0.dmg"
                className="text-center text-xs transition hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Mac Intel ? <span style={{ textDecoration: 'underline' }}>Téléchargez cette version</span>
              </a>
            </div>
            <DownloadButton
              href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto.Setup.1.0.0.exe"
              icon="🪟"
              label="Télécharger pour Windows"
              sub="Windows 10 / 11 · 64 bits"
            />
          </div>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>ou installer en PWA</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Instructions PWA par plateforme */}
        <div className="space-y-4 mb-8">
          <InstructionBlock
            title="iPhone / iPad (Safari)"
            icon="🍎"
            steps={[
              { n: '1', text: 'Ouvrez cette page dans Safari' },
              { n: '2', text: 'Appuyez sur le bouton Partager (carré avec une flèche vers le haut)' },
              { n: '3', text: 'Faites défiler et appuyez sur « Sur l\'écran d\'accueil »' },
              { n: '4', text: 'Appuyez sur « Ajouter » en haut à droite' },
            ]}
          />

          <InstructionBlock
            title="Android (Chrome)"
            icon="🤖"
            steps={[
              { n: '1', text: 'Ouvrez cette page dans Chrome' },
              { n: '2', text: 'Appuyez sur les 3 points ⋮ en haut à droite' },
              { n: '3', text: 'Appuyez sur « Ajouter à l\'écran d\'accueil »' },
              { n: '4', text: 'Appuyez sur « Installer »' },
            ]}
          />

          <InstructionBlock
            title="Ordinateur Mac / Windows (Chrome)"
            icon="🌐"
            steps={[
              { n: '1', text: 'Ouvrez cette page dans Google Chrome' },
              { n: '2', text: 'Cliquez sur l\'icône d\'installation dans la barre d\'adresse (⊕)' },
              { n: '3', text: 'Cliquez sur « Installer »' },
            ]}
          />
        </div>

        {/* Bouton CTA */}
        <Link
          href="/login?source=pwa"
          className="block w-full text-center font-bold text-base rounded-2xl py-4 transition active:scale-95"
          style={{
            background: '#7798AB',
            color: 'white',
            boxShadow: '0 4px 20px rgba(119,152,171,0.35)',
          }}
        >
          J&rsquo;ai installé l&rsquo;application →
        </Link>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Ce bouton activera votre accès au dashboard
        </p>
      </div>
    </div>
  )
}
