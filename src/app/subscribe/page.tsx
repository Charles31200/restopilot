import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { PricingCard } from "@/components/pricing/pricing-card";
import { getPrimaryPlan } from "@/lib/stripe/pricing-service";

export const metadata: Metadata = {
  title: "Activer votre abonnement",
  description: "Un abonnement actif est nécessaire pour accéder à votre espace PilotResto.",
  robots: { index: false, follow: false },
};

export default async function SubscribePage() {
  const plan = await getPrimaryPlan().catch(() => null);

  return (
    <div className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Container>
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-canvas-alt text-ink-subtle">
              <ShieldAlert size={20} />
            </span>
          </Reveal>
          <Reveal delay={0.06} className="mt-6 max-w-[560px]">
            <h1 className="text-balance font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[40px]">
              Un abonnement actif est nécessaire
            </h1>
          </Reveal>
          <Reveal delay={0.12} className="mt-4 max-w-[480px]">
            <p className="text-balance text-[16px] leading-[1.6] text-ink-muted">
              Votre compte est créé, mais l&apos;accès à votre espace client
              PilotResto nécessite un abonnement actif. Souscrivez ci-dessous
              pour continuer.
            </p>
          </Reveal>
        </div>

        <div className="mt-14">
          <PricingCard plan={plan} />
        </div>
      </Container>
    </div>
  );
}
