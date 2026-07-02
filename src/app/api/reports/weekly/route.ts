/**
 * GET  /api/reports/weekly?week=2026-W23  → données du rapport
 * POST /api/reports/weekly?week=2026-W23  → données + envoi email Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getWeekDays, toISODate, formatWeekLabel,
  extractTime, calcHours,
} from '@/lib/utils/week-utils'
import type { WeeklyReportData } from '@/types/comptabilite'

// ── Calcul des données du rapport ────────────────────────────

async function buildReport(
  restaurantId: string,
  weekStr: string
): Promise<WeeklyReportData> {
  const supabase = await createClient()
  const days     = getWeekDays(weekStr)
  const from     = toISODate(days[0])
  const to       = toISODate(days[6])

  const [salesRes, invoicesRes, shiftsRes] = await Promise.all([
    supabase.from('sales').select('total_revenue').eq('restaurant_id', restaurantId).gte('date', from).lte('date', to),
    supabase.from('invoices').select('amount').eq('restaurant_id', restaurantId).gte('invoice_date', from).lte('invoice_date', to),
    supabase.from('shifts').select('start_time, end_time, employees(hourly_rate)').eq('restaurant_id', restaurantId).gte('start_time', `${from}T00:00:00`).lte('start_time', `${to}T23:59:59`),
  ])

  const revenue   = +((salesRes.data ?? []).reduce((s, r) => s + r.total_revenue, 0)).toFixed(2)
  const purchases = +((invoicesRes.data ?? []).reduce((s, i) => s + i.amount, 0)).toFixed(2)
  const laborCost = +((shiftsRes.data ?? []).reduce((sum, s) => {
    const rate  = (s as unknown as { employees: { hourly_rate: number } }).employees?.hourly_rate ?? 0
    return sum + calcHours(extractTime(s.start_time), extractTime(s.end_time)) * rate
  }, 0)).toFixed(2)

  const grossMargin    = +(revenue - purchases - laborCost).toFixed(2)
  const grossMarginPct = revenue > 0 ? +(grossMargin / revenue * 100).toFixed(1) : 0

  const alerts: string[] = []
  if (revenue === 0) {
    alerts.push('Aucune vente enregistrée cette semaine.')
  } else {
    if (laborCost / revenue > 0.4)  alerts.push(`Masse salariale élevée : ${(laborCost / revenue * 100).toFixed(0)} % du CA.`)
    if (purchases / revenue > 0.35) alerts.push(`Achats élevés : ${(purchases / revenue * 100).toFixed(0)} % du CA.`)
  }

  return {
    week:           weekStr,
    weekLabel:      formatWeekLabel(weekStr),
    revenue,
    purchases,
    laborCost,
    grossMargin,
    grossMarginPct,
    alerts,
  }
}

// ── Template email HTML ───────────────────────────────────────

function buildEmailHTML(report: WeeklyReportData, restaurantName: string): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const alertsHTML = report.alerts.length > 0
    ? `<div style="background:#FEF9C3;border-left:4px solid #EAB308;padding:12px;margin:16px 0;border-radius:4px;">
         <strong>⚠️ Alertes :</strong><ul style="margin:8px 0 0 20px;">${report.alerts.map(a => `<li>${a}</li>`).join('')}</ul>
       </div>`
    : `<div style="background:#F0FDF4;border-left:4px solid #22C55E;padding:12px;margin:16px 0;border-radius:4px;">✅ Aucune alerte cette semaine.</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rapport semaine</title></head>
<body style="font-family:Arial,sans-serif;color:#111;max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#2563EB;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px;">📊 Rapport hebdomadaire</h1>
    <p style="margin:4px 0 0;opacity:.8;">${restaurantName} · ${report.weekLabel}</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background:#EFF6FF;padding:12px;border-radius:6px;text-align:center;width:48%;">
          <div style="font-size:12px;color:#3B82F6;text-transform:uppercase;letter-spacing:.05em;">CA semaine</div>
          <div style="font-size:24px;font-weight:bold;color:#1E40AF;">${fmt(report.revenue)}</div>
        </td>
        <td width="4%"></td>
        <td style="background:#F0FDF4;padding:12px;border-radius:6px;text-align:center;width:48%;">
          <div style="font-size:12px;color:#22C55E;text-transform:uppercase;letter-spacing:.05em;">Marge brute</div>
          <div style="font-size:24px;font-weight:bold;color:#15803D;">${fmt(report.grossMargin)} (${report.grossMarginPct} %)</div>
        </td>
      </tr>
    </table>
    <table width="100%" style="border-collapse:collapse;">
      <tr style="background:#F9FAFB;"><td style="padding:8px 12px;font-size:13px;color:#6B7280;">Achats fournisseurs</td><td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;">${fmt(report.purchases)}</td></tr>
      <tr><td style="padding:8px 12px;font-size:13px;color:#6B7280;">Masse salariale</td><td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;">${fmt(report.laborCost)}</td></tr>
    </table>
    ${alertsHTML}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    <p style="font-size:11px;color:#9CA3AF;text-align:center;">Généré par PilotResto · <a href="https://restopilot.fr" style="color:#3B82F6;">restopilot.fr</a></p>
  </div>
</body>
</html>`
}

// ── Route Handlers ────────────────────────────────────────────

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { user, restaurantId: profile?.restaurant_id ?? null, supabase }
}

export async function GET(request: NextRequest) {
  const auth = await getAuth()
  if (!auth?.restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const week = new URL(request.url).searchParams.get('week') ?? ''
  if (!week.match(/^\d{4}-W\d{2}$/)) {
    return NextResponse.json({ error: 'Format week invalide' }, { status: 422 })
  }

  const report = await buildReport(auth.restaurantId, week)
  return NextResponse.json(report)
}

export async function POST(request: NextRequest) {
  const auth = await getAuth()
  if (!auth?.restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const week = new URL(request.url).searchParams.get('week') ?? ''
  if (!week.match(/^\d{4}-W\d{2}$/)) {
    return NextResponse.json({ error: 'Format week invalide' }, { status: 422 })
  }

  const report = await buildReport(auth.restaurantId, week)

  // Email du compte connecté (Supabase Auth — jamais vide pour un user valide)
  const ownerEmail = auth.user.email
  if (!ownerEmail) {
    return NextResponse.json(
      { ...report, emailSent: false, emailError: 'Aucune adresse email associée au compte.' },
      { status: 200 }
    )
  }

  // Nom du restaurant
  const { data: restaurant } = await auth.supabase
    .from('restaurants').select('name').eq('id', auth.restaurantId).single()
  const restaurantName = restaurant?.name ?? 'Mon restaurant'

  // Envoi via Resend REST API
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[reports/weekly] RESEND_API_KEY manquant dans les variables d\'environnement.')
    return NextResponse.json(
      { ...report, emailSent: false, emailError: 'Configuration email manquante (RESEND_API_KEY).' },
      { status: 200 }
    )
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'PilotResto <rapports@restopilot.pro>',
        to:      [ownerEmail],
        subject: `📊 Rapport ${report.weekLabel} — ${restaurantName}`,
        html:    buildEmailHTML(report, restaurantName),
      }),
    })

    if (emailRes.ok) {
      return NextResponse.json({ ...report, emailSent: true, emailTo: ownerEmail })
    }

    // Remonter la vraie erreur Resend (401 = clé invalide, 403 = domaine non vérifié, 422 = destinataire invalide)
    const resendError = await emailRes.json().catch(() => ({ message: 'Réponse non-JSON' }))
    console.error('[reports/weekly] Resend a rejeté l\'email :', emailRes.status, resendError)
    return NextResponse.json(
      { ...report, emailSent: false, emailError: `Resend ${emailRes.status}: ${resendError?.message ?? 'Erreur inconnue'}` },
      { status: 200 }
    )
  } catch (err) {
    console.error('[reports/weekly] Erreur réseau vers Resend :', err)
    return NextResponse.json(
      { ...report, emailSent: false, emailError: 'Erreur réseau lors de l\'appel Resend.' },
      { status: 200 }
    )
  }
}
