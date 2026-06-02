import { useState, useEffect } from 'react'
import { FileText, Eye, Check, X, MapPin, Trash2, User, AlertTriangle } from 'lucide-react'
import { api } from '../../config/api'
import SolicitudDetailModal from '../../components/admin/shared/SolicitudDetailModal'

export default function AdminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailModal, setDetailModal] = useState(null)
  const [rechazoModal, setRechazoModal] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

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
    if (!motivoRechazo.trim()) return
    await api.put(`/api/propiedades-pendientes/${id}/rechazar`, { motivo: motivoRechazo.trim() })
    setRechazoModal(null)
    setMotivoRechazo('')
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
              const usuario = s.usuarios || {}
              return (
                <div key={s.id_solicitud} className="admin-list-item">
                  <div className="admin-list-item__content">
                    <div className="admin-list-item__title">
                      <span className="admin-badge admin-badge--venta" style={{ marginRight: '0.5rem' }}>{d.tipo_inmueble || 'propiedad'}</span>
                      {d.tipo_operacion === 'arriendo' ? 'Arriendo' : 'Venta'}
                    </div>
                    <div className="admin-list-item__meta">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <User size={10} /> {usuario.nombre || 'Usuario desconocido'}
                      </span>
                      {usuario.email && <span style={{ color: '#8097B7' }}>{usuario.email}</span>}
                      <span><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {d.ubicacion?.municipio || 'Sin ubicacion'}</span>
                      <span>$ {Number(d.valor || 0).toLocaleString('es-CO')}</span>
                      <span>{new Date(s.fecha_solicitud).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="admin-list-item__actions">
                    <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => setDetailModal(s)}><Eye size={13} /></button>
                    <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(s.id_solicitud)}><Check size={12} /> Aprobar</button>
                    <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => { setRechazoModal(s); setMotivoRechazo('') }}><X size={12} /> Rechazar</button>
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
          onRechazar={(id) => { setDetailModal(null); setRechazoModal(solicitudes.find(s => s.id_solicitud === id)); setMotivoRechazo('') }}
        />
      )}

      {/* Rechazo Modal */}
      {rechazoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', border: '0.5px solid #e0d8ec' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FCE8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <AlertTriangle size={22} color="#CC1E2B" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#241929', margin: '0 0 6px' }}>Rechazar solicitud</h3>
              <p style={{ fontSize: '12px', color: '#8097B7', margin: 0 }}>
                {rechazoModal.datos?.tipo_inmueble || 'Propiedad'} · {(rechazoModal.usuarios || {}).nombre || 'Usuario'}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5A4864', marginBottom: '6px' }}>
                Motivo del rechazo <span style={{ color: '#CC1E2B' }}>*</span>
              </label>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Explica al usuario por qué se rechaza su solicitud..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px', color: '#241929',
                  border: '0.5px solid #e0d8ec', borderRadius: '8px', background: '#F4F0F8',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit'
                }}
                autoFocus
              />
              {motivoRechazo.trim().length > 0 && motivoRechazo.trim().length < 10 && (
                <p style={{ fontSize: '11px', color: '#8C1132', marginTop: '4px' }}>Mínimo 10 caracteres</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRechazoModal(null)}
                style={{
                  padding: '8px 16px', fontSize: '11px', fontWeight: 500,
                  background: 'transparent', color: '#5A4864', border: '0.5px solid #e0d8ec',
                  borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRechazar(rechazoModal.id_solicitud)}
                disabled={motivoRechazo.trim().length < 10}
                style={{
                  padding: '8px 18px', fontSize: '11px', fontWeight: 500,
                  background: motivoRechazo.trim().length >= 10 ? '#CC1E2B' : '#e0d8ec',
                  color: motivoRechazo.trim().length >= 10 ? '#fff' : '#8097B7',
                  border: 'none', borderRadius: '8px',
                  cursor: motivoRechazo.trim().length >= 10 ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                <X size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
