import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FileText, Users,
  MessageSquare, Bell, BarChart3, Activity,
  ChevronLeft, ChevronRight, Home, ArrowLeft
} from 'lucide-react'

const NAV_MAIN = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/propiedades', icon: Building2, label: 'Propiedades' },
  { path: '/admin/solicitudes', icon: FileText, label: 'Solicitudes' },
  { path: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { path: '/admin/contactos', icon: MessageSquare, label: 'Contactos' },
]

const NAV_SYSTEM = [
  { path: '/admin/notificaciones', icon: Bell, label: 'Notificaciones' },
  { path: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
  { path: '/admin/actividad', icon: Activity, label: 'Actividad' },
]

export default function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}>
      {/* Logo — click goes to home */}
      <div className="admin-sidebar__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Ir a la página principal">
        <div className="admin-sidebar__logo-icon">
          <Home size={14} />
        </div>
        <div className="admin-sidebar__logo-text-wrap">
          <span className="admin-sidebar__logo-name">SONOGROUP</span>
          <span className="admin-sidebar__logo-sub">Real Estate</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        {!collapsed && <div className="admin-sidebar__section-label">Principal</div>}
        <ul>
          {NAV_MAIN.map(item => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <button
                  className={`admin-sidebar__nav-item ${isActive(item.path) ? 'admin-sidebar__nav-item--active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <hr className="admin-sidebar__divider" />

        {!collapsed && <div className="admin-sidebar__section-label">Sistema</div>}
        <ul>
          {NAV_SYSTEM.map(item => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <button
                  className={`admin-sidebar__nav-item ${isActive(item.path) ? 'admin-sidebar__nav-item--active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <hr className="admin-sidebar__divider" />

        {/* Back to main site */}
        <ul>
          <li>
            <button
              className="admin-sidebar__nav-item"
              onClick={() => navigate('/')}
              title="Volver a la página principal"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <ArrowLeft size={16} />
              <span>Volver al sitio</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Toggle */}
      <div className="admin-sidebar__toggle-wrap">
        <button className="admin-sidebar__toggle" onClick={onToggle} title={collapsed ? 'Expandir menu' : 'Colapsar menu'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

export const STORAGE_KEY = 'admin_sidebar_collapsed'
