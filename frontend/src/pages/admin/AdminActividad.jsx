import { useState, useEffect } from 'react'
import { Activity, Building2, Users, FileText, MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../config/api'

const EVENT_CONFIG = {
  propiedad: { icon: Building2, color: '#3D518C', bg: '#E8EEF8', label: 'Propiedad' },
  usuario: { icon: Users, color: '#1B6B3A', bg: '#E6F9EE', label: 'Usuario' },
  solicitud: { icon: FileText, color: '#6B3FA0', bg: '#F0EAFA', label: 'Solicitud' },
  contacto: { icon: MessageSquare, color: '#CC1E2B', bg: '#FCE8EC', label: 'Contacto' },
}

export default function AdminActividad() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [page, setPage] = useState(1)

  useEffect(() => {
    Promise.all([
      api.get('/api/inmuebles?estado_aprobacion=aprobado').catch(() => ({ data: { inmuebles: [] } })),
      api.get('/api/usuarios').catch(() => ({ data: { usuarios: [] } })),
      api.get('/api/propiedades-pendientes').catch(() => ({ data: { propiedades: [] } })),
      api.get('/api/contactos').catch(() => ({ data: { contactos: [] } })),
    ]).then(([inmRes, usrRes, solRes, conRes]) => {
      const timeline = []

      // Properties
      ;(inmRes.data.inmuebles || []).forEach(i => {
        timeline.push({
          type: 'propiedad',
          message: `Propiedad publicada: ${i.tipo_inmueble} en ${i.ubicaciones?.municipio || 'sin ubicacion'}`,
          detail: `$ ${Number(i.valor).toLocaleString('es-CO')} · ${i.tipo_operacion}`,
          date: i.fecha_registro,
        })
      })

      // Users
      ;(usrRes.data.usuarios || []).forEach(u => {
        timeline.push({
          type: 'usuario',
          message: `Nuevo usuario registrado: ${u.nombre || u.nombre_completo}`,
          detail: `${u.email} · ${u.rol}`,
          date: u.fecha_registro,
        })
      })

      // Solicitudes
      ;(solRes.data.propiedades || []).forEach(s => {
        const d = s.datos || {}
        const estado = s.estado_aprobacion
        const verb = estado === 'aprobado' ? 'aprobada' : estado === 'rechazado' ? 'rechazada' : 'recibida'
        timeline.push({
          type: 'solicitud',
          message: `Solicitud ${verb}: ${d.tipo_inmueble || 'propiedad'} en ${d.ubicacion?.municipio || 'sin ubicacion'}`,
          detail: `Estado: ${estado}`,
          date: s.fecha_revision || s.fecha_solicitud,
        })
      })

      // Contacts
      ;(conRes.data.contactos || []).forEach(c => {
        timeline.push({
          type: 'contacto',
          message: `Contacto de ${c.nombre}: ${c.asunto}`,
          detail: c.email,
          date: c.fecha_contacto,
        })
      })

      // Sort by date descending
      timeline.sort((a, b) => new Date(b.date) - new Date(a.date))
      setEvents(timeline)
    }).finally(() => setLoading(false))
  }, [])

  // Filter
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 86400000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let filtered = events
  if (filter === 'hoy') filtered = events.filter(e => new Date(e.date) >= startOfToday)
  else if (filter === 'semana') filtered = events.filter(e => new Date(e.date) >= startOfWeek)
  else if (filter === 'mes') filtered = events.filter(e => new Date(e.date) >= startOfMonth)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days} dias`
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  return (
    <div>
      <div className="admin-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page__title">Actividad</h1>
          <p className="admin-page__subtitle">Registro de actividad reciente del sistema · {filtered.length} eventos</p>
        </div>
      </div>

      {/* Time filters */}
      <div className="upc-filters" style={{ marginBottom: '1.25rem' }}>
        <span className="upc-filters__label">Periodo:</span>
        {['todos', 'hoy', 'semana', 'mes'].map(f => (
          <button key={f} className={`upc-filter-btn ${filter === f ? 'upc-filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'todos' ? 'Todo' : f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Esta semana' : 'Este mes'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando actividad...</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-card__empty">
            <Activity size={32} />
            <p>Sin actividad en este periodo</p>
            <p className="sub">Los eventos del sistema apareceran aqui automaticamente</p>
          </div>
        ) : (
          <div className="act-timeline">
            {filtered.slice((page - 1) * 15, page * 15).map((event, i) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.propiedad
              const Icon = config.icon
              return (
                <div key={i} className="act-item">
                  <div className="act-item__line">
                    <div className="act-item__dot" style={{ background: config.bg, border: `2px solid ${config.color}` }}>
                      <Icon size={12} style={{ color: config.color }} />
                    </div>
                    {i < filtered.length - 1 && <div className="act-item__connector"></div>}
                  </div>
                  <div className="act-item__content">
                    <div className="act-item__header">
                      <span className="act-item__badge" style={{ background: config.bg, color: config.color }}>{config.label}</span>
                      <span className="act-item__time"><Clock size={10} /> {formatDate(event.date)}</span>
                    </div>
                    <p className="act-item__message">{event.message}</p>
                    {event.detail && <p className="act-item__detail">{event.detail}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 15 && (
        <div className="upc-pagination">
          <button className="upc-pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
          <span className="upc-pagination__info">Pagina {page} de {Math.ceil(filtered.length / 15)}</span>
          <button className="upc-pagination__btn" disabled={page >= Math.ceil(filtered.length / 15)} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  )
}
