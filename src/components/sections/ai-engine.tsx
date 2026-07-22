import {
  Camera,
  PiggyBank,
  Truck,
  FileBarChart,
  Database,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AINetworkSchema } from "@/components/sections/ai-network-schema";
import { aiPillars } from "@/content/site";

const icons: Record<string, LucideIcon> = {
  Camera,
  PiggyBank,
  Truck,
  FileBarChart,
  Database,
};

export function AIEngine() {
  return (
    <section className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_420px] lg:gap-12">
          <div>
            <Reveal>
              <Badge>Intelligence artificielle</Badge>
            </Reveal>
            <Reveal delay={0.06} className="mt-5 max-w-[560px]">
              <h2 className="text-balance font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[38px]">
                PilotResto n&apos;est pas un logiciel de caisse. C&apos;est un
                copilote IA pour votre restaurant.
              </h2>
            </Reveal>
            <Reveal delay={0.12} className="mt-4 max-w-[540px]">
              <p className="text-[16px] leading-[1.65] text-ink-muted">
                Pendant que vous gérez le service, l&apos;IA de PilotResto
                analyse votre activité, surveille vos marges et prépare des
                décisions concrètes — pas des chiffres de plus à interpréter.
              </p>
            </Reveal>

            <RevealGroup className="mt-10 flex flex-col gap-1">
              {aiPillars.map((pillar) => {
                const Icon = icons[pillar.icon] ?? Camera;
                return (
                  <RevealItem key={pillar.title}>
                    <div className="flex items-start gap-4 rounded-(--radius-lg) p-4 transition-colors duration-300 hover:bg-surface">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) bg-ink text-ink-inverse">
                        <Icon size={17} />
                      </span>
                      <div>
                        <h3 className="font-display text-[15.5px] font-semibold text-ink">
                          {pillar.title}
                        </h3>
                        <p className="mt-1 text-[14px] leading-[1.6] text-ink-muted">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>

          <Reveal delay={0.15}>
            <AINetworkSchema />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
