'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Loader2, BarChart2, Package, Calendar, FileText, Link2, Cpu } from 'lucide-react'

const CB = 'cubic-bezier(0.16, 1, 0.3, 1)'

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

// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter()

  const [menuOpen,        setMenuOpen]        = useState(false)
  const [scrolled,        setScrolled]        = useState(false)
  const [statsVisible,    setStatsVisible]    = useState(false)
  const [isAnnual,        setIsAnnual]        = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError,   setCheckoutError]   = useState<string | null>(null)

  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (navigator.userAgent.includes('Electron')) router.replace('/login')
  }, [router])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

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

  return (
    <>
      {/* ── Grain overlay (fixed, pointer-events-none) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          pointerEvents: 'none', opacity: 0.028,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      <style>{`
        html { scroll-behavior: smooth; }
        .fade-up {
          opacity: 0;
          transform: translateY(22px);
          filter: blur(4px);
          transition:
            opacity   0.8s ${CB},
            transform 0.8s ${CB},
            filter    0.8s ${CB};
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
        .press:active { transform: scale(0.97); }
        .nav-link {
          color: #555;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: color 0.2s ease;
        }
        .nav-link:hover { color: #111; }
        .pill-btn-white {
          transition: background 0.3s ${CB}, color 0.3s ${CB};
        }
        .pill-btn-white:hover { background: #7798AB !important; color: #fff !important; }
        @keyframes menuFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 767px) {
          .bento-7  { grid-column: span 12 !important; }
          .bento-5  { grid-column: span 12 !important; }
          .bento-6  { grid-column: span 12 !important; }
          .photos-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid  { grid-template-columns: 1fr !important; }
          .stats-grid > div { border-right: none !important; border-bottom: 1px solid #EAEAEA; }
        }
      `}</style>

      <div style={{ background: '#FFFFFF', fontFamily: "'SF Pro Text', 'Geist', system-ui, sans-serif", color: '#111111' }}>

        {/* ══ NAV — FLOATING ISLAND ════════════════════════════════ */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '14px 20px' }}>
          <div
            style={{
              maxWidth: '1120px', margin: '0 auto',
              background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              borderRadius: '9999px',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: scrolled
                ? '0 8px 40px rgba(0,0,0,0.10), 0 1px 0 rgba(0,0,0,0.04)'
                : '0 2px 16px rgba(0,0,0,0.05)',
              transition: `all 0.5s ${CB}`,
              height: '54px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px 0 20px',
            }}
          >
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.png" alt="PilotResto" style={{ height: '27px', width: 'auto' }} />
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#111', letterSpacing: '-0.03em' }}>PilotResto</span>
            </Link>

            <nav className="hidden md:flex" style={{ gap: '30px' }}>
              {[
                { href: '#fonctionnalites', label: 'Fonctionnalités' },
                { href: '#tarifs',          label: 'Tarifs' },
                { href: '/contact',         label: 'Contact' },
              ].map(l => <a key={l.href} href={l.href} className="nav-link">{l.label}</a>)}
            </nav>

            <div className="hidden md:flex" style={{ gap: '6px', alignItems: 'center' }}>
              <Link href="/login" style={{
                padding: '8px 16px', borderRadius: '9999px',
                border: '1px solid #E2E2E2', fontSize: '12px', fontWeight: 600,
                color: '#333', textDecoration: 'none', letterSpacing: '0.01em',
                transition: `border-color 0.2s ease, color 0.2s ease`,
              }}>
                Connexion
              </Link>
              <Link href="/register" className="press" style={{
                padding: '9px 18px', borderRadius: '9999px', background: '#111',
                fontSize: '12px', fontWeight: 700, color: '#fff', textDecoration: 'none',
                letterSpacing: '0.03em', transition: `opacity 0.2s ease`,
              }}>
                Essai gratuit
              </Link>
            </div>

            <button
              className="md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: '8px', marginRight: '4px' }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {menuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(28px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '40px 32px 48px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '48px' }}>
              {[
                { href: '#fonctionnalites', label: 'Fonctionnalités' },
                { href: '#tarifs',          label: 'Tarifs' },
                { href: '/contact',         label: 'Contact' },
              ].map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontSize: '36px', fontWeight: 800, color: '#111',
                    textDecoration: 'none', letterSpacing: '-0.03em', lineHeight: 1,
                    animation: `menuFadeUp 0.45s ${CB} ${i * 0.06}s both`,
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                padding: '14px', borderRadius: '9999px', border: '1.5px solid #E2E2E2',
                textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#333', textDecoration: 'none',
              }}>Connexion</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{
                padding: '14px', borderRadius: '9999px', background: '#111',
                textAlign: 'center', fontWeight: 700, fontSize: '14px', color: '#fff', textDecoration: 'none',
              }}>Commencer gratuitement →</Link>
            </div>
          </div>
        )}

        <main>

          {/* ══ 1. HERO ══════════════════════════════════════════════ */}
          <section style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600"
              alt="Intérieur d'un restaurant"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)' }} />
            {/* bottom fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)' }} />

            <div className="relative z-10 text-center px-5 sm:px-8 w-full" style={{ maxWidth: '880px', margin: '0 auto', paddingTop: '100px' }}>

              {/* Eyebrow badge */}
              <div className="fade-up" style={{ display: 'inline-flex', marginBottom: '32px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 14px', borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
                }}>
                  Gestion restaurant — France
                </span>
              </div>

              <h1
                className="fade-up"
                style={{
                  fontSize: 'clamp(46px, 8.5vw, 96px)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.04,
                  letterSpacing: '-0.04em',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  marginBottom: '26px',
                  textWrap: 'balance',
                  transitionDelay: '0.07s',
                }}
              >
                Gérez votre restaurant.<br />Enfin simplement.
              </h1>

              <p
                className="fade-up"
                style={{
                  fontSize: 'clamp(17px, 2.3vw, 22px)',
                  color: 'rgba(255,255,255,0.68)',
                  marginBottom: '52px',
                  lineHeight: 1.55,
                  transitionDelay: '0.14s',
                  textWrap: 'balance',
                }}
              >
                Moins de paperasse, plus de temps en cuisine.
              </p>

              <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', transitionDelay: '0.22s' }}>
                <Link href="/register" className="press" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: '#FFFFFF', color: '#111111',
                  borderRadius: '9999px', padding: '15px 26px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  textDecoration: 'none',
                  transition: `all 0.3s ${CB}`,
                }}>
                  Commencer gratuitement
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '9999px', background: 'rgba(0,0,0,0.07)', flexShrink: 0 }}>→</span>
                </Link>
                <a href="#tarifs" className="press" style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: 'transparent', color: '#FFFFFF',
                  borderRadius: '9999px', padding: '15px 26px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  textDecoration: 'none',
                  transition: `all 0.3s ${CB}`,
                }}>
                  Voir les tarifs
                </a>
              </div>
            </div>

            {/* Scroll line */}
            <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)' }}>
              <div style={{ width: '1px', height: '52px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.28))' }} />
            </div>
          </section>

          {/* ══ 2. STATS ══════════════════════════════════════════════ */}
          <section style={{ background: '#FFFFFF', borderBottom: '1px solid #EAEAEA' }}>
            <div
              ref={statsRef}
              className="stats-grid"
              style={{ maxWidth: '920px', margin: '0 auto', padding: '80px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}
            >
              {[
                { value: 14,  suffix: ' jours', label: 'Essai gratuit, sans carte bancaire' },
                { value: 3,   suffix: ' min',   label: 'Pour configurer votre restaurant' },
                { value: 100, suffix: '%',      label: 'Données hébergées en France' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="fade-up"
                  style={{
                    textAlign: 'center', padding: '40px 24px',
                    borderRight: i < 2 ? '1px solid #EAEAEA' : 'none',
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  <div style={{
                    fontSize: 'clamp(52px, 7vw, 80px)',
                    fontWeight: 800, color: '#111',
                    lineHeight: 1,
                    fontFamily: "'Georgia', serif",
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <Counter target={stat.value} isVisible={statsVisible} />{stat.suffix}
                  </div>
                  <p style={{ fontSize: '13px', color: '#888', marginTop: '10px', lineHeight: 1.5 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 3. TÉLÉCHARGEMENT ════════════════════════════════════ */}
          <section style={{ background: '#111111', padding: '96px 20px' }}>
            <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
              <div className="fade-up" style={{ marginBottom: '52px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 13px', borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                }}>
                  Application desktop disponible sur
                </span>
              </div>
              <div className="fade-up" style={{ display: 'flex', gap: '36px', flexWrap: 'wrap', justifyContent: 'center', transitionDelay: '0.09s' }}>

                {/* Mac */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    macOS · M1 / M2 / M3
                  </span>
                  <a
                    href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0-arm64.dmg"
                    className="press pill-btn-white"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '10px',
                      background: '#FFFFFF', color: '#111111',
                      borderRadius: '9999px', padding: '14px 32px',
                      textDecoration: 'none', fontWeight: 700, fontSize: '13px',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Télécharger
                  </a>
                  <a
                    href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0.dmg"
                    style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', textDecoration: 'underline', letterSpacing: '0.02em' }}
                  >
                    Mac Intel
                  </a>
                </div>

                {/* Windows */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Windows 10 / 11
                  </span>
                  <a
                    href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto.Setup.1.0.0.exe"
                    className="press pill-btn-white"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '10px',
                      background: '#FFFFFF', color: '#111111',
                      borderRadius: '9999px', padding: '14px 32px',
                      textDecoration: 'none', fontWeight: 700, fontSize: '13px',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}
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

          {/* ══ 4. PROBLÈME — ÉDITORIAL ═══════════════════════════════ */}
          <section style={{ background: '#FFFFFF', padding: '128px 20px' }}>
            <div style={{ maxWidth: '880px', margin: '0 auto' }}>
              <div className="fade-up" style={{ marginBottom: '22px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 13px', borderRadius: '9999px',
                  border: '1px solid #EAEAEA',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#7798AB',
                }}>Le problème</span>
              </div>
              <h2
                className="fade-up"
                style={{
                  fontSize: 'clamp(28px, 4.2vw, 54px)',
                  fontWeight: 800, color: '#111',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                  marginBottom: '72px', maxWidth: '640px',
                  textWrap: 'balance', transitionDelay: '0.07s',
                }}
              >
                Les restaurateurs perdent 2h par jour en paperasse.
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#EAEAEA' }}>
                {[
                  { n: '01', text: 'Les tableurs Excel ne sont pas faits pour gérer un restaurant.' },
                  { n: '02', text: 'Vos données éparpillées dans 5 outils qui ne se parlent pas.' },
                  { n: '03', text: 'Chaque heure perdue en admin est une heure de moins en cuisine.' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="fade-up"
                    style={{
                      background: '#FFFFFF', padding: '36px 40px',
                      display: 'flex', alignItems: 'center', gap: '44px',
                      transitionDelay: `${i * 0.1}s`,
                    }}
                  >
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: '#7798AB',
                      letterSpacing: '0.1em', flexShrink: 0,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {item.n}
                    </span>
                    <p style={{
                      fontSize: 'clamp(16px, 2.2vw, 21px)', color: '#111',
                      fontWeight: 500, lineHeight: 1.5, margin: 0, textWrap: 'pretty',
                    }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 5. FONCTIONNALITÉS — BENTO ASYMÉTRIQUE ═══════════════ */}
          <section id="fonctionnalites" style={{ background: '#F9F9F8', padding: '128px 20px', borderTop: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA' }}>
            <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
              <div className="fade-up" style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 13px', borderRadius: '9999px',
                  border: '1px solid #EAEAEA',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#7798AB',
                }}>Fonctionnalités</span>
              </div>
              <h2
                className="fade-up"
                style={{
                  fontSize: 'clamp(28px, 4.2vw, 54px)',
                  fontWeight: 800, color: '#111',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                  marginBottom: '64px', textWrap: 'balance',
                  transitionDelay: '0.07s',
                }}
              >
                Tout ce dont vous avez besoin
              </h2>

              {/* Bento grid — asymétrique */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2px', background: '#EAEAEA' }}>

                {/* Dashboard — 7 cols, tall */}
                <div className="fade-up bento-7" style={{ gridColumn: 'span 7', background: '#FFFFFF', padding: '52px 44px', transitionDelay: '0s' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    <BarChart2 size={22} color="#7798AB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', marginBottom: '14px', letterSpacing: '-0.025em' }}>Dashboard</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.75, maxWidth: '360px' }}>
                    CA en temps réel, marges et indicateurs clés. Visualisez d&apos;un coup d&apos;œil si votre journée est rentable.
                  </p>
                </div>

                {/* Stocks — 5 cols */}
                <div className="fade-up bento-5" style={{ gridColumn: 'span 5', background: '#FFFFFF', padding: '52px 40px', transitionDelay: '0.07s' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    <Package size={22} color="#7798AB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', marginBottom: '14px', letterSpacing: '-0.025em' }}>Stocks</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.75 }}>Alertes automatiques, valorisation et suivi des entrées/sorties.</p>
                </div>

                {/* Planning — 5 cols */}
                <div className="fade-up bento-5" style={{ gridColumn: 'span 5', background: '#FFFFFF', padding: '52px 40px', transitionDelay: '0.13s' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    <Calendar size={22} color="#7798AB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', marginBottom: '14px', letterSpacing: '-0.025em' }}>Planning</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.75 }}>Conforme HCR, gestion des congés et exports planning PDF.</p>
                </div>

                {/* FEC — 7 cols, dark */}
                <div className="fade-up bento-7" style={{ gridColumn: 'span 7', background: '#111111', padding: '52px 44px', transitionDelay: '0.18s' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(119,152,171,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    <FileText size={22} color="#7798AB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', letterSpacing: '-0.025em' }}>FEC</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: '360px' }}>
                    Export comptable en un clic, conforme à la législation française. Envoi direct à votre expert-comptable.
                  </p>
                </div>

                {/* Caisses — 6 cols */}
                <div className="fade-up bento-6" style={{ gridColumn: 'span 6', background: '#FFFFFF', padding: '52px 40px', transitionDelay: '0.22s' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    <Link2 size={22} color="#7798AB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', marginBottom: '14px', letterSpacing: '-0.025em' }}>Caisses</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.75 }}>Connexion Lightspeed, Tiller, Zelty et autres caisses.</p>
                </div>

                {/* Factures IA — 6 cols */}
                <div className="fade-up bento-6" style={{ gridColumn: 'span 6', background: '#FFFFFF', padding: '52px 40px', transitionDelay: '0.27s' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    <Cpu size={22} color="#7798AB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', marginBottom: '14px', letterSpacing: '-0.025em' }}>Factures IA</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.75 }}>Scan automatique OCR, extraction et classement des factures.</p>
                </div>

              </div>
            </div>
          </section>

          {/* ══ 6. COMMENT ÇA MARCHE ══════════════════════════════════ */}
          <section style={{ background: '#FFFFFF', padding: '128px 20px' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <div className="fade-up" style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 13px', borderRadius: '9999px',
                  border: '1px solid #EAEAEA',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#7798AB',
                }}>Mise en route</span>
              </div>
              <h2
                className="fade-up"
                style={{
                  fontSize: 'clamp(28px, 4.2vw, 54px)',
                  fontWeight: 800, color: '#111',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                  marginBottom: '56px', transitionDelay: '0.07s',
                }}
              >
                Prêt en 5 minutes
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#EAEAEA' }}>
                {[
                  { n: '1', title: "Téléchargez l'application", detail: '2 minutes — Mac ou Windows' },
                  { n: '2', title: 'Configurez votre restaurant',  detail: '3 minutes — nom, SIRET, équipe' },
                  { n: '3', title: 'Pilotez en temps réel',        detail: 'Dès maintenant' },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="fade-up"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '28px',
                      background: '#FFFFFF', padding: '32px 36px',
                      transitionDelay: `${i * 0.12}s`,
                    }}
                  >
                    <div style={{
                      flexShrink: 0, width: '38px', height: '38px', borderRadius: '9999px',
                      border: '1.5px solid #7798AB', color: '#7798AB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '14px',
                    }}>
                      {step.n}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#111', marginBottom: '4px' }}>{step.title}</h3>
                      <p style={{ fontSize: '13px', color: '#888' }}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="fade-up" style={{ marginTop: '52px', textAlign: 'center' }}>
                <Link href="/register" className="press" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: '#111', color: '#FFF',
                  borderRadius: '9999px', padding: '15px 28px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  textDecoration: 'none', transition: `opacity 0.2s ease`,
                }}>
                  Commencer gratuitement
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>→</span>
                </Link>
              </div>

              {/* Réassurance */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#EAEAEA', marginTop: '72px' }}>
                {[
                  'Données hébergées en France',
                  'Conçu pour la restauration française',
                  'Support 24–48h par email',
                  'Conforme RGPD',
                ].map((b, i) => (
                  <div
                    key={i}
                    className="fade-up"
                    style={{
                      background: '#F9F9F8', padding: '20px 24px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      transitionDelay: `${i * 0.07}s`,
                    }}
                  >
                    <div style={{ width: '5px', height: '5px', borderRadius: '9999px', background: '#7798AB', flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#444', lineHeight: 1.5 }}>{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 7. TARIFS ════════════════════════════════════════════ */}
          <section id="tarifs" style={{ background: '#F9F9F8', padding: '128px 20px', borderTop: '1px solid #EAEAEA' }}>
            <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
              <div className="fade-up" style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 13px', borderRadius: '9999px',
                  border: '1px solid #EAEAEA',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#7798AB',
                }}>Tarifs</span>
              </div>
              <h2
                className="fade-up"
                style={{
                  fontSize: 'clamp(28px, 4.2vw, 54px)',
                  fontWeight: 800, color: '#111',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                  marginBottom: '52px', transitionDelay: '0.07s',
                }}
              >
                Nos offres
              </h2>

              {/* Toggle mensuel / annuel */}
              <div className="fade-up" style={{ display: 'flex', marginBottom: '56px' }}>
                <div style={{ display: 'flex', background: '#E4E4E4', borderRadius: '9999px', padding: '3px', gap: '3px' }}>
                  {(['Mensuel', 'Annuel (−20%)'] as const).map((label, i) => {
                    const active = i === (isAnnual ? 1 : 0)
                    return (
                      <button
                        key={label}
                        onClick={() => setIsAnnual(i === 1)}
                        className="press"
                        style={{
                          padding: '8px 20px', borderRadius: '9999px', border: 'none',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          background: active ? '#111' : 'transparent',
                          color: active ? '#FFF' : '#888',
                          transition: `all 0.28s ${CB}`,
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {checkoutError && (
                <p style={{ color: '#DC2626', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>{checkoutError}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px', background: '#EAEAEA' }}>
                {PLANS.map((plan, i) => {
                  const priceId   = isAnnual ? plan.priceIdAnnual  : plan.priceIdMonthly
                  const isLoading = checkoutLoading === priceId

                  const inner = (
                    <div
                      className="fade-up"
                      style={{
                        background:     plan.popular ? '#111111' : '#FFFFFF',
                        padding:        '44px 36px',
                        position:       'relative',
                        transitionDelay:`${i * 0.1}s`,
                        height:         '100%',
                        display:        'flex',
                        flexDirection:  'column',
                      }}
                    >
                      {/* Accent line on popular */}
                      {plan.popular && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#7798AB' }} />
                      )}

                      {plan.popular && (
                        <div style={{
                          position: 'absolute', top: '28px', right: '28px',
                          background: '#7798AB', color: '#FFF',
                          fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em',
                          textTransform: 'uppercase', padding: '4px 10px', borderRadius: '9999px',
                        }}>
                          Populaire
                        </div>
                      )}

                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: plan.popular ? 'rgba(255,255,255,0.38)' : '#999', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>
                        {plan.name}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: 'clamp(44px, 5.5vw, 62px)', fontWeight: 800,
                          color: plan.popular ? '#FFF' : '#111',
                          lineHeight: 1, fontFamily: "'Georgia', serif",
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {isAnnual ? plan.annualMonthly : plan.monthly}€
                        </span>
                        <span style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.32)' : '#C0C0C0' }}>/mois</span>
                      </div>
                      <p style={{ fontSize: '12px', color: plan.popular ? 'rgba(255,255,255,0.25)' : '#C8C8C8', marginBottom: '36px', minHeight: '18px' }}>
                        {isAnnual ? `${plan.annualTotal}€ / an` : 'Facturé mensuellement'}
                      </p>

                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                        {plan.features.map(f => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.7)' : '#444', lineHeight: 1.55 }}>
                            <span style={{ color: '#7798AB', flexShrink: 0, fontWeight: 700, marginTop: '1px' }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleCheckout(priceId)}
                        disabled={!!checkoutLoading}
                        className="press"
                        style={{
                          marginTop: '32px',
                          width: '100%', padding: '13px',
                          borderRadius: '9999px',
                          border: plan.popular ? '1.5px solid rgba(255,255,255,0.18)' : '1.5px solid #111',
                          background: plan.popular ? 'rgba(255,255,255,0.07)' : '#111',
                          color: '#FFF', fontSize: '12px', fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                          opacity: checkoutLoading && !isLoading ? 0.5 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          transition: `all 0.25s ${CB}`,
                        }}
                      >
                        {isLoading && <Loader2 size={13} className="animate-spin" />}
                        S&apos;inscrire — 14j gratuits
                      </button>
                    </div>
                  )

                  return <div key={plan.id} style={{ display: 'flex', flexDirection: 'column' }}>{inner}</div>
                })}
              </div>
            </div>
          </section>

          {/* ══ 8. PHOTOS RESTAURANTS ════════════════════════════════ */}
          <section style={{ background: '#FFFFFF', padding: '128px 20px', borderTop: '1px solid #EAEAEA' }}>
            <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                  <div className="fade-up" style={{ marginBottom: '16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '5px 13px', borderRadius: '9999px',
                      border: '1px solid #EAEAEA',
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                      textTransform: 'uppercase', color: '#7798AB',
                    }}>Instagram</span>
                  </div>
                  <h2
                    className="fade-up"
                    style={{
                      fontSize: 'clamp(24px, 3.8vw, 48px)',
                      fontWeight: 800, color: '#111',
                      letterSpacing: '-0.03em', lineHeight: 1.1,
                      transitionDelay: '0.07s',
                    }}
                  >
                    Suivez notre actualité
                  </h2>
                </div>
                <a
                  href="https://instagram.com/restopilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fade-up press"
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'transparent', color: '#111',
                    borderRadius: '9999px', padding: '10px 20px',
                    fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em',
                    border: '1.5px solid #EAEAEA',
                    textDecoration: 'none', transition: `border-color 0.2s ease`,
                    transitionDelay: '0.12s',
                  }}
                >
                  @restopilot
                </a>
              </div>

              <div className="fade-up photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
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
                    alt={`Ambiance restaurant ${i + 1}`}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', filter: 'saturate(0.82)' }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ══ 9. CTA FINAL ══════════════════════════════════════════ */}
          <section style={{ background: '#111111', padding: '128px 20px' }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
              <h2
                className="fade-up"
                style={{
                  fontSize: 'clamp(36px, 5.5vw, 72px)',
                  fontWeight: 800, color: '#FFFFFF',
                  lineHeight: 1.07, letterSpacing: '-0.04em',
                  fontFamily: "'Georgia', serif",
                  marginBottom: '28px', textWrap: 'balance',
                }}
              >
                Prêt à reprendre le contrôle ?
              </h2>
              <p className="fade-up" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.48)', marginBottom: '48px', lineHeight: 1.7, transitionDelay: '0.09s' }}>
                14 jours gratuits, sans carte bancaire.<br />Configuration en 3 minutes.
              </p>
              <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', transitionDelay: '0.18s' }}>
                <Link href="/register" className="press" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: '#FFFFFF', color: '#111',
                  borderRadius: '9999px', padding: '15px 28px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  textDecoration: 'none', transition: `opacity 0.2s ease`,
                }}>
                  Commencer gratuitement
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '9999px', background: 'rgba(0,0,0,0.07)', flexShrink: 0 }}>→</span>
                </Link>
                <Link href="/contact" className="press" style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: 'transparent', color: '#FFF',
                  borderRadius: '9999px', padding: '15px 28px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  border: '1.5px solid rgba(255,255,255,0.28)',
                  textDecoration: 'none', transition: `border-color 0.2s ease`,
                }}>
                  Contacter l&apos;équipe
                </Link>
              </div>
            </div>
          </section>

        </main>

        {/* ══ FOOTER ════════════════════════════════════════════════ */}
        <footer style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 20px 44px' }}>
          <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', gap: '44px', marginBottom: '56px' }}>

              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon.png" alt="PilotResto" style={{ height: '26px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#FFFFFF', letterSpacing: '-0.03em' }}>PilotResto</span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, maxWidth: '210px' }}>
                  La gestion de restaurant, enfin simple et centralisée.
                </p>
              </div>

              {/* Link columns */}
              <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: '16px' }}>Produit</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <a href="#fonctionnalites" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>Fonctionnalités</a>
                    <a href="#tarifs"          style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>Tarifs</a>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: '16px' }}>Légal</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link href="/cgu-cgv"                      style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>CGU / CGV</Link>
                    <Link href="/politique-de-confidentialite" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>Confidentialité</Link>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: '16px' }}>Contact</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link href="/contact"                        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>Contact</Link>
                    <a href="mailto:charles.lecussan@gmail.com" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>charles.lecussan@gmail.com</a>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.16)' }}>© 2026 PilotResto</p>
              <a
                href="https://instagram.com/restopilot"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.26)', textDecoration: 'none' }}
              >
                Instagram
              </a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
