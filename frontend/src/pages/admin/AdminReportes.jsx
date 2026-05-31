import { BarChart3, Building2, Users, TrendingUp } from 'lucide-react'

export default function AdminReportes() {
  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Reportes</h1>
        <p className="admin-page__subtitle">Estadísticas y análisis del sistema</p>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(226,6,19,0.08)' }}>
            <Building2 size={18} style={{ color: '#E20613' }} />
          </div>
          <div>
            <div className="admin-stat-card__value">—</div>
            <div className="admin-stat-card__label">Propiedades este mes</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <Users size={18} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div className="admin-stat-card__value">—</div>
            <div className="admin-stat-card__label">Nuevos usuarios</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(59,130,246,0.08)' }}>
            <TrendingUp size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <div className="admin-stat-card__value">—</div>
            <div className="admin-stat-card__label">Tasa de conversión</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__empty">
          <BarChart3 size={32} />
          <p>Reportes detallados próximamente</p>
          <p className="sub">Las estadísticas principales se muestran en el Dashboard</p>
        </div>
      </div>
    </div>
  )
}
