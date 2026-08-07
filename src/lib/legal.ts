import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import readingTime from "reading-time";
import type { Element, Root } from "hast";
import type { Metadata } from "next";

export type LegalDocMeta = {
  slug: string;
  file: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
};

export const legalDocs: LegalDocMeta[] = [
  {
    slug: "cgv",
    file: "cgv.md",
    title: "Conditions Générales de Vente",
    shortTitle: "CGV",
    description: "Les conditions applicables à la souscription et à l'utilisation payante de PilotResto.",
    icon: "FileText",
  },
  {
    slug: "cgu",
    file: "cgu.md",
    title: "Conditions Générales d'Utilisation",
    shortTitle: "CGU",
    description: "Les règles d'accès et d'usage de la plateforme PilotResto.",
    icon: "FileCheck2",
  },
  {
    slug: "politique-confidentialite",
    file: "privacy.md",
    title: "Politique de confidentialité",
    shortTitle: "Confidentialité",
    description: "Comment PilotResto collecte, utilise et protège les données personnelles.",
    icon: "Lock",
  },
  {
    slug: "politique-cookies",
    file: "cookies.md",
    title: "Politique de cookies",
    shortTitle: "Cookies",
    description: "Les cookies et traceurs utilisés sur le site et l'application PilotResto.",
    icon: "Cookie",
  },
  {
    slug: "mentions-legales",
    file: "mentions.md",
    title: "Mentions légales",
    shortTitle: "Mentions légales",
    description: "Informations légales relatives à l'éditeur et à l'hébergement du site PilotResto.",
    icon: "Scale",
  },
  {
    slug: "dpa",
    file: "dpa.md",
    title: "Data Processing Agreement",
    shortTitle: "DPA",
    description: "Accord de traitement des données entre PilotResto et ses clients.",
    icon: "ShieldCheck",
  },
  {
    slug: "sla",
    file: "sla.md",
    title: "Service Level Agreement",
    shortTitle: "SLA",
    description: "Les engagements de disponibilité et de support de la plateforme PilotResto.",
    icon: "Activity",
  },
  {
    slug: "charte-ia",
    file: "ai-charter.md",
    title: "Charte de l'intelligence artificielle",
    shortTitle: "Charte IA",
    description: "Les principes qui encadrent l'usage de l'intelligence artificielle chez PilotResto.",
    icon: "BrainCircuit",
  },
];

export function getLegalDocMeta(slug: string): LegalDocMeta | undefined {
  return legalDocs.find((d) => d.slug === slug);
}

export type LegalHeading = {
  depth: 2 | 3;
  text: string;
  id: string;
};

export type LegalContent = {
  title: string;
  description: string;
  lastUpdated: string;
  html: string;
  plainText: string;
  headings: LegalHeading[];
  readingMinutes: number;
};

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

/** Wraps paragraphs starting with the 📝 marker into a distinct callout block. */
function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "p") return;
      const text = hastToString(node);
      if (!text.trimStart().startsWith("📝")) return;

      node.tagName = "div";
      node.properties = { ...node.properties, className: ["legal-callout"] };

      const first = node.children[0];
      if (first && first.type === "text") {
        first.value = first.value.replace(/^\s*📝\s*/, "");
      }
    });
  };
}

/** Wraps every <table> in a scrollable container for responsive layouts. */
function rehypeWrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node],
      };
      (parent as Element).children[index] = wrapper;
    });
  };
}

function collectHeadings(tree: Root): LegalHeading[] {
  const headings: LegalHeading[] = [];
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "h2" && node.tagName !== "h3") return;
    const id = (node.properties?.id as string) || "";
    const text = hastToString(node);
    if (!id || !text) return;
    headings.push({ depth: node.tagName === "h2" ? 2 : 3, text, id });
  });
  return headings;
}

export async function getLegalContent(slug: string): Promise<LegalContent> {
  const meta = getLegalDocMeta(slug);
  if (!meta) {
    throw new Error(`Unknown legal doc slug: ${slug}`);
  }

  const raw = fs.readFileSync(path.join(LEGAL_DIR, meta.file), "utf-8");
  const { data, content } = matter(raw);

  let headings: LegalHeading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(() => (tree: Root) => {
      headings = collectHeadings(tree);
    })
    .use(rehypeCallouts)
    .use(rehypeWrapTables)
    .use(rehypeStringify)
    .process(content);

  const stats = readingTime(content, { wordsPerMinute: 200 });

  const plainText = content
    .replace(/📝/g, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: data.title ?? meta.title,
    description: data.description ?? meta.description,
    lastUpdated: data.lastUpdated ?? "",
    html: String(file),
    plainText,
    headings,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

export function getAllLegalContent(): Promise<
  { meta: LegalDocMeta; content: LegalContent }[]
> {
  return Promise.all(
    legalDocs.map(async (meta) => ({
      meta,
      content: await getLegalContent(meta.slug),
    }))
  );
}

const SITE_URL = "https://restopilot.pro";

export async function getLegalMetadata(slug: string): Promise<Metadata> {
  const content = await getLegalContent(slug);
  const url = `${SITE_URL}/${slug}`;

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: content.title,
      description: content.description,
      siteName: "PilotResto",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary",
      title: content.title,
      description: content.description,
    },
  };
}
