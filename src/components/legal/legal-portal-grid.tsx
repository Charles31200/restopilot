"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  SearchX,
  ArrowRight,
  FileText,
  FileCheck2,
  Lock,
  Cookie,
  Scale,
  ShieldCheck,
  Activity,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LastUpdated } from "@/components/legal/last-updated";
import type { LegalDocMeta } from "@/lib/legal";

const icons: Record<string, LucideIcon> = {
  FileText,
  FileCheck2,
  Lock,
  Cookie,
  Scale,
  ShieldCheck,
  Activity,
  BrainCircuit,
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export type LegalPortalDoc = {
  meta: LegalDocMeta;
  lastUpdated: string;
  searchText: string;
};

export function LegalPortalGrid({ docs }: { docs: LegalPortalDoc[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return docs;
    return docs.filter((doc) => normalize(doc.searchText).includes(q));
  }, [docs, query]);

  return (
    <div>
      <div className="relative mx-auto max-w-[440px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans les documents juridiques…"
          aria-label="Rechercher dans les documents juridiques"
          className="pl-10"
        />
      </div>

      <motion.div
        layout
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((doc) => {
            const Icon = icons[doc.meta.icon] ?? FileText;
            return (
              <motion.div
                key={doc.meta.slug}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/${doc.meta.slug}`}
                  className="group flex h-full flex-col rounded-(--radius-lg) border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_20px_48px_-24px_rgba(16,17,19,0.28)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-ink text-ink-inverse transition-transform duration-300 group-hover:scale-105">
                    <Icon size={19} />
                  </span>
                  <h2 className="mt-5 font-display text-[17px] font-semibold text-ink">
                    {doc.meta.title}
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.6] text-ink-muted">
                    {doc.meta.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <LastUpdated date={doc.lastUpdated} />
                    <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink transition-colors group-hover:text-blue">
                      Consulter
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <SearchX size={28} className="text-ink-subtle" />
          <p className="mt-4 text-[15px] text-ink-muted">
            Aucun document ne correspond à « {query} ».
          </p>
        </div>
      )}
    </div>
  );
}
