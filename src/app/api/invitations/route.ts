import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Helper auth ───────────────────────────────────────────────

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null, userId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null, userId: user.id }
}

// ── Schéma de validation ──────────────────────────────────────

const inviteSchema = z.object({
  employee_id: z.string().uuid('Employé requis'),
  email:       z.string().email('Email invalide'),
})

// ── Email d'invitation (Resend) ────────────────────────────────

async function sendInvitationEmail(params: {
  to:             string
  employeeFirst:  string
  restaurantName: string
  token:          string
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[invitations] RESEND_API_KEY manquant — impossible d\'envoyer l\'invitation')
    return false
  }

  const inviteUrl = `https://restopilot.pro/invite/${params.token}`

  const html = `
<div style="text-align:center;margin-bottom:24px">
  <img src="https://restopilot.pro/favicon.png" alt="PilotResto" height="48" style="height:48px;width:auto" />
</div>
<p style="font-family:sans-serif;font-size:15px;color:#111111">Bonjour ${params.employeeFirst},</p>
<p style="font-family:sans-serif;font-size:15px;color:#111111">
  ${params.restaurantName} vous invite à rejoindre PilotResto pour consulter vos horaires de travail.
</p>
<p style="text-align:center;margin:28px 0">
  <a href="${inviteUrl}" style="background:#7798AB;color:#ffffff;text-decoration:none;font-family:sans-serif;font-size:15px;font-weight:600;padding:12px 28px;border-radius:9999px;display:inline-block">
    Créer mon compte →
  </a>
</p>
<p style="font-family:sans-serif;font-size:13px;color:#6B7280">Ce lien expire dans 7 jours.</p>
<p style="font-family:sans-serif;font-size:13px;color:#6B7280">L'équipe PilotResto</p>
`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'PilotResto <contact@restopilot.pro>',
        to:      [params.to],
        subject: 'Vous êtes invité(e) sur PilotResto',
        html,
      }),
    })
    if (!res.ok) {
      console.error('[invitations] Resend a répondu', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[invitations] erreur réseau Resend:', err)
    return false
  }
}

// ── GET /api/invitations — liste des invitations du restaurant ─

export async function GET() {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('employee_invitations')
    .select('id, employee_id, email, status, expires_at, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invitations: data ?? [] })
}

// ── POST /api/invitations — crée une invitation + envoie l'email ─

export async function POST(request: NextRequest) {
  const { supabase, restaurantId, userId } = await getRestaurantId()
  if (!restaurantId || !userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }) }

  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  // Vérifier que l'employé appartient bien au restaurant
  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name')
    .eq('id', parsed.data.employee_id)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!employee) return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })

  // Contexte pour l'email : nom du restaurant
  const { data: restaurant } = await supabase
    .from('restaurants').select('name').eq('id', restaurantId).single()

  const { data: invitation, error } = await supabase
    .from('employee_invitations')
    .insert({
      restaurant_id: restaurantId,
      employee_id:   parsed.data.employee_id,
      email:         parsed.data.email,
    })
    .select('id, employee_id, email, token, status, expires_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sent = await sendInvitationEmail({
    to:             parsed.data.email,
    employeeFirst:  employee.first_name,
    restaurantName: restaurant?.name ?? 'votre restaurant',
    token:          invitation.token,
  })

  if (!sent) {
    return NextResponse.json({ error: "Invitation créée mais l'email n'a pas pu être envoyé. Réessayez." }, { status: 502 })
  }

  // Ne jamais renvoyer le token brut au client une fois l'email envoyé
  return NextResponse.json({
    invitation: {
      id:          invitation.id,
      employee_id: invitation.employee_id,
      email:       invitation.email,
      status:      invitation.status,
      expires_at:  invitation.expires_at,
      created_at:  invitation.created_at,
    },
  }, { status: 201 })
}
