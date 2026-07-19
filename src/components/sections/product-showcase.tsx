import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { BrowserFrame } from "@/components/sections/product-visual/browser-frame";
import { DashboardPanel } from "@/components/sections/product-visual/dashboard-panel";
import { TabletFrame } from "@/components/sections/product-visual/tablet-frame";
import { FloorplanPanel } from "@/components/sections/product-visual/floorplan-panel";
import { PhoneFrame } from "@/components/sections/product-visual/phone-frame";
import { NotificationsPanel } from "@/components/sections/product-visual/notifications-panel";

export function ProductShowcase() {
  return (
    <section id="produit" className="border-t border-line bg-canvas-alt py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Le produit"
          title="Une plateforme pensée pour tous vos écrans"
          subtitle="Dashboard sur ordinateur, plan de salle sur tablette, notifications sur mobile : la même donnée, partout, en temps réel."
        />

        <Reveal
          delay={0.1}
          className="relative mx-auto mt-16 flex max-w-[860px] flex-col items-center gap-8 md:block md:gap-0 md:pb-40"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 -bottom-8 top-8 -z-10 hidden rounded-[48px] bg-accent/[0.05] blur-[90px] md:block"
          />

          <BrowserFrame label="app.pilotresto.pro/dashboard" className="w-full">
            <DashboardPanel />
          </BrowserFrame>

          <div className="w-[220px] sm:w-[260px] md:absolute md:-bottom-6 md:left-1/2 md:w-[260px] md:-translate-x-[calc(100%+20px)]">
            <TabletFrame>
              <FloorplanPanel compact />
            </TabletFrame>
          </div>

          <div className="w-[150px] sm:w-[170px] md:absolute md:-bottom-[150px] md:left-1/2 md:w-[160px] md:translate-x-[70px]">
            <PhoneFrame>
              <NotificationsPanel />
            </PhoneFrame>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
