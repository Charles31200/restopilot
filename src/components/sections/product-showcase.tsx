import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { FloorplanPanel } from "@/components/sections/product-visual/floorplan-panel";
import { RevenueChart } from "@/components/sections/product-visual/revenue-chart";

export function ProductShowcase() {
  return (
    <section id="produit" className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Le produit"
          title="Toute votre activité, lisible en un coup d'œil"
          subtitle="Salle et performances suivies au même endroit, mises à jour en temps réel — pas de rapport à attendre pour savoir où vous en êtes."
        />

        <div className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
          <Reveal>
            <div className="h-full overflow-hidden rounded-(--radius-xl) border border-line bg-surface">
              <FloorplanPanel />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full overflow-hidden rounded-(--radius-xl) border border-line bg-surface">
              <RevenueChart />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
