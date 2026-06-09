// Utilitaire client-safe : génère l'URL OAuth2 Lightspeed sans aucune dépendance serveur.

const LIGHTSPEED_AUTH_URL = 'https://cloud.lightspeedhq.com/oauth/authorize'

export function getLightspeedAuthUrl(state: string): string {
  const clientId    = process.env.LIGHTSPEED_CLIENT_ID     ?? ''
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/auth/lightspeed/callback`

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope:         'employee:all reports:inventory:read',
    state,
  })
  return `${LIGHTSPEED_AUTH_URL}?${params}`
}
