import { NextResponse } from 'next/server'

// Endpoint de diagnostic — JAMAIS en production (bloqué si NODE_ENV !== development)
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const vars = {
    STRIPE_SECRET_KEY:                        mask(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET:                    mask(process.env.STRIPE_WEBHOOK_SECRET),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:       mask(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? '(non défini)',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL  ?? '(non défini)',
    NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY:     process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY     ?? '(non défini)',
    NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL:      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL      ?? '(non défini)',
    NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY:   process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY   ?? '(non défini)',
    NEXT_PUBLIC_STRIPE_PRICE_MULTI_ANNUAL:    process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_ANNUAL    ?? '(non défini)',
    NEXT_PUBLIC_APP_URL:                      process.env.NEXT_PUBLIC_APP_URL ?? '(non défini)',
    STRIPE_PRICE_STARTER_MONTHLY:             process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '(non défini)',
    STRIPE_PRICE_PRO_MONTHLY:                 process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '(non défini)',
    STRIPE_PRICE_MULTI_MONTHLY:               process.env.STRIPE_PRICE_MULTI_MONTHLY   ?? '(non défini)',
    NODE_ENV:                                 process.env.NODE_ENV,
  }

  const missing = Object.entries(vars)
    .filter(([, v]) => v === '(non défini)' || v === '(vide)')
    .map(([k]) => k)

  return NextResponse.json({ vars, missing, ok: missing.length === 0 })
}

function mask(v?: string) {
  if (!v)           return '(vide)'
  if (v.length < 8) return '(trop court)'
  return v.substring(0, 12) + '…'
}
