import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRestaurantId } from "@/lib/supabase/restaurant";
import type { RestaurantRow } from "@/lib/supabase/types";

/**
 * Opens the Stripe Customer Portal for the authenticated user's restaurant —
 * payment method, invoices, and subscription cancellation all live there,
 * so the site doesn't reimplement Stripe's own billing UI.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const restaurantId = await getRestaurantId(supabase, user.id);
  const { data: restaurant } = restaurantId
    ? await supabase
        .from("restaurants")
        .select("stripe_customer_id")
        .eq("id", restaurantId)
        .single<Pick<RestaurantRow, "stripe_customer_id">>()
    : { data: null };

  if (!restaurant?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun compte de facturation associé à ce compte." },
      { status: 404 }
    );
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: restaurant.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe customer portal session creation failed:", error);
    return NextResponse.json(
      { error: "Impossible d'ouvrir l'espace de facturation. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
