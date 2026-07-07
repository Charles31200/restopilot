/**
 * GET  /api/integrations   → statut de l'intégration du restaurant connecté
 * POST /api/integrations   → créer ou mettre à jour une intégration (token/api_key)
 * DELETE /api/integrations → déconnecter l'intégration active
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PosType } from '@/types'

// ── Helper auth ───────────────────────────────────────────────

async function getRestaurantId(): Promise<{ restaurantId: string; supabase: Awaited<ReturnType<typeof createClient>> } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return null
  return { restaurantId: profile.restaurant_id, supabase }
}

// ── GET — lire le statut ──────────────────────────────────────

export async function GET() {
  const ctx = await getRestaurantId()
  if (!ctx) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // maybeSingle() (pas single()) : aucune intégration existante n'est un cas
  // normal (pas encore connecté), pas une erreur à masquer.
  const { data, error } = await ctx.supabase
    .from('pos_integrations')
    .select('pos_type, is_active, last_synced_at, sync_error, created_at')
    .eq('restaurant_id', ctx.restaurantId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Masquer les tokens — ne jamais les envoyer au client
  return NextResponse.json(data ?? null)
}

// ── POST — connecter / mettre à jour ─────────────────────────

export async function POST(request: NextRequest) {
  const ctx = await getRestaurantId()
  if (!ctx) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json() as {
    pos_type: PosType
    api_key?: string
    // access_token + refresh_token sont injectés par le callback OAuth Lightspeed
    access_token?:     string
    refresh_token?:    string
    token_expires_at?: string
  }

  if (!body.pos_type) {
    return NextResponse.json({ error: 'pos_type requis' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const payload = {
    pos_type:         body.pos_type,
    is_active:        true,
    api_key:          body.api_key          ?? null,
    access_token:     body.access_token     ?? null,
    refresh_token:    body.refresh_token    ?? null,
    token_expires_at: body.token_expires_at ?? null,
    sync_error:       null,
    updated_at:       now,
  }

  // Un restaurant n'a qu'une seule intégration, mais restaurant_id n'a pas de
  // contrainte UNIQUE en base — .upsert(..., { onConflict: 'restaurant_id' })
  // échoue systématiquement côté Postgres (pas de contrainte à cibler).
  // On fait donc explicitement un select puis update/insert.
  const { data: existing } = await ctx.supabase
    .from('pos_integrations')
    .select('id')
    .eq('restaurant_id', ctx.restaurantId)
    .maybeSingle()

  const { data, error } = existing
    ? await ctx.supabase
        .from('pos_integrations')
        .update(payload)
        .eq('id', existing.id)
        .select('pos_type, is_active, last_synced_at, sync_error')
        .single()
    : await ctx.supabase
        .from('pos_integrations')
        .insert({ ...payload, restaurant_id: ctx.restaurantId })
        .select('pos_type, is_active, last_synced_at, sync_error')
        .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// ── DELETE — déconnecter ──────────────────────────────────────

export async function DELETE() {
  const ctx = await getRestaurantId()
  if (!ctx) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await ctx.supabase
    .from('pos_integrations')
    .delete()
    .eq('restaurant_id', ctx.restaurantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
