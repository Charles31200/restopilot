import type { Metadata } from "next";
import { getLegalMetadata } from "@/lib/legal";
import { LegalPageContent } from "@/components/legal/legal-page-content";

const SLUG = "cgv";

export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata(SLUG);
}

export default function CGVPage() {
  return <LegalPageContent slug={SLUG} />;
}
