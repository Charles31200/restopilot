"use client";

import { useState } from "react";
import { CreditCard, FileText, Settings2, Loader2 } from "lucide-react";

type ButtonKey = "payment-method" | "invoices" | "manage";

const buttons: { key: ButtonKey; label: string; icon: typeof CreditCard }[] = [
  { key: "payment-method", label: "Changer mon moyen de paiement", icon: CreditCard },
  { key: "invoices", label: "Télécharger mes factures", icon: FileText },
  { key: "manage", label: "Gérer mon abonnement", icon: Settings2 },
];

function redirectTo(url: string) {
  window.location.href = url;
}

export function BillingPortalButtons() {
  const [loading, setLoading] = useState<ButtonKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openPortal(key: ButtonKey) {
    setError(null);
    setLoading(key);
    try {
      const res = await fetch("/api/stripe/customer-portal", { method: "POST" });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Une erreur est survenue.");
      }
      redirectTo(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {buttons.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          disabled={loading !== null}
          onClick={() => openPortal(key)}
          className="flex items-center justify-between gap-3 rounded-(--radius-sm) border border-line-strong px-4 py-3 text-left text-[14px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          <span className="flex items-center gap-2.5">
            <Icon size={16} className="text-ink-subtle" />
            {label}
          </span>
          {loading === key && <Loader2 size={15} className="animate-spin text-ink-subtle" />}
        </button>
      ))}
      {error && <p className="text-[13px] text-danger-text">{error}</p>}
    </div>
  );
}
