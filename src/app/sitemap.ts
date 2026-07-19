import type { MetadataRoute } from "next";

const siteUrl = "https://pilotresto.pro";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/tarifs", "/cgu", "/confidentialite"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
