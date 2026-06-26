'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight, Menu, X, ChevronDown,
  BarChart3, Package, CalendarDays, FileText, Plug, ScanLine,
  Shield, MapPin, Phone, CheckCircle,
  Clock, Users, Zap,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Dashboard financier',
    desc: "Chiffre d'affaires en temps réel, marges et ratios clés — tout sur un seul écran.",
  },
  {
    icon: Package,
    title: 'Gestion des stocks',
    desc: 'Alertes automatiques, mouvements tracés, commandes suggérées. Fini les ruptures.',
  },
  {
    icon: CalendarDays,
    title: 'Planning RH',
    desc: 'Planning visuel conforme convention HCR, calcul des heures sup et coûts en temps réel.',
  },
  {
    icon: FileText,
    title: 'Export FEC',
    desc: 'Export comptable certifié pour votre expert-comptable. Déclarations en quelques clics.',
  },
  {
    icon: Plug,
    title: 'Intégrations caisses',
    desc: 'Synchronisation automatique avec Lightspeed, Tiller, Zelty et les principales caisses.',
  },
  {
    icon: ScanLine,
    title: 'Scan de factures IA',
    desc: 'OCR automatique sur vos factures fournisseurs. Saisie comptable zéro effort.',
  },
]

const PROBLEMS = [
  {
    emoji: '📊',
    title: 'Les tableurs Excel ne sont pas faits pour gérer un restaurant',
    desc: 'Formules qui cassent, données perdues, aucune vision en temps réel de vos marges.',
  },
  {
    emoji: '🗂️',
    title: 'Les données sont éparpillées entre 5 outils différents',
    desc: "Caisse, RH, comptabilité, stocks... Chaque outil parle une langue différente.",
  },
  {
    emoji: '⏰',
    title: "Le temps passé en admin est du temps en moins en cuisine",
    desc: "2h par jour à ressaisir des chiffres, c'est du temps volé à vos clients.",
  },
]

const STEPS = [
  {
    n: '01',
    icon: Users,
    title: 'Créez votre compte en 2 minutes',
    desc: 'Inscription gratuite, pas de CB requise. Accès immédiat à toutes les fonctionnalités.',
  },
  {
    n: '02',
    icon: Zap,
    title: 'Configurez votre restaurant',
    desc: 'Ajoutez vos employés, votre stock, votre menu et vos intégrations caisse.',
  },
  {
    n: '03',
    icon: BarChart3,
    title: 'Pilotez en temps réel',
    desc: "Tableau de bord, alertes critiques, exports automatiques — votre restaurant en un coup d'œil.",
  },
]

const BADGES = [
  { icon: Shield,      label: 'Données hébergées en France' },
  { icon: MapPin,      label: 'Conçu pour la restauration française' },
  { icon: Phone,       label: 'Support réactif par email' },
  { icon: CheckCircle, label: 'Conforme RGPD' },
]

const FAQ = [
  {
    q: 'Est-ce que je dois installer quelque chose ?',
    a: 'Non, PilotResto fonctionne entièrement dans votre navigateur web. Aucune installation, aucune mise à jour manuelle.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Annulation en un clic depuis votre espace compte. Aucun frais cachés.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui, toutes vos données sont chiffrées et hébergées en Europe, conformément au RGPD.',
  },
  {
    q: "L'application fonctionne-t-elle sur téléphone ?",
    a: "Oui, PilotResto est entièrement responsive et fonctionne sur tous les appareils : mobile, tablette, desktop.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai ?",
    a: "Vous choisissez un plan et entrez vos coordonnées de paiement. Sinon, votre accès est suspendu sans frais.",
  },
]

// ── Helpers ───────────────────────────────────────────────────────

