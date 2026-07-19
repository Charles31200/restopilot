import { Quote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { partners, testimonials, trustStats } from "@/content/site";

export function Trust() {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <Container>
        <Reveal className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
            Une nouvelle génération d&apos;outils pour les restaurateurs
          </p>
        </Reveal>

        <Reveal delay={0.06} className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((name) => (
            <span
              key={name}
              className="font-display text-[16px] font-semibold text-ink-subtle"
            >
              {name}
            </span>
          ))}
        </Reveal>

        <RevealGroup className="mx-auto mt-16 grid max-w-[720px] grid-cols-3 gap-4">
          {trustStats.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <div className="font-mono text-[30px] font-medium tracking-tight text-ink md:text-[36px]">
                {stat.value}
              </div>
              <div className="mt-1 text-[13px] font-medium text-ink">{stat.label}</div>
              <div className="mt-0.5 text-[12px] leading-[1.5] text-ink-subtle">
                {stat.description}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-20">
          <SectionHeading
            eyebrow="Retours d'expérience"
            title="Ce que change PilotResto au quotidien"
            subtitle="Exemples illustratifs représentatifs des retours recueillis pendant le développement de la plateforme."
          />

          <RevealGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <RevealItem key={t.name} className="h-full">
                <figure className="flex h-full flex-col justify-between rounded-(--radius-lg) border border-line bg-canvas-alt p-6">
                  <div>
                    <Quote size={20} className="text-accent-text" />
                    <blockquote className="mt-4 text-[15px] leading-[1.6] text-ink">
                      “{t.quote}”
                    </blockquote>
                  </div>
                  <figcaption className="mt-6 border-t border-line pt-4">
                    <div className="text-[13.5px] font-medium text-ink">{t.name}</div>
                    <div className="text-[13px] text-ink-subtle">{t.role}</div>
                  </figcaption>
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </section>
  );
}
