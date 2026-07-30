import "server-only";
import Stripe from "stripe";

let instance: Stripe | null = null;

/**
 * Lazily creates the Stripe client on first use rather than at module import
 * time. This lets pages that render pricing data fail gracefully (catchable
 * try/catch) when STRIPE_SECRET_KEY isn't configured yet, instead of
 * crashing the whole build/render.
 */
export function getStripeClient(): Stripe {
  if (instance) return instance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Add it to .env.local (see src/lib/stripe/pricing-service.ts for the Product/Price setup this integration expects)."
    );
  }

  instance = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });
  return instance;
}
