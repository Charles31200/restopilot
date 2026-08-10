import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripeClient } from "@/lib/stripe/client";
import { findPriceOrThrow } from "@/lib/stripe/pricing-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRestaurantId } from "@/lib/supabase/restaurant";
import type { RestaurantRow } from "@/lib/supabase/types";

const checkoutSchema = z.object({
  priceId: z.string().min(1),
});

/**
 * Creates a Stripe Checkout Session for the authenticated user. Auth is
 * verified here, server-side — the frontend never decides who's allowed to
 * subscribe. `client_reference_id` links the session back to the Supabase
 * user so the webhook can resolve their restaurant and update it directly,
 * instead of guessing an account from the checkout email.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour vous abonner.", redirect: "/inscription" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const price = await findPriceOrThrow(parsed.data.priceId);
    const origin = request.nextUrl.origin;
    const stripe = getStripeClient();

    const restaurantId = await getRestaurantId(supabase, user.id);
    let existingCustomerId: string | null = null;

    if (restaurantId) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("stripe_customer_id")
        .eq("id", restaurantId)
        .single<Pick<RestaurantRow, "stripe_customer_id">>();
      existingCustomerId = restaurant?.stripe_customer_id ?? null;
    }

    // Premier mois offert : le nombre de jours d'essai vient de STRIPE_TRIAL_DAYS
    // (.env.local / variables d'environnement Vercel), avec un repli à 30 jours si absent.
    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS) || 30;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: user.id,
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email }),
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: { trial_period_days: trialDays },
      success_url: `${origin}/dashboard?checkout=success`,
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
