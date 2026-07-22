"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LegalHeading } from "@/lib/legal";

export function TableOfContents({ headings }: { headings: LegalHeading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Sommaire" className="no-print">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
        Sommaire
      </span>
      <ul className="mt-4 flex flex-col gap-0.5 border-l border-line">
        {headings.map((h) => {
          const isActive = h.id === activeId;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 text-[13.5px] leading-[1.4] transition-colors",
                  h.depth === 3 ? "pl-8" : "pl-4",
                  isActive
                    ? "border-ink font-medium text-ink"
                    : "border-transparent text-ink-subtle hover:text-ink"
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
