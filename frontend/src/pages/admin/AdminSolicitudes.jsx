import { useState, useEffect } from 'react'
import { FileText, Eye, Check, X, MapPin, Trash2, User } from 'lucide-react'
import { api } from '../../config/api'
import PropertyFullDetailModal from '../../components/admin/shared/PropertyFullDetailModal'
import EditSolicitudDetailModal from '../../components/admin/shared/EditSolicitudDetailModal'
import RejectModal from '../../components/admin/shared/RejectModal'
import DeleteConfirmModal from '../../components/admin/shared/DeleteConfirmModal'

const TIPO_CONFIG = {
  publicacion: { label: 'Publicación', color: '#2563EB', bg: '#DBEAFE' },
  eliminacion: { label: 'Eliminación', color: '#991B1B', bg: '#FEE2E2' },
  edicion: { label: 'Edición', color: '#7C3AED', bg: '#EDE9FE' },
  revision_edicion: { label: 'Revisión cambios', color: '#B45309', bg: '#FEF3C7' }
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
  aprobado: { label: 'Aprobado', color: '#059669', bg: '#D1FAE5' },
  rechazado: { label: 'Rechazado', color: '#DC2626', bg: '#FEE2E2' }
}

function Badge({ config }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
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
  const [rejectTarget, setRejectTarget] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todas')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = () => {
    setLoading(true)
    const params = filtroTipo !== 'todas' ? `?tipo=${filtroTipo}` : ''
    api.get(`/api/propiedades-pendientes${params}`)
      .then(res => setSolicitudes(res.data.propiedades || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filtroTipo])

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)

  const handleAprobar = async (id, tipoSolicitud) => {
    if (tipoSolicitud === 'eliminacion') {
      setDeleteConfirmTarget(id)
      return
    }
    if (tipoSolicitud === 'revision_edicion') {
      await api.put(`/api/propiedades-pendientes/${id}/aprobar-cambios`)
    } else {
      await api.put(`/api/propiedades-pendientes/${id}/aprobar`)
    }
    setDetailModal(null)
    fetchData()
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return
    await api.put(`/api/propiedades-pendientes/${deleteConfirmTarget}/aprobar-eliminacion`)
    setDeleteConfirmTarget(null)
    setDetailModal(null)
    fetchData()
  }

  const handleRechazar = async (motivo) => {
    if (!rejectTarget) return
    await api.put(`/api/propiedades-pendientes/${rejectTarget.id_solicitud}/rechazar`, { motivo })
    setRejectTarget(null)
    setDetailModal(null)
    fetchData()
  }

  const handleEliminar = async (id) => {
    await api.delete(`/api/propiedades-pendientes/${id}`)
    setDeleteTarget(null)
    fetchData()
  }

  const pendientes = solicitudes.filter(s => s.estado_aprobacion === 'pendiente').length

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Solicitudes</h1>
        <p className="admin-page__subtitle">
          Revisa solicitudes de publicación, edición y eliminación ·
          <span style={{ color: '#D97706', fontWeight: 600 }}> {pendientes} pendientes</span>
        </p>
      </div>

      {/* Tabs de filtro por TIPO */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'publicacion', label: 'Publicación' },
          { key: 'eliminacion', label: 'Eliminación' },
          { key: 'edicion', label: 'Edición' },
          { key: 'revision_edicion', label: 'Revisión cambios' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroTipo(f.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '5px 12px', fontSize: '11px', fontWeight: 500,
              border: filtroTipo === f.key ? '1px solid #6B3FA0' : '1px solid #e0d8ec',
              background: filtroTipo === f.key ? '#F3EEFF' : '#fff',
              color: filtroTipo === f.key ? '#6B3FA0' : '#5A4864',
              borderRadius: '16px', cursor: 'pointer'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : solicitudes.length === 0 ? (
          <div className="admin-card__empty"><FileText size={32} /><p>No hay solicitudes</p><p className="sub">Las nuevas solicitudes aparecerán aquí</p></div>
        ) : (
          <div className="admin-card__body">
            {solicitudes.map(s => {
              const d = s.datos || {}
              const usuario = s.usuarios || {}
              const tipoConf = TIPO_CONFIG[s.tipo_solicitud] || TIPO_CONFIG.publicacion
              const estadoConf = ESTADO_CONFIG[s.estado_aprobacion] || ESTADO_CONFIG.pendiente
              return (
                <div key={s.id_solicitud} className="admin-list-item">
                  <div className="admin-list-item__content">
                    <div className="admin-list-item__title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge config={tipoConf} />
                      <Badge config={estadoConf} />
                      {s.estado_aprobacion === 'pendiente' && s.motivo_rechazo && (
                        <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: 600, background: '#FEF3C7', color: '#B45309', textTransform: 'uppercase' }}>↻ Reenvío</span>
                      )}
                      <span style={{ marginLeft: '0.25rem' }}>
                        {d.tipo_inmueble || 'propiedad'}
                        {d.tipo_operacion ? ` — ${d.tipo_operacion === 'arriendo' ? 'Arriendo' : 'Venta'}` : ''}
                      </span>
                    </div>
                    <div className="admin-list-item__meta">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <User size={10} /> {usuario.nombre || 'Usuario'}
                      </span>
                      {usuario.email && <span style={{ color: '#8097B7' }}>{usuario.email}</span>}
                      {s.tipo_solicitud === 'edicion' && d.motivo && (
                        <span style={{ color: '#7C3AED', fontStyle: 'italic' }}>"{d.motivo.substring(0, 60)}{d.motivo.length > 60 ? '...' : ''}"</span>
                      )}
                      {s.tipo_solicitud === 'eliminacion' && d.motivo && (
                        <span style={{ color: '#991B1B', fontStyle: 'italic' }}>"{d.motivo.substring(0, 60)}{d.motivo.length > 60 ? '...' : ''}"</span>
                      )}
                      {s.tipo_solicitud !== 'edicion' && s.tipo_solicitud !== 'eliminacion' && (
                        <span><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {d.ubicacion?.municipio || 'Sin ubicación'}</span>
                      )}
                      {s.id_inmueble && (s.tipo_solicitud === 'edicion' || s.tipo_solicitud === 'eliminacion') && (
                        <span style={{ color: '#5A4864' }}>Propiedad #{s.id_inmueble}{d.tipo_inmueble ? ` · ${d.tipo_inmueble}` : ''}</span>
                      )}
                      {d.valor && <span>$ {Number(d.valor).toLocaleString('es-CO')}</span>}
                      <span>{new Date(s.fecha_solicitud).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="admin-list-item__actions">
                    <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => setDetailModal(s)}><Eye size={13} /></button>
                    {s.estado_aprobacion === 'pendiente' && (
                      <>
                        <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(s.id_solicitud, s.tipo_solicitud)}><Check size={12} /> Aprobar</button>
                        <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setRejectTarget(s)}><X size={12} /> Rechazar</button>
                      </>
                    )}
                    <button className="admin-btn admin-btn--ghost admin-btn--sm" title="Eliminar" style={{ color: '#CC1E2B' }} onClick={() => setDeleteTarget(s)}><Trash2 size={12} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal — edicion and eliminacion use EditSolicitudDetailModal (loads property from API) */}
      {detailModal && (detailModal.tipo_solicitud === 'edicion' || detailModal.tipo_solicitud === 'eliminacion') && (
        <EditSolicitudDetailModal
          solicitud={detailModal}
          onClose={() => setDetailModal(null)}
          headerActions={
            detailModal.estado_aprobacion === 'pendiente' ? (
              <>
                <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(detailModal.id_solicitud, detailModal.tipo_solicitud)}>
                  <Check size={12} /> Aprobar
                </button>
                <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => { setDetailModal(null); setRejectTarget(detailModal) }}>
                  <X size={12} /> Rechazar
                </button>
              </>
            ) : null
          }
        />
      )}

      {/* Detail Modal — property detail for publicacion/revision types */}
      {detailModal && detailModal.tipo_solicitud !== 'edicion' && detailModal.tipo_solicitud !== 'eliminacion' && (
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
          title={`Solicitud #${detailModal.id_solicitud}`}
          onClose={() => setDetailModal(null)}
          headerActions={
            detailModal.estado_aprobacion === 'pendiente' ? (
              <>
                <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleAprobar(detailModal.id_solicitud, detailModal.tipo_solicitud)}>
                  <Check size={12} /> Aprobar
                </button>
                <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => { setDetailModal(null); setRejectTarget(detailModal) }}>
                  <X size={12} /> Rechazar
                </button>
              </>
            ) : null
          }
        />
      )}

      {/* Reject Modal (reutilizable) */}
      <RejectModal
        open={!!rejectTarget}
        title="Rechazar solicitud"
        description={
          rejectTarget
            ? `${TIPO_CONFIG[rejectTarget.tipo_solicitud]?.label || 'Publicación'} · ${(rejectTarget.usuarios || {}).nombre || 'Usuario'}`
            : ''
        }
        onConfirm={handleRechazar}
        onCancel={() => setRejectTarget(null)}
        minLength={20}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Eliminar solicitud"
        description={`¿Eliminar esta solicitud de ${TIPO_CONFIG[deleteTarget?.tipo_solicitud]?.label || 'publicación'}? Esta acción no se puede deshacer.`}
        onConfirm={() => handleEliminar(deleteTarget.id_solicitud)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete Confirmation for eliminacion approval */}
      <DeleteConfirmModal
        open={!!deleteConfirmTarget}
        title="Confirmar eliminación de propiedad"
        description="¿Confirmas que deseas eliminar permanentemente esta propiedad? Esta acción desactiva el inmueble y no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmTarget(null)}
      />
    </div>
  )
}
