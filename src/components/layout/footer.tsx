import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { nav, site } from "@/content/site";

const legal = [
  { label: "CGU / CGV", href: "/cgu" },
  { label: "Confidentialité", href: "/confidentialite" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <Logo />
            <p className="max-w-[240px] text-[14px] leading-[1.6] text-ink-subtle">
              {site.tagline} Fait en France, pour les restaurateurs modernes.
            </p>
            <div className="mt-1 flex flex-col gap-2">
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PilotResto sur Instagram"
                className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                <InstagramIcon size={17} />
                @{site.instagramHandle}
              </a>
              <p className="max-w-[240px] text-[12.5px] leading-[1.5] text-ink-subtle">
                {site.instagramBlurb}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              Navigation
            </span>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[14px] text-ink-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              Légal
            </span>
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[14px] text-ink-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              Contact
            </span>
            <a
              href={`mailto:${site.contactEmail}`}
              className="text-[14px] text-ink-muted transition-colors hover:text-ink"
            >
              {site.contactEmail}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-6 text-[13px] text-ink-subtle md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} PilotResto. Tous droits réservés.</span>
          <span>Hébergé en France</span>
        </div>
      </Container>
    </footer>
  );
}
