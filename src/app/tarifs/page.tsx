import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { pricingPlans, site } from "@/content/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Une offre PilotResto adaptée à chaque établissement, du restaurant indépendant au groupe multi-sites.",
};

export default function TarifsPage() {
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
              pensée pour votre taille et vos besoins.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="mx-auto mt-16 grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <RevealItem key={plan.name} className="h-full">
              <div
                className={cn(
                  "flex h-full flex-col rounded-(--radius-lg) border bg-surface p-7",
                  plan.highlighted
                    ? "border-ink shadow-[0_24px_60px_-30px_rgba(16,17,19,0.3)]"
                    : "border-line"
                )}
              >
                {plan.highlighted && (
                  <span className="mb-4 w-fit rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-ink-inverse">
                    Le plus choisi
                  </span>
                )}
                <h2 className="font-display text-[20px] font-semibold text-ink">
                  {plan.name}
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-[1.5] text-ink-muted">
                  {plan.description}
                </p>

                <Button
                  href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(
                    `Demande d'information — Plan ${plan.name}`
                  )}`}
                  external
                  size="lg"
                  variant={plan.highlighted ? "primary" : "secondary"}
                  className="mt-6 w-full"
                >
                  Nous contacter
                  <ArrowRight size={16} />
                </Button>

                <ul className="mt-7 flex flex-col gap-3 border-t border-line pt-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-ink-muted">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent-text" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-16 text-center">
          <p className="text-[14.5px] text-ink-subtle">
            Besoin d&apos;un accompagnement sur mesure ?{" "}
            <a
              href={`mailto:${site.contactEmail}`}
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-accent-text"
            >
              Parlons-en directement
            </a>
          </p>
        </Reveal>
      </Container>
    </div>
  );
}
