import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { api } from '../../config/api'

export default function AdminContactos() {
  const [contactos, setContactos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/contactos').then(res => setContactos(res.data.contactos || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Contactos</h1>
        <p className="admin-page__subtitle">Mensajes y consultas recibidas</p>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : contactos.length === 0 ? (
          <div className="admin-card__empty"><MessageSquare size={32} /><p>No hay contactos</p></div>
        ) : (
          <div className="admin-card__body">
            {contactos.map(c => (
              <div key={c.id_contacto} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f8f8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#333' }}>{c.nombre} — {c.asunto}</p>
                  <p style={{ fontSize: '0.65rem', color: '#999', marginTop: '0.2rem' }}>{c.email} · {new Date(c.fecha_contacto).toLocaleDateString('es-CO')}</p>
                  <p style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.4rem', lineHeight: 1.5 }}>{c.mensaje?.substring(0, 120)}</p>
                </div>
                <span className={`admin-badge ${c.estado === 'pendiente' ? 'admin-badge--pendiente' : 'admin-badge--aprobado'}`}>{c.estado}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

