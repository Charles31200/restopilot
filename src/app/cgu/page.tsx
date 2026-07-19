import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation et de Vente",
};

const sections = [
  {
    title: "1. Objet",
    body: "Les présentes conditions générales d'utilisation et de vente (CGU/CGV) régissent l'accès et l'utilisation du service PilotResto, un logiciel de gestion de restaurant proposé en mode SaaS (Software as a Service).",
  },
  {
    title: "2. Accès au service",
    body: "L'accès à PilotResto est soumis à la création d'un compte et à la souscription d'un abonnement. Un essai gratuit de 14 jours, sans carte bancaire, est proposé à toute nouvelle organisation.",
  },
  {
    title: "3. Abonnement et facturation",
    body: "L'abonnement est souscrit sans engagement de durée et facturé mensuellement. Le client peut résilier à tout moment depuis son espace, la résiliation prenant effet à la fin de la période en cours.",
  },
  {
    title: "4. Responsabilités",
    body: "PilotResto met en œuvre les moyens raisonnables pour assurer la disponibilité et la fiabilité du service. Le client reste responsable de l'exactitude des données qu'il saisit et de la conformité de son usage du service aux réglementations qui lui sont applicables.",
  },
  {
    title: "5. Propriété intellectuelle",
    body: "Le logiciel PilotResto, sa marque et ses éléments graphiques sont la propriété exclusive de PilotResto et ne peuvent être reproduits sans autorisation écrite préalable.",
  },
  {
    title: "6. Contact",
    body: "Pour toute question relative aux présentes conditions, contactez-nous à l'adresse indiquée en pied de page.",
  },
];

export default function CGUPage() {
  return (
    <div className="pt-32 pb-24 md:pt-40">
      <Container className="max-w-[720px]">
        <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-ink md:text-[38px]">
          Conditions Générales d&apos;Utilisation et de Vente
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
