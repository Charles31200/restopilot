import { ArrowRight, Clock, Compass, Sparkles, TrendingUp } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

const stats = [
  {
    icon: Clock,
    value: "Jusqu'à 6h",
    label: "gagnées chaque semaine sur les tâches répétitives",
  },
  {
    icon: TrendingUp,
    value: "+12%",
    label: "de marge potentielle identifiée par l'IA",
  },
  {
    icon: Sparkles,
    value: "24/7",
    label: "analyse continue de votre activité",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-20 md:pt-48 md:pb-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-220px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-ink/[0.05] blur-[160px]"
      />

      <Container className="relative flex flex-col items-center text-center">
        <Reveal className="max-w-[820px]">
          <h1 className="text-balance font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[50px] md:text-[60px]">
            Le copilote IA conçu pour les restaurateurs
          </h1>
        </Reveal>

        <Reveal delay={0.12} className="mt-6 max-w-[620px]">
          <p className="text-balance text-[17px] leading-[1.6] text-ink-muted md:text-[19px]">
            PilotResto analyse votre activité, optimise vos marges et
            automatise les tâches répétitives — l&apos;intelligence
            artificielle qui travaille pour votre rentabilité, pas un logiciel
            de plus à apprendre.
          </p>
        </Reveal>

        <Reveal delay={0.18} className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Button href="/demo" size="lg">
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

        <RevealGroup className="mt-16 grid w-full max-w-[760px] grid-cols-1 divide-y divide-line overflow-hidden rounded-(--radius-xl) border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:mt-20">
          {stats.map((stat) => (
            <RevealItem key={stat.label}>
              <div className="flex h-full flex-col items-center gap-2 px-6 py-8 text-center">
                <stat.icon size={18} className="text-ink-subtle" />
                <span className="font-mono text-[26px] font-medium tracking-tight text-ink">
                  {stat.value}
                </span>
                <span className="max-w-[180px] text-[13px] leading-[1.5] text-ink-muted">
                  {stat.label}
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
