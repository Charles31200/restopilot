/**
 * GET  /api/exports/fec?month=2026-06  → téléchargement du fichier FEC
 * POST /api/exports/fec?month=2026-06  → génération + envoi email avec pièce jointe
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFEC, fecFilename } from '@/lib/utils/fec-generator'
import type { FECSaleInput, FECInvoiceInput } from '@/lib/utils/fec-generator'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? ''

  const monthMatch = month.match(/^(\d{4})-(\d{2})$/)
  if (!monthMatch) {
    return NextResponse.json({ error: 'Format month invalide (YYYY-MM)' }, { status: 422 })
  }

  const year = parseInt(monthMatch[1])
  const mo   = parseInt(monthMatch[2])
  const from = `${year}-${String(mo).padStart(2, '0')}-01`
  const last = new Date(year, mo, 0).getDate()
  const to   = `${year}-${String(mo).padStart(2, '0')}-${last}`

  // Fetch ventes et factures du mois
  const [salesRes, invoicesRes, restaurantRes] = await Promise.all([
    supabase
      .from('sales')
      .select('id, date, total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', from).lte('date', to)
      .order('date'),
    supabase
      .from('invoices')
      .select('id, invoice_date, supplier_name, amount, vat_amount')
      .eq('restaurant_id', restaurantId)
      .gte('invoice_date', from).lte('invoice_date', to)
      .order('invoice_date'),
    supabase
      .from('restaurants')
      .select('name, siret')
      .eq('id', restaurantId)
      .single(),
  ])

  const sales:    FECSaleInput[]    = (salesRes.data    ?? []).map(s => ({
    id:            s.id,
    date:          s.date,
    total_revenue: s.total_revenue,
  }))
  const invoices: FECInvoiceInput[] = (invoicesRes.data ?? []).map(i => ({
    id:           i.id,
    invoice_date: i.invoice_date,
    supplier_name: i.supplier_name,
    amount:       i.amount,
    vat_amount:   i.vat_amount,
  }))

  const siret    = restaurantRes.data?.siret ?? null
  const fecText  = generateFEC(sales, invoices, month)
  const filename = fecFilename(siret, month)

  // Retourner le fichier texte en téléchargement
  return new NextResponse(fecText, {
    status: 200,
    headers: {
      'Content-Type':        'text/plain; charset=UTF-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// ── POST — envoi email avec pièce jointe ─────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? ''

  const monthMatch = month.match(/^(\d{4})-(\d{2})$/)
  if (!monthMatch) {
    return NextResponse.json({ error: 'Format month invalide (YYYY-MM)' }, { status: 422 })
  }

  const year = parseInt(monthMatch[1])
  const mo   = parseInt(monthMatch[2])
  const from = `${year}-${String(mo).padStart(2, '0')}-01`
  const last = new Date(year, mo, 0).getDate()
  const to   = `${year}-${String(mo).padStart(2, '0')}-${last}`

  const [salesRes, invoicesRes, restaurantRes] = await Promise.all([
    supabase.from('sales').select('id, date, total_revenue').eq('restaurant_id', restaurantId).gte('date', from).lte('date', to).order('date'),
    supabase.from('invoices').select('id, invoice_date, supplier_name, amount, vat_amount').eq('restaurant_id', restaurantId).gte('invoice_date', from).lte('invoice_date', to).order('invoice_date'),
    supabase.from('restaurants').select('name, siret').eq('id', restaurantId).single(),
  ])

  const sales:    FECSaleInput[]    = (salesRes.data    ?? []).map(s => ({ id: s.id, date: s.date, total_revenue: s.total_revenue }))
  const invoices: FECInvoiceInput[] = (invoicesRes.data ?? []).map(i => ({ id: i.id, invoice_date: i.invoice_date, supplier_name: i.supplier_name, amount: i.amount, vat_amount: i.vat_amount }))

  const siret       = restaurantRes.data?.siret    ?? null
  const restName    = restaurantRes.data?.name     ?? 'Mon restaurant'
  const fecText     = generateFEC(sales, invoices, month)
  const filename    = fecFilename(siret, month)
  const base64File  = Buffer.from(fecText, 'utf-8').toString('base64')

  // Destinataire : email du propriétaire (à étendre avec accountant_email si le champ est ajouté à la BDD)
  const recipientEmail = user.email ?? ''
  if (!recipientEmail) {
    return NextResponse.json({ error: 'Aucun email destinataire configuré.' }, { status: 422 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'Service email non configuré (RESEND_API_KEY manquante).' }, { status: 503 })
  }

  const monthLabel = new Date(year, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const emailRes = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:        'PilotResto <noreply@restopilot.fr>',
      to:          [recipientEmail],
      subject:     `Fichier FEC — ${restName} — ${monthLabel}`,
      html:        `<p>Bonjour,</p><p>Veuillez trouver ci-joint le fichier FEC de <strong>${restName}</strong> pour la période <strong>${monthLabel}</strong>.</p><p>Ce fichier est au format officiel DGFiP (article L13 AA du LPF).</p><hr><p style="font-size:11px;color:#9CA3AF;">Généré par PilotResto</p>`,
      attachments: [{ filename, content: base64File }],
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.text()
    return NextResponse.json({ error: `Échec envoi email : ${err.slice(0, 200)}` }, { status: 502 })
  }

  return NextResponse.json({ emailSent: true, recipient: recipientEmail })
}
