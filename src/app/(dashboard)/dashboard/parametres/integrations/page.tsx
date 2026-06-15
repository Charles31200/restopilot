'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Wifi, WifiOff, RefreshCw, Loader2, CheckCircle2,
  AlertTriangle, ExternalLink, Plug, PlugZap, FileSpreadsheet,
  Clock, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

import { CSVImportModal } from '@/components/integrations/CSVImportModal'
import type { PosType } from '@/types'

// ── Config des caisses ────────────────────────────────────────

type POSConfig = {
  id:          PosType
  name:        string
  description: string
  authType:    'oauth2' | 'token' | 'apikey' | 'csv'
  docsUrl:     string
  color:       string
  bgColor:     string
  borderColor: string
}

const POS_OPTIONS: POSConfig[] = [
  {
    id:          'lightspeed',
    name:        'Lightspeed Restaurant',
    description: 'Connexion automatique via OAuth2. Vos ventes se synchronisent chaque nuit.',
    authType:    'oauth2',
    docsUrl:     'https://developers.lightspeedhq.com',
    color:       'text-orange-700',
    bgColor:     'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id:          'tiller',
    name:        'Tiller — SumUp POS',
    description: 'Connexion par token API. Récupérez votre token dans Tiller → Paramètres → API.',
    authType:    'token',
    docsUrl:     'https://tillersystems.com/fr/api',
    color:       'text-blue-700',
    bgColor:     'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id:          'zelty',
    name:        'Zelty',
    description: 'Connexion par clé API. Créez votre clé dans Zelty → Mon compte → API.',
    authType:    'apikey',
    docsUrl:     'https://zelty.fr/api',
    color:       'text-green-700',
    bgColor:     'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id:          'csv',
    name:        'Import CSV manuel',
    description: 'Pour toutes les autres caisses. Exportez vos ventes en CSV et importez-les ici.',
    authType:    'csv',
    docsUrl:     '',
    color:       'text-purple-700',
    bgColor:     'bg-purple-50',
    borderColor: 'border-purple-200',
  },
]

// ── Types ─────────────────────────────────────────────────────

type IntegrationStatus = {
  pos_type:       PosType
  is_active:      boolean
  last_synced_at: string | null
  sync_error:     string | null
} | null

