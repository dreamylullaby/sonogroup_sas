/**
 * ActivityFeed — feed de actividad reciente (últimas 10 acciones)
 * Requirements: 2.8
 */
import { CheckCircle, XCircle, UserPlus, MessageSquare, Star, Settings } from 'lucide-react'

const ICON_MAP = {
  aprobacion: { Icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  rechazo: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  usuario: { Icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
  contacto: { Icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
  favorito: { Icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  sistema: { Icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' }
}

function getRelativeTime(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export default function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Actividad Reciente</h3>
        <p className="text-sm text-slate-400 text-center py-8">Sin actividad reciente</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Actividad Reciente</h3>
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {activities.slice(0, 10).map((activity, idx) => {
          const config = ICON_MAP[activity.tipo] || ICON_MAP.sistema
          const { Icon } = config
          return (
            <div key={activity.id || idx} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg ${config.bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{activity.descripcion}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activity.actor && <span>{activity.actor} · </span>}
                  {getRelativeTime(activity.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
