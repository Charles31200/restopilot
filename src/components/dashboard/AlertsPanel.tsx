import Link from 'next/link'
import { AlertTriangle, Clock, FileText, CheckCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DashboardAlert, AlertType, AlertSeverity } from '@/types/dashboard'

// ── Configuration visuelle ────────────────────────────────────

type AlertConfig = {
  icon: React.ReactNode
  containerClass: string
  iconClass: string
  badgeClass: string
  badgeLabel: string
}

function getAlertConfig(type: AlertType, severity: AlertSeverity): AlertConfig {
  const iconSize = 'w-4 h-4'

  const icons: Record<AlertType, React.ReactNode> = {
    stock:    <AlertTriangle className={iconSize} />,
    overtime: <Clock         className={iconSize} />,
    invoice:  <FileText      className={iconSize} />,
  }

  const styles: Record<AlertSeverity, Omit<AlertConfig, 'icon'>> = {
    critical: {
      containerClass: 'border-red-100 bg-red-50',
      iconClass:      'text-red-500 bg-red-100',
      badgeClass:     'bg-red-100 text-red-700',
      badgeLabel:     'Critique',
    },
    warning: {
      containerClass: 'border-amber-100 bg-amber-50',
      iconClass:      'text-amber-500 bg-amber-100',
      badgeClass:     'bg-amber-100 text-amber-700',
      badgeLabel:     'Attention',
    },
    info: {
      containerClass: 'border-blue-100 bg-blue-50',
      iconClass:      'text-blue-500 bg-blue-100',
      badgeClass:     'bg-blue-100 text-blue-700',
      badgeLabel:     'Info',
    },
  }

  return { icon: icons[type], ...styles[severity] }
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return `il y a ${Math.floor(hours / 24)} j`
}

// ── Props ─────────────────────────────────────────────────────

type AlertsPanelProps = {
  alerts: DashboardAlert[]
}

// ── Composant ─────────────────────────────────────────────────

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Alertes actives</h3>
        {alerts.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </div>

      {/* Contenu */}
      {alerts.length === 0 ? (
        // État vide — tout va bien
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-green-700">Tout est en ordre</p>
            <p className="text-xs text-gray-400 mt-0.5">Aucune alerte pour aujourd'hui</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.type, alert.severity)

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border',
                  config.containerClass
                )}
              >
                {/* Icône */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    config.iconClass
                  )}
                >
                  {config.icon}
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">
                      {alert.title}
                    </p>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
                        config.badgeClass
                      )}
                    >
                      {config.badgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                    {alert.description}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {relativeTime(alert.createdAt)}
                  </p>
                </div>

                {/* Bouton Voir */}
                <Link
                  href={alert.href}
                  className="flex-shrink-0 flex items-center gap-0.5 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors mt-0.5"
                >
                  Voir
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
