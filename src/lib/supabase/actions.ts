'use server'

/**
 * actions.ts — Server Actions Supabase.
 *
 * Next.js 16 : 'use server' doit être en tête de fichier.
 * Les inline 'use server' dans les Client Components ne sont plus autorisés.
 * Ce fichier exporte uniquement des Server Actions (appelables depuis n'importe quel composant).
 */

import { redirect } from 'next/navigation'
import { createClient } from './server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { Database } from '@/types'

// ── Types ─────────────────────────────────────────────────────

export type AuthResult = { error: string } | { message: string } | { success: boolean } | undefined

// ── Admin client ──────────────────────────────────────────────

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Actions ───────────────────────────────────────────────────

export async function signInAction(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: translateError(error.message) }
  redirect('/dashboard')
}

export async function signUpAction(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
): Promise<AuthResult> {
  const admin = getAdminClient()

  // generateLink() crée/retrouve l'utilisateur et renvoie le code OTP brut
  // (data.properties.email_otp) SANS jamais envoyer d'email — contrairement à
  // auth.signUp(), qui délègue l'envoi au mailer intégré de Supabase (limité
  // à quelques emails/heure, non fiable en production). On envoie donc le
  // code nous-mêmes via Resend, dont le domaine restopilot.pro est vérifié.
  const { data, error: authError } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
    },
  })

  if (authError) {
    console.error('[signUp] erreur Supabase Auth:', authError.message, authError.code)
    return { error: translateError(authError.message) }
  }

  const otp = data.properties?.email_otp
  if (!otp) {
    console.error('[signUp] pas de email_otp dans la réponse generateLink')
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }

  const sent = await sendSignupOtpEmail(email, firstName, otp)
  if (!sent) {
    return { error: "Impossible d'envoyer l'email de vérification. Réessayez dans quelques instants." }
  }

  return { success: true }
}

async function sendSignupOtpEmail(email: string, firstName: string, otp: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[signUp] RESEND_API_KEY manquant — impossible d\'envoyer le code OTP')
    return false
  }

  const html = `
<div style="text-align:center;margin-bottom:24px">
  <img src="https://restopilot.pro/favicon.png" alt="PilotResto" height="48" style="height:48px;width:auto" />
</div>
<p style="font-family:sans-serif;font-size:15px;color:#111111">Bonjour ${firstName || ''},</p>
<p style="font-family:sans-serif;font-size:15px;color:#111111">Voici votre code de confirmation PilotResto :</p>
<p style="font-family:sans-serif;font-size:32px;font-weight:bold;letter-spacing:8px;color:#111111;text-align:center;margin:24px 0">${otp}</p>
<p style="font-family:sans-serif;font-size:13px;color:#6B7280">Ce code expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
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
        to:      [email],
        subject: `${otp} — Votre code de confirmation PilotResto`,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[signUp] Resend a répondu', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[signUp] erreur réseau Resend:', err)
    return false
  }
}

export async function verifyOtpAction(
  email: string,
  token: string,
): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })

  if (error) {
    console.error('[verifyOtp] erreur:', error.message, error.code)
    return { error: 'Code incorrect ou expiré. Vérifiez votre boîte mail.' }
  }

  redirect('/onboarding')
}

// ── Types onboarding ──────────────────────────────────────

export type OnboardingRestaurantData = {
  name:     string
  address?: string
  siret?:   string
}

export type OnboardingProfileData = {
  first_name: string
  last_name:  string
}

export async function updateOnboardingAction(
  restaurantData: OnboardingRestaurantData,
  profileData:    OnboardingProfileData,
): Promise<AuthResult> {
  const supabase = await createClient()
  const admin    = getAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté. Veuillez vous reconnecter.' }

  // get_user_restaurant_id() est SECURITY DEFINER → bypass RLS, lit auth.uid()
  // depuis le JWT du client user (cookies) → toujours valide en Server Action.
  // On évite le client admin dont la clé SUPABASE_SERVICE_ROLE_KEY peut être
  // absente ou incorrecte dans l'environnement de développement.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: restaurantId, error: rpcError } = await (supabase as any)
    .rpc('get_user_restaurant_id')

  if (rpcError) {
    console.error('[onboarding] get_user_restaurant_id RPC erreur:', rpcError.message, rpcError.code)
    return { error: `Impossible de lire le profil : ${rpcError.message}` }
  }

  if (!restaurantId) {
    // Compte orphelin (trigger non déclenché) : on a besoin du service role.
    // Si admin ne fonctionne pas, retourner une erreur claire.
    const { data: newRestaurant, error: createErr } = await admin
      .from('restaurants')
      .insert({
        name:    restaurantData.name,
        address: restaurantData.address || null,
        siret:   restaurantData.siret   || null,
      })
      .select('id')
      .single()

    if (createErr || !newRestaurant) {
      return { error: `Impossible de créer le restaurant : ${createErr?.message ?? 'erreur inconnue'}` }
    }

    const newId = newRestaurant.id

    await admin.from('profiles').upsert({ id: user.id, restaurant_id: newId, role: 'owner' })

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14)
    await admin.from('subscriptions').insert({
      restaurant_id:      newId,
      plan:               'starter',
      status:             'trialing',
      current_period_end: trialEnd.toISOString(),
    })

    await admin.from('profiles')
      .update({ first_name: profileData.first_name, last_name: profileData.last_name })
      .eq('id', user.id)

    redirect('/onboarding-payment')
  }

  // Mettre à jour le restaurant existant via le client user :
  // la policy RLS "UPDATE restaurants WHERE id = get_user_restaurant_id()" autorise ça.
  const { error: restError } = await supabase
    .from('restaurants')
    .update({
      name:    restaurantData.name,
      address: restaurantData.address || null,
      siret:   restaurantData.siret   || null,
    })
    .eq('id', restaurantId)

  if (restError) {
    console.error('[onboarding] update restaurant erreur:', restError.message, restError.code)
    return { error: `Erreur restaurant : ${restError.message}` }
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .update({
      first_name: profileData.first_name,
      last_name:  profileData.last_name,
    })
    .eq('id', user.id)

  if (profErr) {
    console.error('[onboarding] update profil erreur:', profErr.message, profErr.code)
    return { error: `Erreur profil : ${profErr.message}` }
  }

  redirect('/onboarding-payment')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Traduction des erreurs ────────────────────────────────────

function translateError(message: string): string {
  if (message.includes('Invalid login credentials'))  return 'Email ou mot de passe incorrect.'
  if (message.includes('Email not confirmed'))         return 'Veuillez confirmer votre adresse email avant de vous connecter.'
  if (message.includes('User already registered'))     return 'Un compte existe déjà avec cette adresse email.'
  if (message.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.'
  return 'Une erreur est survenue. Veuillez réessayer.'
}
