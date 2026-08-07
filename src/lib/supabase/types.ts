/**
 * Hand-written types for the real, pre-existing tables this integration
 * reads and writes — confirmed live against the shared Supabase project
 * (same one the real PilotResto application uses). There is no `profiles`
 * table dedicated to this site; billing lives on `restaurants` and
 * `subscriptions`, both keyed by `restaurant_id`, with `profiles` mapping
 * a Supabase auth user to their restaurant. Replace with generated types
 * (`supabase gen types typescript`) when convenient.
 *
 * `restaurants.access_status` is the confirmed access gate the real
 * application also reads — kept in sync with `subscriptions.status` (a
 * fuller, newer table) on every Stripe webhook event, per explicit
 * confirmation that both must stay consistent.
 */

/** Normalized gate value written to `restaurants.access_status`. */
export type AccessStatus = "trial" | "active" | "past_due" | "canceled" | "incomplete";

export function hasActiveAccess(accessStatus: AccessStatus | string | null): boolean {
  return accessStatus === "active" || accessStatus === "past_due";
}

export type ProfileRow = {
  id: string;
  restaurant_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  employee_id: string | null;
  is_active: boolean;
  created_at: string;
};

export type RestaurantRow = {
  id: string;
  name: string | null;
  siret: string | null;
  address: string | null;
  timezone: string | null;
  plan_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  /** Raw Stripe subscription status string (e.g. "active", "past_due"). */
  subscription_status: string | null;
  /** Normalized access gate — see AccessStatus. */
  access_status: AccessStatus;
  trial_ends_at: string | null;
  past_due_since: string | null;
  accountant_email: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionTableRow = {
  id: string;
  user_id: string | null;
  restaurant_id: string;
  /** Raw Stripe subscription status string. */
  status: string | null;
  plan: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  trial_end: string | null;
  has_payment_method: boolean;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};
