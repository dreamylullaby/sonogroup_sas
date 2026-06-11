import { useState, useEffect } from 'react'
import { MessageSquare, Eye, CheckCircle, Trash2, X } from 'lucide-react'
import { api } from '../../config/api'

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
  recibido: { label: 'Recibido', color: '#2563EB', bg: '#DBEAFE' },
  no_resuelto: { label: 'No resuelto', color: '#DC2626', bg: '#FEE2E2' },
  resuelto: { label: 'Resuelto', color: '#059669', bg: '#D1FAE5' }
}

function EstadoBadge({ estado }) {
  const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente
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

export default function AdminContactos() {
  const [contactos, setContactos] = useState([])
  const [contadores, setContadores] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [resolveModal, setResolveModal] = useState(null)
  const [respuesta, setRespuesta] = useState('')
  const [resolving, setResolving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    const params = filtroEstado ? `?estado=${filtroEstado}` : ''
    api.get(`/api/admin/contactos${params}`)
      .then(res => {
        setContactos(res.data.contactos || [])
        if (res.data.contadores) setContadores(res.data.contadores)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filtroEstado])

  const handleOpenDetail = async (contacto) => {
    // Llamar al detalle para marcar como recibido si era pendiente
    try {
      const res = await api.get(`/api/admin/contactos/${contacto.id_contacto}`)
      setDetailModal(res.data.contacto)
      // Actualizar localmente
      if (contacto.estado === 'pendiente') {
        setContactos(prev => prev.map(c =>
          c.id_contacto === contacto.id_contacto ? { ...c, estado: 'recibido' } : c
        ))
      }
    } catch {
      setDetailModal(contacto)
    }
  }

  const handleResolver = async () => {
    if (!resolveModal || respuesta.trim().length < 10) return
    setResolving(true)
    try {
      await api.put(`/api/admin/contactos/${resolveModal.id_contacto}/resolver`, {
        respuesta: respuesta.trim()
      })
      setResolveModal(null)
      setDetailModal(null)
      setRespuesta('')
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al resolver')
    } finally {
      setResolving(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este contacto permanentemente?')) return
    await api.delete(`/api/admin/contactos/${id}`)
    fetchData()
  }

  const tabs = [
    { key: '', label: 'Todos', count: contadores.total },
    { key: 'pendiente', label: 'Pendientes', count: contadores.pendiente },
    { key: 'recibido', label: 'Recibidos', count: contadores.recibido },
    { key: 'no_resuelto', label: 'No resueltos', count: contadores.no_resuelto },
    { key: 'resuelto', label: 'Resueltos', count: contadores.resuelto },
  ]

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Contactos</h1>
        <p className="admin-page__subtitle">Mensajes y consultas recibidas</p>
      </div>

      {/* Tabs de filtro */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFiltroEstado(tab.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '5px 12px', fontSize: '11px', fontWeight: 500,
              border: filtroEstado === tab.key ? '1px solid #6B3FA0' : '1px solid #e0d8ec',
              background: filtroEstado === tab.key ? '#F3EEFF' : '#fff',
              color: filtroEstado === tab.key ? '#6B3FA0' : '#5A4864',
              borderRadius: '16px', cursor: 'pointer'
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{ fontSize: '9px', background: filtroEstado === tab.key ? '#6B3FA0' : '#e0d8ec', color: filtroEstado === tab.key ? '#fff' : '#5A4864', borderRadius: '8px', padding: '1px 5px', marginLeft: '2px' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : contactos.length === 0 ? (
          <div className="admin-card__empty"><MessageSquare size={32} /><p>No hay contactos en este estado</p></div>
        ) : (
          <div className="admin-card__body">
            {contactos.map(c => (
              <div key={c.id_contacto} className="admin-list-item">
                <div className="admin-list-item__content">
                  <div className="admin-list-item__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <EstadoBadge estado={c.estado} />
                    <span>{c.nombre} — {c.asunto}</span>
                  </div>
                  <div className="admin-list-item__meta">
                    <span>{c.email}</span>
                    <span>{new Date(c.fecha_contacto).toLocaleDateString('es-CO')}</span>
                    <span style={{ color: '#666' }}>{c.mensaje?.substring(0, 80)}{c.mensaje?.length > 80 ? '...' : ''}</span>
                  </div>
                </div>
                <div className="admin-list-item__actions">
                  <button className="admin-btn admin-btn--ghost" title="Ver detalle" onClick={() => handleOpenDetail(c)}><Eye size={13} /></button>
                  {c.estado !== 'resuelto' && (
                    <button className="admin-btn admin-btn--success admin-btn--sm" title="Resolver" onClick={() => { setResolveModal(c); setRespuesta('') }}><CheckCircle size={12} /> Resolver</button>
                  )}
                  <button className="admin-btn admin-btn--ghost admin-btn--sm" title="Eliminar" style={{ color: '#CC1E2B' }} onClick={() => handleEliminar(c.id_contacto)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '520px', border: '0.5px solid #e0d8ec', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#241929', margin: 0 }}>
                  {detailModal.nombre} — {detailModal.asunto}
                </h3>
                <p style={{ fontSize: '11px', color: '#8097B7', margin: '4px 0 0' }}>
                  {detailModal.email} · {detailModal.telefono || 'Sin teléfono'} · {new Date(detailModal.fecha_contacto).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8097B7' }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <EstadoBadge estado={detailModal.estado} />
              {detailModal.inmuebles && (
                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#5A4864' }}>
                  Propiedad: {detailModal.inmuebles.tipo_inmueble} #{detailModal.inmuebles.id_inmueble}
                </span>
              )}
            </div>

            {/* Mensaje original */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5A4864', marginBottom: '6px' }}>
                Mensaje del usuario
              </label>
              <div style={{ padding: '12px', background: '#F4F0F8', borderRadius: '8px', fontSize: '13px', color: '#241929', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {detailModal.mensaje}
              </div>
            </div>

            {/* Respuesta del admin (si resuelto) */}
            {detailModal.estado === 'resuelto' && detailModal.respuesta_admin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', marginBottom: '6px' }}>
                  Respuesta del administrador
                </label>
                <div style={{ padding: '12px', background: '#D1FAE5', borderRadius: '8px', fontSize: '13px', color: '#065F46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {detailModal.respuesta_admin}
                </div>
                {detailModal.fecha_resolucion && (
                  <p style={{ fontSize: '10px', color: '#8097B7', marginTop: '4px' }}>
                    Resuelto el {new Date(detailModal.fecha_resolucion).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {detailModal.estado !== 'resuelto' && (
                <button
                  className="admin-btn admin-btn--success admin-btn--sm"
                  onClick={() => { setDetailModal(null); setResolveModal(detailModal); setRespuesta('') }}
                >
                  <CheckCircle size={12} /> Resolver
                </button>
              )}
              <button
                onClick={() => setDetailModal(null)}
                style={{ padding: '6px 14px', fontSize: '11px', background: 'transparent', border: '1px solid #e0d8ec', borderRadius: '8px', cursor: 'pointer', color: '#5A4864' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '480px', border: '0.5px solid #e0d8ec' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#241929', margin: '0 0 6px' }}>Responder y resolver consulta</h3>
              <p style={{ fontSize: '12px', color: '#8097B7', margin: 0 }}>
                {resolveModal.nombre} · {resolveModal.asunto}
              </p>
            </div>

            {/* Mensaje original (solo lectura) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5A4864', marginBottom: '4px' }}>
                Mensaje original
              </label>
              <div style={{ padding: '10px', background: '#F4F0F8', borderRadius: '8px', fontSize: '12px', color: '#4A3F55', lineHeight: 1.5, maxHeight: '100px', overflow: 'auto' }}>
                {resolveModal.mensaje}
              </div>
            </div>

            {/* Textarea respuesta */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5A4864', marginBottom: '6px' }}>
                Tu respuesta <span style={{ color: '#CC1E2B' }}>*</span>
              </label>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe la respuesta al usuario..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px', color: '#241929',
                  border: '0.5px solid #e0d8ec', borderRadius: '8px', background: '#F4F0F8',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit'
                }}
                autoFocus
              />
              {respuesta.trim().length > 0 && respuesta.trim().length < 10 && (
                <p style={{ fontSize: '11px', color: '#8C1132', marginTop: '4px' }}>Mínimo 10 caracteres</p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setResolveModal(null); setRespuesta('') }}
                style={{
                  padding: '8px 16px', fontSize: '11px', fontWeight: 500,
                  background: 'transparent', color: '#5A4864', border: '0.5px solid #e0d8ec',
                  borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleResolver}
                disabled={respuesta.trim().length < 10 || resolving}
                style={{
                  padding: '8px 18px', fontSize: '11px', fontWeight: 500,
                  background: respuesta.trim().length >= 10 ? '#059669' : '#e0d8ec',
                  color: respuesta.trim().length >= 10 ? '#fff' : '#8097B7',
                  border: 'none', borderRadius: '8px',
                  cursor: respuesta.trim().length >= 10 ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                <CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {resolving ? 'Enviando...' : 'Enviar respuesta y resolver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
