import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PKCE callback for Supabase OAuth (Google, Apple, …) and email links
 * (password recovery, invite). Exchanges the `code` param for a session
 * cookie, then redirects into the account.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectTo = request.nextUrl.searchParams.get("redirect_to") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("OAuth callback failed:", err);
      return NextResponse.redirect(new URL("/connexion?error=oauth", request.url));
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
