import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../config/api'

export default function AdminNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    api.get('/api/notificaciones').then(res => setNotificaciones(res.data.notificaciones || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const noLeidas = notificaciones.filter(n => !n.leida)

  const marcarTodas = async () => { await api.put('/api/notificaciones/leer-todas'); fetchData() }

  // Navegar a la sección relevante según el tipo de notificación
  const handleClickNotificacion = async (n) => {
    // Marcar como leída
    if (!n.leida) {
      await api.put(`/api/notificaciones/${n.id_notificacion}/leer`)
    }

    // Determinar destino según título/tipo
    const titulo = (n.titulo || '').toLowerCase()
    const mensaje = (n.mensaje || '').toLowerCase()

    if (titulo.includes('solicitud') || titulo.includes('edición') || titulo.includes('publicacion') || titulo.includes('reenvi') || titulo.includes('revisión') || titulo.includes('cambios')) {
      navigate('/admin/solicitudes')
    } else if (titulo.includes('contacto') || titulo.includes('consulta') || titulo.includes('mensaje')) {
      navigate('/admin/contactos')
    } else if (titulo.includes('propiedad') || titulo.includes('inmueble') || n.id_inmueble) {
      navigate('/admin/propiedades')
    } else if (titulo.includes('usuario') || titulo.includes('cuenta') || titulo.includes('eliminación')) {
      navigate('/admin/usuarios')
    } else {
      // Default: refrescar
      fetchData()
    }
  }

  return (
    <div>
      <div className="admin-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page__title">Notificaciones</h1>
          <p className="admin-page__subtitle">Centro de notificaciones del sistema · {noLeidas.length} sin leer</p>
        </div>
        {noLeidas.length > 0 && (
          <button onClick={marcarTodas} style={{ padding: '0.4rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '6px', background: 'white', fontSize: '0.68rem', fontWeight: 500, color: '#666', cursor: 'pointer' }}>Marcar todas como leídas</button>
        )}
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : noLeidas.length === 0 ? (
          <div className="admin-card__empty"><Bell size={32} /><p>No hay notificaciones pendientes</p><p className="sub">Cuando lleguen nuevas alertas aparecerán aquí</p></div>
        ) : (
          <div className="admin-card__body">
            {noLeidas.map(n => (
              <div
                key={n.id_notificacion}
                onClick={() => handleClickNotificacion(n)}
                style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #f8f8f8', borderLeft: !n.leida ? '3px solid #E20613' : '3px solid transparent', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9F7FB'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: !n.leida ? '#E20613' : '#ddd', marginTop: 5, flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#333' }}>{n.titulo}</p>
                  {n.mensaje && <p style={{ fontSize: '0.68rem', color: '#888', marginTop: '0.2rem' }}>{n.mensaje}</p>}
                  <p style={{ fontSize: '0.6rem', color: '#ccc', marginTop: '0.3rem' }}>{n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <span style={{ fontSize: '0.6rem', color: '#6B3FA0', marginTop: '4px' }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
