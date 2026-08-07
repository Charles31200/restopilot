"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { PricingDeviceMockup } from "@/components/pricing/pricing-device-mockup";
import { proPlanFeatures } from "@/content/site";
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

const ctaClass =
  "w-full h-14 rounded-(--radius-md) text-[13px] font-semibold uppercase tracking-[0.08em]";

export function PricingCard({ plan }: { plan: PrimaryPlan | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stripe checkout logic is unchanged from before this redesign — only the
  // markup around it changed.
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
      <Reveal className="mx-auto max-w-[460px]">
        <div className="overflow-hidden rounded-(--radius-xl) border border-line shadow-[0_40px_80px_-32px_rgba(16,17,19,0.35)]">
          {/* Dark visual header */}
          <div className="relative overflow-hidden bg-ink px-8 pb-9 pt-10 sm:px-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[-140px] h-[280px] w-[420px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-[100px]"
            />

            <div className="relative text-center">
              <span className="font-display text-[38px] font-bold tracking-[0.1em] text-white sm:text-[44px]">
                PRO
              </span>
              <p className="mt-1.5 text-[15px] text-white/60">
                Pour {formatAmount(plan.unitAmount, plan.currency)} par mois
              </p>
            </div>

            <div className="relative mt-8">
              <PricingDeviceMockup />
            </div>
          </div>

          {/* White body */}
          <div className="bg-surface px-8 py-8 sm:px-10 sm:py-9">
            <ul className="flex flex-col divide-y divide-line">
              {proPlanFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 py-3.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className="text-[14.5px] text-ink">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-baseline gap-1.5">
              <span className="font-mono text-[36px] font-bold tracking-tight text-ink sm:text-[40px]">
                {formatAmount(plan.unitAmount, plan.currency)}
              </span>
              <span className="text-[15px] text-ink-muted">/ mois</span>
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-success-text">
              Sans engagement • Facturation mensuelle
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={handleCheckout}
              className={`${ctaClass} mt-6 inline-flex items-center justify-center gap-2 bg-ink text-white transition-all duration-200 ease-out hover:bg-[#1c1c1f] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-2`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Redirection…
                </>
              ) : (
                "Commencer maintenant"
              )}
            </button>

            <Button href="#fonctionnalites" variant="secondary" className={`${ctaClass} mt-3`}>
              En savoir plus
            </Button>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-subtle">
              <Lock size={12} />
              Paiement sécurisé par Stripe
            </p>
          </div>
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
