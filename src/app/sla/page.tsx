import type { Metadata } from "next";
import { getLegalMetadata } from "@/lib/legal";
import { LegalPageContent } from "@/components/legal/legal-page-content";

const SLUG = "sla";

export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata(SLUG);
}

export default function SLAPage() {
  return <LegalPageContent slug={SLUG} />;
}
