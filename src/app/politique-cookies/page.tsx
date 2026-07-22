import type { Metadata } from "next";
import { getLegalMetadata } from "@/lib/legal";
import { LegalPageContent } from "@/components/legal/legal-page-content";

const SLUG = "politique-cookies";

export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata(SLUG);
}

export default function CookiesPage() {
  return <LegalPageContent slug={SLUG} />;
}
