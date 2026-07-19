import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
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
            <p className="max-w-[220px] text-[14px] leading-[1.6] text-ink-subtle">
              {site.tagline} Fait en France, pour les restaurateurs modernes.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PilotResto sur Instagram"
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-(--radius-sm) border border-line text-ink-subtle transition-colors hover:border-line-strong hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
              </svg>
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              Produit
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
