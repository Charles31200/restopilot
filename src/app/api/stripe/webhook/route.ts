import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AccessStatus, ProfileRow } from "@/lib/supabase/types";

/**
 * Syncs Stripe checkout/subscription/invoice events into the real,
 * pre-existing Supabase schema so a customer who pays through this site
 * gets the same access the real application grants. Billing lives on
 * `restaurants` (the confirmed access gate, via `access_status`) and
 * `subscriptions` (a fuller, newer table) — both are kept in sync on every
 * event, per explicit confirmation that the real app may still read either.
 */

const ACCESS_STATUS_MAP: Partial<Record<string, AccessStatus>> = {
  active: "active",
  canceled: "canceled",
  past_due: "past_due",
  unpaid: "past_due",
};

function mapAccessStatus(status: Stripe.Subscription.Status): AccessStatus {
  return ACCESS_STATUS_MAP[status] ?? "incomplete";
}

function toIso(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * `subscriptions.plan` / `restaurants.plan_id` store lowercase slugs (e.g.
 * existing rows use "starter"), matching the convention V3 already uses via
 * its own `getPlanByPriceId()`. Fixed mapping, not derived — only one plan
 * is active (the duplicate "PilotResto" product was archived), so this is
 * a single entry. Add a new one here if a second plan is ever sold.
 */
const PLAN_BY_PRICE_ID: Record<string, string> = {
  price_1TybXBEw9od5qGxlKJ836Msf: "pro", // "🔵 Pro", 29€/mois — prod_UyYez7Zvx4F06K
};

function resolvePlanSlug(subscription: Stripe.Subscription): string | null {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;
  return PLAN_BY_PRICE_ID[priceId] ?? null;
}

async function findOrCreateAuthUser(email: string, appOrigin: string) {
  const admin = getSupabaseAdminClient();

  const invited = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appOrigin}/connexion`,
  });
  if (invited.data.user) return invited.data.user;

  // Most likely cause of failure: the user already exists. Look them up
  // instead of failing the whole webhook (there's no direct
  // get-user-by-email in the admin API).
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }

  throw new Error(`Impossible de créer ou retrouver le compte pour ${email}`);
}

async function getRestaurantIdForUser(userId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("restaurant_id")
    .eq("id", userId)
    .single<Pick<ProfileRow, "restaurant_id">>();
  return data?.restaurant_id ?? null;
}

async function syncBillingToRestaurant(params: {
  restaurantId: string;
  customerId: string;
  subscription: Stripe.Subscription;
}) {
  const admin = getSupabaseAdminClient();
  const { restaurantId, customerId: custId, subscription } = params;
  const item = subscription.items.data[0];
  const plan = resolvePlanSlug(subscription);
  const access = mapAccessStatus(subscription.status);
  const periodEnd = toIso(item?.current_period_end ?? null);

  const { error: restaurantError } = await admin
    .from("restaurants")
    .update({
      stripe_customer_id: custId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      access_status: access,
      past_due_since: access === "past_due" ? new Date().toISOString() : null,
      ...(plan ? { plan_id: plan } : {}),
    })
    .eq("id", restaurantId);

  if (restaurantError) {
    throw new Error(`Échec de synchronisation du restaurant : ${restaurantError.message}`);
  }

  const { error: subscriptionError } = await admin
    .from("subscriptions")
    .update({
      stripe_customer_id: custId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan,
      current_period_end: periodEnd,
      has_payment_method: true,
    })
    .eq("restaurant_id", restaurantId);

  if (subscriptionError) {
    console.error("Failed to sync subscriptions table:", subscriptionError.message);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, appOrigin: string) {
  if (session.mode !== "subscription" || !session.subscription || !session.customer) return;

  const stripe = getStripeClient();
  const custId = customerId(session.customer);
  if (!custId) return;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const email = session.customer_details?.email ?? session.customer_email;

  // Primary path: the checkout session was created by an authenticated
  // user (see /api/stripe/create-checkout-session), so client_reference_id
  // is the Supabase user id — resolve their restaurant via `profiles`.
  let userId = session.client_reference_id;

  if (!userId) {
    // Fallback for sessions created outside that flow (e.g. a manual test
    // from the Stripe Dashboard): find or create the account by email.
    if (!email) return;
    const user = await findOrCreateAuthUser(email, appOrigin);
    userId = user.id;
  }

  const restaurantId = await getRestaurantIdForUser(userId);
  if (!restaurantId) {
    console.error(`No restaurant found for user ${userId} — cannot sync billing.`);
    return;
  }

  await syncBillingToRestaurant({ restaurantId, customerId: custId, subscription });
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const admin = getSupabaseAdminClient();
  const custId = customerId(subscription.customer);
  if (!custId) return;

  // Matched by stripe_customer_id (already synced by checkout.session.completed),
  // not restaurant_id — this event doesn't carry a Supabase user reference.
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id")
    .eq("stripe_customer_id", custId)
    .single<{ id: string }>();

  if (!restaurant) {
    console.error(`No restaurant found for Stripe customer ${custId}.`);
    return;
  }

  await syncBillingToRestaurant({ restaurantId: restaurant.id, customerId: custId, subscription });
}

async function updateAccessStatusByCustomer(custId: string, access: AccessStatus) {
  const admin = getSupabaseAdminClient();

  const { error: restaurantError } = await admin
    .from("restaurants")
    .update({
      access_status: access,
      past_due_since: access === "past_due" ? new Date().toISOString() : null,
    })
    .eq("stripe_customer_id", custId);
  if (restaurantError) console.error("Failed to sync restaurants access_status:", restaurantError.message);

  const { error: subscriptionError } = await admin
    .from("subscriptions")
    .update({ status: access === "active" ? "active" : "past_due" })
    .eq("stripe_customer_id", custId);
  if (subscriptionError) console.error("Failed to sync subscriptions status:", subscriptionError.message);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const custId = customerId(invoice.customer);
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  if (!custId || !subscriptionRef) return;

  await updateAccessStatusByCustomer(custId, "active");
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const custId = customerId(invoice.customer);
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  if (!custId || !subscriptionRef) return;

  await updateAccessStatusByCustomer(custId, "past_due");
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 500 });
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, request.nextUrl.origin);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: "Échec du traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
