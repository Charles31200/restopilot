import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — RestoPilot',
  description: 'Politique de confidentialité et traitement des données personnelles de RestoPilot.',
}

export default function PolitiqueConfidentialitePage() {
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
        Politique de confidentialité
      </h1>
      <p className="text-sm text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données collectées via RestoPilot est Charles Lecussan,
            joignable à <a href="mailto:charles.lecussan@gmail.com" className="text-blue-600 hover:underline">charles.lecussan@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données collectées</h2>
          <p>RestoPilot collecte les données suivantes :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Informations de compte : adresse email, prénom, nom</li>
            <li>Informations du restaurant : nom, adresse, numéro SIRET</li>
            <li>Données métier saisies : ventes, stocks, planning</li>
            <li>Données de facturation (traitées par Stripe — non stockées chez RestoPilot)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Finalités du traitement</h2>
          <p>Les données sont utilisées pour :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Fournir le service de gestion de restaurant</li>
            <li>Gérer les abonnements et la facturation</li>
            <li>Envoyer des notifications liées au service (paiements, rapports)</li>
            <li>Améliorer la plateforme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Base légale</h2>
          <p>
            Le traitement est fondé sur l&rsquo;exécution du contrat (fourniture du service) et, le cas
            échéant, sur le consentement de l&rsquo;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Hébergement et sous-traitants</h2>
          <p>Les données sont hébergées en Europe via :</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Supabase</strong> — base de données et authentification (région eu-west)</li>
            <li><strong>Vercel</strong> — hébergement de l&rsquo;application</li>
            <li><strong>Stripe</strong> — paiements (certifié PCI-DSS)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Durée de conservation</h2>
          <p>
            Les données sont conservées pendant toute la durée du contrat et 90 jours après la
            résiliation du compte, puis supprimées définitivement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Vos droits (RGPD)</h2>
          <p>
            Conformément au RGPD, vous disposez des droits d&rsquo;accès, de rectification, d&rsquo;effacement,
            de portabilité et d&rsquo;opposition. Pour exercer ces droits, contactez :
            <a href="mailto:charles.lecussan@gmail.com" className="text-blue-600 hover:underline ml-1">charles.lecussan@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookies</h2>
          <p>
            RestoPilot utilise uniquement des cookies fonctionnels nécessaires à l&rsquo;authentification.
            Aucun cookie publicitaire ou de tracking n&rsquo;est utilisé.
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
