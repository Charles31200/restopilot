import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  firstName:     z.string().min(1),
  lastName:      z.string().min(1),
  email:         z.string().email(),
  phone:         z.string().min(6),
  restaurantName:z.string().min(1),
  city:          z.string().min(1),
  employees:     z.string().min(1),
  restaurantType:z.string().min(1),
  message:       z.string().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const d = parsed.data
  const resendKey = process.env.RESEND_API_KEY

  if (resendKey) {
    const html = `
<div style="text-align:center;margin-bottom:24px">
  <img src="https://restopilot.pro/favicon.png" alt="RestoPilot" height="48" style="height:48px;width:auto" />
</div>
<h2>Nouvelle demande de démo RestoPilot</h2>
<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Prénom</td><td style="padding:8px">${d.firstName}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Nom</td><td style="padding:8px">${d.lastName}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px"><a href="mailto:${d.email}">${d.email}</a></td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Téléphone</td><td style="padding:8px">${d.phone}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Restaurant</td><td style="padding:8px">${d.restaurantName}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Ville</td><td style="padding:8px">${d.city}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Employés</td><td style="padding:8px">${d.employees}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Type</td><td style="padding:8px">${d.restaurantType}</td></tr>
  ${d.message ? `<tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Message</td><td style="padding:8px">${d.message}</td></tr>` : ''}
</table>
`
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'RestoPilot <onboarding@resend.dev>',
        to:      ['charles.lecussan@gmail.com'],
        subject: `🍽️ Nouvelle demande — ${d.firstName} ${d.lastName} (${d.restaurantName}, ${d.city})`,
        html,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
