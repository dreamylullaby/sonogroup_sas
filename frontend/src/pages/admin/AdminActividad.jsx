import { Activity } from 'lucide-react'

export default function AdminActividad() {
  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Actividad</h1>
        <p className="admin-page__subtitle">Registro de actividad reciente del sistema</p>
      </div>
      <div className="admin-card">
        <div className="admin-card__empty">
          <Activity size={32} />
          <p>Sin actividad reciente registrada</p>
          <p className="sub">Los eventos del sistema aparecerán aquí</p>
        </div>
      </div>
    </div>
  )
}
