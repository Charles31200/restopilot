"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/content/site";

const fieldClasses =
  "w-full rounded-(--radius-sm) border border-line-strong bg-surface px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-ink-subtle transition-colors outline-none focus:border-blue focus:ring-2 focus:ring-blue-soft";

export function ContactForm() {
  const [form, setForm] = useState({
    phone: "",
    city: "",
    email: "",
    note: "",
  });

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = `Nouvelle demande de contact — ${form.city || "PilotResto"}`;
    const body = [
      `Téléphone : ${form.phone}`,
      `Ville du restaurant : ${form.city}`,
      `Adresse email : ${form.email}`,
      "",
      "Note :",
      form.note,
    ].join("\n");

    const mailto = `mailto:${site.contactEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  };

  return (
    <div className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Container className="max-w-[980px]">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Badge>Contact</Badge>
          </Reveal>
          <Reveal delay={0.06} className="mt-6 max-w-[560px]">
            <h1 className="text-balance font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[44px]">
              Parlons de votre restaurant
            </h1>
          </Reveal>
          <Reveal delay={0.12} className="mt-4 max-w-[480px]">
            <p className="text-balance text-[16px] leading-[1.6] text-ink-muted">
              Laissez-nous vos coordonnées et votre question, notre équipe
              vous répond personnellement.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-[1fr_320px]">
          <Reveal delay={0.1}>
            <form
              onSubmit={handleSubmit}
              className="rounded-(--radius-lg) border border-line bg-surface p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-[13px] font-medium text-ink">
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="06 12 34 56 78"
                    value={form.phone}
                    onChange={update("phone")}
                    className={fieldClasses}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="city" className="text-[13px] font-medium text-ink">
                    Ville du restaurant
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="Lyon"
                    value={form.city}
                    onChange={update("city")}
                    className={fieldClasses}
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="email" className="text-[13px] font-medium text-ink">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="vous@restaurant.fr"
                    value={form.email}
                    onChange={update("email")}
                    className={fieldClasses}
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="note" className="text-[13px] font-medium text-ink">
                    Votre question
                  </label>
                  <textarea
                    id="note"
                    required
                    rows={5}
                    placeholder="Dites-nous en plus sur votre établissement et ce que vous cherchez à résoudre."
                    value={form.note}
                    onChange={update("note")}
                    className={`${fieldClasses} resize-none`}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
                Envoyer le message
                <ArrowRight size={16} />
              </Button>

              <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-subtle">
                En envoyant ce formulaire, votre messagerie s&apos;ouvre avec
                un message pré-rempli à destination de notre équipe.
              </p>
            </form>
          </Reveal>

          <Reveal delay={0.16} className="flex flex-col gap-4">
            <div className="rounded-(--radius-lg) border border-line bg-canvas-alt p-6">
              <h2 className="font-display text-[15.5px] font-semibold text-ink">
                Nous contacter directement
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="flex items-center gap-2.5 text-[14px] text-ink-muted transition-colors hover:text-ink"
                >
                  <Mail size={16} className="shrink-0 text-ink-subtle" />
                  {site.contactEmail}
                </a>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-[14px] text-ink-muted transition-colors hover:text-ink"
                >
                  <InstagramIcon size={16} className="shrink-0 text-ink-subtle" />@
                  {site.instagramHandle}
                </a>
              </div>
              <p className="mt-4 border-t border-line pt-4 text-[12.5px] leading-[1.6] text-ink-subtle">
                {site.instagramBlurb}
              </p>
            </div>
            <p className="px-1 text-[13px] leading-[1.6] text-ink-subtle">
              On répond en général sous 24h ouvrées.
            </p>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
