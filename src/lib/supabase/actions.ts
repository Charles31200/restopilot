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

export type AuthResult = { error: string } | undefined

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
  password: string,
): Promise<AuthResult> {
  const supabase = await createClient()

  // Le trigger Supabase `on_auth_user_created` crée automatiquement
  // le restaurant, le profil et l'abonnement trial dès l'inscription.
  const { error: authError } = await supabase.auth.signUp({ email, password })
  if (authError) return { error: translateError(authError.message) }

  // Le proxy redirigera vers /onboarding si first_name est null
  redirect('/dashboard')
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

    redirect('/dashboard')
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

  if (restError) return { error: `Erreur restaurant : ${restError.message}` }

  // Mettre à jour le profil via le client user :
  // la policy RLS "UPDATE profiles WHERE id = auth.uid()" autorise ça.
  const { error: profErr } = await supabase
    .from('profiles')
    .update({
      first_name: profileData.first_name,
      last_name:  profileData.last_name,
    })
    .eq('id', user.id)

  if (profErr) return { error: `Erreur profil : ${profErr.message}` }

  redirect('/dashboard')
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
