import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/reveal";
import { faqs } from "@/content/site";

export function FAQ() {
  return (
    <section id="faq" className="border-t border-line py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Questions fréquentes"
          title="Tout ce que vous vous demandez"
          subtitle="Si votre question n'y est pas, écrivez-nous — on répond personnellement."
        />

        <Reveal delay={0.1} className="mx-auto mt-14 max-w-[720px]">
          <Accordion items={faqs} />
          <p className="mt-6 text-center text-[14px] text-ink-subtle">
            Une autre question ?{" "}
            <Link
              href="/contact"
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
            >
              Contactez l&apos;équipe
            </Link>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
