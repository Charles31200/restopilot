import { NextResponse } from 'next/server'
import { getLightspeedAuthUrl } from '@/lib/integrations/lightspeed-url'

// Génère l'URL OAuth Lightspeed côté serveur pour que LIGHTSPEED_CLIENT_ID
// reste une variable serveur (non NEXT_PUBLIC_) et ne soit jamais exposée au navigateur.
export async function GET() {
  const url = getLightspeedAuthUrl(crypto.randomUUID())
  return NextResponse.json({ url })
}
