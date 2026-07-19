import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { advantages } from "@/content/site";

export function Advantages() {
  return (
    <section className="border-t border-line bg-ink py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Pourquoi PilotResto"
          eyebrowClassName="text-accent"
          title={<span className="text-ink-inverse">Pourquoi choisir PilotResto ?</span>}
          subtitle="Ce que la centralisation change concrètement, semaine après semaine."
          subtitleClassName="text-[#a1a1aa]"
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {advantages.map((a) => (
            <RevealItem key={a.title}>
              <div className="h-full rounded-(--radius-lg) border border-white/10 bg-white/[0.04] p-6">
                <CheckCircle2 size={20} className="text-accent" />
                <h3 className="mt-4 font-display text-[15.5px] font-semibold text-ink-inverse">
                  {a.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#a1a1aa]">
                  {a.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
