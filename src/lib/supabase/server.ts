import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Doit correspondre au storageKey de src/lib/supabase/client.ts (et de
      // middleware.ts) : @supabase/ssr utilise cette clé comme nom de cookie.
      // Une divergence = le serveur ne retrouve jamais la session posée par
      // le client → toute connexion email/mot de passe semble échouer (le
      // middleware renvoie systématiquement vers /login).
      auth: {
        storageKey: 'pilotresto-session',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll appelé depuis un Server Component — ignoré si les cookies
            // sont déjà envoyés (middleware gère la session dans ce cas)
          }
        },
      },
    }
  )
}
