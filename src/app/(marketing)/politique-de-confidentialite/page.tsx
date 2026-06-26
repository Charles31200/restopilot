'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUp } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface TocItem { id: string; label: string }

// ── Constants ──────────────────────────────────────────────────────

const TOC: TocItem[] = [
  { id: 'art1',  label: 'Responsable du traitement' },
  { id: 'art2',  label: 'Données collectées et finalités' },
  { id: 'art3',  label: 'Base légale des traitements' },
  { id: 'art4',  label: 'Durée de conservation' },
  { id: 'art5',  label: 'Partage des données' },
  { id: 'art6',  label: 'Vos droits RGPD' },
  { id: 'art7',  label: 'Sécurité' },
  { id: 'art8',  label: 'Transferts hors UE' },
  { id: 'art9',  label: 'Cookies' },
  { id: 'art10', label: 'Contact' },
]

// ── Helpers ────────────────────────────────────────────────────────

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Sub-components ─────────────────────────────────────────────────

function ArticleTitle({ id, n, title }: { id: string; n: number; title: string }) {
  return (
    <div id={id} className="mb-5 scroll-mt-24">
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
      >
        {n}. {title}
      </h2>
      <div className="h-0.5 w-12 rounded-full" style={{ background: '#D4952A' }} />
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 mb-1.5">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D4952A' }} />
      <span>{children}</span>
    </li>
  )
}

// ── Page ───────────────────────────────────────────────────────────

