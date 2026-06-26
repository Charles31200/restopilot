'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUp } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface TocItem { id: string; label: string }

// ── Constants ──────────────────────────────────────────────────────

const TOC: TocItem[] = [
  { id: 'art1',  label: 'Article 1 — Identification de l\'éditeur' },
  { id: 'art2',  label: 'Article 2 — Objet et champ d\'application' },
  { id: 'art3',  label: 'Article 3 — Offre commerciale et tarifs' },
  { id: 'art4',  label: 'Article 4 — Processus de commande' },
  { id: 'art5',  label: 'Article 5 — Période d\'essai gratuite' },
  { id: 'art6',  label: 'Article 6 — Paiement' },
  { id: 'art7',  label: 'Article 7 — Droit de rétractation' },
  { id: 'art8',  label: 'Article 8 — Résiliation et remboursement' },
  { id: 'art9',  label: 'Article 9 — Communications par email' },
  { id: 'art10', label: 'Article 10 — Responsabilités' },
  { id: 'art11', label: 'Article 11 — Réclamations et médiation' },
  { id: 'art12', label: 'Article 12 — Propriété intellectuelle' },
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
        Article {n} — {title}
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

export default function CguCgvPage() {
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
            Conditions Générales d&rsquo;Utilisation<br className="hidden sm:block" /> et de Vente
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
                  {i + 1}. {item.label.replace(/^Article \d+ — /, '')}
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Articles ─────────────────────────────────────────── */}
        <div className="space-y-12">

          {/* Article 1 */}
          <section>
            <ArticleTitle id="art1" n={1} title="Identification de l'éditeur" />
            <p style={textStyle}>
              PilotResto est édité par :
            </p>
            <div className="mt-4 pl-4 border-l-2 space-y-1" style={{ borderColor: '#D4952A', ...textStyle }}>
              <p><strong style={{ color: '#1B2A4A' }}>Charles LECUSSAN</strong></p>
              <p>54 rue du Cailloux Gris, 31200 Toulouse, France</p>
              <p>Email : <a href="mailto:charles.lecussan@gmail.com" className="underline" style={{ color: '#D4952A' }}>charles.lecussan@gmail.com</a></p>
              <p>Site web : <a href="https://restopilot.pro" className="underline" style={{ color: '#D4952A' }}>https://restopilot.pro</a></p>
              <p>Statut : Entrepreneur individuel (en cours de formalisation). Une structure juridique adaptée sera mise en place selon le développement de l&rsquo;activité.</p>
            </div>
          </section>

          {/* Article 2 */}
          <section>
            <ArticleTitle id="art2" n={2} title="Objet et champ d'application" />
            <p style={textStyle} className="mb-4">
              Les présentes CGU/CGV définissent les droits et obligations des parties dans le cadre de l&rsquo;utilisation de PilotResto. PilotResto s&rsquo;adresse aussi bien aux professionnels de la restauration (B2B) qu&rsquo;aux particuliers souhaitant gérer un établissement alimentaire.
            </p>
            <p style={textStyle} className="mb-3">PilotResto est un logiciel SaaS proposant selon le plan souscrit :</p>
            <ul className="list-none space-y-0" style={textStyle}>
              <Li>Tableau de bord financier et suivi du CA en temps réel</Li>
              <Li>Gestion des stocks, inventaires et alertes automatiques</Li>
              <Li>Planning RH conforme convention HCR</Li>
              <Li>Comptabilité simplifiée avec export FEC (DGFiP)</Li>
              <Li>Import CSV et intégrations caisses (Lightspeed, Tiller, Zelty)</Li>
              <Li>Module Menu &amp; Recettes avec fiches techniques</Li>
              <Li>Génération de rapports PDF et scan factures IA</Li>
            </ul>
          </section>

          {/* Article 3 */}
          <section>
            <ArticleTitle id="art3" n={3} title="Offre commerciale et tarifs" />
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #E8ECF2' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1B2A4A', color: 'white' }}>
                    <th className="px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold">Mensuel (HT)</th>
                    <th className="px-4 py-3 text-left font-semibold">Annuel (HT)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { plan: 'Starter',     monthly: '39 €',  annual: '368 €' },
                    { plan: 'Pro',         monthly: '79 €',  annual: '663 €' },
                    { plan: 'Multi-sites', monthly: '149 €', annual: '1 430 €' },
                  ].map((row, i) => (
                    <tr key={row.plan} style={{ background: i % 2 === 0 ? 'white' : '#F8F9FB', color: '#444' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1B2A4A' }}>{row.plan}</td>
                      <td className="px-4 py-3">{row.monthly}/mois</td>
                      <td className="px-4 py-3">{row.annual}/an</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={textStyle}>
              Les prix sont indiqués hors taxes (HT). Des remises ponctuelles peuvent être accordées sans créer de droit acquis. Toute modification tarifaire est notifiée par email avec un préavis de 30 jours.
            </p>
          </section>

          {/* Article 4 */}
          <section>
            <ArticleTitle id="art4" n={4} title="Processus de commande" />
            <p style={textStyle}>
              Le client choisit un abonnement sur <a href="https://restopilot.pro/pricing" className="underline" style={{ color: '#D4952A' }}>restopilot.pro/pricing</a>, sélectionne la formule souhaitée et clique sur &laquo;&nbsp;Essayer 14 jours gratuits&nbsp;&raquo;. Il est alors redirigé vers Stripe pour le paiement sécurisé. L&rsquo;accès au service est activé immédiatement après validation. L&rsquo;abonnement se renouvelle automatiquement à chaque échéance.
            </p>
          </section>

          {/* Article 5 */}
          <section>
            <ArticleTitle id="art5" n={5} title="Période d'essai gratuite" />
            <ul className="list-none space-y-0" style={textStyle}>
              <Li>14 jours d&rsquo;essai gratuit avec accès complet à toutes les fonctionnalités</Li>
              <Li>La carte bancaire est enregistrée mais aucun débit n&rsquo;est effectué pendant la période d&rsquo;essai</Li>
              <Li>Annulation possible à tout moment sans frais pendant cette période</Li>
              <Li>Un seul essai gratuit par utilisateur et par restaurant</Li>
              <Li>À l&rsquo;issue des 14 jours : activation automatique de l&rsquo;abonnement si aucune résiliation</Li>
            </ul>
          </section>

          {/* Article 6 */}
          <section>
            <ArticleTitle id="art6" n={6} title="Paiement" />
            <p style={textStyle}>
              Les paiements sont traités par <strong style={{ color: '#1B2A4A' }}>Stripe</strong> (certifié PCI-DSS niveau 1). PilotResto ne stocke aucune donnée bancaire. Le prélèvement est effectué mensuellement ou annuellement à date anniversaire selon la formule choisie. En cas d&rsquo;échec de paiement, le client dispose de 7 jours pour régulariser sa situation avant la suspension du compte.
            </p>
          </section>

          {/* Article 7 */}
          <section>
            <ArticleTitle id="art7" n={7} title="Droit de rétractation" />
            <p style={textStyle}>
              Conformément à l&rsquo;article L.221-28 du Code de la consommation, le droit de rétractation de 14 jours n&rsquo;est pas applicable aux services numériques pleinement exécutés avec l&rsquo;accord préalable du consommateur. La période d&rsquo;essai de 14 jours offre une protection équivalente et supérieure.
            </p>
          </section>

          {/* Article 8 */}
          <section>
            <ArticleTitle id="art8" n={8} title="Résiliation et remboursement" />
            <ul className="list-none space-y-0" style={textStyle}>
              <Li>Résiliation possible à tout moment depuis l&rsquo;espace compte, sans justification</Li>
              <Li>La résiliation prend effet à la fin de la période de facturation en cours</Li>
              <Li>En cas de bug bloquant non résolu sous 48h : remboursement prorata possible sur demande à <a href="mailto:charles.lecussan@gmail.com" className="underline" style={{ color: '#D4952A' }}>charles.lecussan@gmail.com</a> dans les 30 jours suivant l&rsquo;incident</Li>
              <Li>Les données du client sont supprimées définitivement 30 jours après la résiliation. Le client doit exporter ses données avant ce délai.</Li>
            </ul>
          </section>

          {/* Article 9 */}
          <section>
            <ArticleTitle id="art9" n={9} title="Communications par email" />
            <p style={textStyle} className="mb-3">
              En s&rsquo;inscrivant, le client accepte de recevoir :
            </p>
            <ul className="list-none space-y-0 mb-4" style={textStyle}>
              <Li>Emails transactionnels (confirmation d&rsquo;inscription, factures, alertes de paiement) — non désactivables</Li>
              <Li>Informations sur les nouvelles fonctionnalités</Li>
              <Li>Emails promotionnels ponctuels</Li>
            </ul>
            <p style={textStyle}>
              La désinscription des emails non transactionnels est possible via le lien présent dans chaque email.
            </p>
          </section>

          {/* Article 10 */}
          <section>
            <ArticleTitle id="art10" n={10} title="Responsabilités" />
            <p style={textStyle} className="mb-3">
              PilotResto est un outil d&rsquo;aide à la gestion. L&rsquo;éditeur s&rsquo;engage à :
            </p>
            <ul className="list-none space-y-0 mb-4" style={textStyle}>
              <Li>Fournir une réponse au support dans un délai de 24 à 48h ouvrables</Li>
              <Li>Annoncer les maintenances planifiées avec un préavis de 48h</Li>
            </ul>
            <p style={textStyle}>
              La responsabilité de l&rsquo;éditeur est limitée aux sommes effectivement payées par le client au cours des 12 derniers mois précédant le sinistre.
            </p>
          </section>

          {/* Article 11 */}
          <section>
            <ArticleTitle id="art11" n={11} title="Réclamations et médiation" />
            <p style={textStyle} className="mb-4">
              Toute réclamation doit être adressée dans les 30 jours suivant le fait générateur à <a href="mailto:charles.lecussan@gmail.com" className="underline" style={{ color: '#D4952A' }}>charles.lecussan@gmail.com</a>. L&rsquo;éditeur s&rsquo;engage à y répondre sous 7 jours ouvrables.
            </p>
            <p style={textStyle} className="mb-3">En cas de litige non résolu :</p>
            <ul className="list-none space-y-0 mb-4" style={textStyle}>
              <Li><strong style={{ color: '#1B2A4A' }}>Médiateur de la consommation :</strong> CM2C — 14 rue Saint Jean, 75017 Paris — <a href="mailto:cm2c@cm2c.net" className="underline" style={{ color: '#D4952A' }}>cm2c@cm2c.net</a> — <a href="https://www.cm2c.net" className="underline" style={{ color: '#D4952A' }}>www.cm2c.net</a></Li>
              <Li><strong style={{ color: '#1B2A4A' }}>Plateforme européenne ODR :</strong> <a href="https://ec.europa.eu/consumers/odr" className="underline" style={{ color: '#D4952A' }}>ec.europa.eu/consumers/odr</a></Li>
            </ul>
            <p style={textStyle}>
              Le droit français est applicable. En cas de litige judiciaire, les tribunaux de Toulouse sont seuls compétents.
            </p>
          </section>

          {/* Article 12 */}
          <section>
            <ArticleTitle id="art12" n={12} title="Propriété intellectuelle" />
            <p style={textStyle}>
              Tous les éléments constituant PilotResto (code source, interfaces, textes, images, marques, logos) sont la propriété exclusive de Charles LECUSSAN. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite.
            </p>
            <p style={textStyle} className="mt-3">
              Les données saisies par le client dans PilotResto (ventes, stocks, planning, recettes, etc.) restent la propriété exclusive du client. PilotResto ne revendique aucun droit sur ces données.
            </p>
          </section>

          {/* Contact */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#F8F9FB', border: '1px solid #E8ECF2' }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: '#1B2A4A' }}>
              Une question sur ces conditions ?
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
