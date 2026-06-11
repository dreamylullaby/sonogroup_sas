import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError } from '../../config/api'
import { MessageCircle, ChevronDown, CheckCircle, XCircle, Clock, AlertCircle, Send } from 'lucide-react'
import '../../styles/pages/Messages.css'

const ITEMS_PER_PAGE = 5

const Messages = () => {
  const { user } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { if (user) cargarDatos() }, [user])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/contactos/mis-solicitudes')
      setMensajes(res.data.contactos || [])
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const formatFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const getEstadoConfig = (estado) => {
    const map = {
      pendiente: { label: 'Pendiente', icon: Clock, color: '#D97706', bg: '#FEF3C7' },
      recibido: { label: 'Recibido', icon: CheckCircle, color: '#1B2CC1', bg: '#EEF0FC' },
      respondido: { label: 'Respondido', icon: CheckCircle, color: '#1a7a48', bg: '#E8F5EE' },
      resuelto: { label: 'Resuelto', icon: CheckCircle, color: '#1a7a48', bg: '#E8F5EE' },
      cerrado: { label: 'Cerrado', icon: XCircle, color: '#5A4864', bg: '#F4F0F8' },
      no_resuelto: { label: 'Sin resolver', icon: AlertCircle, color: '#8C1132', bg: '#FCE8EC' }
    }
    return map[estado] || map.pendiente
  }

  const totalPages = Math.ceil(mensajes.length / ITEMS_PER_PAGE)
  const paginados = mensajes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  if (loading) return (
    <div className="msg-page"><div className="msg-container"><div className="msg-loading"><p>Cargando mensajes...</p></div></div></div>
  )

  return (
    <div className="msg-page">
      <div className="msg-container">
        <div className="msg-header">
          <div>
            <h1>Mis Mensajes</h1>
            <p>Consultas enviadas a Sonogroup · {mensajes.length} total</p>
          </div>
        </div>

        {error && <div className="msg-error"><AlertCircle size={14} /> {error}</div>}

        {mensajes.length === 0 ? (
          <div className="msg-empty">
            <MessageCircle size={40} strokeWidth={1.5} />
            <h3>No tienes mensajes</h3>
            <p>Cuando envíes una consulta desde Contáctanos, aparecerá aquí con su respuesta</p>
          </div>
        ) : (
          <>
            <div className="msg-list">
              {paginados.map(m => {
                const estado = getEstadoConfig(m.estado)
                const EstadoIcon = estado.icon
                const isOpen = expandedId === m.id_contacto
                const tieneRespuesta = m.respuesta || m.respuesta_admin

                return (
                  <div key={m.id_contacto} className={`msg-card ${isOpen ? 'msg-card--open' : ''}`}>
                    <div className="msg-card-top" onClick={() => setExpandedId(isOpen ? null : m.id_contacto)}>
                      <div className="msg-card-left">
                        <span className="msg-estado-badge" style={{ background: estado.bg, color: estado.color }}>
                          <EstadoIcon size={12} /> {estado.label}
                        </span>
                        <div className="msg-card-info">
                          <span className="msg-tipo">{m.asunto || 'Consulta'}</span>
                        </div>
                        <span className="msg-ubicacion">{m.mensaje?.substring(0, 60)}{m.mensaje?.length > 60 ? '...' : ''}</span>
                      </div>
                      <div className="msg-card-right">
                        <span className="msg-fecha">{formatFecha(m.fecha_contacto)}</span>
                        {tieneRespuesta && <span className="msg-reply-indicator"><Send size={11} /></span>}
                        <ChevronDown size={16} className={`msg-chevron ${isOpen ? 'msg-chevron--open' : ''}`} />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="msg-card-detail">
                        <div className="msg-conversation">
                          {/* Mensaje del usuario */}
                          <div className="msg-bubble msg-bubble--user">
                            <span className="msg-bubble-label">Tú · {formatFecha(m.fecha_contacto)}</span>
                            <p>{m.mensaje}</p>
                          </div>

                          {/* Respuesta del admin */}
                          {tieneRespuesta ? (
                            <div className="msg-bubble msg-bubble--admin">
                              <span className="msg-bubble-label">Sonogroup · {formatFecha(m.fecha_respuesta)}</span>
                              <p>{m.respuesta_admin || m.respuesta}</p>
                            </div>
                          ) : (
                            <div className="msg-waiting">
                              <Clock size={14} />
                              <span>Esperando respuesta del equipo de soporte</span>
                            </div>
                          )}
                        </div>

                        {m.id_inmueble && m.inmuebles && (
                          <div className="msg-property-ref">
                            <span className="msg-detail-label">Propiedad asociada</span>
                            <span className="msg-detail-value">
                              {m.inmuebles.tipo_inmueble} · {m.inmuebles.tipo_operacion}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

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
