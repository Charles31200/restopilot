import "server-only";
import { createClient } from "@supabase/supabase-js";

// No generated Database types yet (see supabase/migrations) — `any` is the
// documented interim until `supabase gen types` runs against the real schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: ReturnType<typeof createClient<any>> | null = null;

/**
 * Service-role Supabase client — bypasses Row Level Security. Only ever use
 * this from trusted server code that isn't driven by a user session, i.e.
 * the Stripe webhook handler syncing account + subscription state.
 */
export function getSupabaseAdminClient() {
  if (instance) return instance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants)."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance = createClient<any>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return instance;
}
