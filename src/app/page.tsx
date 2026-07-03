'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Loader2, BarChart2, Package, Calendar, FileText, Link2, Cpu } from 'lucide-react'

// ─── Animated counter ─────────────────────────────────────────
function Counter({ target, isVisible }: { target: number; isVisible: boolean }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!isVisible || started.current) return
    started.current = true
    const duration = Math.min(target * 60, 1500)
    const step = duration / target
    let current = 0
    const timer = setInterval(() => {
      current++
      setCount(current)
      if (current >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [isVisible, target])

  return <>{count}</>
}

// ─── Stripe price IDs ─────────────────────────────────────────
const PLANS = [
  {
    id:             'starter',
    name:           'Starter',
    monthly:        39,
    annualTotal:    368,
    annualMonthly:  31,
    priceIdMonthly: 'price_1TjRUOEw9od5qGxlnDbe4Nqv',
    priceIdAnnual:  'price_1TjRUOEw9od5qGxlmwXgMQQD',
    popular:        false,
    features: [
      'Dashboard & KPIs',
      'Gestion des stocks',
      'Planning HCR',
      'Export FEC',
      '1 établissement',
    ],
  },
  {
    id:             'pro',
    name:           'Pro',
    monthly:        79,
    annualTotal:    663,
    annualMonthly:  55,
    priceIdMonthly: 'price_1TjRUvEw9od5qGxl9yxWt6JO',
    priceIdAnnual:  'price_1TjRVfEw9od5qGxlsOTeBSyV',
    popular:        true,
    features: [
      'Tout Starter',
      'Connexion caisses (Lightspeed, Tiller, Zelty)',
      'Factures IA (OCR)',
      'Rapports avancés',
      '1 établissement',
    ],
  },
  {
    id:             'multi',
    name:           'Multi',
    monthly:        149,
    annualTotal:    1430,
    annualMonthly:  119,
    priceIdMonthly: 'price_1TjRWjEw9od5qGxlAzYYrIqd',
    priceIdAnnual:  'price_1TjRXBEw9od5qGxlw0BvlHds',
    popular:        false,
    features: [
      'Tout Pro',
      'Multi-établissements',
      'Tableau de bord consolidé',
      'Accès équipe illimité',
      'Support prioritaire',
    ],
  },
]

// ─── Feature icons ─────────────────────────────────────────────
const FEATURES = [
  { Icon: BarChart2, title: 'Dashboard',   desc: 'CA en temps réel, marges et indicateurs clés au quotidien.' },
  { Icon: Package,   title: 'Stocks',      desc: 'Alertes automatiques, valorisation et suivi des entrées/sorties.' },
  { Icon: Calendar,  title: 'Planning',    desc: 'Conforme HCR, gestion des congés et exports planning PDF.' },
  { Icon: FileText,  title: 'FEC',         desc: 'Export comptable en un clic, conforme à la législation française.' },
  { Icon: Link2,     title: 'Caisses',     desc: 'Connexion Lightspeed, Tiller, Zelty et autres caisses.' },
  { Icon: Cpu,       title: 'Factures IA', desc: 'Scan automatique OCR, extraction et classement des factures.' },
]

// ═══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter()

  const [menuOpen,         setMenuOpen]         = useState(false)
  const [scrolled,         setScrolled]         = useState(false)
  const [statsVisible,     setStatsVisible]     = useState(false)
  const [isAnnual,         setIsAnnual]         = useState(false)
  const [checkoutLoading,  setCheckoutLoading]  = useState<string | null>(null)
  const [checkoutError,    setCheckoutError]    = useState<string | null>(null)

  const statsRef = useRef<HTMLDivElement>(null)

  // Electron → /login
  useEffect(() => {
    if (navigator.userAgent.includes('Electron')) router.replace('/login')
  }, [router])

  // Sticky nav shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fade-up animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Stats counter trigger
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Stripe checkout
  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId }),
      })
      if (res.status === 401) {
        router.push(`/register?priceId=${encodeURIComponent(priceId)}`)
        return
      }
      const json = await res.json()
      if (json.url) { window.location.href = json.url; return }
      setCheckoutError(json.error ?? 'Une erreur est survenue.')
    } catch {
      setCheckoutError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  // ── Shared styles ──────────────────────────────────────────
  const S = {
    btnBlack: {
      display:        'inline-flex' as const,
      alignItems:     'center' as const,
      justifyContent: 'center' as const,
      gap:            '8px',
      background:     '#111111',
      color:          '#FFFFFF',
      borderRadius:   '9999px',
      padding:        '14px 28px',
      fontSize:       '13px',
      fontWeight:     700,
      letterSpacing:  '0.08em',
      textTransform:  'uppercase' as const,
      border:         'none',
      cursor:         'pointer',
      textDecoration: 'none',
      transition:     'opacity 0.15s',
    },
    btnOutline: {
      display:        'inline-flex' as const,
      alignItems:     'center' as const,
      justifyContent: 'center' as const,
      gap:            '8px',
      background:     'transparent',
      color:          '#111111',
      borderRadius:   '9999px',
      padding:        '14px 28px',
      fontSize:       '13px',
      fontWeight:     700,
      letterSpacing:  '0.08em',
      textTransform:  'uppercase' as const,
      border:         '1.5px solid #111111',
      cursor:         'pointer',
      textDecoration: 'none',
      transition:     'background 0.15s, color 0.15s',
    },
    btnGhost: {
      display:        'inline-flex' as const,
      alignItems:     'center' as const,
      justifyContent: 'center' as const,
      gap:            '8px',
      background:     'transparent',
      color:          '#FFFFFF',
      borderRadius:   '9999px',
      padding:        '13px 28px',
      fontSize:       '13px',
      fontWeight:     700,
      letterSpacing:  '0.08em',
      textTransform:  'uppercase' as const,
      border:         '1.5px solid rgba(255,255,255,0.55)',
      cursor:         'pointer',
      textDecoration: 'none',
    },
    heading: {
      fontSize:      'clamp(30px, 4vw, 52px)' as const,
      fontWeight:    800,
      color:         '#111111',
      letterSpacing: '-0.025em',
      lineHeight:    1.12,
      fontFamily:    'var(--font-display, system-ui)',
    },
    label: {
      fontSize:      '11px',
      fontWeight:    700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      color:         '#7798AB',
    },
  }

  return (
    <div style={{ background: '#FFFFFF', fontFamily: 'var(--font-body, system-ui)', color: '#111111' }}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background:     'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom:   scrolled ? '1px solid #E8E8E8' : '1px solid transparent',
        }}
      >
        <div
          className="max-w-6xl mx-auto px-5 sm:px-8"
          style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '30px', width: 'auto' }} />
            <span style={{ fontWeight: 800, fontSize: '16px', color: '#111111', fontFamily: 'var(--font-display, system-ui)', letterSpacing: '-0.03em' }}>
              PilotResto
            </span>
          </Link>

          <nav className="hidden md:flex" style={{ gap: '36px' }}>
            {[
              { href: '#fonctionnalites', label: 'Fonctionnalités' },
              { href: '#tarifs',          label: 'Tarifs' },
              { href: '/contact',         label: 'Contact' },
            ].map(l => (
              <a
                key={l.href} href={l.href}
                style={{ color: '#555555', fontSize: '13px', fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em' }}
                className="hover:text-black transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex" style={{ gap: '10px', alignItems: 'center' }}>
            <Link href="/login"    style={{ ...S.btnOutline, padding: '9px 18px', fontSize: '12px' }}>Connexion</Link>
            <Link href="/register" style={{ ...S.btnBlack,   padding: '9px 18px', fontSize: '12px' }}>Essai gratuit</Link>
          </div>

          <button
            className="md:hidden p-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111111' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fermer' : 'Menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div style={{ background: '#FFFFFF', borderTop: '1px solid #E8E8E8' }}>
            <div className="px-5 py-6 flex flex-col gap-5">
              {[
                { href: '#fonctionnalites', label: 'Fonctionnalités' },
                { href: '#tarifs',          label: 'Tarifs' },
                { href: '/contact',         label: 'Contact' },
              ].map(l => (
                <a
                  key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  style={{ color: '#111111', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}
                >
                  {l.label}
                </a>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E8E8E8' }}>
                <Link href="/login"    onClick={() => setMenuOpen(false)} style={{ ...S.btnOutline, justifyContent: 'center' }}>Connexion</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{ ...S.btnBlack,   justifyContent: 'center' }}>Essai gratuit</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ 1. HERO ══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600"
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)' }} />

        <div className="relative z-10 text-center px-5 sm:px-8 w-full" style={{ maxWidth: '820px', margin: '0 auto', paddingTop: '80px' }}>
          <p className="fade-up" style={{ ...S.label, color: 'rgba(255,255,255,0.55)', marginBottom: '28px' }}>
            Gestion restaurant — France
          </p>
          <h1
            className="fade-up"
            style={{
              fontSize:    'clamp(42px, 7.5vw, 80px)',
              fontWeight:  800,
              color:       '#FFFFFF',
              lineHeight:  1.07,
              letterSpacing: '-0.035em',
              fontFamily:  'var(--font-display, system-ui)',
              marginBottom: '24px',
              transitionDelay: '0.05s',
            }}
          >
            Gérez votre restaurant.<br />Enfin simplement.
          </h1>
          <p
            className="fade-up"
            style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.75)', marginBottom: '44px', lineHeight: 1.5, transitionDelay: '0.12s' }}
          >
            Moins de paperasse, plus de temps en cuisine.
          </p>
          <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', transitionDelay: '0.2s' }}>
            <Link href="/register" style={S.btnBlack}>Commencer gratuitement →</Link>
            <a href="#tarifs" style={S.btnGhost}>Voir les tarifs</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.3)' }} />
        </div>
      </section>

      {/* ══ 2. STATS ══════════════════════════════════════════════ */}
      <section style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
        <div
          ref={statsRef}
          style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0' }}
        >
          {[
            { value: 14,  suffix: ' jours', label: 'Essai gratuit' },
            { value: 3,   suffix: ' min',   label: 'Pour démarrer' },
            { value: 100, suffix: '%',      label: 'Données sécurisées' },
          ].map((stat, i) => (
            <div
              key={i}
              className="fade-up"
              style={{
                textAlign:  'center',
                padding:    '32px 20px',
                borderRight: i < 2 ? '1px solid #E8E8E8' : 'none',
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, color: '#111111', lineHeight: 1, fontFamily: 'var(--font-display, system-ui)' }}>
                <Counter target={stat.value} isVisible={statsVisible} />{stat.suffix}
              </div>
              <p style={{ fontSize: '14px', color: '#888888', marginTop: '8px', letterSpacing: '0.01em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 3. TÉLÉCHARGEMENT ════════════════════════════════════ */}
      <section style={{ background: '#111111', padding: '88px 20px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p className="fade-up" style={{ ...S.label, color: 'rgba(255,255,255,0.35)', marginBottom: '40px' }}>
            Application desktop disponible sur
          </p>
          <div className="fade-up" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>

            {/* Mac */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>macOS · M1 / M2 / M3</span>
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0-arm64.dmg"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '10px',
                  background:     '#FFFFFF',
                  color:          '#111111',
                  borderRadius:   '9999px',
                  padding:        '14px 32px',
                  textDecoration: 'none',
                  fontWeight:     700,
                  fontSize:       '13px',
                  letterSpacing:  '0.06em',
                  textTransform:  'uppercase' as const,
                  transition:     'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#7798AB'; (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLAnchorElement).style.color = '#111111' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Télécharger
              </a>
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0.dmg"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'underline', letterSpacing: '0.02em' }}
              >
                Mac Intel ? Téléchargez cette version
              </a>
            </div>

            {/* Windows */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Windows 10 / 11</span>
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto.Setup.1.0.0.exe"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '10px',
                  background:     '#FFFFFF',
                  color:          '#111111',
                  borderRadius:   '9999px',
                  padding:        '14px 32px',
                  textDecoration: 'none',
                  fontWeight:     700,
                  fontSize:       '13px',
                  letterSpacing:  '0.06em',
                  textTransform:  'uppercase' as const,
                  transition:     'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#7798AB'; (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLAnchorElement).style.color = '#111111' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.801"/>
                </svg>
                Télécharger
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ══ 4. PROBLÈME (ÉDITORIAL) ══════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 20px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p className="fade-up" style={{ ...S.label, marginBottom: '24px' }}>Le problème</p>
          <h2 className="fade-up" style={{ ...S.heading, marginBottom: '72px', maxWidth: '640px', transitionDelay: '0.05s' }}>
            Les restaurateurs perdent 2h/jour en gestion administrative.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#E8E8E8' }}>
            {[
              { n: '01', text: 'Les tableurs Excel ne sont pas faits pour gérer un restaurant.' },
              { n: '02', text: 'Les données éparpillées entre 5 outils différents.' },
              { n: '03', text: 'Chaque heure perdue en admin est une heure de moins en cuisine.' },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  background:      '#FFFFFF',
                  padding:         '36px 40px',
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '40px',
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#7798AB', fontFamily: 'var(--font-display, system-ui)', letterSpacing: '0.05em', flexShrink: 0 }}>
                  {item.n}
                </span>
                <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#111111', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. FONCTIONNALITÉS ═══════════════════════════════════ */}
      <section id="fonctionnalites" style={{ background: '#FAFAFA', padding: '120px 20px', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p className="fade-up" style={{ ...S.label, marginBottom: '16px' }}>Fonctionnalités</p>
          <h2 className="fade-up" style={{ ...S.heading, marginBottom: '64px', transitionDelay: '0.05s' }}>
            Tout ce dont vous avez besoin
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px', background: '#E8E8E8' }}>
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                className="fade-up"
                style={{
                  background:      '#FFFFFF',
                  padding:         '36px 32px',
                  transitionDelay: `${i * 0.07}s`,
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icon size={20} color="#7798AB" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#111111', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: '#666666', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. COMMENT ÇA MARCHE ══════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <p className="fade-up" style={{ ...S.label, marginBottom: '16px' }}>Mise en route</p>
          <h2 className="fade-up" style={{ ...S.heading, marginBottom: '56px', transitionDelay: '0.05s' }}>
            Prêt en 5 minutes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: '#E8E8E8' }}>
            {[
              { n: '1', title: 'Téléchargez l\'application', detail: '2 minutes — Mac ou Windows' },
              { n: '2', title: 'Configurez votre restaurant', detail: '3 minutes — nom, SIRET, équipe' },
              { n: '3', title: 'Pilotez en temps réel',       detail: 'Dès maintenant' },
            ].map((step, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '28px',
                  background:      '#FFFFFF',
                  padding:         '32px 36px',
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <div style={{
                  flexShrink:     0,
                  width:          '36px',
                  height:         '36px',
                  borderRadius:   '9999px',
                  border:         '1.5px solid #7798AB',
                  color:          '#7798AB',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontWeight:     800,
                  fontSize:       '14px',
                  fontFamily:     'var(--font-display, system-ui)',
                }}>
                  {step.n}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#111111', marginBottom: '4px' }}>{step.title}</h3>
                  <p style={{ fontSize: '13px', color: '#888888' }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="fade-up" style={{ marginTop: '48px', textAlign: 'center' }}>
            <Link href="/register" style={S.btnBlack}>Commencer gratuitement →</Link>
          </div>

          {/* Badges réassurance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', background: '#E8E8E8', marginTop: '64px' }}>
            {[
              { text: 'Données hébergées en France' },
              { text: 'Conçu pour la restauration française' },
              { text: 'Support 24-48h par email' },
              { text: 'Conforme RGPD' },
            ].map((b, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  background:      '#FAFAFA',
                  padding:         '20px 24px',
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '12px',
                  transitionDelay: `${i * 0.08}s`,
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#7798AB', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#333333', lineHeight: 1.4 }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. TARIFS ════════════════════════════════════════════ */}
      <section id="tarifs" style={{ background: '#FAFAFA', padding: '120px 20px', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p className="fade-up" style={{ ...S.label, marginBottom: '16px' }}>Tarifs</p>
          <h2 className="fade-up" style={{ ...S.heading, marginBottom: '48px', transitionDelay: '0.05s' }}>
            Nos offres
          </h2>

          {/* Toggle */}
          <div className="fade-up" style={{ display: 'flex', marginBottom: '56px' }}>
            <div style={{ display: 'flex', background: '#E8E8E8', borderRadius: '9999px', padding: '3px', gap: '3px' }}>
              {(['Mensuel', 'Annuel (−20%)'] as const).map((label, i) => {
                const active = i === (isAnnual ? 1 : 0)
                return (
                  <button
                    key={label}
                    onClick={() => setIsAnnual(i === 1)}
                    style={{
                      padding:      '8px 20px',
                      borderRadius: '9999px',
                      border:       'none',
                      cursor:       'pointer',
                      fontSize:     '12px',
                      fontWeight:   700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      background:   active ? '#111111' : 'transparent',
                      color:        active ? '#FFFFFF' : '#888888',
                      transition:   'all 0.18s',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {checkoutError && (
            <p className="text-center mb-6" style={{ color: '#DC2626', fontSize: '14px' }}>{checkoutError}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px', background: '#E8E8E8' }}>
            {PLANS.map((plan, i) => {
              const priceId   = isAnnual ? plan.priceIdAnnual : plan.priceIdMonthly
              const isLoading = checkoutLoading === priceId
              return (
                <div
                  key={plan.id}
                  className="fade-up"
                  style={{
                    background:      plan.popular ? '#111111' : '#FFFFFF',
                    padding:         '40px 32px',
                    position:        'relative',
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position:      'absolute',
                      top:           '24px',
                      right:         '24px',
                      background:    '#7798AB',
                      color:         '#FFFFFF',
                      fontSize:      '10px',
                      fontWeight:    700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                      padding:       '4px 10px',
                      borderRadius:  '9999px',
                    }}>
                      Populaire
                    </div>
                  )}

                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: plan.popular ? 'rgba(255,255,255,0.5)' : '#888888', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>
                    {plan.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 800, color: plan.popular ? '#FFFFFF' : '#111111', lineHeight: 1, fontFamily: 'var(--font-display, system-ui)' }}>
                      {isAnnual ? plan.annualMonthly : plan.monthly}€
                    </span>
                    <span style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.45)' : '#AAAAAA' }}>/mois</span>
                  </div>
                  <p style={{ fontSize: '12px', color: plan.popular ? 'rgba(255,255,255,0.35)' : '#BBBBBB', marginBottom: '32px', minHeight: '18px' }}>
                    {isAnnual ? `${plan.annualTotal}€ / an` : 'Facturé mensuellement'}
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.8)' : '#444444', lineHeight: 1.5 }}>
                        <span style={{ color: '#7798AB', flexShrink: 0, fontWeight: 700 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCheckout(priceId)}
                    disabled={!!checkoutLoading}
                    style={{
                      width:          '100%',
                      padding:        '13px',
                      borderRadius:   '9999px',
                      border:         plan.popular ? '1.5px solid rgba(255,255,255,0.25)' : '1.5px solid #111111',
                      background:     plan.popular ? 'rgba(255,255,255,0.1)' : '#111111',
                      color:          '#FFFFFF',
                      fontSize:       '12px',
                      fontWeight:     700,
                      letterSpacing:  '0.1em',
                      textTransform:  'uppercase' as const,
                      cursor:         checkoutLoading ? 'not-allowed' : 'pointer',
                      opacity:        checkoutLoading && !isLoading ? 0.5 : 1,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      gap:            '8px',
                      transition:     'opacity 0.15s',
                    }}
                  >
                    {isLoading && <Loader2 size={13} className="animate-spin" />}
                    S&apos;inscrire — 14j gratuits
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ 8. PHOTOS RESTAURANTS ════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 20px', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p className="fade-up" style={{ ...S.label, marginBottom: '16px' }}>Instagram</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <h2 className="fade-up" style={{ ...S.heading, transitionDelay: '0.05s' }}>
              Suivez notre actualité
            </h2>
            <a
              href="https://instagram.com/restopilot"
              target="_blank"
              rel="noopener noreferrer"
              className="fade-up"
              style={{ ...S.btnOutline, fontSize: '12px', padding: '10px 20px', transitionDelay: '0.1s' }}
            >
              @restopilot
            </a>
          </div>

          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {[
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
              'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600',
              'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
              'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=600',
            ].map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Restaurant ${i + 1}`}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. CTA FINAL ══════════════════════════════════════════ */}
      <section style={{ background: '#111111', padding: '120px 20px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2
            className="fade-up"
            style={{
              fontSize:    'clamp(32px, 5vw, 60px)',
              fontWeight:  800,
              color:       '#FFFFFF',
              lineHeight:  1.1,
              letterSpacing: '-0.03em',
              fontFamily:  'var(--font-display, system-ui)',
              marginBottom: '24px',
            }}
          >
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="fade-up" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', marginBottom: '40px', lineHeight: 1.6, transitionDelay: '0.08s' }}>
            14 jours gratuits, sans carte bancaire. Configuration en 3 minutes.
          </p>
          <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', transitionDelay: '0.16s' }}>
            <Link href="/register" style={{ ...S.btnBlack, background: '#FFFFFF', color: '#111111' }}>
              Commencer gratuitement →
            </Link>
            <Link href="/contact" style={S.btnGhost}>
              Contacter l&apos;équipe
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '48px 20px 36px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', gap: '32px', marginBottom: '48px' }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/favicon.png" alt="PilotResto" style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF', fontFamily: 'var(--font-display, system-ui)', letterSpacing: '-0.02em' }}>
                  PilotResto
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: '240px' }}>
                La gestion de restaurant, enfin simple et centralisée.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>
                  Produit
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href="#fonctionnalites" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Fonctionnalités</a>
                  <a href="#tarifs"          style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Tarifs</a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>
                  Entreprise
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link href="/contact"                        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Contact</Link>
                  <Link href="/cgu-cgv"                        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>CGU / CGV</Link>
                  <Link href="/politique-de-confidentialite"   style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Confidentialité</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>
                  Contact
                </p>
                <a href="mailto:charles.lecussan@gmail.com" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                  charles.lecussan@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
              © 2026 PilotResto
            </p>
            <a
              href="https://instagram.com/restopilot"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
