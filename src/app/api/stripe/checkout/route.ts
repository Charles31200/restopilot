import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripeClient } from "@/lib/stripe/client";
import { findPriceOrThrow } from "@/lib/stripe/pricing-service";

const checkoutSchema = z.object({
  priceId: z.string().min(1),
});

const DEFAULT_TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? "30");

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 }
    );
  }

  try {
    const price = await findPriceOrThrow(parsed.data.priceId);
    const origin = request.nextUrl.origin;
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: {
        trial_period_days: price.recurring?.trial_period_days ?? DEFAULT_TRIAL_DAYS,
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/tarifs?checkout=success`,
      cancel_url: `${origin}/tarifs?checkout=cancel`,
    });

    if (!session.url) {
      throw new Error("Stripe n'a pas retourné d'URL de paiement.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
