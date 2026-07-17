'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, Menu, X, ChevronDown,
  BarChart3, Package, CalendarDays, FileText, Plug, ScanLine,
  Shield, Lock, Headphones, CheckCircle,
  TrendingUp, Clock, Users,
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Dashboard financier',
    desc: "CA en temps réel, marges et ratios clés — tout sur un seul écran. Plus de tableurs.",
  },
  {
    icon: Package,
    title: 'Gestion des stocks',
    desc: 'Alertes automatiques, mouvements tracés, commandes suggérées. Zéro rupture.',
  },
  {
    icon: CalendarDays,
    title: 'Planning HCR',
    desc: 'Planning visuel conforme convention HCR, calcul des heures sup et coûts en temps réel.',
  },
  {
    icon: FileText,
    title: 'Export FEC',
    desc: 'Export comptable certifié. Déclarations prêtes pour votre expert-comptable en quelques clics.',
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

const STATS = [
  { value: '14',   unit: 'jours',    label: "d'essai gratuit" },
  { value: '3',    unit: 'min',      label: 'pour configurer' },
  { value: '100%', unit: '',         label: 'données en France' },
]

const TRUST = [
  { icon: Shield,       label: 'Données hébergées en France' },
  { icon: Lock,         label: 'Chiffrement de bout en bout' },
  { icon: Headphones,   label: 'Support réactif par email' },
  { icon: CheckCircle,  label: 'Conforme RGPD' },
]

const FAQ = [
  {
    q: 'Est-ce que je dois installer quelque chose ?',
    a: 'Non, PilotResto fonctionne entièrement dans votre navigateur web et en PWA sur mobile. Aucune installation requise.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Annulation en un clic depuis votre espace compte. Aucun frais caché.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Vos données sont chiffrées et hébergées en Europe, dans des datacenters conformes au RGPD. Elles ne sont jamais revendues.',
  },
  {
    q: "L'application fonctionne-t-elle sur téléphone ?",
    a: "Oui, PilotResto est conçu mobile-first. L'espace staff est optimisé pour être utilisé en cuisine avec une seule main.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai ?",
    a: "Vous choisissez un plan et entrez vos coordonnées de paiement. Sinon, votre accès est suspendu sans aucun frais.",
  },
]

// ── Mock dashboard UI ─────────────────────────────────────────────

function DashboardMock() {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border select-none"
      style={{
        background:   '#111117',
        borderColor:  'rgba(255,255,255,0.08)',
        boxShadow:    '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* TopBar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: '#18181F', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-[#7798AB]/30 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#7798AB]" />
          </div>
          <span className="text-[11px] font-semibold text-white/60">Le Bistro du Coin</span>
        </div>
        <div className="flex items-center gap-2">
          {['Dashboard','Stocks','Planning','Compta'].map((t, i) => (
            <span key={t} className="text-[10px] px-2 py-1 rounded-md font-medium"
              style={{ background: i === 0 ? '#7798AB' : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="w-6 h-6 rounded-full bg-[#7798AB]/20 border border-[#7798AB]/30" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 p-4">
        {[
          { label: "CA aujourd'hui", value: '1 847 €', trend: '+12%', color: '#7798AB' },
          { label: 'Couverts',       value: '82',       trend: '+5',   color: '#34D399' },
          { label: 'Food cost',      value: '27,8 %',   trend: '–0.4', color: '#FBBF24' },
          { label: 'Masse salariale',value: '32,1 %',   trend: '–1.2', color: '#A78BFA' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-3 border"
            style={{ background: '#18181F', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-[9px] uppercase tracking-wider font-semibold mb-1"
              style={{ color: 'rgba(255,255,255,0.35)' }}>{kpi.label}</div>
            <div className="text-[15px] font-bold tabular-nums" style={{ color: '#F0F2F5' }}>{kpi.value}</div>
            <div className="text-[9px] font-semibold mt-1" style={{ color: kpi.color }}>{kpi.trend}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mx-4 mb-3 rounded-xl border overflow-hidden"
        style={{ background: '#18181F', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-3 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.35)' }}>CA hebdomadaire — 8 semaines</div>
        <div className="flex items-end gap-1.5 px-3 pb-3" style={{ height: '60px' }}>
          {[52, 68, 45, 78, 61, 83, 71, 95].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${h}%`,
                background: i === 7 ? '#7798AB' : 'rgba(119,152,171,0.25)',
              }} />
          ))}
        </div>
      </div>

      {/* Alerts + Next shifts */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <div className="rounded-xl border p-3" style={{ background: '#18181F', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Alertes stocks</div>
          {[
            { name: 'Poulet (filet)', color: '#F87171' },
            { name: 'Farine T55',     color: '#FBBF24' },
          ].map(a => (
            <div key={a.name} className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{a.name}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-3" style={{ background: '#18181F', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Prochain service</div>
          {['Marie D. · 9h–17h', 'Thomas R. · 11h–22h'].map(s => (
            <div key={s} className="text-[9px] mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{s}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq,  setOpenFaq]  = useState<number | null>(null)
  const statsRef                = useRef<HTMLDivElement>(null)
  const statsAnimated           = useRef(false)
  const [counts, setCounts]     = useState({ days: 0, min: 0 })

  // Scroll fade-up
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.fade-up').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Counter animation
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min((now - start) / 1200, 1)
          const e = 1 - Math.pow(1 - t, 3)
          setCounts({ days: Math.round(14 * e), min: Math.round(3 * e) })
          if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0A0A0E', fontFamily: 'var(--font-body, system-ui)' }}>

      {/* ══ NAV ════════════════════════════════════════════════════ */}
      <header className="fixed inset-x-0 top-0 z-50" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(10,10,14,0.75)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">

          <a href="/landing" className="flex items-center gap-2.5 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '28px', width: 'auto' }} />
            <span className="font-bold text-[15px] text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              PilotResto
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Fonctionnalités', href: '#fonctionnalites' },
              { label: 'Tarifs',          href: '/pricing' },
              { label: 'Contact',         href: '/contact' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              Connexion
            </a>
            <a href="/register"
              className="flex items-center gap-1.5 text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: '#7798AB', borderRadius: '10px', padding: '8px 18px' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#8FADC0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7798AB')}
            >
              Essai gratuit
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t" style={{ background: '#111117', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="px-4 py-4 flex flex-col gap-1">
              {['#fonctionnalites', '/pricing', '/contact'].map((href, i) => (
                <a key={href} href={href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  {['Fonctionnalités', 'Tarifs', 'Contact'][i]}
                </a>
              ))}
              <div className="mt-2 pt-2 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <a href="/login" className="px-3 py-2.5 rounded-lg text-sm font-medium text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>Connexion</a>
                <a href="/register" className="py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ background: '#7798AB' }}>
                  Essai gratuit 14 jours
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ═══════════════════════════════════════════════════ */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(119,152,171,0.12)', color: '#7798AB', border: '1px solid rgba(119,152,171,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#7798AB] animate-pulse" />
              Essai gratuit · Aucune CB requise
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', textWrap: 'balance' }}
            >
              Pilotez votre restaurant depuis un seul endroit
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              Stocks, planning, comptabilité et facturation centralisés. Conçu pour les restaurateurs indépendants français qui veulent récupérer du temps sur l'administratif.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <a href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold text-white text-sm transition-all active:scale-95"
              style={{ background: '#7798AB', borderRadius: '12px', padding: '13px 28px', minHeight: '48px', boxShadow: '0 4px 24px rgba(119,152,171,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#8FADC0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7798AB')}
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/contact"
              className="w-full sm:w-auto flex items-center justify-center gap-2 font-medium text-sm transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '13px 28px', minHeight: '48px', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            >
              Voir une démo
            </a>
          </div>

          {/* Dashboard mock */}
          <div className="fade-up max-w-4xl mx-auto">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════ */}
      <section ref={statsRef} className="py-16 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {[
              { count: `${counts.days}`, suffix: 'jours', label: "d'essai gratuit" },
              { count: `${counts.min}`,  suffix: 'min',   label: 'pour configurer' },
              { count: '100%',           suffix: '',       label: 'données en France' },
            ].map((s, i) => (
              <div key={i} className="text-center px-4 sm:px-8">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                  {s.count}<span className="text-[#7798AB] ml-0.5">{s.suffix}</span>
                </div>
                <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════════════ */}
      <section id="fonctionnalites" className="py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 fade-up">
            <div className="inline-block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#7798AB' }}>
              Fonctionnalités
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em', textWrap: 'balance' }}>
              Tout ce dont un restaurant a besoin
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="fade-up rounded-2xl p-5 border transition-all duration-300"
                  style={{
                    background:    '#111117',
                    borderColor:   'rgba(255,255,255,0.07)',
                    transitionDelay: `${i * 0.05}s`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(119,152,171,0.3)'
                    e.currentTarget.style.background  = '#18181F'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.background  = '#111117'
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                    style={{ background: 'rgba(119,152,171,0.12)' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: '#7798AB' }} size={18} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 fade-up">
            <div className="inline-block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#7798AB' }}>
              Démarrage
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>
              Opérationnel en 3 minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                n: '1', icon: Users,
                title: 'Créez votre compte',
                desc: 'Email ou Google. Aucune carte bancaire. Accès immédiat à tout.',
              },
              {
                n: '2', icon: TrendingUp,
                title: 'Configurez votre restaurant',
                desc: "Nom, employés, produits. Import depuis Excel si besoin. Assisté pas à pas.",
              },
              {
                n: '3', icon: Clock,
                title: 'Pilotez en temps réel',
                desc: "Votre dashboard, vos stocks, votre planning — disponibles partout, tout de suite.",
              },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="fade-up text-center" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="relative inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(119,152,171,0.12)', border: '1px solid rgba(119,152,171,0.2)' }}>
                      <Icon className="w-5 h-5" style={{ color: '#7798AB' }} />
                    </div>
                    {i < 2 && (
                      <div className="hidden sm:block absolute top-6 left-full w-full border-t border-dashed"
                        style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIAL ════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0D0D12' }}>
        <div className="max-w-2xl mx-auto text-center fade-up">
          <div className="text-4xl mb-6 font-serif leading-none select-none" style={{ color: '#7798AB', opacity: 0.5 }}>&ldquo;</div>
          <blockquote className="text-lg sm:text-2xl font-normal leading-relaxed text-white/85 mb-8"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
            PilotResto nous a fait gagner 2h par jour sur la gestion administrative. Le planning et les stocks en un seul endroit, c&rsquo;est ce dont on avait besoin.
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: '#7798AB' }}>
              PM
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-white">Pierre M.</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Restaurant Le Comptoir, Lyon</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST ══════════════════════════════════════════════════ */}
      <section className="py-14 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST.map((t, i) => {
              const Icon = t.icon
              return (
                <div key={i} className="fade-up flex flex-col items-center text-center gap-2.5" style={{ transitionDelay: `${i * 0.07}s` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(119,152,171,0.1)' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: '#7798AB' }} size={18} />
                  </div>
                  <span className="text-xs font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <h2 className="text-2xl sm:text-3xl font-normal text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden fade-up border" style={{ background: '#111117', borderColor: 'rgba(255,255,255,0.07)', transitionDelay: `${i * 0.06}s` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 transition-colors"
                  style={{ color: '#fff' }}
                >
                  <span className="text-[14px] font-medium">{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    style={{ color: '#7798AB', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-[13.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="pt-3">{item.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-5 sm:px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto text-center fade-up">
          <h2 className="text-3xl sm:text-5xl font-normal text-white mb-5 leading-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-[15px] mb-10 max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            14 jours gratuits. Aucune carte bancaire requise. Configuration en 3 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold text-white text-[15px] transition-all active:scale-95"
              style={{ background: '#7798AB', borderRadius: '14px', padding: '15px 36px', minHeight: '52px', boxShadow: '0 8px 32px rgba(119,152,171,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#8FADC0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7798AB')}
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/contact"
              className="w-full sm:w-auto flex items-center justify-center font-medium text-[15px] transition-all active:scale-95"
              style={{ color: 'rgba(255,255,255,0.55)', borderRadius: '14px', padding: '15px 28px', minHeight: '52px', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              Parler à un expert
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0A0A0E' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '22px', width: 'auto', opacity: 0.6 }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 PilotResto</span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: 'CGU / CGV',       href: '/cgu-cgv' },
              { label: 'Confidentialité', href: '/politique-de-confidentialite' },
              { label: 'Contact',         href: '/contact' },
            ].map(l => (
              <a key={l.href} href={l.href}
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
