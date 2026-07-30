import "server-only";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";

/**
 * StripePricingService — the single source of truth for pricing data on the
 * marketing site. Nothing here is hardcoded: plan names, prices, currency,
 * billing periods, Price IDs and feature lists are all read live from Stripe
 * so the website can never drift from what's configured in the Stripe
 * Dashboard (the same account the real application bills against).
 *
 * Expected Stripe Dashboard setup, per plan Product:
 * - `marketing_features`: short bullet list shown on the pricing card.
 * - `metadata.order`: "1" | "2" | "3" — left-to-right sort order.
 * - `metadata.badge`: "populaire" | "complet" (optional).
 * - `metadata.comparison`: a JSON object mapping comparison-table row keys
 *   (see COMPARISON_ROWS below) to "yes" | "no" | "premium", e.g.
 *   {"stock":"yes","api":"no","ia_avancee":"premium"}.
 * - Exactly one recurring monthly Price and one recurring annual Price per
 *   Product, both active.
 */

export const COMPARISON_ROWS: { key: string; label: string }[] = [
  { key: "stock", label: "Gestion des stocks" },
  { key: "recettes", label: "Fiches recettes & coûts matière" },
  { key: "reservations", label: "Réservations" },
  { key: "planning", label: "Planning des équipes" },
  { key: "caisse", label: "Connexion caisse (POS)" },
  { key: "dashboard", label: "Tableau de bord temps réel" },
  { key: "rapports", label: "Rapports & exports" },
  { key: "ia_briefing", label: "Briefing quotidien IA" },
  { key: "ia_missions", label: "Missions IA" },
  { key: "ia_recettes", label: "Analyse IA des recettes" },
  { key: "ia_concurrence", label: "Analyse de la concurrence" },
  { key: "ia_fournisseurs", label: "Recherche de fournisseurs IA" },
  { key: "ia_objectifs", label: "Objectifs & prévisions IA" },
  { key: "multi_etablissement", label: "Multi-établissements" },
  { key: "support", label: "Support prioritaire" },
  { key: "api", label: "Accès API" },
];

export type ComparisonValue = "yes" | "no" | "premium";

export type PricingPlan = {
  productId: string;
  name: string;
  description: string;
  badge?: "populaire" | "complet";
  order: number;
  marketingFeatures: string[];
  comparison: Record<string, ComparisonValue>;
  currency: string;
  monthly: { priceId: string; unitAmount: number; trialDays: number };
  annual: { priceId: string; unitAmount: number; trialDays: number };
};

const DEFAULT_TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? "30");

function parseComparison(raw: string | undefined): Record<string, ComparisonValue> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const result: Record<string, ComparisonValue> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === "yes" || value === "no" || value === "premium") {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function pickInterval(
  prices: Stripe.Price[],
  interval: "month" | "year"
): Stripe.Price | undefined {
  return prices.find(
    (price) => price.active && price.recurring?.interval === interval
  );
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const stripe = getStripeClient();
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: 20,
  });

  const plans = await Promise.all(
    products.data.map(async (product): Promise<PricingPlan | null> => {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 20,
      });

      const monthlyPrice = pickInterval(prices.data, "month");
      const annualPrice = pickInterval(prices.data, "year");

      if (!monthlyPrice || !annualPrice) return null;
      if (monthlyPrice.unit_amount == null || annualPrice.unit_amount == null) {
        return null;
      }

      const badgeRaw = product.metadata.badge;
      const badge =
        badgeRaw === "populaire" || badgeRaw === "complet" ? badgeRaw : undefined;

      return {
        productId: product.id,
        name: product.name,
        description: product.description ?? "",
        badge,
        order: Number(product.metadata.order ?? "99"),
        marketingFeatures: product.marketing_features
          .map((feature) => feature.name)
          .filter((name): name is string => Boolean(name)),
        comparison: parseComparison(product.metadata.comparison),
        currency: monthlyPrice.currency,
        monthly: {
          priceId: monthlyPrice.id,
          unitAmount: monthlyPrice.unit_amount,
          trialDays: monthlyPrice.recurring?.trial_period_days ?? DEFAULT_TRIAL_DAYS,
        },
        annual: {
          priceId: annualPrice.id,
          unitAmount: annualPrice.unit_amount,
          trialDays: annualPrice.recurring?.trial_period_days ?? DEFAULT_TRIAL_DAYS,
        },
      };
    })
  );

  return plans
    .filter((plan): plan is PricingPlan => plan !== null)
    .sort((a, b) => a.order - b.order);
}

export async function findPriceOrThrow(priceId: string): Promise<Stripe.Price> {
  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(priceId);
  if (!price.active) {
    throw new Error("Ce tarif n'est plus disponible.");
  }
  return price;
}
