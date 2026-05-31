import { useState, useEffect } from 'react'
import { FileText, Check, X, Eye, MapPin, AlertTriangle } from 'lucide-react'
import { api } from '../../config/api'

export default function AdminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesCuenta, setSolicitudesCuenta] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('publicacion')
  const [detailModal, setDetailModal] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/propiedades-pendientes').catch(() => ({ data: { propiedades: [] } })),
      api.get('/api/solicitudes-cuenta').catch(() => ({ data: { solicitudes: [] } }))
    ]).then(([pubRes, cuentaRes]) => {
      setSolicitudes(pubRes.data.propiedades || [])
      setSolicitudesCuenta(cuentaRes.data.solicitudes || [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const handleAprobar = async (id) => { if (!window.confirm('¿Aprobar esta solicitud?')) return; await api.put(`/api/propiedades-pendientes/${id}/aprobar`); fetchData() }
  const handleRechazar = async (id) => { const m = prompt('Motivo del rechazo:'); if (!m) return; await api.put(`/api/propiedades-pendientes/${id}/rechazar`, { motivo: m }); fetchData() }
  const handleAprobarCuenta = async (id) => { if (!window.confirm('¿Aprobar eliminación de cuenta?')) return; await api.put(`/api/solicitudes-cuenta/${id}/aprobar`); fetchData() }
  const handleRechazarCuenta = async (id) => { const n = prompt('Nota para el usuario:'); await api.put(`/api/solicitudes-cuenta/${id}/rechazar`, { nota_admin: n || '' }); fetchData() }

  const pendientes = solicitudes.filter(s => s.estado_aprobacion === 'pendiente')
  const cuentaPendientes = solicitudesCuenta.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision')

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Solicitudes</h1>
        <p className="admin-page__subtitle">Gestiona solicitudes de publicación y eliminación de cuenta</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'publicacion' ? 'admin-tab--active' : ''}`} onClick={() => setTab('publicacion')}>
          Publicación ({pendientes.length})
        </button>
        <button className={`admin-tab ${tab === 'cuenta' ? 'admin-tab--active' : ''}`} onClick={() => setTab('cuenta')}>
          Eliminación de cuenta ({cuentaPendientes.length})
        </button>
      </div>

      {/* Publicación */}
      {tab === 'publicacion' && (
        <div className="admin-card">
          {loading ? (
            <div className="admin-card__empty"><p>Cargando...</p></div>
          ) : pendientes.length === 0 ? (
            <div className="admin-card__empty"><FileText size={32} /><p>No hay solicitudes de publicación pendientes</p></div>
          ) : (
            <div className="admin-card__body">
              {pendientes.map(s => {
                const d = s.datos || {}
                return (
                  <div key={s.id_solicitud} className="admin-list-item">
                    <div className="admin-list-item__content">
                      <div className="admin-list-item__title">
                        <span className="admin-badge admin-badge--slate">{d.tipo_inmueble || 'propiedad'}</span>
                        <span style={{ marginLeft: '0.5rem' }}>{d.tipo_operacion === 'arriendo' ? 'Arriendo' : 'Venta'}</span>
                      </div>
                      <div className="admin-list-item__meta">
                        <span><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {d.ubicacion?.municipio || 'Sin ubicación'}</span>
                        <span>$ {Number(d.valor || 0).toLocaleString('es-CO')}</span>
                        <span>{new Date(s.fecha_solicitud).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => setDetailModal(d)}><Eye size={13} /></button>
                      <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(s.id_solicitud)}><Check size={12} /> Aprobar</button>
                      <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleRechazar(s.id_solicitud)}><X size={12} /> Rechazar</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Eliminación de cuenta */}
      {tab === 'cuenta' && (
        <div className="admin-card">
          {cuentaPendientes.length === 0 ? (
            <div className="admin-card__empty"><AlertTriangle size={32} /><p>No hay solicitudes de eliminación de cuenta</p></div>
          ) : (
            <div className="admin-card__body">
              {cuentaPendientes.map(s => (
                <div key={s.id_solicitud} className="admin-list-item">
                  <div className="admin-list-item__content">
                    <div className="admin-list-item__title">
                      {s.usuarios?.nombre_completo || s.usuarios?.email || 'Usuario'}
                    </div>
                    <div className="admin-list-item__meta">
                      <span>Motivo: {s.motivo || 'No especificado'}</span>
                      <span>{new Date(s.fecha_solicitud).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="admin-list-item__actions">
                    <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobarCuenta(s.id_solicitud)}><Check size={12} /> Aprobar</button>
                    <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleRechazarCuenta(s.id_solicitud)}><X size={12} /> Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Detalles de la solicitud</h3>
              <button className="admin-btn admin-btn--ghost" onClick={() => setDetailModal(null)}><X size={16} /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-detail-grid">
                <div><strong>Tipo:</strong> {detailModal.tipo_inmueble}</div>
                <div><strong>Operación:</strong> {detailModal.tipo_operacion}</div>
                <div><strong>Valor:</strong> $ {Number(detailModal.valor || 0).toLocaleString('es-CO')}</div>
                <div><strong>Zona:</strong> {detailModal.zona}</div>
                <div><strong>Estado:</strong> {detailModal.estado_inmueble}</div>
                <div><strong>Estrato:</strong> {detailModal.estrato || '—'}</div>
                <div><strong>Municipio:</strong> {detailModal.ubicacion?.municipio || '—'}</div>
                <div><strong>Dirección:</strong> {detailModal.ubicacion?.direccion || '—'}</div>
              </div>
              {detailModal.descripcion && <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '1rem', lineHeight: 1.6 }}>{detailModal.descripcion}</p>}
              {detailModal.caracteristicas && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ fontSize: '0.72rem' }}>Características:</strong>
                  <div className="admin-detail-grid" style={{ marginTop: '0.5rem' }}>
                    {Object.entries(detailModal.caracteristicas).filter(([, v]) => v !== null && v !== false).map(([k, v]) => (
                      <div key={k}><strong>{k.replace(/_/g, ' ')}:</strong> {typeof v === 'boolean' ? 'Sí' : v}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
