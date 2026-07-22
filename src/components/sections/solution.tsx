import { ClipboardList, LayoutGrid, BarChart3, Users, Zap, Plug } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { solutions } from "@/content/site";

const icons = [ClipboardList, LayoutGrid, BarChart3, Users, Zap, Plug];

export function Solution() {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="La solution"
          title="Une seule plateforme pour gérer votre restaurant"
          subtitle="PilotResto réunit ce qui, ailleurs, est éparpillé entre six outils différents — et laisse l'IA faire le travail de liaison."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution, i) => {
            const Icon = icons[i] ?? Zap;
            return (
              <RevealItem key={solution.title}>
                <div className="h-full rounded-(--radius-lg) border border-line bg-surface p-6 transition-colors duration-300 hover:border-line-strong">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-sm) bg-ink text-ink-inverse">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-5 font-display text-[17px] font-semibold text-ink">
                    {solution.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-muted">
                    {solution.description}
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
