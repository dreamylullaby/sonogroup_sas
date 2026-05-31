import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import '../../../styles/pages/admin/admin-layout.css'

const STORAGE_KEY = 'admin_sidebar_collapsed'

export default function AdminLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || false }
    catch { return false }
  })

  const handleToggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const contentMargin = collapsed ? 56 : 220

  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="admin-layout__content" style={{ marginLeft: contentMargin }}>
        <AdminNavbar />
        <main className="admin-layout__main">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  )
}
