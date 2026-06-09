// Callback OAuth Supabase (Google, etc.)
// Supabase redirige ici après authentification tierce.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Vérifier si le profil existe (nouvel utilisateur OAuth)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // Nouvel utilisateur OAuth sans profil → compléter l'inscription
        if (!profile) {
          return NextResponse.redirect(
            new URL('/register?step=restaurant&oauth=1', origin)
          )
        }
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=auth_callback_error', origin)
  )
}
