import { getLegalContent } from "@/lib/legal";
import { LegalLayout } from "@/components/legal/legal-layout";

const SITE_URL = "https://pilotresto.pro";

export async function LegalPageContent({ slug }: { slug: string }) {
  const content = await getLegalContent(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.description,
    dateModified: content.lastUpdated,
    inLanguage: "fr-FR",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Légal", item: `${SITE_URL}/legal` },
        {
          "@type": "ListItem",
          position: 3,
          name: content.title,
          item: `${SITE_URL}/${slug}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalLayout content={content} />
    </>
  );
}
