"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import type { PrimaryPlan } from "@/lib/stripe/pricing-service";

function redirectTo(url: string) {
  window.location.href = url;
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function PricingCard({ plan }: { plan: PrimaryPlan | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!plan) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId }),
      });
      const data: { url?: string; error?: string; redirect?: string } = await res.json();

      if (res.status === 401 && data.redirect) {
        router.push(data.redirect);
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Une erreur est survenue.");
      }
      redirectTo(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-[440px] rounded-(--radius-lg) border border-line bg-surface p-8 text-center">
        <p className="text-[15px] text-ink-muted">
          Notre offre est en cours de configuration. Contactez-nous pour en
          savoir plus.
        </p>
        <Button href="/contact" size="md" className="mt-5">
          Nous contacter
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Reveal className="mx-auto max-w-[420px]">
        <div className="rounded-(--radius-lg) border border-ink bg-surface p-8 shadow-[0_32px_72px_-32px_rgba(16,17,19,0.32)] md:p-10">
          <h3 className="font-display text-[22px] font-semibold text-ink">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-muted">
              {plan.description}
            </p>
          )}

          <div className="mt-7 flex items-baseline gap-1.5">
            <span className="font-mono text-[44px] font-semibold tracking-tight text-ink">
              {formatAmount(plan.unitAmount, plan.currency)}
            </span>
            <span className="text-[15px] text-ink-muted">/ mois</span>
          </div>
          <p className="mt-2 text-[13px] font-medium text-success-text">
            Sans engagement · Facturation mensuelle
          </p>

          <Button
            size="lg"
            className="mt-7 w-full"
            disabled={loading}
            onClick={handleCheckout}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirection…
              </>
            ) : (
              "Commencer maintenant"
            )}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-subtle">
            <ShieldCheck size={14} />
            Paiement sécurisé par Stripe
          </p>

          {plan.marketingFeatures.length > 0 && (
            <ul className="mt-7 flex flex-col gap-3 border-t border-line pt-6">
              {plan.marketingFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] text-ink-muted"
                >
                  <Check size={16} className="mt-0.5 shrink-0 text-ink" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      {error && (
        <p className="mx-auto mt-6 max-w-[420px] rounded-(--radius-sm) bg-danger-soft px-4 py-3 text-center text-[13.5px] text-danger-text">
          {error}
        </p>
      )}

      <div className="mx-auto mt-8 flex max-w-[520px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-subtle">
        <span>✓ Toutes les fonctionnalités incluses</span>
        <span>✓ Données hébergées en Europe</span>
        <span>✓ Résiliation à tout moment</span>
        <span>✓ Support français</span>
      </div>

      <p className="mt-8 text-center text-[13.5px] text-ink-muted">
        Déjà client PilotResto ?{" "}
        <Link
          href="/connexion"
          className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
        >
          Connectez-vous
        </Link>
      </p>
    </div>
  );
}
