import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LastUpdated } from "@/components/legal/last-updated";
import { EstimatedReadingTime } from "@/components/legal/estimated-reading-time";
import { DownloadPdfButton } from "@/components/legal/download-pdf-button";

export function LegalHeader({
  title,
  description,
  lastUpdated,
  readingMinutes,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  readingMinutes: number;
}) {
  return (
    <div className="pb-8">
      <nav aria-label="Fil d'Ariane" className="no-print">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-ink-subtle">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={13} />
          </li>
          <li>
            <Link href="/legal" className="transition-colors hover:text-ink">
              Légal
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={13} />
          </li>
          <li aria-current="page" className="text-ink-muted">
            {title}
          </li>
        </ol>
      </nav>

      <h1 className="mt-5 text-balance font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[42px]">
        {title}
      </h1>
      <p className="mt-3 max-w-[560px] text-[16px] leading-[1.6] text-ink-muted">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <LastUpdated date={lastUpdated} />
        <EstimatedReadingTime minutes={readingMinutes} />
        <DownloadPdfButton />
      </div>
    </div>
  );
}
