'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Loader2 } from 'lucide-react'

// ─── Animated counter ────────────────────────────────────────
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

// ─── Stripe price IDs ────────────────────────────────────────
const PLANS = [
  {
    id:             'starter',
    name:           'Starter',
    monthly:        39,
    annualTotal:    368,
    annualMonthly:  31,
    priceIdMonthly: 'price_1TjRUOEw9od5qGxlmwXgMQQD',
    priceIdAnnual:  'price_1TjRUOEw9od5qGxlnDbe4Nqv',
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

// ═══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter()

  const [menuOpen,      setMenuOpen]      = useState(false)
  const [scrolled,      setScrolled]      = useState(false)
  const [statsVisible,  setStatsVisible]  = useState(false)
  const [isAnnual,      setIsAnnual]      = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError,   setCheckoutError]   = useState<string | null>(null)
  const [contactSent,   setContactSent]   = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

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

  // Contact form
  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setContactLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fd.get('firstName'),
          lastName:  fd.get('lastName'),
          email:     fd.get('email'),
          message:   fd.get('message'),
        }),
      })
      if (res.ok) setContactSent(true)
    } catch { /* silent */ } finally {
      setContactLoading(false)
    }
  }

  // ── Shared button styles ────────────────────────────────────
  const btnBlack = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    background:     '#111111',
    color:          '#FFFFFF',
    borderRadius:   '9999px',
    padding:        '14px 28px',
    fontSize:       '13px',
    fontWeight:     700,
    letterSpacing:  '0.1em',
    textTransform:  'uppercase' as const,
    border:         'none',
    cursor:         'pointer',
    textDecoration: 'none',
  }
  const btnOutline = {
    ...btnBlack,
    background:   '#FFFFFF',
    color:        '#111111',
    border:       '1px solid #111111',
  }
  const btnOutlineWhite = {
    ...btnBlack,
    background:   'transparent',
    color:        '#FFFFFF',
    border:       '2px solid rgba(255,255,255,0.7)',
  }

  return (
    <div style={{ background: '#FFFFFF', fontFamily: 'var(--font-body, system-ui)', color: '#111111' }}>

      {/* ══ NAV STICKY ════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background:     'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom:   scrolled ? '1px solid #E5E5E5' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '32px', width: 'auto' }} />
            <span style={{ fontWeight: 800, fontSize: '17px', color: '#111111', fontFamily: 'var(--font-display, system-ui)', letterSpacing: '-0.02em' }}>
              PilotResto
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex" style={{ gap: '40px' }}>
            {[
              { href: '#fonctionnalites', label: 'Fonctionnalités' },
              { href: '#tarifs',          label: 'Tarifs' },
              { href: '#contact',         label: 'Contact' },
            ].map(l => (
              <a key={l.href} href={l.href}
                style={{ color: '#555555', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
                className="hover:text-black transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
            <Link href="/login" style={{ ...btnOutline, padding: '10px 20px', fontSize: '12px' }}>
              Se connecter
            </Link>
            <Link href="/register" style={{ ...btnBlack, padding: '10px 20px', fontSize: '12px' }}>
              Commencer gratuitement
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            className="md:hidden p-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111111' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fermer' : 'Menu'}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div style={{ background: '#FFFFFF', borderTop: '1px solid #E5E5E5' }}>
            <div className="px-5 py-6 flex flex-col gap-5">
              {[
                { href: '#fonctionnalites', label: 'Fonctionnalités' },
                { href: '#tarifs',          label: 'Tarifs' },
                { href: '#contact',         label: 'Contact' },
              ].map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  style={{ color: '#111111', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}
                >
                  {l.label}
                </a>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E5E5E5' }}>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ ...btnOutline, justifyContent: 'center' }}>
                  Se connecter
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{ ...btnBlack, justifyContent: 'center' }}>
                  Commencer gratuitement
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ 1. HERO ═══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600"
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

        <div className="relative z-10 text-center px-5 sm:px-8 w-full" style={{ maxWidth: '860px', margin: '0 auto', paddingTop: '80px' }}>
          <h1
            className="fade-up"
            style={{
              fontSize:    'clamp(40px, 7vw, 72px)',
              fontWeight:  800,
              color:       '#FFFFFF',
              lineHeight:  1.1,
              letterSpacing: '-0.03em',
              fontFamily:  'var(--font-display, system-ui)',
              marginBottom: '20px',
            }}
          >
            Gérez votre restaurant.<br />Enfin simplement.
          </h1>
          <p
            className="fade-up"
            style={{ fontSize: '20px', color: 'rgba(255,255,255,0.85)', marginBottom: '40px', transitionDelay: '0.1s' }}
          >
            Moins de paperasse, plus de temps en cuisine.
          </p>
          <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', transitionDelay: '0.2s' }}>
            <Link href="/register" style={btnBlack}>
              Commencer gratuitement →
            </Link>
            <a href="#tarifs" style={btnOutlineWhite}>
              Voir les tarifs
            </a>
          </div>
        </div>
      </section>

      {/* ══ 2. TÉLÉCHARGEMENT ════════════════════════════════════ */}
      <section style={{ background: '#111111', padding: '80px 20px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p className="fade-up text-center" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>
            Application desktop disponible sur
          </p>
          <div className="fade-up" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Mac */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>macOS · M1 / M2 / M3</span>
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0-arm64.dmg"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '10px',
                  background:     '#4F39F5',
                  color:          '#FFFFFF',
                  borderRadius:   '9999px',
                  padding:        '14px 32px',
                  textDecoration: 'none',
                  fontWeight:     600,
                  fontSize:       '15px',
                  transition:     'background 0.18s, transform 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#3d29e0'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#4F39F5'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Télécharger
              </a>
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0.dmg"
                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}
              >
                Mac Intel ? Téléchargez cette version
              </a>
            </div>
            {/* Windows */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>Windows 10 / 11</span>
              <a
                href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto.Setup.1.0.0.exe"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '10px',
                  background:     '#4F39F5',
                  color:          '#FFFFFF',
                  borderRadius:   '9999px',
                  padding:        '14px 32px',
                  textDecoration: 'none',
                  fontWeight:     600,
                  fontSize:       '15px',
                  transition:     'background 0.18s, transform 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#3d29e0'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#4F39F5'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.801"/>
                </svg>
                Télécharger
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. ACCROCHE / PROBLÈME ═══════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 20px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <h2
            className="fade-up text-center"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#111111', marginBottom: '64px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Les restaurateurs perdent 2h/jour<br />en gestion administrative
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              { icon: '😓', text: 'Les tableurs Excel ne sont pas faits pour gérer un restaurant' },
              { icon: '📦', text: 'Les données éparpillées entre 5 outils différents' },
              { icon: '⏰', text: 'Du temps perdu en admin = moins de temps en cuisine' },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  border:       '1px solid #E5E5E5',
                  borderRadius: '16px',
                  padding:      '32px',
                  textAlign:    'center',
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>{item.icon}</span>
                <p style={{ fontSize: '15px', color: '#333333', fontWeight: 500, lineHeight: 1.6 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. CHIFFRES ═══════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '80px 20px', borderTop: '1px solid #E5E5E5' }}>
        <div ref={statsRef} style={{ maxWidth: '760px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', textAlign: 'center' }}>
          {[
            { value: 14,  suffix: ' jours', label: 'Essai gratuit' },
            { value: 3,   suffix: ' min',   label: 'Pour démarrer' },
            { value: 100, suffix: '%',      label: 'Données sécurisées' },
          ].map((stat, i) => (
            <div key={i} className="fade-up" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div style={{ fontSize: '64px', fontWeight: 800, color: '#111111', lineHeight: 1, fontFamily: 'var(--font-display, system-ui)' }}>
                <Counter target={stat.value} isVisible={statsVisible} />{stat.suffix}
              </div>
              <p style={{ fontSize: '16px', color: '#888888', marginTop: '8px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 5. FONCTIONNALITÉS ═══════════════════════════════════ */}
      <section id="fonctionnalites" style={{ background: '#FFFFFF', padding: '120px 20px', borderTop: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <h2
            className="fade-up text-center"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#111111', marginBottom: '64px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Tout ce dont vous avez besoin
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { icon: '📊', title: 'Dashboard',    desc: 'CA en temps réel, marges et indicateurs clés au quotidien.' },
              { icon: '📦', title: 'Stocks',       desc: 'Alertes automatiques, valorisation et suivi des entrées/sorties.' },
              { icon: '👥', title: 'Planning',     desc: 'Conforme HCR, gestion des congés et exports planning PDF.' },
              { icon: '🧾', title: 'FEC',          desc: 'Export comptable en un clic, conforme à la législation française.' },
              { icon: '🔗', title: 'Caisses',      desc: 'Connexion Lightspeed, Tiller, Zelty et autres caisses.' },
              { icon: '🤖', title: 'Factures IA',  desc: 'Scan automatique OCR, extraction et classement des factures.' },
            ].map((feat, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  border:       '1px solid #E5E5E5',
                  borderRadius: '16px',
                  padding:      '32px',
                  transitionDelay: `${i * 0.08}s`,
                }}
              >
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>{feat.icon}</span>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#111111', marginBottom: '8px' }}>{feat.title}</h3>
                <p style={{ fontSize: '14px', color: '#666666', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. COMMENT ÇA MARCHE ══════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 20px', borderTop: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2
            className="fade-up text-center"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#111111', marginBottom: '64px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Comment ça marche ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { n: '1', title: 'Téléchargez l\'application', detail: '2 min' },
              { n: '2', title: 'Configurez votre restaurant', detail: '3 min' },
              { n: '3', title: 'Pilotez en temps réel',       detail: 'Dès maintenant' },
            ].map((step, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '20px',
                  border:       '1px solid #E5E5E5',
                  borderRadius: '16px',
                  padding:      '24px 28px',
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <div style={{
                  flexShrink:    0,
                  width:         '44px',
                  height:        '44px',
                  borderRadius:  '9999px',
                  background:    '#111111',
                  color:         '#FFFFFF',
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent: 'center',
                  fontWeight:    800,
                  fontSize:      '18px',
                }}>
                  {step.n}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#111111' }}>{step.title}</h3>
                  <p style={{ fontSize: '13px', color: '#888888', marginTop: '2px' }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Badges réassurance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '48px' }}>
            {[
              { icon: '🔒', text: 'Données hébergées en France' },
              { icon: '🇫🇷', text: 'Conçu pour la restauration française' },
              { icon: '📞', text: 'Support 24-48h par email' },
              { icon: '✅', text: 'Conforme RGPD' },
            ].map((b, i) => (
              <div
                key={i}
                className="fade-up"
                style={{
                  border:       '1px solid #E5E5E5',
                  borderRadius: '12px',
                  padding:      '16px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '12px',
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span style={{ fontSize: '22px' }}>{b.icon}</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#333333', lineHeight: 1.4 }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. TARIFS ═════════════════════════════════════════════ */}
      <section id="tarifs" style={{ background: '#FFFFFF', padding: '120px 20px', borderTop: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <h2
            className="fade-up text-center"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#111111', marginBottom: '32px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Nos offres
          </h2>

          {/* Toggle mensuel / annuel */}
          <div className="fade-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: '9999px', padding: '4px', gap: '4px' }}>
              {['Mensuel', 'Annuel (−20%)'].map((label, i) => {
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
                      fontSize:     '13px',
                      fontWeight:   700,
                      letterSpacing: '0.05em',
                      background:   active ? '#111111' : 'transparent',
                      color:        active ? '#FFFFFF' : '#888888',
                      transition:   'all 0.2s',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {PLANS.map((plan, i) => {
              const priceId   = isAnnual ? plan.priceIdAnnual : plan.priceIdMonthly
              const isLoading = checkoutLoading === priceId
              return (
                <div
                  key={plan.id}
                  className="fade-up"
                  style={{
                    border:       `1px solid ${plan.popular ? '#111111' : '#E5E5E5'}`,
                    borderRadius: '16px',
                    padding:      '32px',
                    background:   plan.popular ? '#111111' : '#FFFFFF',
                    position:     'relative',
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position:     'absolute',
                      top:          '-12px',
                      left:         '50%',
                      transform:    'translateX(-50%)',
                      background:   '#FFFFFF',
                      color:        '#111111',
                      fontSize:     '11px',
                      fontWeight:   800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding:      '4px 14px',
                      borderRadius: '9999px',
                      border:       '1px solid #E5E5E5',
                      whiteSpace:   'nowrap',
                    }}>
                      Le plus populaire
                    </div>
                  )}

                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: plan.popular ? '#FFFFFF' : '#111111', marginBottom: '8px' }}>
                    {plan.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '40px', fontWeight: 800, color: plan.popular ? '#FFFFFF' : '#111111', lineHeight: 1 }}>
                      {isAnnual ? plan.annualMonthly : plan.monthly}€
                    </span>
                    <span style={{ fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.6)' : '#888888' }}>/mois</span>
                  </div>
                  {isAnnual && (
                    <p style={{ fontSize: '12px', color: plan.popular ? 'rgba(255,255,255,0.5)' : '#888888', marginBottom: '24px' }}>
                      soit {plan.annualTotal}€ facturés annuellement
                    </p>
                  )}
                  {!isAnnual && <div style={{ marginBottom: '24px' }} />}

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.85)' : '#333333' }}>
                        <span style={{ flexShrink: 0, marginTop: '2px' }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCheckout(priceId)}
                    disabled={!!checkoutLoading}
                    style={{
                      width:          '100%',
                      padding:        '14px',
                      borderRadius:   '9999px',
                      border:         plan.popular ? '2px solid rgba(255,255,255,0.3)' : '2px solid #111111',
                      background:     plan.popular ? 'rgba(255,255,255,0.12)' : '#111111',
                      color:          plan.popular ? '#FFFFFF' : '#FFFFFF',
                      fontSize:       '13px',
                      fontWeight:     700,
                      letterSpacing:  '0.1em',
                      textTransform:  'uppercase',
                      cursor:         checkoutLoading ? 'not-allowed' : 'pointer',
                      opacity:        checkoutLoading && !isLoading ? 0.5 : 1,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      gap:            '8px',
                    }}
                  >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    S&apos;inscrire
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ 8. PHOTOS RESTAURANT ══════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 20px', borderTop: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <h2
            className="fade-up text-center"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#111111', marginBottom: '48px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Suivez notre actualité
          </h2>
          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '40px' }}>
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
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '12px' }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <a
              href="https://instagram.com/restopilot"
              target="_blank"
              rel="noopener noreferrer"
              style={btnBlack}
            >
              SUIVRE
            </a>
          </div>
        </div>
      </section>

      {/* ══ 9. CONTACT ════════════════════════════════════════════ */}
      <section id="contact" style={{ background: '#FFFFFF', padding: '120px 20px', borderTop: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '80px', alignItems: 'start' }}>

          {/* Gauche */}
          <div className="fade-up">
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#111111', letterSpacing: '-0.02em', fontFamily: 'var(--font-display, system-ui)', marginBottom: '16px' }}>
              Vous avez<br />un projet ?
            </h2>
            <p style={{ fontSize: '16px', color: '#555555', lineHeight: 1.7 }}>
              Parlez-nous de votre restaurant et nous reviendrons vers vous sous 24h.
            </p>
            <p style={{ fontSize: '14px', color: '#888888', marginTop: '24px' }}>
              charles.lecussan@gmail.com
            </p>
          </div>

          {/* Droite — formulaire */}
          <div className="fade-up" style={{ transitionDelay: '0.1s' }}>
            {contactSent ? (
              <div style={{ border: '1px solid #E5E5E5', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p>
                <p style={{ fontWeight: 700, fontSize: '18px', color: '#111111' }}>Message envoyé !</p>
                <p style={{ fontSize: '14px', color: '#888888', marginTop: '8px' }}>Nous vous répondrons sous 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    name="firstName"
                    placeholder="Prénom"
                    required
                    style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', outline: 'none', color: '#111111' }}
                  />
                  <input
                    name="lastName"
                    placeholder="Nom de famille"
                    required
                    style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', outline: 'none', color: '#111111' }}
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', outline: 'none', color: '#111111' }}
                />
                <textarea
                  name="message"
                  placeholder="Message"
                  rows={5}
                  required
                  style={{ border: '1px solid #E5E5E5', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', outline: 'none', color: '#111111', resize: 'vertical' }}
                />
                <button
                  type="submit"
                  disabled={contactLoading}
                  style={{ ...btnBlack, opacity: contactLoading ? 0.6 : 1, justifyContent: 'center' }}
                >
                  {contactLoading && <Loader2 size={14} className="animate-spin" />}
                  ENVOYER
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E5E5E5', padding: '40px 20px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '16px', color: '#111111', fontFamily: 'var(--font-display, system-ui)' }}>PilotResto</p>
              <p style={{ fontSize: '13px', color: '#888888', marginTop: '4px' }}>charles.lecussan@gmail.com</p>
            </div>
            <div style={{ display: 'flex', gap: '28px' }}>
              <Link href="/cgu-cgv"                     style={{ fontSize: '13px', color: '#555555', textDecoration: 'none' }}>CGU / CGV</Link>
              <Link href="/politique-de-confidentialite" style={{ fontSize: '13px', color: '#555555', textDecoration: 'none' }}>Politique de confidentialité</Link>
              <Link href="/contact"                      style={{ fontSize: '13px', color: '#555555', textDecoration: 'none' }}>Contact</Link>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#BBBBBB' }}>
            © 2026 PilotResto
          </p>
        </div>
      </footer>

    </div>
  )
}
