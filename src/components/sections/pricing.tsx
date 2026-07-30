import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { getPricingPlans } from "@/lib/stripe/pricing-service";

export async function Pricing() {
  const plans = await getPricingPlans().catch(() => []);

  return (
    <section id="tarifs" className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Tarifs"
          title="Une offre adaptée à chaque établissement"
          subtitle="Du restaurant indépendant au groupe multi-sites, une formule pensée pour votre taille et vos besoins — essai gratuit, sans engagement."
        />

        <div className="mt-14">
          <PricingCards plans={plans} />
        </div>
      </Container>
    </section>
  );
}
