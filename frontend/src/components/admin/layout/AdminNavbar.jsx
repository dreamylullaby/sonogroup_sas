import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Settings, LogOut, User, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../config/api'

export default function AdminNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    api.get('/api/notificaciones?limit=5')
      .then(res => setUnreadCount(res.data.no_leidas || 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="admin-topbar">
      <div style={{ flex: 1 }}></div>

      <div className="admin-topbar__right">
        <button className="admin-topbar__icon-btn" onClick={() => navigate('/admin/notificaciones')}>
          <Bell size={16} />
          {unreadCount > 0 && <span className="admin-topbar__badge">{unreadCount}</span>}
        </button>

        {/* Profile */}
        <div className="admin-topbar__profile" ref={profileRef} onClick={() => setShowProfile(!showProfile)}>
          <div className="admin-topbar__profile-avatar">
            {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="admin-topbar__profile-info">
            <span className="admin-topbar__profile-name">{user?.nombre}</span>
            <span className="admin-topbar__profile-role">Administrador</span>
          </div>

          {showProfile && (
            <div className="admin-topbar__dropdown">
              <a className="admin-topbar__dropdown-item" onClick={() => { navigate('/perfil'); setShowProfile(false) }}>
                <User size={14} /> Mi perfil
              </a>
              <a className="admin-topbar__dropdown-item" onClick={() => { navigate('/configuracion'); setShowProfile(false) }}>
                <Settings size={14} /> Configuracion de cuenta
              </a>
              <hr className="admin-topbar__dropdown-divider" />
              <a className="admin-topbar__dropdown-item" onClick={() => { navigate('/'); setShowProfile(false) }}>
                <ArrowLeft size={14} /> Volver al sitio
              </a>
              <a className="admin-topbar__dropdown-item admin-topbar__dropdown-item--danger" onClick={() => { logout(); navigate('/login') }}>
                <LogOut size={14} /> Cerrar sesion
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