type TokenModalState = {
  pos: POSConfig
  value: string
  saving: boolean
  error: string | null
}

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return 'Jamais synchronisé'
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`
}

// ── Logo placeholder ──────────────────────────────────────────

function POSIcon({ pos }: { pos: POSConfig }) {
  const icons: Record<PosType, React.ReactNode> = {
    lightspeed: <Zap       className={cn('w-5 h-5', pos.color)} />,
    tiller:     <PlugZap   className={cn('w-5 h-5', pos.color)} />,
    zelty:      <Settings  className={cn('w-5 h-5', pos.color)} />,
    csv:        <FileSpreadsheet className={cn('w-5 h-5', pos.color)} />,
  }
  return (
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', pos.bgColor)}>
      {icons[pos.id]}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [status,    setStatus]    = useState<IntegrationStatus>(null)
  const [loading,   setLoading]   = useState(true)
  const [syncing,   setSyncing]   = useState(false)
  const [syncMsg,   setSyncMsg]   = useState<string | null>(null)
  const [tokenModal, setTokenModal] = useState<TokenModalState | null>(null)
  const [showCSV,   setShowCSV]   = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // ── Charger le statut ────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/integrations')
      const json = await res.json()
      setStatus(res.ok ? json : null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // Lire les params URL (callback OAuth Lightspeed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'lightspeed') {
      loadStatus()
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname)
    }
    const err = params.get('error')
    if (err) setSyncMsg(`Erreur de connexion : ${decodeURIComponent(err)}`)
  }, [loadStatus])

  // ── Sync manuelle ─────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res  = await fetch('/api/sync', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSyncMsg(`✅ ${json.salesCreated} vente${json.salesCreated > 1 ? 's' : ''} synchronisée${json.salesCreated > 1 ? 's' : ''}`)
        loadStatus()
      } else {
        setSyncMsg(`⚠️ ${json.errors?.[0] ?? 'Erreur de synchronisation'}`)
      }
    } catch {
      setSyncMsg('Erreur réseau lors de la synchronisation')
    } finally { setSyncing(false) }
  }

  // ── Déconnexion ────────────────────────────────────────────────

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter la caisse ? La synchronisation automatique sera désactivée.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/integrations', { method: 'DELETE' })
      setStatus(null)
      setSyncMsg('Caisse déconnectée.')
    } finally { setDisconnecting(false) }
  }

  // ── Connexion OAuth2 (Lightspeed) ─────────────────────────────
  // L'URL est générée côté serveur pour garder LIGHTSPEED_CLIENT_ID hors du bundle navigateur.

  const handleConnectOAuth = async (_pos: POSConfig) => {
    try {
      const res = await fetch('/api/auth/lightspeed/url')
      if (!res.ok) throw new Error('Impossible de générer l\'URL de connexion.')
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Erreur de connexion Lightspeed.')
    }
  }

  // ── Connexion Token/API Key ────────────────────────────────────

  const handleConnectToken = (pos: POSConfig) => {
    setTokenModal({ pos, value: '', saving: false, error: null })
  }

  const saveToken = async () => {
    if (!tokenModal) return
    setTokenModal(m => m ? { ...m, saving: true, error: null } : null)

    const res = await fetch('/api/integrations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pos_type: tokenModal.pos.id, api_key: tokenModal.value }),
    })

    if (!res.ok) {
      const json = await res.json()
      setTokenModal(m => m ? { ...m, saving: false, error: json.error ?? 'Erreur' } : null)
      return
    }
    setTokenModal(null)
    loadStatus()
  }

  const activePos = POS_OPTIONS.find(p => p.id === status?.pos_type)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connexion à votre caisse</h1>
        <p className="text-sm text-gray-400 mt-1">
          Connectez votre caisse enregistreuse pour importer vos ventes automatiquement.
        </p>
      </div>

      {/* Statut actuel */}
      {!loading && status && activePos && (
        <div className={cn(
          'rounded-2xl border p-5 space-y-4',
          status.sync_error
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        )}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center',
                status.sync_error ? 'bg-red-100' : 'bg-green-100')}>
                {status.sync_error
                  ? <WifiOff className="w-5 h-5 text-red-600" />
                  : <Wifi    className="w-5 h-5 text-green-600" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {activePos.name} — Connecté
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {timeAgo(status.last_synced_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status.pos_type !== 'csv' && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {syncing
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sync…</>
                    : <><RefreshCw className="w-3.5 h-3.5" />Synchroniser</>
                  }
                </button>
              )}
              {status.pos_type === 'csv' && (
                <button
                  onClick={() => setShowCSV(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />Importer CSV
                </button>
              )}
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 bg-white rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
                Déconnecter
              </button>
            </div>
          </div>

          {status.sync_error && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-100 rounded-xl p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>{status.sync_error}</p>
            </div>
          )}

          {syncMsg && (
            <p className={cn('text-xs font-medium', syncMsg.startsWith('✅') ? 'text-green-700' : 'text-amber-700')}>
              {syncMsg}
            </p>
          )}
        </div>
      )}

      {/* Liste des options */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {status ? 'Changer de caisse' : 'Choisissez votre caisse'}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          POS_OPTIONS.map(pos => {
            const isConnected = status?.pos_type === pos.id && status?.is_active
            return (
              <div
                key={pos.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all',
                  isConnected
                    ? `${pos.bgColor} ${pos.borderColor}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <POSIcon pos={pos} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{pos.name}</p>
                        {isConnected && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                            pos.bgColor, pos.color
                          )}>
                            <CheckCircle2 className="w-3 h-3" />Connecté
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {pos.description}
                      </p>
                      {pos.docsUrl && (
                        <a href={pos.docsUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                          Documentation <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {!isConnected && (
                    <button
                      onClick={() => {
                        if (pos.authType === 'oauth2') handleConnectOAuth(pos)
                        else if (pos.authType === 'csv') setShowCSV(true)
                        else handleConnectToken(pos)
                      }}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors',
                        pos.bgColor, pos.color,
                        `border ${pos.borderColor} hover:opacity-80`
                      )}
                    >
                      <Plug className="w-3.5 h-3.5" />
                      Connecter
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Info cron */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Synchronisation automatique</p>
        <p>Les ventes sont importées automatiquement <strong>chaque nuit à 2h00</strong> pour les intégrations API (Lightspeed, Tiller, Zelty).</p>
        <p>Vous pouvez aussi déclencher une synchronisation manuelle à tout moment via le bouton "Synchroniser".</p>
      </div>

      {/* Modal saisie token/api-key */}
      {tokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <POSIcon pos={tokenModal.pos} />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Connecter {tokenModal.pos.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {tokenModal.pos.authType === 'apikey' ? 'Clé API' : 'Token API'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                {tokenModal.pos.authType === 'apikey' ? 'Votre clé API' : 'Votre token API'} *
              </label>
              <input
                type="password"
                value={tokenModal.value}
                onChange={e => setTokenModal(m => m ? { ...m, value: e.target.value } : null)}
                placeholder={tokenModal.pos.authType === 'apikey' ? 'sk-xxxx…' : 'Bearer xxxx…'}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
              />
            </div>

            {tokenModal.error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {tokenModal.error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setTokenModal(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveToken}
                disabled={!tokenModal.value.trim() || tokenModal.saving}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {tokenModal.saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CSV */}
      {showCSV && (
        <CSVImportModal
          onClose={() => setShowCSV(false)}
          onSuccess={result => {
            setShowCSV(false)
            setSyncMsg(`✅ ${result.imported} ligne${result.imported > 1 ? 's' : ''} importée${result.imported > 1 ? 's' : ''} — ${result.salesCreated} journée${result.salesCreated > 1 ? 's' : ''} créée${result.salesCreated > 1 ? 's' : ''}`)
            loadStatus()
          }}
        />
      )}
    </div>
  )
}
