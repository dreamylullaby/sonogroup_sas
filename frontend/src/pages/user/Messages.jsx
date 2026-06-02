import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError } from '../../config/api'
import { FileText, ChevronDown, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import '../../styles/pages/Messages.css'

const ITEMS_PER_PAGE = 5

const Messages = () => {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { if (user) cargarDatos() }, [user])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/propiedades-pendientes/mis-propiedades')
      setSolicitudes(res.data.propiedades || [])
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const formatPrecio = (v) => {
    if (!v) return '—'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  }

  const formatFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  const getEstadoConfig = (estado) => {
    const map = {
      pendiente: { label: 'Pendiente', icon: Clock, color: '#D97706', bg: '#FEF3C7' },
      aprobado: { label: 'Aprobado', icon: CheckCircle, color: '#1a7a48', bg: '#E8F5EE' },
      rechazado: { label: 'Rechazado', icon: XCircle, color: '#8C1132', bg: '#FCE8EC' }
    }
    return map[estado] || map.pendiente
  }

  const totalPages = Math.ceil(solicitudes.length / ITEMS_PER_PAGE)
  const paginadas = solicitudes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  if (loading) return (
    <div className="msg-page"><div className="msg-container"><div className="msg-loading"><p>Cargando solicitudes...</p></div></div></div>
  )

  return (
    <div className="msg-page">
      <div className="msg-container">
        <div className="msg-header">
          <div>
            <h1>Mis Solicitudes</h1>
            <p>Historial de propiedades enviadas para revisión · {solicitudes.length} total</p>
          </div>
        </div>

        {error && <div className="msg-error"><AlertCircle size={14} /> {error}</div>}

        {solicitudes.length === 0 ? (
          <div className="msg-empty">
            <FileText size={40} strokeWidth={1.5} />
            <h3>No tienes solicitudes</h3>
            <p>Cuando publiques una propiedad, aparecerá aquí para seguimiento</p>
          </div>
        ) : (
          <>
            <div className="msg-list">
              {paginadas.map(s => {
                const datos = s.datos || {}
                const estado = getEstadoConfig(s.estado_aprobacion)
                const EstadoIcon = estado.icon
                const isOpen = expandedId === s.id_solicitud

                return (
                  <div key={s.id_solicitud} className={`msg-card ${isOpen ? 'msg-card--open' : ''}`}>
                    <div className="msg-card-top" onClick={() => setExpandedId(isOpen ? null : s.id_solicitud)}>
                      <div className="msg-card-left">
                        <span className="msg-estado-badge" style={{ background: estado.bg, color: estado.color }}>
                          <EstadoIcon size={12} /> {estado.label}
                        </span>
                        <div className="msg-card-info">
                          <span className="msg-tipo">{datos.tipo_inmueble || '—'}</span>
                          <span className="msg-sep">·</span>
                          <span className="msg-op">{datos.tipo_operacion || '—'}</span>
                          <span className="msg-sep">·</span>
                          <span className="msg-precio">{formatPrecio(datos.valor)}</span>
                        </div>
                        <span className="msg-ubicacion">{datos.ubicacion?.municipio || 'Sin ubicación'}</span>
                      </div>
                      <div className="msg-card-right">
                        <span className="msg-fecha">{formatFecha(s.fecha_solicitud)}</span>
                        <ChevronDown size={16} className={`msg-chevron ${isOpen ? 'msg-chevron--open' : ''}`} />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="msg-card-detail">
                        {datos.descripcion && <p className="msg-desc">{datos.descripcion}</p>}
                        <div className="msg-detail-grid">
                          <div className="msg-detail-item">
                            <span className="msg-detail-label">Zona</span>
                            <span className="msg-detail-value">{datos.zona || '—'}</span>
                          </div>
                          <div className="msg-detail-item">
                            <span className="msg-detail-label">Estado inmueble</span>
                            <span className="msg-detail-value">{datos.estado_inmueble || '—'}</span>
                          </div>
                          <div className="msg-detail-item">
                            <span className="msg-detail-label">Estrato</span>
                            <span className="msg-detail-value">{datos.estrato || '—'}</span>
                          </div>
                          <div className="msg-detail-item">
                            <span className="msg-detail-label">Enviado</span>
                            <span className="msg-detail-value">{formatFecha(s.fecha_solicitud)}</span>
                          </div>
                          {s.fecha_revision && (
                            <div className="msg-detail-item">
                              <span className="msg-detail-label">Revisado</span>
                              <span className="msg-detail-value">{formatFecha(s.fecha_revision)}</span>
                            </div>
                          )}
                        </div>
                        {s.estado_aprobacion === 'aprobado' && (
                          <div className="msg-success-note"><CheckCircle size={13} /> Tu propiedad ha sido aprobada y publicada</div>
                        )}
                        {s.estado_aprobacion === 'rechazado' && s.motivo_rechazo && (
                          <div className="msg-reject-note"><XCircle size={13} /> Motivo: {s.motivo_rechazo}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="msg-pagination">
                <button className="msg-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                <span className="msg-page-info">Página {page} de {totalPages}</span>
                <button className="msg-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Messages
