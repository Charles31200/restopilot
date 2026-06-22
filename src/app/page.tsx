import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3, Package, CalendarDays, FileText,
  Plug, ScanLine, ArrowRight, ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'RestoPilot — Logiciel de gestion pour restaurateurs indépendants',
  description: 'Stocks, planning RH et comptabilité centralisés en une seule plateforme. Conçu pour les restaurateurs indépendants français.',
}

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Dashboard financier',
    desc:  'Chiffre d\'affaires en temps réel, marges et ratios clés — tout sur un seul écran.',
  },
  {
    icon: Package,
    title: 'Gestion des stocks',
    desc:  'Alertes automatiques, mouvements tracés, commandes suggérées. Fini les ruptures.',
  },
  {
    icon: CalendarDays,
    title: 'Planning RH',
    desc:  'Planning visuel conforme convention HCR, calcul des heures sup et coûts en temps réel.',
  },
  {
    icon: FileText,
    title: 'Export FEC',
    desc:  'Export comptable certifié pour votre expert-comptable. Déclarations en quelques clics.',
  },
  {
    icon: Plug,
    title: 'Intégrations caisses',
    desc:  'Synchronisation automatique avec Lightspeed, Tiller, Zelty et les principales caisses.',
  },
  {
    icon: ScanLine,
    title: 'Scan de factures IA',
    desc:  'OCR automatique sur vos factures fournisseurs. Saisie comptable zéro effort.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══ NAV ════════════════════════════════════════════════ */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-5">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#D4952A' }}
            >
              <span className="text-white font-bold text-sm select-none">RP</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">RestoPilot</span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#fonctionnalites" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Fonctionnalités
            </a>
            <a href="/pricing" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Tarifs
            </a>
            <a href="/contact" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Contact
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden sm:block text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              Connexion
            </a>
            <a
              href="/contact"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95"
              style={{ background: '#D4952A', color: 'white' }}
            >
              Demander une démo
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80&auto=format&fit=crop)',
          }}
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(27,42,74,0.72)' }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
            style={{ background: 'rgba(212,149,42,0.2)', color: '#F5C46A', border: '1px solid rgba(212,149,42,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#D4952A' }} />
            Logiciel de gestion #1 pour restaurants indépendants
          </div>

          {/* Titre */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            Gérez votre restaurant.<br />
            <span style={{ color: '#F5C46A' }}>Enfin simplement.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            RestoPilot centralise stocks, planning et comptabilité en une seule plateforme.
            Conçu pour les restaurateurs indépendants français.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-bold transition active:scale-95 shadow-lg"
              style={{ background: '#D4952A', color: 'white' }}
            >
              Demander une démo
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/pricing"
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold border-2 text-white border-white/40 hover:border-white/80 transition backdrop-blur-sm"
            >
              Voir les tarifs
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <span className="text-white text-xs">Découvrir</span>
          <div className="w-px h-8 bg-white/50" />
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              { value: '14 jours', label: 'Essai gratuit sans engagement' },
              { value: '3 min',    label: 'Pour configurer votre restaurant' },
              { value: '100%',     label: 'Données sécurisées en France' },
            ].map(s => (
              <div key={s.value} className="flex flex-col items-center gap-2">
                <span
                  className="text-5xl font-bold"
                  style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
                >
                  {s.value}
                </span>
                <span className="text-base text-gray-500 font-medium">{s.label}</span>
                <div className="w-8 h-0.5 rounded-full mt-1" style={{ background: '#D4952A' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS ════════════════════════════════════ */}
      <section id="fonctionnalites" className="py-24" style={{ background: '#F8F9FB' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="text-xs font-bold uppercase tracking-widest mb-3 block"
              style={{ color: '#D4952A' }}
            >
              Tout-en-un
            </span>
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Tout ce dont votre restaurant a besoin
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Une plateforme pensée pour les contraintes réelles des restaurateurs indépendants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-7 border hover:shadow-md transition-shadow"
                  style={{ borderColor: '#E8ECF2' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(212,149,42,0.12)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#D4952A' }} />
                  </div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGE ═════════════════════════════════════════ */}
      <section className="py-24" style={{ background: '#1B2A4A' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div
            className="text-6xl mb-6 opacity-40 select-none"
            style={{ color: '#D4952A', fontFamily: 'Georgia, serif' }}
          >
            "
          </div>
          <blockquote
            className="text-2xl md:text-3xl font-medium text-white/90 leading-relaxed mb-8"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            RestoPilot nous a fait gagner 2h par jour sur la gestion
            administrative. Le planning et les stocks en un seul endroit,
            c&rsquo;est ce dont on avait besoin.
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: '#D4952A', color: 'white' }}
            >
              PM
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Pierre M.</p>
              <p className="text-white/50 text-sm">Restaurant Le Comptoir, Lyon</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══════════════════════════════════════════ */}
      <section className="py-24" style={{ background: '#B8962E' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-8"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            Prêt à simplifier votre gestion ?
          </h2>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-white transition hover:bg-white/90 active:scale-95 shadow-lg"
            style={{ color: '#1B2A4A' }}
          >
            Contacter RestoPilot
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════ */}
      <footer style={{ background: '#111827' }}>
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#D4952A' }}
            >
              <span className="text-white font-bold text-xs">RP</span>
            </div>
            <span className="text-white/60 text-sm">© 2026 RestoPilot</span>
            <span className="text-white/30 text-sm">·</span>
            <a
              href="mailto:charles.lecussan@gmail.com"
              className="text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              charles.lecussan@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <a href="/cgu-cgv"                       className="hover:text-white/70 transition-colors">CGU / CGV</a>
            <a href="/politique-de-confidentialite"   className="hover:text-white/70 transition-colors">Confidentialité</a>
            <a href="/contact"                        className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
