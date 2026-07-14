import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types'

// Routes publiques (page /invite/[token]) — le visiteur n'a pas encore de
// session, donc pas d'accès RLS. On utilise le service role uniquement
// pour lire/écrire l'invitation elle-même et créer le compte.
function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isInvitationValid(invitation: { status: string; expires_at: string }): boolean {
  return invitation.status === 'pending' && new Date(invitation.expires_at).getTime() > Date.now()
}

// ── GET /api/invitations/[token] — vérifie le token (public) ───

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = getAdminClient()

  const { data: invitation } = await admin
    .from('employee_invitations')
    .select('email, status, expires_at, employee_id, restaurant_id')
    .eq('token', token)
    .single()

  if (!invitation) {
    return NextResponse.json({ valid: false, error: 'Invitation introuvable.' }, { status: 404 })
  }

  const valid = isInvitationValid(invitation)
  if (!valid) {
    return NextResponse.json({
      valid: false,
      error: invitation.status === 'accepted'
        ? 'Cette invitation a déjà été utilisée.'
        : 'Cette invitation a expiré.',
    }, { status: 410 })
  }

  const [{ data: employee }, { data: restaurant }] = await Promise.all([
    admin.from('employees').select('first_name').eq('id', invitation.employee_id).single(),
    admin.from('restaurants').select('name').eq('id', invitation.restaurant_id).single(),
  ])

  return NextResponse.json({
    valid:           true,
    email:           invitation.email,
    employeeFirst:   employee?.first_name   ?? '',
    restaurantName:  restaurant?.name       ?? 'votre restaurant',
  })
}

// ── POST /api/invitations/[token] — accepte l'invitation (public) ─

const acceptSchema = z.object({
  password:        z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path:    ['confirmPassword'],
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }) }

  const parsed = acceptSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Données invalides'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  const admin = getAdminClient()

  const { data: invitation } = await admin
    .from('employee_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 })
  if (!isInvitationValid(invitation)) {
    return NextResponse.json({
      error: invitation.status === 'accepted' ? 'Cette invitation a déjà été utilisée.' : 'Cette invitation a expiré.',
    }, { status: 410 })
  }

  const { data: employee } = await admin
    .from('employees')
    .select('first_name, last_name')
    .eq('id', invitation.employee_id)
    .single()

  // Créer le compte, email déjà confirmé (le lien d'invitation reçu par
  // email a déjà prouvé la propriété de l'adresse — pas besoin d'un
  // second round-trip de confirmation par code).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email:         invitation.email,
    password:      parsed.data.password,
    email_confirm: true,
    user_metadata: {
      first_name: employee?.first_name ?? '',
      last_name:  employee?.last_name  ?? '',
    },
  })

  if (createErr || !created.user) {
    console.error('[invitations/accept] erreur création compte:', createErr?.message, createErr?.code)
    const alreadyExists = createErr?.message?.toLowerCase().includes('already registered')
    return NextResponse.json({
      error: alreadyExists
        ? 'Un compte existe déjà avec cette adresse email.'
        : 'Impossible de créer le compte. Réessayez.',
    }, { status: alreadyExists ? 409 : 500 })
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({
      id:            created.user.id,
      restaurant_id: invitation.restaurant_id,
      role:          'staff',
      employee_id:   invitation.employee_id,
      first_name:    employee?.first_name ?? null,
      last_name:     employee?.last_name  ?? null,
    })

  if (profileErr) {
    console.error('[invitations/accept] erreur profil:', profileErr.message, profileErr.code)
    return NextResponse.json({ error: 'Compte créé mais le profil n\'a pas pu être configuré.' }, { status: 500 })
  }

  await admin
    .from('employee_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  // Ouvre une session (cookies) via le client serveur normal, pour que le
  // navigateur soit connecté immédiatement après l'inscription.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email:    invitation.email,
    password: parsed.data.password,
  })

  if (signInErr) {
    console.error('[invitations/accept] compte créé mais échec connexion auto:', signInErr.message)
    return NextResponse.json({
      success: true,
      autoLoginFailed: true,
    })
  }

  return NextResponse.json({ success: true })
}
