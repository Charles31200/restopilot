'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

// ─── FAQ Accordion ────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="w-full text-left py-5 flex justify-between items-center gap-4 font-semibold text-gray-900 text-base"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        {open
          ? <ChevronUp className="w-5 h-5 flex-shrink-0 text-gray-400" />
          : <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
        }
      </button>
      {open && (
        <p className="pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

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

// ─── Apple icon SVG ──────────────────────────────────────────
function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-167.2-140.9c-52.3-88.2-87.5-231.7-87.5-375.8 0-231.9 151.6-354.3 300.5-354.3 79.7 0 145.9 52.3 195.4 52.3 47.5 0 122.4-55.5 210.9-55.5zm-105.9-157.1c-37.5 0-94.4-26.1-131.9-60.7-33.6-31.1-65.8-81.5-65.8-131.9 0-6.4.6-12.9 1.9-19.4 0-6.4 0-12.9-1.9-19.4 35.6-.9 96.1 34.9 135.9 74.3 33.6 33.6 60 83.5 60 131.9z"/>
    </svg>
  )
}

// ─── Star SVG ────────────────────────────────────────────────
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="#B8962E" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen]         = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  // Redirige vers /login si l'utilisateur est dans l'app Electron
  useEffect(() => {
    if (navigator.userAgent.includes('Electron')) {
      router.replace('/login')
    }
  }, [router])

  // Effet header scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Animations fade-up au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Déclenchement des compteurs stats
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF', fontFamily: 'var(--font-body, system-ui)' }}>

      {/* ══ 1. HEADER STICKY ══════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background:     scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(8px)'              : 'none',
          boxShadow:      scrolled ? '0 1px 16px rgba(27,42,74,0.08)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '36px', width: 'auto' }} />
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: scrolled ? '#1B2A4A' : 'white', fontFamily: 'var(--font-display, system-ui)' }}
            >
              PilotResto
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '#fonctionnalites', label: 'Fonctionnalités' },
              { href: '/pricing',         label: 'Tarifs' },
              { href: '/contact',         label: 'Contact' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:opacity-100"
                style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.82)' }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl border transition-all"
              style={{
                color:       scrolled ? '#1B2A4A' : 'white',
                borderColor: scrolled ? 'rgba(27,42,74,0.3)' : 'rgba(255,255,255,0.45)',
              }}
            >
              Se connecter
            </Link>
            <Link
              href="/contact"
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: '#B8962E', color: 'white', boxShadow: '0 2px 12px rgba(184,150,46,0.4)' }}
            >
              Demander une démo
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: scrolled ? '#1B2A4A' : 'white' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <div className="md:hidden border-t" style={{ background: '#1B2A4A', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="px-5 py-5 flex flex-col gap-4">
              {[
                { href: '#fonctionnalites', label: 'Fonctionnalités' },
                { href: '/pricing',         label: 'Tarifs' },
                { href: '/contact',         label: 'Contact' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-medium text-base py-1"
                  style={{ color: 'rgba(255,255,255,0.82)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Link
                  href="/login"
                  className="text-center py-3 rounded-xl border text-white font-semibold text-sm"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Se connecter
                </Link>
                <Link
                  href="/contact"
                  className="text-center py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: '#B8962E' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Demander une démo
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ 2. HERO ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay navy */}
        <div className="absolute inset-0" style={{ background: 'rgba(27,42,74,0.78)' }} />

        {/* Contenu */}
        <div className="relative z-10 text-center px-5 sm:px-6 max-w-4xl mx-auto pt-24">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold mb-8 fade-up"
            style={{ background: 'rgba(184,150,46,0.2)', color: '#F5C46A', border: '1px solid rgba(184,150,46,0.4)' }}
          >
            ✨ Logiciel de gestion #1 pour indépendants
          </div>

          {/* Titre */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight fade-up"
            style={{ fontFamily: 'var(--font-display, system-ui)', transitionDelay: '0.1s' }}
          >
            Gérez votre restaurant.<br />Enfin simplement.
          </h1>

          {/* Sous-titre */}
          <p
            className="text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed fade-up"
            style={{ color: 'rgba(255,255,255,0.75)', transitionDelay: '0.2s' }}
          >
            PilotResto centralise stocks, planning et comptabilité en une seule plateforme.
            Essai gratuit 14 jours.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-up" style={{ transitionDelay: '0.3s' }}>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold rounded-2xl px-8 py-4 text-base transition-all active:scale-95"
              style={{ background: '#B8962E', color: 'white', boxShadow: '0 4px 24px rgba(184,150,46,0.45)' }}
            >
              Demander une démo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold rounded-2xl px-8 py-4 text-base text-white border-2 transition-all hover:bg-white/10 active:scale-95"
              style={{ borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Voir les tarifs
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ opacity: 0.5 }}>
          <div className="w-px h-8 bg-white animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </section>

      {/* ══ 3. TÉLÉCHARGEMENT APP ═════════════════════════════════ */}
      <section className="py-16 sm:py-20" style={{ background: '#FFFFFF' }}>
        <div className="max-w-xl mx-auto px-5 sm:px-6 text-center fade-up">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-6"
            style={{ background: '#EFF6FF', color: '#1B2A4A' }}
          >
            🖥️ Application desktop Mac
          </div>
          <h2
            className="text-2xl sm:text-3xl font-extrabold mb-3"
            style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Disponible sur Mac
          </h2>
          <p className="text-gray-500 text-base mb-8 leading-relaxed">
            Téléchargez l&rsquo;application PilotResto et gérez votre restaurant
            depuis votre ordinateur.
          </p>
          <a
            href="/downloads/PilotResto.dmg"
            download
            className="inline-flex items-center justify-center gap-3 font-bold rounded-2xl px-8 py-4 text-base transition-all active:scale-95 mb-4"
            style={{ background: '#111827', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}
          >
            <AppleIcon size={20} />
            ⬇ Télécharger pour Mac (.dmg)
          </a>
          <p className="text-xs text-gray-400 mt-3">Gratuit · macOS 10.13+ · 90 Mo</p>
        </div>
      </section>

      {/* ══ 4. PROBLÈME ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: '#F8F9FB' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12 fade-up">
            <h2
              className="text-2xl sm:text-4xl font-extrabold leading-tight"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Les restaurateurs perdent 2h/jour<br className="hidden sm:block" /> en gestion administrative
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '😓', text: 'Les tableurs Excel ne sont pas faits pour gérer un restaurant' },
              { icon: '🗂️', text: 'Les données éparpillées entre 5 outils différents' },
              { icon: '⏰', text: 'Du temps perdu en admin = moins de temps en cuisine' },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up bg-white rounded-2xl p-6 border border-gray-200 text-center"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span style={{ fontSize: '40px' }}>{item.icon}</span>
                <p className="mt-4 text-gray-700 font-medium text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. STATS ══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-6" ref={statsRef}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: 14,  suffix: ' jours', label: 'Essai gratuit' },
              { value: 3,   suffix: ' min',   label: 'Pour démarrer' },
              { value: 100, suffix: '%',      label: 'Données sécurisées' },
            ].map((stat, i) => (
              <div key={i} className="fade-up" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div
                  className="text-5xl font-extrabold mb-2 tabular-nums"
                  style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
                >
                  <Counter target={stat.value} isVisible={statsVisible} />
                  {stat.suffix}
                </div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. FONCTIONNALITÉS ═══════════════════════════════════ */}
      <section id="fonctionnalites" className="py-16 sm:py-24" style={{ background: '#F8F9FB' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12 fade-up">
            <h2
              className="text-2xl sm:text-4xl font-extrabold"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Tout ce dont vous avez besoin
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '📊', title: 'Dashboard',    desc: 'CA en temps réel, marges et indicateurs clés au quotidien.' },
              { icon: '📦', title: 'Stocks',       desc: 'Alertes automatiques, valorisation et suivi des entrées/sorties.' },
              { icon: '👥', title: 'Planning',     desc: 'Conforme HCR, gestion des congés et exports planning PDF.' },
              { icon: '📄', title: 'FEC',          desc: 'Export comptable en un clic, compatible avec tous les logiciels.' },
              { icon: '🔗', title: 'Caisses',      desc: 'Connexion Lightspeed, Tiller, Zelty et synchronisation auto.' },
              { icon: '🧾', title: 'Factures IA',  desc: 'Scan automatique OCR, extraction et catégorisation intelligente.' },
            ].map((feat, i) => (
              <div
                key={i}
                className="fade-up bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <span style={{ fontSize: '32px' }}>{feat.icon}</span>
                <h3 className="font-bold text-gray-900 mt-3 mb-1.5 text-base">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. COMMENT ÇA MARCHE ══════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12 fade-up">
            <h2
              className="text-2xl sm:text-4xl font-extrabold"
              style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
            >
              Comment ça marche ?
            </h2>
          </div>
          <div className="space-y-5">
            {[
              { n: '1', title: 'Téléchargez l\'application', detail: '2 min' },
              { n: '2', title: 'Configurez votre restaurant', detail: '3 min' },
              { n: '3', title: 'Pilotez en temps réel',       detail: 'Dès maintenant' },
            ].map((step, i) => (
              <div
                key={i}
                className="fade-up flex items-center gap-5 p-6 rounded-2xl border border-gray-100 bg-gray-50/50"
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-xl text-white"
                  style={{ background: '#1B2A4A' }}
                >
                  {step.n}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#B8962E' }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. RÉASSURANCE ════════════════════════════════════════ */}
      <section className="py-12 sm:py-16" style={{ background: '#F8F9FB' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🔒', text: 'Données hébergées en France' },
              { icon: '🇫🇷', text: 'Conçu pour la restauration française' },
              { icon: '📞', text: 'Support 24-48h par email' },
              { icon: '✅', text: 'Conforme RGPD' },
            ].map((b, i) => (
              <div
                key={i}
                className="fade-up bg-white rounded-2xl p-5 text-center border border-gray-100"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span style={{ fontSize: '28px' }}>{b.icon}</span>
                <p className="text-xs font-semibold text-gray-700 mt-2 leading-snug">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. TÉMOIGNAGE ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: '#1B2A4A' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center fade-up">
          <div className="flex justify-center gap-1 mb-8">
            {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
          </div>
          <blockquote
            className="text-white text-lg sm:text-2xl font-medium leading-relaxed mb-8"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            &ldquo;PilotResto nous a fait gagner 2h par jour. Le planning et les stocks
            en un seul endroit, c&rsquo;est exactement ce dont on avait besoin.&rdquo;
          </blockquote>
          <p className="font-semibold text-white text-sm">Pierre M.</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Restaurant Le Comptoir, Lyon
          </p>
        </div>
      </section>

      {/* ══ 10. FAQ ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: '#FFFFFF' }}>
        <div className="max-w-2xl mx-auto px-5 sm:px-6 fade-up">
          <h2
            className="text-2xl sm:text-4xl font-extrabold text-center mb-12"
            style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Questions fréquentes
          </h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-200">
            <div className="px-6">
              <FAQItem
                q="Dois-je installer quelque chose ?"
                a="Oui, téléchargez l'application Mac gratuitement depuis ce site. L'installation prend moins de 2 minutes."
              />
              <FAQItem
                q="Puis-je annuler à tout moment ?"
                a="Oui, sans engagement depuis votre espace client. Aucuns frais de résiliation."
              />
              <FAQItem
                q="Mes données sont-elles sécurisées ?"
                a="Oui, chiffrées (TLS + AES-256) et hébergées sur des serveurs européens, conformément au RGPD."
              />
              <FAQItem
                q="Sur quels appareils fonctionne PilotResto ?"
                a="Mac (application desktop) et navigateur web (Chrome, Safari, Firefox)."
              />
              <FAQItem
                q="Que se passe-t-il après 14 jours ?"
                a="Vous choisissez un plan ou votre accès est suspendu sans frais. Aucun débit automatique."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 11. CTA FINAL ════════════════════════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: '#B8962E' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center fade-up">
          <h2
            className="text-2xl sm:text-5xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-display, system-ui)' }}
          >
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-white/75 text-base sm:text-lg mb-10 max-w-lg mx-auto">
            Téléchargez l&rsquo;app Mac ou demandez une démo personnalisée.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/downloads/PilotResto.dmg"
              download
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold bg-white transition hover:bg-white/90 active:scale-95 shadow-lg"
              style={{ color: '#1B2A4A', borderRadius: '12px', padding: '18px 40px', fontSize: '16px', minHeight: '56px' }}
            >
              <AppleIcon size={18} />
              Télécharger pour Mac
            </a>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold border-2 text-white transition hover:bg-white/10 active:scale-95"
              style={{ borderColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '18px 40px', fontSize: '16px', minHeight: '56px' }}
            >
              Demander une démo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 12. FOOTER ═══════════════════════════════════════════ */}
      <footer style={{ background: '#1B2A4A' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '28px', width: 'auto' }} />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              © 2026 PilotResto — restopilot.pro
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <Link href="/cgu-cgv"                     className="hover:text-white/60 transition-colors">CGU / CGV</Link>
            <Link href="/politique-de-confidentialite" className="hover:text-white/60 transition-colors">Confidentialité</Link>
            <Link href="/contact"                      className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
