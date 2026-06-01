import { X, Mail, Phone, Calendar, Shield, Hash } from 'lucide-react'

export default function UserProfileCard({ user, onClose }) {
  if (!user) return null

  const nombre = user.nombre || user.nombre_completo || 'Usuario'
  const inicial = nombre.charAt(0).toUpperCase()
  const fecha = user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <div className="upc-overlay" onClick={onClose}>
      <div className="upc" onClick={e => e.stopPropagation()}>
        {/* Background blobs */}
        <div className="upc__bg">
          <div className="upc__blob upc__blob--1"></div>
          <div className="upc__blob upc__blob--2"></div>
          <div className="upc__blob upc__blob--3"></div>
        </div>

        {/* Close */}
        <button className="upc__close" onClick={onClose}><X size={16} /></button>

        {/* Card content */}
        <div className="upc__card">
          {/* Avatar */}
          <div className="upc__avatar">
            <span>{inicial}</span>
          </div>

          {/* Name & role */}
          <h2 className="upc__name">{nombre}</h2>
          <span className="upc__role">{user.rol || 'Cliente'}</span>

          {/* Info items */}
          <div className="upc__info">
            <div className="upc__info-item">
              <Mail size={14} />
              <span>{user.email}</span>
            </div>
            {user.telefono && (
              <div className="upc__info-item">
                <Phone size={14} />
                <span>{user.telefono}</span>
              </div>
            )}
            <div className="upc__info-item">
              <Hash size={14} />
              <span>ID: {user.id_usuario}</span>
            </div>
            <div className="upc__info-item">
              <Shield size={14} />
              <span>{user.rol === 'admin' ? 'Administrador' : user.rol === 'comisionista' ? 'Comisionista' : 'Cliente'}</span>
            </div>
            <div className="upc__info-item">
              <Calendar size={14} />
              <span>Miembro desde {fecha}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