function animateCount(
  from: number,
  to: number,
  duration: number,
  callback: (v: number) => void
) {
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    callback(Math.round(from + (to - from) * eased))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ── Component ─────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [counts, setCounts] = useState({ days: 0, min: 0, pct: 0 })
  const statsRef = useRef<HTMLDivElement>(null)
  const statsAnimated = useRef(false)

  // Redirection si déjà connecté
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  // Fade-up on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    const els = document.querySelectorAll('.fade-up')
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Counter animation on stats section
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsAnimated.current) {
          statsAnimated.current = true
          animateCount(0, 14,  1200, v => setCounts(c => ({ ...c, days: v })))
          animateCount(0, 3,   800,  v => setCounts(c => ({ ...c, min:  v })))
          animateCount(0, 100, 1600, v => setCounts(c => ({ ...c, pct:  v })))
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-body, system-ui)' }}>

      {/* ══ NAV ════════════════════════════════════════════════════ */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-18 flex items-center justify-between py-5">

          {/* Logo */}
          <a href="/" className="flex-shrink-0">
            <img src="/favicon.png" alt="PilotResto" style={{ height: '40px', width: 'auto' }} />
          </a>

          {/* Nav links — desktop */}
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

          {/* CTA — desktop */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Connexion
            </a>
            <a
              href="/contact"
              className="flex items-center gap-1.5 text-white font-semibold text-sm transition active:scale-95"
              style={{ background: '#B8962E', borderRadius: '12px', padding: '10px 22px' }}
            >
              Demander une démo
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hamburger — mobile */}
          <div className="flex md:hidden items-center gap-3">
            <a
              href="/contact"
              className="text-white font-semibold text-sm transition"
              style={{ background: '#B8962E', borderRadius: '10px', padding: '8px 16px' }}
            >
              Démo
            </a>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="md:hidden mx-4 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#1B2A4A', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <nav className="flex flex-col py-2">
              {[
                { href: '#fonctionnalites', label: 'Fonctionnalités' },
                { href: '/pricing',         label: 'Tarifs' },
                { href: '/contact',         label: 'Contact' },
                { href: '/login',           label: 'Connexion' },
              ].map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-3.5 text-white/80 hover:text-white hover:bg-white/5 text-base font-medium transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 pb-4 pt-2">
                <a
                  href="/contact"
                  className="block text-center text-white font-bold text-base rounded-xl py-3.5 transition active:scale-95"
                  style={{ background: '#B8962E', minHeight: '52px', lineHeight: '26px' }}
                >
                  Demander une démo
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ══ HERO ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(27,42,74,0.75)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full text-sm font-semibold mb-8"
            style={{ background: 'rgba(212,149,42,0.2)', color: '#F5C46A', border: '1px solid rgba(212,149,42,0.4)', padding: '6px 18px' }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#D4952A' }} />
            Logiciel de gestion #1 pour restaurants indépendants
          </div>

          {/* Titre */}
          <h1
            className="font-bold text-white leading-tight mb-6"
            style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 'clamp(32px, 6vw, 70px)',
            }}
          >
            Gérez votre restaurant.<br />
            <span style={{ color: '#F5C46A' }}>Enfin simplement.</span>
          </h1>

          {/* Sous-titre */}
          <p
            className="text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ fontSize: 'clamp(15px, 2.5vw, 20px)' }}
          >
            PilotResto centralise stocks, planning et comptabilité en une seule plateforme.
            Conçu pour les restaurateurs indépendants français.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/contact"
              className="w-full sm:w-auto flex items-center justify-center gap-2 font-bold text-white transition active:scale-95 shadow-lg"
              style={{
                background: '#B8962E',
                borderRadius: '12px',
                padding: '16px 32px',
                minHeight: '52px',
                fontSize: '16px',
              }}
            >
              Demander une démo
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center font-semibold text-white transition active:scale-95 backdrop-blur-sm"
              style={{
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '12px',
                padding: '16px 32px',
                minHeight: '52px',
                fontSize: '16px',
              }}
            >
              Voir les tarifs
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <span className="text-white text-xs">Découvrir</span>
          <div className="w-px h-8 bg-white/50" />
        </div>
      </section>

      {/* ══ PROBLÈME ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24" style={{ background: '#F8F8F8' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12 fade-up">
            <h2
              className="text-2xl sm:text-4xl font-bold mb-4 leading-tight"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Les restaurateurs indépendants perdent<br className="hidden sm:block" />
              en moyenne <span style={{ color: '#C0392B' }}>2h par jour</span> en gestion administrative
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PROBLEMS.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl p-7 fade-up"
                style={{
                  background: 'white',
                  border: '1px solid #FDDCDA',
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <div className="text-4xl mb-4">{p.emoji}</div>
                <h3
                  className="font-bold mb-2 text-base leading-snug"
                  style={{ color: '#C0392B' }}
                >
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white" ref={statsRef}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              { value: counts.days, suffix: ' jours', label: 'Essai gratuit sans engagement' },
              { value: counts.min,  suffix: ' min',   label: 'Pour configurer votre restaurant' },
              { value: counts.pct,  suffix: '%',      label: 'Données sécurisées en France' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 fade-up" style={{ transitionDelay: `${i * 0.12}s` }}>
                <span
                  className="font-bold"
                  style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)', fontSize: 'clamp(36px, 5vw, 56px)' }}
                >
                  {s.value}{s.suffix}
                </span>
                <span className="text-base text-gray-500 font-medium">{s.label}</span>
                <div className="w-8 h-0.5 rounded-full mt-1" style={{ background: '#D4952A' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOLUTION ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: '#F8F9FB' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14 fade-up">
            <span
              className="text-xs font-bold uppercase tracking-widest mb-3 block"
              style={{ color: '#D4952A' }}
            >
              La solution
            </span>
            <h2
              className="text-2xl sm:text-4xl font-bold mb-4"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              PilotResto centralise tout en un seul endroit
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
              Un tableau de bord unique pour piloter votre restaurant au quotidien
            </p>
          </div>

          {/* Mock dashboard */}
          <div className="fade-up max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#1B2A4A' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
              <span className="ml-4 text-white/40 text-xs">PilotResto — Tableau de bord</span>
            </div>

            <div className="p-5 sm:p-7">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "CA du jour",  value: "€2 847", trend: "+12%", up: true },
                  { label: "Ticket moyen", value: "€24.60", trend: "+4%",  up: true },
                  { label: "Coût matière",value: "28%",    trend: "-2%",  up: false },
                  { label: "Stock alerte",value: "3 items", trend: "",    up: false },
                ].map(card => (
                  <div
                    key={card.label}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{card.label}</div>
                    <div className="text-lg sm:text-xl font-bold text-white mb-1">{card.value}</div>
                    {card.trend && (
                      <div className="text-xs font-semibold" style={{ color: card.up ? '#4ADE80' : '#F87171' }}>
                        {card.up ? '↑' : '↓'} {card.trend}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chart bars */}
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white">CA semaine</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Lun → Dim</span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {[60, 75, 45, 90, 82, 95, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i === 5 ? '#D4952A' : 'rgba(212,149,42,0.3)' }} />
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <div key={i} className="flex-1 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{d}</div>
                  ))}
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-xs mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Stock critique</div>
                  {['Farine T55', 'Huile tournesol', 'Viande hachée'].map(item => (
                    <div key={item} className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F87171' }} />
                      <span className="text-xs text-white/60">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-xs mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Planning aujourd&rsquo;hui</div>
                  {['Sophie M. — 10h-18h', 'Karim B. — 12h-22h', 'Lucas R. — 16h-23h'].map(emp => (
                    <div key={emp} className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4ADE80' }} />
                      <span className="text-xs text-white/60">{emp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS ════════════════════════════════════════ */}
      <section id="fonctionnalites" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14 fade-up">
            <span
              className="text-xs font-bold uppercase tracking-widest mb-3 block"
              style={{ color: '#D4952A' }}
            >
              Tout-en-un
            </span>
            <h2
              className="text-2xl sm:text-4xl font-bold mb-4"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Tout ce dont votre restaurant a besoin
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
              Une plateforme pensée pour les contraintes réelles des restaurateurs indépendants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-2xl p-6 sm:p-7 border hover:shadow-md transition-shadow fade-up"
                  style={{ borderColor: '#E8ECF2', transitionDelay: `${i * 0.08}s` }}
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

      {/* ══ COMMENT ÇA MARCHE ══════════════════════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: '#F8F9FB' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-14 fade-up">
            <span
              className="text-xs font-bold uppercase tracking-widest mb-3 block"
              style={{ color: '#D4952A' }}
            >
              Simple & rapide
            </span>
            <h2
              className="text-2xl sm:text-4xl font-bold"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.n}
                  className="flex flex-col items-center text-center fade-up"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <div className="relative mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: '#1B2A4A' }}
                    >
                      <Icon className="w-7 h-7" style={{ color: '#D4952A' }} />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center"
                      style={{ background: '#D4952A', color: 'white' }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ RÉASSURANCE ════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {BADGES.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-3 fade-up"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(212,149,42,0.10)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#D4952A' }} />
                  </div>
                  <span className="text-sm font-semibold leading-snug" style={{ color: '#1B2A4A' }}>
                    {b.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGE ═════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: '#1B2A4A' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center fade-up">
          <div
            className="text-6xl mb-6 opacity-40 select-none"
            style={{ color: '#D4952A', fontFamily: 'Georgia, serif', lineHeight: 1 }}
          >
            &ldquo;
          </div>
          <blockquote
            className="text-xl sm:text-3xl font-medium text-white/90 leading-relaxed mb-8"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            PilotResto nous a fait gagner 2h par jour sur la gestion
            administrative. Le planning et les stocks en un seul endroit,
            c&rsquo;est ce dont on avait besoin.
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
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

      {/* ══ FAQ ════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12 fade-up">
            <h2
              className="text-2xl sm:text-4xl font-bold"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden fade-up"
                style={{ borderColor: '#E8ECF2', transitionDelay: `${i * 0.08}s` }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 font-semibold text-base transition-colors hover:bg-gray-50"
                  style={{ color: '#1B2A4A' }}
                >
                  {item.q}
                  <ChevronDown
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                    style={{
                      color: '#D4952A',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#555' }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: '#B8962E' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center fade-up">
          <h2
            className="text-2xl sm:text-5xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-white/75 text-base sm:text-lg mb-10 max-w-lg mx-auto">
            14 jours gratuits. Aucune carte bancaire requise. Configuration en 3 minutes.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 font-bold bg-white transition hover:bg-white/90 active:scale-95 shadow-lg"
            style={{ color: '#1B2A4A', borderRadius: '12px', padding: '18px 40px', fontSize: '16px', minHeight: '56px' }}
          >
            Contacter PilotResto
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════ */}
      <footer style={{ background: '#111827' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="PilotResto" style={{ height: '28px', width: 'auto' }} />
            <span className="text-white/50 text-sm">© 2026 PilotResto</span>
            <span className="text-white/20 text-sm hidden sm:block">·</span>
            <a
              href="mailto:charles.lecussan@gmail.com"
              className="text-white/35 text-sm hover:text-white/60 transition-colors hidden sm:block"
            >
              charles.lecussan@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <a href="/cgu-cgv"                       className="hover:text-white/60 transition-colors">CGU / CGV</a>
            <a href="/politique-de-confidentialite"   className="hover:text-white/60 transition-colors">Confidentialité</a>
            <a href="/contact"                        className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
