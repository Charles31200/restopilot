import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { pricingPlans, site } from "@/content/site";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="tarifs" className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Tarifs"
          title="Une offre adaptée à chaque établissement"
          subtitle="Du restaurant indépendant au groupe multi-sites, une formule pensée pour votre taille et vos besoins."
        />

        <RevealGroup className="mx-auto mt-14 grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-3">
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
                <h3 className="font-display text-[20px] font-semibold text-ink">
                  {plan.name}
                </h3>
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
      </Container>
    </section>
  );
}
