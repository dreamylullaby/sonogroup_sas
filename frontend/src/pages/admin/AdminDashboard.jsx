/**
 * AdminDashboard (nuevo) — página principal que integra todos los widgets
 * Requirements: 2.1, 2.2, 2.3, 2.8, 2.9, 2.10, 2.11
 */
import { Building2, Users, Clock, XCircle, UserCheck, UserPlus, MessageSquare, Heart, Star, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import KPICard from '../../components/admin/dashboard/KPICard'
import KPICardSkeleton from '../../components/admin/dashboard/KPICardSkeleton'
import PublicationsBarChart from '../../components/admin/dashboard/PublicationsBarChart'
import UsersLineChart from '../../components/admin/dashboard/UsersLineChart'
import PropertyTypeDonut from '../../components/admin/dashboard/PropertyTypeDonut'
import ActivityFeed from '../../components/admin/dashboard/ActivityFeed'
import StatusBadge from '../../components/admin/shared/StatusBadge'
import PageHeader from '../../components/admin/shared/PageHeader'
import useAdminStats from '../../hooks/admin/useAdminStats'

function getTrend(change) {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

export default function AdminDashboard() {
  const { kpis, changes, charts, loading, error, refetch } = useAdminStats()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-700 font-medium mb-2">Error al cargar el dashboard</p>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    )
  }

  const kpiCards = kpis ? [
    { title: 'Total Propiedades', value: kpis.totalPropiedades, change: changes?.totalPropiedades || 0, icon: Building2, color: 'blue' },
    { title: 'Aprobadas', value: kpis.propiedadesAprobadas, change: 0, icon: CheckCircle, color: 'green' },
    { title: 'Pendientes', value: kpis.propiedadesPendientes, change: 0, icon: Clock, color: 'yellow' },
    { title: 'Rechazadas', value: kpis.propiedadesRechazadas, change: 0, icon: XCircle, color: 'red' },
    { title: 'Usuarios Activos', value: kpis.usuariosActivos, change: changes?.usuariosActivos || 0, icon: UserCheck, color: 'blue' },
    { title: 'Nuevos esta Semana', value: kpis.nuevosUsuariosSemana, change: 0, icon: UserPlus, color: 'green' },
    { title: 'Contactos Pendientes', value: kpis.contactosSinResponder, change: changes?.contactosSinResponder || 0, icon: MessageSquare, color: 'purple' },
    { title: 'Favoritos Totales', value: kpis.favoritosTotales, change: 0, icon: Heart, color: 'red' },
    { title: 'Destacadas', value: kpis.propiedadesDestacadas, change: 0, icon: Star, color: 'yellow' },
    { title: 'Publicaciones Activas', value: kpis.publicacionesActivas, change: 0, icon: Building2, color: 'green' },
    { title: 'Publicaciones Vencidas', value: kpis.publicacionesVencidas, change: 0, icon: AlertTriangle, color: 'red' },
  ] : []

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del sistema" />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpiCards.slice(0, 4).map((kpi, i) => (
              <KPICard
                key={i}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                trend={getTrend(kpi.change)}
                icon={kpi.icon}
                color={kpi.color}
                sparklineData={[]}
              />
            ))
        }
      </div>

      {!loading && kpiCards.length > 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.slice(4, 8).map((kpi, i) => (
            <KPICard
              key={i}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              trend={getTrend(kpi.change)}
              icon={kpi.icon}
              color={kpi.color}
              sparklineData={[]}
            />
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {loading ? (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-80" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-80" />
          </>
        ) : (
          <>
            <PublicationsBarChart data={charts?.publicacionesPorMes || []} />
            <UsersLineChart data={charts?.usuariosPorSemana || []} />
          </>
        )}
      </div>

      {/* Donut + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {loading ? (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-80" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-80" />
          </>
        ) : (
          <>
            <PropertyTypeDonut data={charts?.distribucionTipos || []} />
            <ActivityFeed activities={[]} />
          </>
        )}
      </div>

      {/* Remaining KPIs (3 more) */}
      {!loading && kpiCards.length > 8 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {kpiCards.slice(8).map((kpi, i) => (
            <KPICard
              key={i}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              trend={getTrend(kpi.change)}
              icon={kpi.icon}
              color={kpi.color}
              sparklineData={[]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
