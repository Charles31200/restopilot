import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CGU / CGV — RestoPilot',
  description: "Conditions Générales d'Utilisation et de Vente de RestoPilot.",
}

export default function CguCgvPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <a
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l&rsquo;accueil
      </a>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Conditions Générales d&rsquo;Utilisation et de Vente
      </h1>
      <p className="text-sm text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Objet</h2>
          <p>
            Les présentes Conditions Générales d&rsquo;Utilisation et de Vente (CGU/CGV) régissent
            l&rsquo;accès et l&rsquo;utilisation de la plateforme RestoPilot, accessible à l&rsquo;adresse
            <strong> restopilot.pro</strong>, éditée par Charles Lecussan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Accès au service</h2>
          <p>
            L&rsquo;accès à RestoPilot est réservé aux professionnels de la restauration. Un essai gratuit de
            14 jours est proposé. À l&rsquo;issue de cette période, un abonnement payant est nécessaire pour
            continuer à utiliser le service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Tarifs et paiement</h2>
          <p>
            Les tarifs en vigueur sont affichés sur la page <a href="/pricing" className="text-blue-600 hover:underline">Tarifs</a>.
            Les paiements sont traités de manière sécurisée par Stripe. RestoPilot ne stocke aucune donnée
            bancaire.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Résiliation</h2>
          <p>
            L&rsquo;utilisateur peut résilier son abonnement à tout moment depuis son espace client. La
            résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement
            prorata temporis n&rsquo;est effectué.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Propriété intellectuelle</h2>
          <p>
            L&rsquo;ensemble des éléments constituant RestoPilot (logiciels, textes, images, marques) est
            protégé par les droits de propriété intellectuelle. Toute reproduction est interdite sans
            autorisation préalable écrite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Limitation de responsabilité</h2>
          <p>
            RestoPilot est un outil d&rsquo;aide à la gestion. L&rsquo;éditeur ne saurait être tenu responsable
            des décisions prises par l&rsquo;utilisateur sur la base des informations fournies par la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Droit applicable</h2>
          <p>
            Les présentes CGU/CGV sont soumises au droit français. En cas de litige, les tribunaux français
            sont seuls compétents.
          </p>
        </section>

        <div className="border-t border-gray-200 pt-8 text-xs text-gray-400">
          <p>
            Pour toute question : <a href="mailto:charles.lecussan@gmail.com" className="hover:text-gray-600 underline">charles.lecussan@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
