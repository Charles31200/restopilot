import {
  BrainCircuit,
  ScanSearch,
  PiggyBank,
  Handshake,
  CloudSun,
  PackageCheck,
  Radar,
  LayoutDashboard,
  Plug,
  FileBarChart,
  Bot,
  ScanLine,
  Database,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { whyChoose } from "@/content/site";

const icons: Record<string, LucideIcon> = {
  BrainCircuit,
  ScanSearch,
  PiggyBank,
  Handshake,
  CloudSun,
  PackageCheck,
  Radar,
  LayoutDashboard,
  Plug,
  FileBarChart,
  Bot,
  ScanLine,
  Database,
  Wand2,
};

export function WhyChoose() {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Pourquoi PilotResto"
          title="Pourquoi choisir PilotResto ?"
          subtitle="Bien plus qu'un logiciel de caisse : une plateforme pilotée par l'IA, pensée pour faire gagner du temps et de la rentabilité à chaque établissement."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((item) => {
            const Icon = icons[item.icon] ?? BrainCircuit;
            return (
              <RevealItem key={item.title}>
                <div className="group h-full rounded-(--radius-lg) border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_16px_40px_-24px_rgba(16,17,19,0.25)]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-ink text-ink-inverse transition-transform duration-300 group-hover:scale-105">
                    <Icon size={16} />
                  </span>
                  <h3 className="mt-4 font-display text-[14.5px] font-semibold leading-[1.3] text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-muted">
                    {item.description}
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
