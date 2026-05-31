/**
 * AdminNavbar — Premium top navbar with search, notifications, and user menu
 * Requirements: 1.8, 7.1, 7.2
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../config/api'

export default function AdminNavbar({ onMobileMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notificaciones?limit=10')
      const data = res.data.notificaciones || res.data.data || []
      setNotifications(data.slice(0, 10))
      setUnreadCount(data.filter(n => !n.leido).length)
    } catch {
      // Silently fail — notifications are non-critical
    }
  }

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.leido) {
        await api.put(`/api/notificaciones/${notif.id_notificacion}/leer`)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev =>
          prev.map(n => n.id_notificacion === notif.id_notificacion ? { ...n, leido: true } : n)
        )
      }
    } catch {
      // ignore
    }
    setShowNotifications(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Left: hamburger menu */}
      <button
        onClick={onMobileMenuToggle}
        className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Center: search input */}
      <div className="hidden sm:flex items-center flex-1 justify-center">
        <div className="relative w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full rounded-full bg-slate-100 pl-10 pr-4 py-1.5 text-sm text-slate-500 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">{unreadCount} sin leer</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id_notificacion}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                        !notif.leido ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.leido ? 'bg-indigo-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate">
                            {notif.titulo || notif.mensaje?.substring(0, 40)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {getRelativeTime(notif.created_at || notif.fecha)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <button
                  onClick={() => { navigate('/admin/notificaciones'); setShowNotifications(false) }}
                  className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1"
                >
                  Ver todas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <ChevronDown size={14} className="hidden md:block text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.nombre}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/perfil'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={16} />
                  Mi Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
