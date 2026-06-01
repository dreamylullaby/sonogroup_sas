import { useState, useEffect } from 'react'
import { FileText, Eye, Check, X, MapPin, Trash2 } from 'lucide-react'
import { api } from '../../config/api'
import SolicitudDetailModal from '../../components/admin/shared/SolicitudDetailModal'

export default function AdminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailModal, setDetailModal] = useState(null)

  const fetchData = () => {
    setLoading(true)
    api.get('/api/propiedades-pendientes').then(res => setSolicitudes(res.data.propiedades || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const handleAprobar = async (id) => {
    await api.put(`/api/propiedades-pendientes/${id}/aprobar`)
    setDetailModal(null)
    fetchData()
  }

  const handleRechazar = async (id) => {
    const m = prompt('Motivo del rechazo:')
    if (!m) return
    await api.put(`/api/propiedades-pendientes/${id}/rechazar`, { motivo: m })
    setDetailModal(null)
    fetchData()
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar esta solicitud permanentemente?')) return
    await api.delete(`/api/propiedades-pendientes/${id}`)
    fetchData()
  }

  const pendientes = solicitudes.filter(s => s.estado_aprobacion === 'pendiente')

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Solicitudes</h1>
        <p className="admin-page__subtitle">Revisa solicitudes de publicacion · <span style={{ color: '#6B3FA0', fontWeight: 600 }}>{pendientes.length} pendientes</span></p>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : pendientes.length === 0 ? (
          <div className="admin-card__empty"><FileText size={32} /><p>No hay solicitudes pendientes</p><p className="sub">Las nuevas solicitudes apareceran aqui</p></div>
        ) : (
          <div className="admin-card__body">
            {pendientes.map(s => {
              const d = s.datos || {}
              return (
                <div key={s.id_solicitud} className="admin-list-item">
                  <div className="admin-list-item__content">
                    <div className="admin-list-item__title">
                      <span className="admin-badge admin-badge--venta" style={{ marginRight: '0.5rem' }}>{d.tipo_inmueble || 'propiedad'}</span>
                      {d.tipo_operacion === 'arriendo' ? 'Arriendo' : 'Venta'}
                    </div>
                    <div className="admin-list-item__meta">
                      <span><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {d.ubicacion?.municipio || 'Sin ubicacion'}</span>
                      <span>$ {Number(d.valor || 0).toLocaleString('es-CO')}</span>
                      <span>{new Date(s.fecha_solicitud).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="admin-list-item__actions">
                    <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => setDetailModal(s)}><Eye size={13} /></button>
                    <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(s.id_solicitud)}><Check size={12} /> Aprobar</button>
                    <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleRechazar(s.id_solicitud)}><X size={12} /> Rechazar</button>
                    <button className="admin-btn admin-btn--ghost admin-btn--sm" title="Eliminar solicitud" style={{ color: '#CC1E2B' }} onClick={() => handleEliminar(s.id_solicitud)}><Trash2 size={12} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <SolicitudDetailModal
          solicitud={detailModal}
          onClose={() => setDetailModal(null)}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
        />
      )}
    </div>
  )
}
