import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { hasActiveAccess, type ProfileRow, type RestaurantRow } from "@/lib/supabase/types";

// Add new private route prefixes here as they're built — the matcher below
// must be kept in sync, Next.js can't infer it dynamically.
export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/settings/:path*"],
};

export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();

  if (!env) {
    // Supabase isn't configured yet — the page itself falls back to a
    // "configuration requise" state, but private routes have nothing to
    // show without a session, so send visitors to /connexion instead.
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("id", user.id)
    .single<Pick<ProfileRow, "restaurant_id">>();

  const { data: restaurant } = profile?.restaurant_id
    ? await supabase
        .from("restaurants")
        .select("access_status")
        .eq("id", profile.restaurant_id)
        .single<Pick<RestaurantRow, "access_status">>()
    : { data: null };

  if (!hasActiveAccess(restaurant?.access_status ?? null)) {
    return NextResponse.redirect(new URL("/subscribe", request.url));
  }

  return response;
}
