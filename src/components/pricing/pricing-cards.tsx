"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import type { PricingPlan } from "@/lib/stripe/pricing-service";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

const badgeLabel: Record<NonNullable<PricingPlan["badge"]>, string> = {
  populaire: "Le plus populaire",
  complet: "Le plus complet",
};

function redirectToCheckout(url: string) {
  window.location.href = url;
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(priceId: string) {
    setError(null);
    setLoadingPriceId(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Une erreur est survenue.");
      }
      redirectToCheckout(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoadingPriceId(null);
    }
  }

  if (plans.length === 0) {
    return (
      <div className="mx-auto mt-14 max-w-[560px] rounded-(--radius-lg) border border-line bg-surface p-8 text-center">
        <p className="text-[15px] text-ink-muted">
          Nos tarifs sont en cours de configuration. Contactez-nous pour
          connaître nos offres actuelles.
        </p>
        <Button href="/contact" size="md" className="mt-5">
          Nous contacter
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-line bg-surface p-1">
        {(["monthly", "annual"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setBilling(option)}
            className={cn(
              "relative rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors",
              billing === option ? "text-ink-inverse" : "text-ink-muted hover:text-ink"
            )}
          >
            {billing === option && (
              <span className="absolute inset-0 -z-10 rounded-full bg-ink transition-all duration-300" />
            )}
            {option === "monthly" ? "Mensuel" : "Annuel"}
            {option === "annual" && (
              <span className="ml-1.5 text-[11px] font-semibold text-success-text">
                −
                {Math.max(
                  ...plans.map((plan) =>
                    Math.round(
                      (1 -
                        plan.annual.unitAmount / 12 / plan.monthly.unitAmount) *
                        100
                    )
                  )
                )}
                %
              </span>
            )}
          </button>
        ))}
      </div>

      <RevealGroup className="mx-auto mt-10 grid max-w-[1000px] grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const current = billing === "monthly" ? plan.monthly : plan.annual;
          const monthlyEquivalent =
            billing === "annual" ? Math.round(plan.annual.unitAmount / 12) : current.unitAmount;
          const isPopular = plan.badge === "populaire";

          return (
            <RevealItem key={plan.productId} className="h-full">
              <div
                className={cn(
                  "flex h-full flex-col rounded-(--radius-lg) border bg-surface p-7",
                  isPopular
                    ? "border-ink shadow-[0_24px_60px_-30px_rgba(16,17,19,0.3)]"
                    : "border-line"
                )}
              >
                {plan.badge && (
                  <span className="mb-4 w-fit rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-ink-inverse">
                    {badgeLabel[plan.badge]}
                  </span>
                )}

                <h3 className="font-display text-[20px] font-semibold text-ink">
                  {plan.name}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.5] text-ink-muted">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-mono text-[34px] font-semibold tracking-tight text-ink">
                    {formatAmount(monthlyEquivalent, plan.currency)}
                  </span>
                  <span className="text-[14px] text-ink-muted">/ mois</span>
                </div>
                {billing === "annual" && (
                  <p className="mt-1 text-[12.5px] text-ink-subtle">
                    Facturé {formatAmount(current.unitAmount, plan.currency)} par an
                  </p>
                )}

                <p className="mt-3 text-[12.5px] font-medium text-success-text">
                  {current.trialDays} jours d&apos;essai gratuit · Aucun paiement aujourd&apos;hui
                </p>

                <Button
                  size="lg"
                  variant={isPopular ? "primary" : "secondary"}
                  className="mt-5 w-full"
                  disabled={loadingPriceId !== null}
                  onClick={() => handleCheckout(current.priceId)}
                >
                  {loadingPriceId === current.priceId ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Redirection…
                    </>
                  ) : (
                    "Commencer l'essai gratuit"
                  )}
                </Button>

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
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>

      {error && (
        <p className="mx-auto mt-6 max-w-[440px] rounded-(--radius-sm) bg-danger-soft px-4 py-3 text-center text-[13.5px] text-danger-text">
          {error}
        </p>
      )}

      <div className="mx-auto mt-10 flex max-w-[720px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-subtle">
        <span>✓ Paiement sécurisé par Stripe</span>
        <span>✓ Données hébergées en Europe</span>
        <span>✓ Résiliation à tout moment</span>
        <span>✓ Sans engagement</span>
        <span>✓ Support français</span>
      </div>

      <p className="mt-8 text-center text-[13.5px] text-ink-muted">
        Déjà client PilotResto ?{" "}
        <Link
          href="/login"
          className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
        >
          Connectez-vous pour gérer votre abonnement
        </Link>
      </p>
    </div>
  );
}
