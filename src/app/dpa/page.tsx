import type { Metadata } from "next";
import { getLegalMetadata } from "@/lib/legal";
import { LegalPageContent } from "@/components/legal/legal-page-content";

const SLUG = "dpa";

export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata(SLUG);
}

export default function DPAPage() {
  return <LegalPageContent slug={SLUG} />;
}
