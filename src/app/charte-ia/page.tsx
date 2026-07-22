import type { Metadata } from "next";
import { getLegalMetadata } from "@/lib/legal";
import { LegalPageContent } from "@/components/legal/legal-page-content";

const SLUG = "charte-ia";

export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata(SLUG);
}

export default function AICharterPage() {
  return <LegalPageContent slug={SLUG} />;
}
