import "server-only";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";

/**
 * StripePricingService — the single source of truth for pricing data on the
 * marketing site. Nothing here is hardcoded: the plan name, price, currency
 * and feature list are all read live from Stripe so the website can never
 * drift from what's configured in the Stripe Dashboard (the same account the
 * real application bills against).
 *
 * PilotResto now sells a single monthly plan. Expected Stripe Dashboard
 * setup: exactly one active Product with `marketing_features` (the bullet
 * list shown on the card) and exactly one active recurring monthly Price.
 * If several active Products exist, the first one found is used — clean up
 * the account to a single Product to avoid ambiguity.
 */

export type PrimaryPlan = {
  productId: string;
  name: string;
  description: string;
  marketingFeatures: string[];
  currency: string;
  priceId: string;
  unitAmount: number;
};

export async function getPrimaryPlan(): Promise<PrimaryPlan | null> {
  const stripe = getStripeClient();
  const products = await stripe.products.list({
    active: true,
    limit: 20,
  });

  for (const product of products.data) {
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 20,
    });

    const monthlyPrice = prices.data.find(
      (price) => price.active && price.recurring?.interval === "month"
    );

    if (!monthlyPrice || monthlyPrice.unit_amount == null) continue;

    return {
      productId: product.id,
      name: product.name,
      description: product.description ?? "",
      marketingFeatures: product.marketing_features
        .map((feature) => feature.name)
        .filter((name): name is string => Boolean(name)),
      currency: monthlyPrice.currency,
      priceId: monthlyPrice.id,
      unitAmount: monthlyPrice.unit_amount,
    };
  }

  return null;
}

export async function findPriceOrThrow(priceId: string): Promise<Stripe.Price> {
  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(priceId);
  if (!price.active) {
    throw new Error("Ce tarif n'est plus disponible.");
  }
  return price;
}
