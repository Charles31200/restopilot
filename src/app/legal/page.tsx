import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { LegalPortalGrid } from "@/components/legal/legal-portal-grid";
import { getAllLegalContent } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Centre juridique",
  description:
    "Retrouvez tous les documents juridiques de PilotResto : CGV, CGU, politique de confidentialité, cookies, mentions légales, DPA, SLA et charte IA.",
  alternates: { canonical: "https://restopilot.pro/legal" },
};

export default async function LegalPortalPage() {
  const docs = await getAllLegalContent();

  const portalDocs = docs.map(({ meta, content }) => ({
    meta,
    lastUpdated: content.lastUpdated,
    searchText: [meta.title, meta.shortTitle, meta.description, content.plainText].join(" "),
  }));

  return (
    <div className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Container className="max-w-[1100px]">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Badge>Centre juridique</Badge>
          </Reveal>
          <Reveal delay={0.06} className="mt-6 max-w-[600px]">
            <h1 className="text-balance font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[44px]">
              Tous les documents juridiques de PilotResto
            </h1>
          </Reveal>
          <Reveal delay={0.12} className="mt-4 max-w-[480px]">
            <p className="text-balance text-[16px] leading-[1.6] text-ink-muted">
              Conditions, politiques et engagements, réunis au même endroit et
              tenus à jour.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.16} className="mt-16">
          <LegalPortalGrid docs={portalDocs} />
        </Reveal>
      </Container>
    </div>
  );
}
