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
              style={{ background: '#B8962E', color: 'white' }}
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

export default function InstallPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: '#1B2A4A' }}
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
            style={{ background: 'rgba(184,150,46,0.2)', color: '#F5C46A', border: '1px solid rgba(184,150,46,0.4)' }}
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

        {/* Instructions par plateforme */}
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
            icon="💻"
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
            background:  '#B8962E',
            color:       'white',
            boxShadow:   '0 4px 20px rgba(184,150,46,0.35)',
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
