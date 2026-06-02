import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { api } from '../../config/api'

export default function AdminNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    api.get('/api/notificaciones').then(res => setNotificaciones(res.data.notificaciones || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const noLeidas = notificaciones.filter(n => !n.leida)

  const marcarTodas = async () => { await api.put('/api/notificaciones/leer-todas'); fetchData() }

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
              <div key={n.id_notificacion} style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #f8f8f8', borderLeft: !n.leida ? '3px solid #E20613' : '3px solid transparent', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: !n.leida ? '#E20613' : '#ddd', marginTop: 5, flexShrink: 0 }}></div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#333' }}>{n.titulo}</p>
                  {n.mensaje && <p style={{ fontSize: '0.68rem', color: '#888', marginTop: '0.2rem' }}>{n.mensaje}</p>}
                  <p style={{ fontSize: '0.6rem', color: '#ccc', marginTop: '0.3rem' }}>{n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-CO') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
