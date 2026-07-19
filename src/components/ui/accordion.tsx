"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-line rounded-(--radius-lg) border border-line bg-surface">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              >
                <span className="text-[15px] font-medium text-ink">
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "shrink-0 text-ink-subtle transition-transform duration-300",
                    isOpen && "rotate-180 text-accent-text"
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[14.5px] leading-[1.6] text-ink-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
