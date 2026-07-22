"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export function FooterAccordion({ columns }: { columns: FooterColumn[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-line border-y border-line sm:hidden">
      {columns.map((column, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={column.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
                {column.title}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-ink-subtle transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <ul className="flex flex-col gap-3 pb-4">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-ink-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
