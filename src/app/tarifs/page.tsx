import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Clock, TrendingUp, LayoutDashboard, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Accordion } from "@/components/ui/accordion";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { ComparisonTable } from "@/components/pricing/comparison-table";
import { RoiCalculator } from "@/components/pricing/roi-calculator";
import { CheckoutBanner } from "@/components/pricing/checkout-banner";
import { getPricingPlans } from "@/lib/stripe/pricing-service";
import { billingFaqs, pricingBenefits } from "@/content/site";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Une offre PilotResto adaptée à chaque établissement, du restaurant indépendant au groupe multi-sites. Essai gratuit, sans engagement.",
};

const icons: Record<string, LucideIcon> = {
  Clock,
  TrendingUp,
  LayoutDashboard,
};

export default async function TarifsPage() {
  const plans = await getPricingPlans().catch(() => []);

  return (
    <div className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Container>
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Badge>Tarifs</Badge>
          </Reveal>
          <Reveal delay={0.06} className="mt-6 max-w-[640px]">
            <h1 className="text-balance font-display text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[48px]">
              Une offre adaptée à chaque établissement
            </h1>
          </Reveal>
          <Reveal delay={0.12} className="mt-4 max-w-[520px]">
            <p className="text-balance text-[16px] leading-[1.6] text-ink-muted md:text-[17px]">
              Du restaurant indépendant au groupe multi-sites, une formule
              pensée pour votre taille et vos besoins — essai gratuit, sans
              engagement.
            </p>
          </Reveal>
        </div>

        <div className="mt-12">
          <Suspense fallback={null}>
            <CheckoutBanner />
          </Suspense>
        </div>

        <div className="mt-2">
          <PricingCards plans={plans} />
        </div>

        {plans.length > 0 && (
          <div className="mt-24">
            <Reveal className="text-center">
              <h2 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink md:text-[30px]">
                Comparez les fonctionnalités en détail
              </h2>
            </Reveal>
            <div className="mt-8">
              <ComparisonTable plans={plans} />
            </div>
          </div>
        )}

        <div className="mt-24">
          <RoiCalculator />
        </div>

        <div className="mt-24">
          <Reveal className="text-center">
            <h2 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink md:text-[30px]">
              Ce que PilotResto change au quotidien
            </h2>
          </Reveal>
          <RevealGroup className="mx-auto mt-10 grid max-w-[960px] grid-cols-1 gap-5 sm:grid-cols-3">
            {pricingBenefits.map((benefit) => {
              const Icon = icons[benefit.icon];
              return (
                <RevealItem key={benefit.title}>
                  <div className="flex h-full flex-col rounded-(--radius-lg) border border-line bg-surface p-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-sm) bg-ink text-ink-inverse">
                      <Icon size={17} />
                    </span>
                    <h3 className="mt-4 font-display text-[16px] font-semibold text-ink">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-muted">
                      {benefit.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>

        <div className="mx-auto mt-24 max-w-[720px]">
          <Reveal className="text-center">
            <h2 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink md:text-[30px]">
              Questions sur la facturation
            </h2>
          </Reveal>
          <Reveal delay={0.06} className="mt-8">
            <Accordion items={billingFaqs} />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-20 text-center">
          <p className="text-[14.5px] text-ink-subtle">
            Besoin d&apos;un accompagnement sur mesure ?{" "}
            <Link
              href="/contact"
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
            >
              Parlons-en directement
            </Link>
          </p>
        </Reveal>
      </Container>
    </div>
  );
}
