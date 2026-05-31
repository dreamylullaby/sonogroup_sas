/**
 * AdminSidebar — Premium dark navy sidebar with collapsible navigation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/propiedades', icon: Building2, label: 'Propiedades' },
  { path: '/admin/solicitudes', icon: FileText, label: 'Solicitudes' },
  { path: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { path: '/admin/contactos', icon: MessageSquare, label: 'Contactos' },
  { path: '/admin/notificaciones', icon: Bell, label: 'Notificaciones' },
  { path: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
]

const NAV_BOTTOM_ITEMS = [
  { path: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  { path: '/admin/seguridad', icon: Shield, label: 'Seguridad' },
  { path: '/admin/actividad', icon: Activity, label: 'Actividad' },
]

const STORAGE_KEY = 'admin_sidebar_collapsed'

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  const handleNavClick = (path) => {
    navigate(path)
    if (mobileOpen) onMobileClose()
  }

  const NavItem = ({ item }) => {
    const Icon = item.icon
    const active = isActive(item.path)
    return (
      <li>
        <button
          onClick={() => handleNavClick(item.path)}
          className={`
            w-full flex items-center rounded-lg text-sm font-medium
            transition-all duration-200 relative group
            ${collapsed
              ? 'justify-center px-0 py-2.5 mx-auto'
              : 'gap-3 px-3 py-2.5 mx-2'
            }
            ${active
              ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }
          `}
          title={collapsed ? item.label : undefined}
        >
          <Icon size={18} className="flex-shrink-0" />
          <span
            className={`whitespace-nowrap transition-all duration-200 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            {item.label}
          </span>
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
              {item.label}
            </span>
          )}
        </button>
      </li>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f172a] border-r border-white/10 text-white">
      {/* Logo area */}
      <div className={`flex items-center h-14 border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        {collapsed ? (
          <span className="text-indigo-400 font-bold text-lg">S</span>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-indigo-400 text-lg">●</span>
            <span className="font-bold text-sm tracking-wide text-white whitespace-nowrap">
              SONOGROUP
            </span>
          </div>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </ul>

        {/* Divider */}
        <div className="border-t border-white/5 my-4 mx-4" />

        {/* Bottom nav items */}
        <ul className="space-y-0.5">
          {NAV_BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </ul>
      </nav>

      {/* User info + collapse toggle */}
      <div className="border-t border-white/5 p-3">
        {collapsed && user && (
          <div className="flex justify-center mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {user.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
          </div>
        )}
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {user.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.nombre}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                admin
              </span>
            </div>
          </div>
        )}
        <div className={`flex ${collapsed ? 'justify-center' : ''} w-full py-1`}>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden md:block fixed top-0 left-0 h-screen z-40 bg-[#0f172a]"
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 h-screen w-64 z-50 md:hidden bg-[#0f172a]"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 transition-colors"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export { NAV_ITEMS, NAV_BOTTOM_ITEMS, STORAGE_KEY }
