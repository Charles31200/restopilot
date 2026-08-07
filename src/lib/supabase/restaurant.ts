import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@/lib/supabase/types";

/**
 * Resolves the restaurant a Supabase auth user belongs to. Billing lives on
 * `restaurants`/`subscriptions` (keyed by restaurant_id), not on the user
 * directly — `profiles` is what maps a user to their restaurant.
 */
export async function getRestaurantId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("id", userId)
    .single<Pick<ProfileRow, "restaurant_id">>();

  return data?.restaurant_id ?? null;
}
