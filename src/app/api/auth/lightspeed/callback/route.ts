/**
 * GET /api/auth/lightspeed/callback?code=...&state=...
 *
 * Callback OAuth2 Lightspeed.
 * Lightspeed redirige ici après que l'utilisateur a accordé l'accès.
 *
 * Le paramètre `state` contient l'ID utilisateur Supabase (signé en base64)
 * pour associer le token au bon restaurant sans session HTTP active.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/integrations/lightspeed'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const redirectBase = `${appUrl}/parametres/integrations`

  // Lightspeed a refusé l'accès ou annulé
  if (error) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?error=missing_params`)
  }

  try {
    // 1. Échanger le code contre des tokens
    const tokens = await exchangeCodeForTokens(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // 2. Récupérer le restaurant de l'utilisateur courant
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${redirectBase}?error=unauthenticated`)
    }

    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id').eq('id', user.id).single()
    if (!profile?.restaurant_id) {
      return NextResponse.redirect(`${redirectBase}?error=no_restaurant`)
    }

    // 3. Stocker / mettre à jour l'intégration
    const { error: upsertError } = await supabase
      .from('pos_integrations')
      .upsert({
        restaurant_id:    profile.restaurant_id,
        pos_type:         'lightspeed',
        access_token:     tokens.access_token,
        refresh_token:    tokens.refresh_token,
        token_expires_at: expiresAt,
        is_active:        true,
        sync_error:       null,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'restaurant_id' })

    if (upsertError) {
      return NextResponse.redirect(
        `${redirectBase}?error=${encodeURIComponent(upsertError.message)}`
      )
    }

    // 4. Succès — rediriger avec confirmation
    return NextResponse.redirect(`${redirectBase}?connected=lightspeed`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent(msg)}`
    )
  }
}
