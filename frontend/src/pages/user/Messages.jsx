import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError } from '../../config/api'
import { MessageCircle, ChevronDown, CheckCircle, XCircle, Clock, AlertCircle, Send, Search, Trash2 } from 'lucide-react'
import '../../styles/pages/Messages.css'

const ITEMS_PER_PAGE = 10

const Messages = () => {
  const { user } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [page, setPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterAsunto, setFilterAsunto] = useState('')

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

  const eliminarMensaje = async (id) => {
    try {
      await api.delete(`/api/contactos/${id}`)
      setMensajes(prev => prev.filter(m => m.id_contacto !== id))
      setDeleteModal(null)
    } catch (err) {
      setError(parseApiError(err))
      setDeleteModal(null)
    }
  }

  const formatFecha = (f) => {
    if (!f) return '—'
    return new Date(f).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'America/Bogota'
    })
  }

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

  // Filtered messages
  const filtered = useMemo(() => {
    let items = mensajes
    if (search) {
      const q = search.toLowerCase().trim()
      items = items.filter(m =>
        (m.asunto || '').toLowerCase().includes(q) ||
        (m.mensaje || '').toLowerCase().includes(q) ||
        (m.respuesta || '').toLowerCase().includes(q) ||
        (m.respuesta_admin || '').toLowerCase().includes(q)
      )
    }
    if (filterEstado) items = items.filter(m => m.estado === filterEstado)
    if (filterAsunto) items = items.filter(m => (m.asunto || '').toLowerCase().includes(filterAsunto.toLowerCase()))
    return items
  }, [mensajes, search, filterEstado, filterAsunto])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginados = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const resetFilters = () => { setSearch(''); setFilterEstado(''); setFilterAsunto(''); setPage(1) }

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

        {/* FILTERS */}
        <div className="msg-filters">
          <div className="msg-filters-left">
            <div className="msg-search-wrap">
              <Search size={13} />
              <input type="text" placeholder="Buscar por asunto o contenido..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="respondido">Respondidos</option>
              <option value="resuelto">Resueltos</option>
              <option value="no_resuelto">Sin resolver</option>
              <option value="cerrado">Cerrados</option>
            </select>
            <select value={filterAsunto} onChange={e => { setFilterAsunto(e.target.value); setPage(1) }}>
              <option value="">Tipo de consulta</option>
              <option value="consulta-general">Consulta General</option>
              <option value="informacion-propiedad">Información Propiedad</option>
              <option value="agendar-visita">Agendar Visita</option>
              <option value="cotizacion">Cotización</option>
              <option value="vender-propiedad">Vender Propiedad</option>
              <option value="arrendar-propiedad">Arrendar Propiedad</option>
              <option value="asesoria-inversion">Asesoría Inversión</option>
              <option value="financiamiento">Financiamiento</option>
              <option value="queja-reclamo">Queja o Reclamo</option>
              <option value="otro">Otro</option>
            </select>
            {(search || filterEstado || filterAsunto) && (
              <button className="msg-filter-reset" onClick={resetFilters}>Limpiar</button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="msg-empty">
            <MessageCircle size={40} strokeWidth={1.5} />
            <h3>{mensajes.length === 0 ? 'No tienes mensajes' : 'Sin resultados'}</h3>
            <p>{mensajes.length === 0 ? 'Cuando envíes una consulta desde Contáctanos, aparecerá aquí con su respuesta' : 'Intenta con otros filtros'}</p>
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
                          <div className="msg-bubble msg-bubble--user">
                            <span className="msg-bubble-label">Tú · {formatFecha(m.fecha_contacto)}</span>
                            <p>{m.mensaje}</p>
                          </div>

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

                        <div className="msg-card-actions">
                          <button className="msg-delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteModal(m) }}>
                            <Trash2 size={12} /> Eliminar mensaje
                          </button>
                        </div>
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

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="msg-modal-overlay">
          <div className="msg-modal">
            <div className="msg-modal-icon"><Trash2 size={22} color="#CC1E2B" /></div>
            <h3>¿Eliminar este mensaje?</h3>
            <p>El mensaje será eliminado permanentemente de tu historial. Esta acción no se puede deshacer.</p>
            <div className="msg-modal-actions">
              <button className="msg-modal-btn-delete" onClick={() => eliminarMensaje(deleteModal.id_contacto)}>Sí, eliminar</button>
              <button className="msg-modal-btn-cancel" onClick={() => setDeleteModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
