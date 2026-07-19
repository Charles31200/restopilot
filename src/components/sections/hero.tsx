import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { BrowserFrame } from "@/components/sections/product-visual/browser-frame";
import { DashboardPanel } from "@/components/sections/product-visual/dashboard-panel";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-20 md:pt-48 md:pb-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-220px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.08] blur-[160px]"
      />

      <Container className="relative flex flex-col items-center text-center">
        <Reveal>
          <Badge icon={<Sparkles size={13} className="text-accent-text" />}>
            Une plateforme intelligente pour les restaurateurs modernes
          </Badge>
        </Reveal>

        <Reveal delay={0.06} className="mt-6 max-w-[820px]">
          <h1 className="text-balance font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[50px] md:text-[60px]">
            Le centre de pilotage intelligent des restaurants
          </h1>
        </Reveal>

        <Reveal delay={0.12} className="mt-6 max-w-[600px]">
          <p className="text-balance text-[17px] leading-[1.6] text-ink-muted md:text-[19px]">
            PilotResto centralise vos opérations, connecte vos outils et aide
            votre restaurant à fonctionner plus efficacement.
          </p>
        </Reveal>

        <Reveal delay={0.18} className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(
              "Demande de démonstration PilotResto"
            )}`}
            external
            size="lg"
          >
            Demander une démonstration
            <ArrowRight size={16} />
          </Button>
          <Button href="#produit" size="lg" variant="secondary">
            <Compass size={16} />
            Découvrir la plateforme
          </Button>
        </Reveal>

        <Reveal delay={0.24} className="mt-6">
          <p className="text-[13px] text-ink-subtle">
            Hébergé en France · Données chiffrées · Conçu pour les
            restaurateurs
          </p>
        </Reveal>

        <Reveal delay={0.3} className="mt-16 w-full max-w-[880px] md:mt-20">
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -bottom-10 top-10 -z-10 rounded-[40px] bg-accent/[0.06] blur-[100px]"
            />
            <BrowserFrame>
              <DashboardPanel />
            </BrowserFrame>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