export default function PolitiqueConfidentialitePage() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 500)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const textStyle = { color: '#444444', fontSize: '15px', lineHeight: '1.8' }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">

        {/* ── Retour ───────────────────────────────────────────── */}
        <a
          href="/landing"
          className="inline-flex items-center gap-2 text-sm font-medium mb-10 transition-colors"
          style={{ color: '#8896A8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1B2A4A')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&rsquo;accueil
        </a>

        {/* ── En-tête ───────────────────────────────────────────── */}
        <div className="mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
            style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Politique de confidentialité
          </h1>
          <span
            className="inline-block text-sm font-semibold rounded-full px-4 py-1.5"
            style={{ background: 'rgba(212,149,42,0.12)', color: '#B8962E' }}
          >
            Version en vigueur au 24 juin 2026
          </span>
        </div>

        {/* ── Table des matières ───────────────────────────────── */}
        <div
          className="rounded-2xl p-6 sm:p-7 mb-12"
          style={{ background: '#F8F9FB', border: '1px solid #E8ECF2' }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-widest mb-4"
            style={{ color: '#D4952A' }}
          >
            Table des matières
          </h2>
          <ol className="space-y-2">
            {TOC.map((item, i) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className="text-left text-sm transition-colors hover:underline"
                  style={{ color: '#1B2A4A' }}
                >
                  {i + 1}. {item.label}
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Articles ─────────────────────────────────────────── */}
        <div className="space-y-12">

          {/* Article 1 */}
          <section>
            <ArticleTitle id="art1" n={1} title="Responsable du traitement" />
            <div className="pl-4 border-l-2 space-y-1" style={{ borderColor: '#D4952A', ...textStyle }}>
              <p><strong style={{ color: '#1B2A4A' }}>Charles LECUSSAN</strong></p>
              <p>54 rue du Cailloux Gris, 31200 Toulouse, France</p>
              <p>
                Email : <a href="mailto:charles.lecussan@gmail.com" className="underline" style={{ color: '#D4952A' }}>
                  charles.lecussan@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Article 2 */}
          <section>
            <ArticleTitle id="art2" n={2} title="Données collectées et finalités" />

            <div className="space-y-6" style={textStyle}>
              <div>
                <p className="font-semibold mb-2" style={{ color: '#1B2A4A' }}>2.1 Données d&rsquo;identité</p>
                <p className="mb-2">Prénom, nom, adresse email, nom du restaurant, adresse, SIRET (facultatif), téléphone (si formulaire de contact).</p>
                <p><em>Finalité :</em> gestion du compte, facturation et communication.</p>
              </div>

              <div>
                <p className="font-semibold mb-2" style={{ color: '#1B2A4A' }}>2.2 Données de gestion</p>
                <p className="mb-2">Ventes, stocks, planning, comptabilité, fiches techniques, menus, employés — toutes les données saisies dans PilotResto.</p>
                <p><em>Finalité :</em> fourniture du service PilotResto. Ces données sont la propriété exclusive du client.</p>
              </div>

              <div>
                <p className="font-semibold mb-2" style={{ color: '#1B2A4A' }}>2.3 Données de paiement</p>
                <p>Traitées exclusivement par Stripe. Aucune donnée bancaire n&rsquo;est stockée par PilotResto.</p>
              </div>

              <div>
                <p className="font-semibold mb-2" style={{ color: '#1B2A4A' }}>2.4 Données de connexion</p>
                <p>Adresse IP, type de navigateur, date et heure d&rsquo;accès. Aucun cookie de tracking ou publicitaire n&rsquo;est utilisé.</p>
              </div>
            </div>
          </section>

          {/* Article 3 */}
          <section>
            <ArticleTitle id="art3" n={3} title="Base légale des traitements" />
            <ul className="list-none space-y-0" style={textStyle}>
              <Li><strong style={{ color: '#1B2A4A' }}>Exécution du contrat (art. 6.1.b RGPD)</strong> — gestion du compte, fourniture du service, facturation</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Intérêt légitime (art. 6.1.f RGPD)</strong> — sécurité de la plateforme, amélioration des fonctionnalités</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Consentement (art. 6.1.a RGPD)</strong> — envoi d&rsquo;emails promotionnels ponctuels</Li>
            </ul>
          </section>

          {/* Article 4 */}
          <section>
            <ArticleTitle id="art4" n={4} title="Durée de conservation" />
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8ECF2' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1B2A4A', color: 'white' }}>
                    <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                    <th className="px-4 py-3 text-left font-semibold">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Compte actif',             dur: 'Pendant toute la durée de l\'abonnement' },
                    { cat: 'Après résiliation',         dur: 'Suppression après 30 jours' },
                    { cat: 'Données de facturation',    dur: '10 ans (obligation légale)' },
                    { cat: 'Données de connexion',      dur: '12 mois' },
                  ].map((row, i) => (
                    <tr key={row.cat} style={{ background: i % 2 === 0 ? 'white' : '#F8F9FB', color: '#444' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1B2A4A' }}>{row.cat}</td>
                      <td className="px-4 py-3">{row.dur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Article 5 */}
          <section>
            <ArticleTitle id="art5" n={5} title="Partage des données" />
            <p style={textStyle} className="mb-4">
              Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales. Elles sont uniquement partagées avec nos sous-traitants techniques dans le cadre de la fourniture du service :
            </p>
            <ul className="list-none space-y-0" style={textStyle}>
              <Li>
                <strong style={{ color: '#1B2A4A' }}>Supabase</strong> (base de données &amp; authentification) —{' '}
                <a href="https://supabase.com/privacy" className="underline" style={{ color: '#D4952A' }}>supabase.com/privacy</a>
              </Li>
              <Li>
                <strong style={{ color: '#1B2A4A' }}>Vercel</strong> (hébergement de l&rsquo;application) —{' '}
                <a href="https://vercel.com/legal/privacy" className="underline" style={{ color: '#D4952A' }}>vercel.com/legal/privacy</a>
              </Li>
              <Li>
                <strong style={{ color: '#1B2A4A' }}>Stripe</strong> (paiement, certifié PCI-DSS) —{' '}
                <a href="https://stripe.com/fr/privacy" className="underline" style={{ color: '#D4952A' }}>stripe.com/fr/privacy</a>
              </Li>
              <Li>
                <strong style={{ color: '#1B2A4A' }}>Resend</strong> (envoi d&rsquo;emails transactionnels) —{' '}
                <a href="https://resend.com/privacy" className="underline" style={{ color: '#D4952A' }}>resend.com/privacy</a>
              </Li>
            </ul>
          </section>

          {/* Article 6 */}
          <section>
            <ArticleTitle id="art6" n={6} title="Vos droits RGPD" />
            <p style={textStyle} className="mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
            </p>
            <ul className="list-none space-y-0 mb-4" style={textStyle}>
              <Li><strong style={{ color: '#1B2A4A' }}>Droit d&rsquo;accès</strong> — obtenir une copie de vos données personnelles</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Droit de rectification</strong> — corriger des données inexactes</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Droit à l&rsquo;effacement</strong> — supprimer vos données (&laquo;&nbsp;droit à l&rsquo;oubli&nbsp;&raquo;)</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Droit d&rsquo;opposition</strong> — s&rsquo;opposer à certains traitements</Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Retrait du consentement</strong> — pour les traitements fondés sur le consentement</Li>
            </ul>
            <p style={textStyle} className="mb-3">
              Pour exercer vos droits : <a href="mailto:charles.lecussan@gmail.com" className="underline" style={{ color: '#D4952A' }}>charles.lecussan@gmail.com</a> (réponse sous 30 jours).
            </p>
            <p style={textStyle}>
              En cas de réclamation non résolue, vous pouvez saisir la CNIL :{' '}
              <a href="https://www.cnil.fr" className="underline" style={{ color: '#D4952A' }}>www.cnil.fr</a>
            </p>
          </section>

          {/* Article 7 */}
          <section>
            <ArticleTitle id="art7" n={7} title="Sécurité" />
            <ul className="list-none space-y-0" style={textStyle}>
              <Li>Chiffrement HTTPS/TLS pour toutes les communications en transit</Li>
              <Li>Données chiffrées au repos sur l&rsquo;infrastructure Supabase (certifiée ISO 27001)</Li>
              <Li>Hébergement en Europe</Li>
              <Li>Aucun cookie de tracking ou publicitaire</Li>
              <Li>Notification aux personnes concernées en cas de violation de données sous 72h (art. 34 RGPD)</Li>
            </ul>
          </section>

          {/* Article 8 */}
          <section>
            <ArticleTitle id="art8" n={8} title="Transferts hors UE" />
            <p style={textStyle}>
              Vercel et Stripe sont des entreprises basées aux États-Unis. Ces transferts de données hors de l&rsquo;Union Européenne sont encadrés par des clauses contractuelles types (art. 46 RGPD) et le cadre EU-US Data Privacy Framework, garantissant un niveau de protection adéquat.
            </p>
          </section>

          {/* Article 9 */}
          <section>
            <ArticleTitle id="art9" n={9} title="Cookies" />
            <p style={textStyle} className="mb-3">
              PilotResto utilise uniquement des cookies strictement nécessaires :
            </p>
            <ul className="list-none space-y-0 mb-4" style={textStyle}>
              <Li>Cookies d&rsquo;authentification (maintien de la session)</Li>
              <Li>Cookies de sécurité CSRF</Li>
            </ul>
            <p style={textStyle}>
              Aucun cookie publicitaire, analytique ou de tracking tiers n&rsquo;est utilisé. Aucun bandeau de consentement n&rsquo;est requis.
            </p>
          </section>

          {/* Article 10 */}
          <section>
            <ArticleTitle id="art10" n={10} title="Contact" />
            <div className="pl-4 border-l-2 space-y-1" style={{ borderColor: '#D4952A', ...textStyle }}>
              <p><strong style={{ color: '#1B2A4A' }}>Charles LECUSSAN</strong></p>
              <p>
                Email : <a href="mailto:charles.lecussan@gmail.com" className="underline" style={{ color: '#D4952A' }}>
                  charles.lecussan@gmail.com
                </a>
              </p>
              <p>
                Site : <a href="https://restopilot.pro" className="underline" style={{ color: '#D4952A' }}>
                  https://restopilot.pro
                </a>
              </p>
            </div>
          </section>

          {/* Contact card */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#F8F9FB', border: '1px solid #E8ECF2' }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: '#1B2A4A' }}>
              Une question sur la protection de vos données ?
            </p>
            <a
              href="mailto:charles.lecussan@gmail.com"
              className="text-sm underline"
              style={{ color: '#D4952A' }}
            >
              charles.lecussan@gmail.com
            </a>
          </div>

        </div>
      </div>

      {/* ── Bouton retour en haut ─────────────────────────────── */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ background: '#1B2A4A', color: 'white', zIndex: 50 }}
          aria-label="Haut de page"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
