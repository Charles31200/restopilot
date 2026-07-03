'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Menu, X, Loader2,
  BarChart2, Package, Calendar, FileText, Link2, Cpu,
  TrendingUp, CheckCircle2, ArrowRight,
} from 'lucide-react'

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

// ─── Dashboard mockup ─────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{ background: '#F0EFEC', borderRadius: '20px', padding: '18px', boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {['#E8E8E8','#E8E8E8','#E8E8E8'].map((c,i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
        <div style={{ background: '#111', borderRadius: '12px', padding: '14px 12px' }}>
          <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>CA Aujourd&apos;hui</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>4 820€</p>
          <p style={{ fontSize: '9px', color: '#7798AB', marginTop: '5px' }}>↑ 12% vs hier</p>
        </div>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px 12px' }}>
          <p style={{ fontSize: '8px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Marge brute</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#111', lineHeight: 1 }}>67.3%</p>
          <p style={{ fontSize: '9px', color: '#7798AB', marginTop: '5px' }}>↑ 2.1 pts</p>
        </div>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px 12px' }}>
          <p style={{ fontSize: '8px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Ticket moy.</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#111', lineHeight: 1 }}>32.50€</p>
          <p style={{ fontSize: '9px', color: '#888', marginTop: '5px' }}>148 couverts</p>
        </div>
      </div>
      <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '9px', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CA — 7 derniers jours</p>
          <TrendingUp size={12} color="#7798AB" />
        </div>
        <svg viewBox="0 0 260 52" style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7798AB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7798AB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points="0,44 37,36 74,40 111,24 148,28 185,14 222,9 260,6" fill="none" stroke="#7798AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="0,44 37,36 74,40 111,24 148,28 185,14 222,9 260,6 260,52 0,52" fill="url(#g1)" />
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '8px', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Stocks critiques</p>
          {[['Filet de bœuf','2 kg','#DC2626'],['Vin rouge','4 btl','#F59E0B']].map(([n,v,c]) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#444' }}>{n}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '8px', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Planning ce soir</p>
          {[['Marie B.','18h–23h'],['Jean D.','19h–0h']].map(([n,h]) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#444' }}>{n}</span>
              <span style={{ fontSize: '10px', color: '#7798AB' }}>{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Planning mockup ──────────────────────────────────────────
function PlanningMockup() {
  const jours = ['LUN','MAR','MER','JEU','VEN','SAM','DIM']
  const equipe = [
    { nom: 'Marie B.',  role: 'Service', shifts: [1,0,1,1,1,0,0] },
    { nom: 'Jean D.',   role: 'Cuisine', shifts: [0,1,1,0,1,1,0] },
    { nom: 'Alice M.',  role: 'Service', shifts: [1,1,0,1,1,1,0] },
    { nom: 'Luc P.',    role: 'Bar',     shifts: [0,0,1,1,0,1,1] },
  ]
  return (
    <div style={{ background: '#F0EFEC', borderRadius: '20px', padding: '18px', boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E8E8E8' }} />)}
      </div>
      <div style={{ background: '#FFF', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#111' }}>Planning — Semaine 27</p>
          <span style={{ fontSize: '9px', color: '#888', background: '#F5F5F5', padding: '3px 8px', borderRadius: '9999px' }}>30 juin – 6 juil.</span>
        </div>
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', padding: '8px 0', borderBottom: '1px solid #F0F0F0' }}>
            <span />
            {jours.map(j => <span key={j} style={{ fontSize: '8px', color: '#AAA', textAlign: 'center', letterSpacing: '0.06em' }}>{j}</span>)}
          </div>
          {equipe.map(({ nom, role, shifts }) => (
            <div key={nom} style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', padding: '7px 0', borderBottom: '1px solid #F8F8F8', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 600, color: '#111' }}>{nom}</p>
                <p style={{ fontSize: '8px', color: '#AAA' }}>{role}</p>
              </div>
              {shifts.map((on, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'center', padding: '0 2px' }}>
                  {on ? <div style={{ height: '18px', width: '100%', maxWidth: '32px', borderRadius: '4px', background: '#7798AB', opacity: 0.75 }} /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888' }}>4 employés · 18 shifts</span>
          <span style={{ fontSize: '10px', color: '#7798AB', fontWeight: 600 }}>Export PDF →</span>
        </div>
      </div>
    </div>
  )
}

// ─── FEC mockup ───────────────────────────────────────────────
function FECMockup() {
  return (
    <div style={{ background: '#F0EFEC', borderRadius: '20px', padding: '18px', boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E8E8E8' }} />)}
      </div>
      <div style={{ background: '#FFF', borderRadius: '14px', padding: '18px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={18} color="#7798AB" strokeWidth={1.75} />
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Export FEC — Juin 2026</p>
            <p style={{ fontSize: '10px', color: '#888' }}>Conforme DGFiP · art. L13 AA LPF</p>
          </div>
        </div>
        {[
          'Journal VE — Ventes journalières',
          'Journal AC — Achats fournisseurs',
          'Format 16 colonnes pipe-séparé',
          'Encodage UTF-8 vérifié',
        ].map(line => (
          <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #F5F5F5' }}>
            <CheckCircle2 size={13} color="#7798AB" strokeWidth={2} />
            <span style={{ fontSize: '11px', color: '#444' }}>{line}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#111', borderRadius: '14px', padding: '16px' }}>
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Envoi automatique</p>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#FFF' }}>Cabinet Martin & Assoc.</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>comptable@cabinet-martin.fr</p>
          </div>
          <div style={{ background: '#7798AB', borderRadius: '8px', padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#FFF' }}>
            Envoyé ✓
          </div>
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          {['Lightspeed','Tiller','Zelty'].map(c => (
            <span key={c} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px' }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Stripe plans ─────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter', name: 'Starter',
    monthly: 39, annualTotal: 368, annualMonthly: 31,
    priceIdMonthly: 'price_1TjRUOEw9od5qGxlnDbe4Nqv',
    priceIdAnnual:  'price_1TjRUOEw9od5qGxlmwXgMQQD',
    popular: false,
    features: ['Dashboard & KPIs','Gestion des stocks','Planning HCR','Export FEC','1 établissement'],
  },
  {
    id: 'pro', name: 'Pro',
    monthly: 79, annualTotal: 663, annualMonthly: 55,
    priceIdMonthly: 'price_1TjRUvEw9od5qGxl9yxWt6JO',
    priceIdAnnual:  'price_1TjRVfEw9od5qGxlsOTeBSyV',
    popular: true,
    features: ['Tout Starter','Connexion caisses (Lightspeed, Tiller, Zelty)','Factures IA (OCR)','Rapports avancés','1 établissement'],
  },
  {
    id: 'multi', name: 'Multi',
    monthly: 149, annualTotal: 1430, annualMonthly: 119,
    priceIdMonthly: 'price_1TjRWjEw9od5qGxlAzYYrIqd',
    priceIdAnnual:  'price_1TjRXBEw9od5qGxlw0BvlHds',
    popular: false,
    features: ['Tout Pro','Multi-établissements','Tableau de bord consolidé','Accès équipe illimité','Support prioritaire'],
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
      { threshold: 0.07 }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      if (res.status === 401) { router.push(`/register?priceId=${encodeURIComponent(priceId)}`); return }
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
  const eyebrow = {
    display: 'inline-block' as const, padding: '5px 13px', borderRadius: '9999px',
    border: '1px solid #EAEAEA', fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#7798AB',
  }

  return (
    <>
      {/* Grain overlay */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 60, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />

      <style>{`
        html { scroll-behavior: smooth; }
        .fade-up {
          opacity: 0; transform: translateY(20px); filter: blur(3px);
          transition: opacity 0.8s ${CB}, transform 0.8s ${CB}, filter 0.8s ${CB};
        }
        .fade-up.visible { opacity: 1; transform: translateY(0); filter: blur(0); }
        .press:active { transform: scale(0.97); }
        .nav-link { color: #555; font-size: 13px; font-weight: 500; text-decoration: none; letter-spacing: 0.01em; transition: color 0.2s ease; }
        .nav-link:hover { color: #111; }
        .pill-btn-white { transition: background 0.3s ${CB}, color 0.3s ${CB}; }
        .pill-btn-white:hover { background: #7798AB !important; color: #fff !important; }
        @keyframes menuFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 767px) {
          .feature-split { grid-template-columns: 1fr !important; }
          .feature-rev .feat-visual { order: -1; }
          .stats-grid   { grid-template-columns: 1fr !important; }
          .stats-grid > div { border-right: none !important; border-bottom: 1px solid #EAEAEA; }
          .modules-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .photos-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .dl-row       { flex-direction: column !important; gap: 28px !important; }
        }
      `}</style>

      <div style={{ background: '#FFFFFF', fontFamily: "'SF Pro Text', 'Geist', system-ui, sans-serif", color: '#111111' }}>

        {/* ══ NAV — FLOATING ISLAND ═══════════════════════════════ */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '14px 20px' }}>
          <div style={{
            maxWidth: '1120px', margin: '0 auto',
            background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px)',
            borderRadius: '9999px',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.10)' : '0 2px 16px rgba(0,0,0,0.05)',
            transition: `all 0.5s ${CB}`,
            height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 8px 0 20px',
          }}>
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
              <Link href="/login" style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid #E2E2E2', fontSize: '12px', fontWeight: 600, color: '#333', textDecoration: 'none' }}>
                Connexion
              </Link>
              <Link href="/register" className="press" style={{ padding: '9px 18px', borderRadius: '9999px', background: '#111', fontSize: '12px', fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '0.03em' }}>
                Essai gratuit
              </Link>
            </div>
            <button className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: '8px', marginRight: '4px' }}
              onClick={() => setMenuOpen(v => !v)} aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>
              {menuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>
        </header>

        {/* Mobile overlay */}
        {menuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(28px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 32px 48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '48px' }}>
              {[{ href: '#fonctionnalites', label: 'Fonctionnalités' },{ href: '#tarifs', label: 'Tarifs' },{ href: '/contact', label: 'Contact' }].map((l,i) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '36px', fontWeight: 800, color: '#111', textDecoration: 'none', letterSpacing: '-0.03em', lineHeight: 1, animation: `menuFadeUp 0.45s ${CB} ${i*0.06}s both` }}>
                  {l.label}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: '14px', borderRadius: '9999px', border: '1.5px solid #E2E2E2', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#333', textDecoration: 'none' }}>Connexion</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ padding: '14px', borderRadius: '9999px', background: '#111', textAlign: 'center', fontWeight: 700, fontSize: '14px', color: '#fff', textDecoration: 'none' }}>Commencer gratuitement →</Link>
            </div>
          </div>
        )}

        <main>

          {/* ══ 1. HERO — split layout ═══════════════════════════════ */}
          <section style={{ background: '#FFFFFF', paddingTop: '110px', paddingBottom: '80px', borderBottom: '1px solid #EAEAEA' }}>
            <div className="feature-split" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

              {/* Text */}
              <div>
                <div className="fade-up" style={{ marginBottom: '24px' }}>
                  <span style={eyebrow}>Gestion restaurant · France</span>
                </div>
                <h1 className="fade-up" style={{
                  fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, color: '#111',
                  lineHeight: 1.06, letterSpacing: '-0.04em',
                  fontFamily: "'Georgia', serif",
                  marginBottom: '20px', textWrap: 'balance', transitionDelay: '0.07s',
                }}>
                  Gérez votre restaurant.<br />Enfin simplement.
                </h1>
                <p className="fade-up" style={{ fontSize: '17px', color: '#555', lineHeight: 1.65, marginBottom: '36px', transitionDelay: '0.13s', textWrap: 'balance', maxWidth: '460px' }}>
                  Moins de paperasse, plus de temps en cuisine. Dashboard, stocks, planning, comptabilité — tout en un.
                </p>
                <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px', transitionDelay: '0.18s' }}>
                  {[
                    'CA en temps réel et marges au quotidien',
                    'Planning HCR et stocks centralisés',
                    'FEC envoyé automatiquement à votre comptable',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={16} color="#7798AB" strokeWidth={2} />
                      <span style={{ fontSize: '14px', color: '#444' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', transitionDelay: '0.24s' }}>
                  <Link href="/register" className="press" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    background: '#111', color: '#FFF', borderRadius: '9999px', padding: '14px 24px',
                    fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textDecoration: 'none',
                    transition: `opacity 0.2s ease`,
                  }}>
                    Commencer gratuitement — 14j gratuits
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '9999px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>→</span>
                  </Link>
                  <a href="#tarifs" className="press" style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'transparent', color: '#111', borderRadius: '9999px', padding: '14px 22px',
                    fontSize: '13px', fontWeight: 600, border: '1.5px solid #D8D8D8', textDecoration: 'none',
                  }}>
                    Voir les tarifs
                  </a>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="fade-up" style={{ transitionDelay: '0.1s' }}>
                <DashboardMockup />
              </div>

            </div>
          </section>

          {/* ══ 2. STATS BAND ════════════════════════════════════════ */}
          <section style={{ background: '#FAFAFA', borderBottom: '1px solid #EAEAEA' }}>
            <div ref={statsRef} className="stats-grid" style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { value: 14,  suffix: ' jours', label: 'Essai gratuit, sans carte bancaire' },
                { value: 3,   suffix: ' min',   label: 'Pour configurer votre restaurant' },
                { value: 100, suffix: '%',      label: 'Données hébergées en France' },
              ].map((stat, i) => (
                <div key={i} className="fade-up" style={{ textAlign: 'center', padding: '32px 20px', borderRight: i < 2 ? '1px solid #EAEAEA' : 'none', transitionDelay: `${i*0.1}s` }}>
                  <div style={{ fontSize: 'clamp(44px, 6vw, 68px)', fontWeight: 800, color: '#111', lineHeight: 1, fontFamily: "'Georgia', serif", fontVariantNumeric: 'tabular-nums' }}>
                    <Counter target={stat.value} isVisible={statsVisible} />{stat.suffix}
                  </div>
                  <p style={{ fontSize: '13px', color: '#888', marginTop: '8px', lineHeight: 1.5 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 3. FEATURE — Dashboard ══════════════════════════════ */}
          <section id="fonctionnalites" style={{ background: '#FFFFFF', padding: '120px 24px', borderBottom: '1px solid #EAEAEA' }}>
            <div className="feature-split" style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
              <div>
                <div className="fade-up" style={{ marginBottom: '20px' }}>
                  <span style={eyebrow}>Dashboard</span>
                </div>
                <h2 className="fade-up" style={{ fontSize: 'clamp(28px, 3.8vw, 50px)', fontWeight: 800, color: '#111', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '24px', textWrap: 'balance', transitionDelay: '0.07s' }}>
                  Votre restaurant en un coup d&apos;œil
                </h2>
                <p className="fade-up" style={{ fontSize: '16px', color: '#555', lineHeight: 1.7, marginBottom: '32px', transitionDelay: '0.12s' }}>
                  Suivez votre chiffre d&apos;affaires en temps réel, vos marges et vos indicateurs clés. Plus besoin de croiser plusieurs fichiers pour savoir si votre journée est rentable.
                </p>
                <ul className="fade-up" style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '14px', transitionDelay: '0.17s' }}>
                  {[
                    'CA du jour, de la semaine et du mois comparés à votre objectif',
                    'Marge brute et ticket moyen calculés automatiquement',
                    'Alertes intelligentes quand un seuil critique est dépassé',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <ArrowRight size={15} color="#7798AB" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '14px', color: '#444', lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="fade-up" style={{ transitionDelay: '0.22s' }}>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#111', textDecoration: 'none', borderBottom: '1.5px solid #111', paddingBottom: '1px', transition: 'opacity 0.2s ease' }}>
                    Voir le dashboard en action
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
              <div className="fade-up" style={{ transitionDelay: '0.08s' }}>
                <DashboardMockup />
              </div>
            </div>
          </section>

          {/* ══ 4. FEATURE — Planning & Stocks ══════════════════════ */}
          <section style={{ background: '#F9F9F8', padding: '120px 24px', borderBottom: '1px solid #EAEAEA' }}>
            <div className="feature-split feature-rev" style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
              <div className="fade-up feat-visual" style={{ transitionDelay: '0.08s' }}>
                <PlanningMockup />
              </div>
              <div>
                <div className="fade-up" style={{ marginBottom: '20px' }}>
                  <span style={eyebrow}>Planning & Stocks</span>
                </div>
                <h2 className="fade-up" style={{ fontSize: 'clamp(28px, 3.8vw, 50px)', fontWeight: 800, color: '#111', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '24px', textWrap: 'balance', transitionDelay: '0.07s' }}>
                  Planifiez, gérez, ne subissez plus
                </h2>
                <p className="fade-up" style={{ fontSize: '16px', color: '#555', lineHeight: 1.7, marginBottom: '32px', transitionDelay: '0.12s' }}>
                  Planning du personnel conforme à la législation HCR et gestion des stocks en un seul endroit. Fini les tableaux Excel, les erreurs et les ruptures de dernière minute.
                </p>
                <ul className="fade-up" style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '14px', transitionDelay: '0.17s' }}>
                  {[
                    'Planning semaine conforme HCR, exports PDF pour votre équipe',
                    'Gestion des congés, absences et remplacements intégrée',
                    'Alertes stock automatiques avant rupture, valorisation en temps réel',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <ArrowRight size={15} color="#7798AB" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '14px', color: '#444', lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="fade-up" style={{ transitionDelay: '0.22s' }}>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#111', textDecoration: 'none', borderBottom: '1.5px solid #111', paddingBottom: '1px' }}>
                    Essayer le planning
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ══ 5. FEATURE — FEC & Caisses ══════════════════════════ */}
          <section style={{ background: '#FFFFFF', padding: '120px 24px', borderBottom: '1px solid #EAEAEA' }}>
            <div className="feature-split" style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
              <div>
                <div className="fade-up" style={{ marginBottom: '20px' }}>
                  <span style={eyebrow}>Comptabilité & Caisses</span>
                </div>
                <h2 className="fade-up" style={{ fontSize: 'clamp(28px, 3.8vw, 50px)', fontWeight: 800, color: '#111', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '24px', textWrap: 'balance', transitionDelay: '0.07s' }}>
                  La comptabilité, sans effort
                </h2>
                <p className="fade-up" style={{ fontSize: '16px', color: '#555', lineHeight: 1.7, marginBottom: '32px', transitionDelay: '0.12s' }}>
                  Générez votre fichier FEC conforme DGFiP en un clic et envoyez-le automatiquement à votre expert-comptable. Vos données de caisse remontent en temps réel.
                </p>
                <ul className="fade-up" style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '14px', transitionDelay: '0.17s' }}>
                  {[
                    'Fichier FEC généré automatiquement, conforme article L13 AA LPF',
                    'Envoi direct à votre expert-comptable par email',
                    'Connexion Lightspeed, Tiller, Zelty et scan factures IA (OCR)',
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <ArrowRight size={15} color="#7798AB" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '14px', color: '#444', lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="fade-up" style={{ transitionDelay: '0.22s' }}>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#111', textDecoration: 'none', borderBottom: '1.5px solid #111', paddingBottom: '1px' }}>
                    Configurer mon comptable
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
              <div className="fade-up" style={{ transitionDelay: '0.08s' }}>
                <FECMockup />
              </div>
            </div>
          </section>

          {/* ══ 6. MODULES GRID ══════════════════════════════════════ */}
          <section style={{ background: '#F9F9F8', padding: '120px 24px', borderBottom: '1px solid #EAEAEA' }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
              <div style={{ maxWidth: '640px', marginBottom: '64px' }}>
                <div className="fade-up" style={{ marginBottom: '20px' }}>
                  <span style={eyebrow}>Modules</span>
                </div>
                <h2 className="fade-up" style={{ fontSize: 'clamp(28px, 3.8vw, 50px)', fontWeight: 800, color: '#111', letterSpacing: '-0.035em', lineHeight: 1.1, textWrap: 'balance', transitionDelay: '0.07s' }}>
                  Tout ce dont vous avez besoin, dans une seule app
                </h2>
              </div>
              <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#EAEAEA' }}>
                {[
                  { Icon: BarChart2, title: 'Dashboard',   desc: 'CA en temps réel, marges et indicateurs clés au quotidien.',          detail: 'CA · Marge · KPIs' },
                  { Icon: Package,   title: 'Stocks',      desc: 'Alertes automatiques, valorisation et suivi des entrées/sorties.',     detail: 'Alertes · Inventaire' },
                  { Icon: Calendar,  title: 'Planning',    desc: 'Conforme HCR, gestion des congés et exports planning PDF.',            detail: 'HCR · PDF · Absences' },
                  { Icon: FileText,  title: 'FEC',         desc: 'Export comptable en un clic, conforme à la législation française.',    detail: 'DGFiP · L13 AA LPF' },
                  { Icon: Link2,     title: 'Caisses',     desc: 'Connexion Lightspeed, Tiller, Zelty et autres systèmes de caisse.',   detail: 'Lightspeed · Tiller · Zelty' },
                  { Icon: Cpu,       title: 'Factures IA', desc: 'Scan automatique OCR, extraction et classement des factures.',         detail: 'OCR · IA · Classement' },
                ].map(({ Icon, title, desc, detail }, i) => (
                  <div key={title} className="fade-up" style={{ background: '#FFFFFF', padding: '36px 32px', transitionDelay: `${i*0.07}s` }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: '#EFF3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                      <Icon size={21} color="#7798AB" strokeWidth={1.75} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111', marginBottom: '8px', letterSpacing: '-0.02em' }}>{title}</h3>
                    <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.7, marginBottom: '16px' }}>{desc}</p>
                    <p style={{ fontSize: '10px', color: '#7798AB', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 7. TÉLÉCHARGEMENT ════════════════════════════════════ */}
          <section style={{ background: '#111111', padding: '96px 24px' }}>
            <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
              <div className="fade-up" style={{ marginBottom: '16px' }}>
                <span style={{ display: 'inline-block', padding: '5px 13px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  Application desktop
                </span>
              </div>
              <h2 className="fade-up" style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#FFF', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '16px', transitionDelay: '0.07s' }}>
                Mac & Windows
              </h2>
              <p className="fade-up" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginBottom: '52px', lineHeight: 1.65, transitionDelay: '0.12s' }}>
                Accédez à PilotResto depuis votre bureau. Toutes les fonctionnalités, hors connexion compatible.
              </p>
              <div className="fade-up dl-row" style={{ display: 'flex', gap: '40px', justifyContent: 'center', transitionDelay: '0.16s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>macOS · M1 / M2 / M3</span>
                  <a href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0-arm64.dmg"
                    className="press pill-btn-white"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#FFF', color: '#111', borderRadius: '9999px', padding: '13px 30px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    Télécharger
                  </a>
                  <a href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto-1.0.0.dmg"
                    style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', textDecoration: 'underline' }}>Mac Intel</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Windows 10 / 11</span>
                  <a href="https://github.com/Charles31200/pilotresto-desktop/releases/download/v1.0.0/PilotResto.Setup.1.0.0.exe"
                    className="press pill-btn-white"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#FFF', color: '#111', borderRadius: '9999px', padding: '13px 30px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.801"/></svg>
                    Télécharger
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ══ 8. TARIFS ════════════════════════════════════════════ */}
          <section id="tarifs" style={{ background: '#FFFFFF', padding: '120px 24px', borderTop: '1px solid #EAEAEA' }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
              <div style={{ maxWidth: '560px', marginBottom: '56px' }}>
                <div className="fade-up" style={{ marginBottom: '20px' }}>
                  <span style={eyebrow}>Tarifs</span>
                </div>
                <h2 className="fade-up" style={{ fontSize: 'clamp(28px, 3.8vw, 50px)', fontWeight: 800, color: '#111', letterSpacing: '-0.035em', lineHeight: 1.1, transitionDelay: '0.07s' }}>
                  Simple. Transparent. Sans surprise.
                </h2>
              </div>

              {/* Toggle */}
              <div className="fade-up" style={{ display: 'flex', marginBottom: '48px' }}>
                <div style={{ display: 'flex', background: '#F0F0F0', borderRadius: '9999px', padding: '3px', gap: '3px' }}>
                  {(['Mensuel', 'Annuel (−20%)'] as const).map((label, i) => {
                    const active = i === (isAnnual ? 1 : 0)
                    return (
                      <button key={label} onClick={() => setIsAnnual(i === 1)} className="press"
                        style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: active ? '#111' : 'transparent', color: active ? '#FFF' : '#888', transition: `all 0.28s ${CB}` }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {checkoutError && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '24px' }}>{checkoutError}</p>}

              <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#EAEAEA' }}>
                {PLANS.map((plan, i) => {
                  const priceId   = isAnnual ? plan.priceIdAnnual  : plan.priceIdMonthly
                  const isLoading = checkoutLoading === priceId
                  return (
                    <div key={plan.id} className="fade-up" style={{ background: plan.popular ? '#111' : '#FFF', padding: '44px 36px', position: 'relative', transitionDelay: `${i*0.1}s`, display: 'flex', flexDirection: 'column' }}>
                      {plan.popular && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#7798AB' }} />}
                      {plan.popular && (
                        <div style={{ position: 'absolute', top: '28px', right: '28px', background: '#7798AB', color: '#FFF', fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '9999px' }}>
                          Populaire
                        </div>
                      )}
                      <h3 style={{ fontSize: '11px', fontWeight: 700, color: plan.popular ? 'rgba(255,255,255,0.38)' : '#999', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>{plan.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: 'clamp(44px, 5vw, 60px)', fontWeight: 800, color: plan.popular ? '#FFF' : '#111', lineHeight: 1, fontFamily: "'Georgia', serif", fontVariantNumeric: 'tabular-nums' }}>
                          {isAnnual ? plan.annualMonthly : plan.monthly}€
                        </span>
                        <span style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.35)' : '#C0C0C0' }}>/mois</span>
                      </div>
                      <p style={{ fontSize: '12px', color: plan.popular ? 'rgba(255,255,255,0.25)' : '#C8C8C8', marginBottom: '36px', minHeight: '18px' }}>
                        {isAnnual ? `${plan.annualTotal}€ / an` : 'Facturé mensuellement'}
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                        {plan.features.map(f => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.72)' : '#444', lineHeight: 1.55 }}>
                            <span style={{ color: '#7798AB', flexShrink: 0, fontWeight: 700, marginTop: '1px' }}>✓</span>{f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleCheckout(priceId)} disabled={!!checkoutLoading} className="press"
                        style={{ marginTop: '32px', width: '100%', padding: '13px', borderRadius: '9999px', border: plan.popular ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid #111', background: plan.popular ? 'rgba(255,255,255,0.07)' : '#111', color: '#FFF', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: checkoutLoading ? 'not-allowed' : 'pointer', opacity: checkoutLoading && !isLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: `all 0.25s ${CB}` }}>
                        {isLoading && <Loader2 size={13} className="animate-spin" />}
                        S&apos;inscrire — 14j gratuits
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ══ 9. CTA FINAL ══════════════════════════════════════════ */}
          <section style={{ background: '#111', padding: '120px 24px' }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
              <h2 className="fade-up" style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800, color: '#FFF', lineHeight: 1.08, letterSpacing: '-0.04em', fontFamily: "'Georgia', serif", marginBottom: '24px', textWrap: 'balance' }}>
                Prêt à reprendre le contrôle ?
              </h2>
              <p className="fade-up" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.48)', marginBottom: '44px', lineHeight: 1.7, transitionDelay: '0.09s' }}>
                14 jours gratuits, sans carte bancaire. Configuration en 3 minutes.
              </p>
              <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', transitionDelay: '0.17s' }}>
                <Link href="/register" className="press" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#FFF', color: '#111', borderRadius: '9999px', padding: '15px 28px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textDecoration: 'none' }}>
                  Commencer gratuitement
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '9999px', background: 'rgba(0,0,0,0.07)', flexShrink: 0 }}>→</span>
                </Link>
                <Link href="/contact" className="press" style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#FFF', borderRadius: '9999px', padding: '15px 28px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', border: '1.5px solid rgba(255,255,255,0.28)', textDecoration: 'none' }}>
                  Contacter l&apos;équipe
                </Link>
              </div>
            </div>
          </section>

        </main>

        {/* ══ FOOTER ════════════════════════════════════════════════ */}
        <footer style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px 44px' }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', gap: '44px', marginBottom: '56px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon.png" alt="PilotResto" style={{ height: '26px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#FFF', letterSpacing: '-0.03em' }}>PilotResto</span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, maxWidth: '210px' }}>
                  La gestion de restaurant, enfin simple et centralisée.
                </p>
              </div>
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
                    <Link href="/contact"                        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>Nous écrire</Link>
                    <a href="mailto:charles.lecussan@gmail.com" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>charles.lecussan@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.16)' }}>© 2026 PilotResto</p>
              <a href="https://instagram.com/restopilot" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.26)', textDecoration: 'none' }}>Instagram</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
