import { useState, useEffect } from 'react'
import { FileText, Eye, Check, X, MapPin, Trash2, User, AlertTriangle, RefreshCw, CheckCircle, Clock, Inbox } from 'lucide-react'
import { api } from '../../config/api'
import PropertyFullDetailModal from '../../components/admin/shared/PropertyFullDetailModal'

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
  recibido: { label: 'Recibido', color: '#2563EB', bg: '#DBEAFE' },
  aprobado: { label: 'Aprobado', color: '#059669', bg: '#D1FAE5' },
  rechazado: { label: 'Rechazado', color: '#DC2626', bg: '#FEE2E2' },
  resuelto: { label: 'Resuelto', color: '#059669', bg: '#D1FAE5' },
  no_resuelto: { label: 'No resuelto', color: '#DC2626', bg: '#FEE2E2' }
}

function EstadoBadge({ estado }) {
  const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
      color: config.color, background: config.bg, textTransform: 'uppercase', letterSpacing: '0.03em'
    }}>
      {config.label}
    </span>
  )
}

export default function AdminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailModal, setDetailModal] = useState(null)
  const [rechazoModal, setRechazoModal] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('pendiente')

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

  const handleResolver = async (id) => {
    await api.put(`/api/propiedades-pendientes/${id}/resolver`)
    setDetailModal(null)
    fetchData()
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar esta solicitud permanentemente?')) return
    await api.delete(`/api/propiedades-pendientes/${id}`)
    fetchData()
  }

  // Marcar como recibido al abrir detalle
  const handleOpenDetail = async (solicitud) => {
    setDetailModal(solicitud)
    if (solicitud.estado_aprobacion === 'pendiente') {
      try {
        await api.put(`/api/propiedades-pendientes/${solicitud.id_solicitud}/recibido`)
        // Actualizar localmente
        setSolicitudes(prev => prev.map(s =>
          s.id_solicitud === solicitud.id_solicitud
            ? { ...s, estado_aprobacion: 'recibido' }
            : s
        ))
      } catch (e) { /* silencioso */ }
    }
  }

  const filtradas = filtroEstado === 'todas'
    ? solicitudes
    : solicitudes.filter(s => s.estado_aprobacion === filtroEstado)

  const conteos = {
    pendiente: solicitudes.filter(s => s.estado_aprobacion === 'pendiente').length,
    recibido: solicitudes.filter(s => s.estado_aprobacion === 'recibido').length,
    no_resuelto: solicitudes.filter(s => s.estado_aprobacion === 'no_resuelto').length,
  }

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Solicitudes</h1>
        <p className="admin-page__subtitle">
          Gestiona solicitudes de publicación y edición ·
          <span style={{ color: '#D97706', fontWeight: 600 }}> {conteos.pendiente} pendientes</span>
          {conteos.recibido > 0 && <span style={{ color: '#2563EB', fontWeight: 600 }}> · {conteos.recibido} recibidas</span>}
          {conteos.no_resuelto > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}> · {conteos.no_resuelto} sin resolver</span>}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'pendiente', label: 'Pendientes', icon: <Clock size={11} /> },
          { key: 'recibido', label: 'Recibidas', icon: <Inbox size={11} /> },
          { key: 'no_resuelto', label: 'No resueltas', icon: <AlertTriangle size={11} /> },
          { key: 'resuelto', label: 'Resueltas', icon: <CheckCircle size={11} /> },
          { key: 'todas', label: 'Todas', icon: <FileText size={11} /> },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroEstado(f.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '5px 12px', fontSize: '11px', fontWeight: 500,
              border: filtroEstado === f.key ? '1px solid #6B3FA0' : '1px solid #e0d8ec',
              background: filtroEstado === f.key ? '#F3EEFF' : '#fff',
              color: filtroEstado === f.key ? '#6B3FA0' : '#5A4864',
              borderRadius: '16px', cursor: 'pointer'
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : filtradas.length === 0 ? (
          <div className="admin-card__empty"><FileText size={32} /><p>No hay solicitudes en este estado</p></div>
        ) : (
          <div className="admin-card__body">
            {filtradas.map(s => {
              const d = s.datos || {}
              const usuario = s.usuarios || {}
              return (
                <div key={s.id_solicitud} className="admin-list-item">
                  <div className="admin-list-item__content">
                    <div className="admin-list-item__title">
                      <EstadoBadge estado={s.estado_aprobacion} />
                      {s.tipo_solicitud === 'edicion' && (
                        <span style={{ marginLeft: '4px', padding: '2px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 600, background: '#EDE9FE', color: '#7C3AED' }}>EDICIÓN</span>
                      )}
                      <span style={{ marginLeft: '0.5rem' }}>
                        {d.tipo_inmueble || 'propiedad'} — {d.tipo_operacion === 'arriendo' ? 'Arriendo' : 'Venta'}
                      </span>
                    </div>
                    <div className="admin-list-item__meta">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <User size={10} /> {usuario.nombre || 'Usuario'}
                      </span>
                      {usuario.email && <span style={{ color: '#8097B7' }}>{usuario.email}</span>}
                      <span><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {d.ubicacion?.municipio || 'Sin ubicacion'}</span>
                      <span>$ {Number(d.valor || 0).toLocaleString('es-CO')}</span>
                      <span>{new Date(s.fecha_solicitud).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="admin-list-item__actions">
                    <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => handleOpenDetail(s)}><Eye size={13} /></button>
                    {['pendiente', 'recibido'].includes(s.estado_aprobacion) && (
                      <>
                        <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(s.id_solicitud)}><Check size={12} /> Aprobar</button>
                        <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => { setRechazoModal(s); setMotivoRechazo('') }}><X size={12} /> Rechazar</button>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" title="Marcar resuelto" style={{ color: '#059669' }} onClick={() => handleResolver(s.id_solicitud)}><CheckCircle size={12} /></button>
                      </>
                    )}
                    <button className="admin-btn admin-btn--ghost admin-btn--sm" title="Eliminar" style={{ color: '#CC1E2B' }} onClick={() => handleEliminar(s.id_solicitud)}><Trash2 size={12} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <PropertyFullDetailModal
          property={{
            ...detailModal.datos,
            id_inmueble: detailModal.id_solicitud,
            estado_aprobacion: detailModal.estado_aprobacion,
            fecha_registro: detailModal.fecha_solicitud,
            caracteristicas: detailModal.datos?.caracteristicas || {},
            ubicaciones: detailModal.datos?.ubicacion || {}
          }}
          usuario={detailModal.usuarios}
          title={`Solicitud #${detailModal.id_solicitud}${detailModal.tipo_solicitud === 'edicion' ? ' (Edición)' : ''}`}
          onClose={() => setDetailModal(null)}
          headerActions={
            ['pendiente', 'recibido'].includes(detailModal.estado_aprobacion) ? (
              <>
                <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(detailModal.id_solicitud)}>
                  <Check size={12} /> Aprobar
                </button>
                <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => { setDetailModal(null); setRechazoModal(detailModal); setMotivoRechazo('') }}>
                  <X size={12} /> Rechazar
                </button>
                <button className="admin-btn admin-btn--ghost admin-btn--sm" style={{ color: '#059669', border: '1px solid #059669' }} onClick={() => handleResolver(detailModal.id_solicitud)}>
                  <CheckCircle size={12} /> Resuelto
                </button>
              </>
            ) : null
          }
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
