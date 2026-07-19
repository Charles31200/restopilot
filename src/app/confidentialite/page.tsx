import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

const sections = [
  {
    title: "1. Données collectées",
    body: "PilotResto collecte les données nécessaires au fonctionnement du service : informations de compte, données relatives à l'établissement, à l'équipe, aux plannings et aux réservations saisies par le client.",
  },
  {
    title: "2. Hébergement",
    body: "Les données sont hébergées chez un prestataire situé en France, dans le respect du Règlement Général sur la Protection des Données (RGPD).",
  },
  {
    title: "3. Utilisation des données",
    body: "Les données sont utilisées exclusivement pour fournir et améliorer le service PilotResto. Elles ne sont ni vendues ni partagées avec des tiers à des fins commerciales.",
  },
  {
    title: "4. Durée de conservation",
    body: "Les données sont conservées pendant toute la durée de l'abonnement, puis supprimées dans un délai raisonnable après résiliation, sauf obligation légale de conservation plus longue.",
  },
  {
    title: "5. Vos droits",
    body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour l'exercer, contactez-nous directement.",
  },
  {
    title: "6. Contact",
    body: `Pour toute question relative à cette politique, écrivez à ${site.contactEmail}.`,
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="pt-32 pb-24 md:pt-40">
      <Container className="max-w-[720px]">
        <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-ink md:text-[38px]">
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-[14px] text-ink-subtle">
          Document de référence — dernière mise à jour à finaliser avant mise
          en production.
        </p>

        <div className="mt-12 flex flex-col gap-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-[18px] font-semibold text-ink">
                {s.title}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.7] text-ink-muted">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
