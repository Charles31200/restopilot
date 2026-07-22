import { Container } from "@/components/ui/container";
import { LegalHeader } from "@/components/legal/legal-header";
import { TableOfContents } from "@/components/legal/table-of-contents";
import { ReadingProgress } from "@/components/legal/reading-progress";
import { BackToTop } from "@/components/legal/back-to-top";
import type { LegalContent } from "@/lib/legal";

export function LegalLayout({ content }: { content: LegalContent }) {
  return (
    <div className="pt-32 pb-24 md:pt-40 md:pb-32">
      <ReadingProgress />

      <Container className="legal-print-width max-w-[1180px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_220px]">
          <div className="mx-auto w-full max-w-[900px] lg:mx-0">
            <LegalHeader
              title={content.title}
              description={content.description}
              lastUpdated={content.lastUpdated}
              readingMinutes={content.readingMinutes}
            />

            <article
              className="legal-prose"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          </div>

          <aside className="no-print hidden lg:block">
            <div className="sticky top-28">
              <TableOfContents headings={content.headings} />
            </div>
          </aside>
        </div>
      </Container>

      <BackToTop />
    </div>
  );
}
