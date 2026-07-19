import { Shuffle, EyeOff, Boxes, Hourglass, BarChart3 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { problems } from "@/content/site";

const icons = [Shuffle, EyeOff, Boxes, Hourglass, BarChart3];

export function Problem() {
  return (
    <section className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Le constat"
          title="Les restaurateurs utilisent trop d'outils différents"
          subtitle="Caisse, réservation, planning, tableur : chaque outil supplémentaire ajoute de la friction au quotidien."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {problems.map((problem, i) => {
            const Icon = icons[i] ?? Boxes;
            return (
              <RevealItem key={problem.title}>
                <div className="h-full rounded-(--radius-lg) border border-line bg-surface p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-canvas-alt text-ink-muted">
                    <Icon size={16} />
                  </span>
                  <h3 className="mt-4 font-display text-[16px] font-semibold text-ink">
                    {problem.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-muted">
                    {problem.description}
                  </p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </section>
  );
}
