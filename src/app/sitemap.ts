import type { MetadataRoute } from "next";

const siteUrl = "https://pilotresto.pro";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/tarifs",
    "/demo",
    "/contact",
    "/legal",
    "/cgv",
    "/cgu",
    "/politique-confidentialite",
    "/politique-cookies",
    "/mentions-legales",
    "/dpa",
    "/sla",
    "/charte-ia",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
