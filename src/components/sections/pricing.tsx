import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PricingCard } from "@/components/pricing/pricing-card";
import { getPrimaryPlan } from "@/lib/stripe/pricing-service";

export async function Pricing() {
  const plan = await getPrimaryPlan().catch(() => null);

  return (
    <section id="tarifs" className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Tarifs"
          title="Une offre simple, sans surprise"
          subtitle="Un seul prix, toutes les fonctionnalités incluses — sans engagement, paiement mensuel."
        />

        <div className="mt-14">
          <PricingCard plan={plan} />
        </div>
      </Container>
    </section>
  );
}
