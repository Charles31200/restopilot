import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { FooterAccordion } from "@/components/layout/footer-accordion";
import { site } from "@/content/site";

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/#fonctionnalites" },
      { label: "Tarifs", href: "/tarifs" },
      { label: "Démonstration", href: "/demo" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Centre juridique", href: "/legal" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGV", href: "/cgv" },
      { label: "CGU", href: "/cgu" },
      { label: "Politique de confidentialité", href: "/politique-confidentialite" },
      { label: "Cookies", href: "/politique-cookies" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "DPA", href: "/dpa" },
      { label: "SLA", href: "/sla" },
      { label: "Charte IA", href: "/charte-ia" },
    ],
  },
  {
    title: "Entreprise",
    links: [{ label: "Contact", href: "/contact" }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <Container className="py-16">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-[320px] text-[14px] leading-[1.6] text-ink-subtle">
            Le copilote intelligent des restaurateurs.
          </p>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PilotResto sur Instagram"
            className="mt-1 inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <InstagramIcon size={17} />
            @{site.instagramHandle}
          </a>
        </div>

        <div className="mt-12 hidden grid-cols-2 gap-10 sm:grid lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
                {column.title}
              </span>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[14px] text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <FooterAccordion columns={columns} />
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-6 text-[13px] text-ink-subtle sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} PilotResto. Tous droits réservés.</span>
          <span>Conçu avec ❤️ en France</span>
        </div>
      </Container>
    </footer>
  );
}
