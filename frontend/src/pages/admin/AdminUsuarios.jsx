import { useState, useEffect } from 'react'
import { Users, Trash2, Search, Shield, ShieldOff, Eye, X, AlertTriangle } from 'lucide-react'
import { api } from '../../config/api'

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('activos') // activos | bloqueados | eliminados
  const [detailModal, setDetailModal] = useState(null)

  const fetchData = () => {
    setLoading(true)
    api.get('/api/usuarios').then(res => {
      const data = res.data.usuarios || []
      setUsuarios(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let result = [...usuarios]
    // Filter by status (simulated — backend returns all active by default)
    if (filter === 'bloqueados') result = result.filter(u => u.bloqueado)
    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        (u.nombre || u.nombre_completo || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.rol || '').toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [search, filter, usuarios])

  const handleBloquear = async (id) => {
    if (!window.confirm('¿Bloquear este usuario? No podrá publicar propiedades.')) return
    try {
      await api.put(`/api/usuarios/${id}`, { bloqueado: true })
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleDesbloquear = async (id) => {
    try {
      await api.put(`/api/usuarios/${id}`, { bloqueado: false })
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleSoftDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta cuenta? El usuario no podrá acceder pero sus datos se conservan.')) return
    try {
      await api.put(`/api/usuarios/${id}`, { activo: false })
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleHardDelete = async (id) => {
    if (!window.confirm('⚠️ ELIMINAR PERMANENTEMENTE. Se borrarán todos los datos del usuario. ¿Continuar?')) return
    if (!window.confirm('Esta acción es IRREVERSIBLE. ¿Estás seguro?')) return
    try {
      await api.delete(`/api/usuarios/${id}`)
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Usuarios</h1>
        <p className="admin-page__subtitle">{filtered.length} usuarios encontrados</p>
      </div>

      <div className="admin-card">
        <div className="admin-card__header" style={{ gap: '1rem' }}>
          <div className="admin-search" style={{ maxWidth: '350px', flex: 1 }}>
            <Search size={14} />
            <input type="text" placeholder="Buscar por nombre, email o rol..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {['activos', 'bloqueados'].map(f => (
              <button key={f} className={`admin-btn admin-btn--sm ${filter === f ? 'admin-btn--secondary' : 'admin-btn--outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="admin-card__empty"><p>Cargando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-card__empty"><Users size={32} /><p>No se encontraron usuarios</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Registro</th><th style={{ textAlign: 'center' }}>Acciones</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id_usuario}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="admin-avatar admin-avatar--navy">{(u.nombre || u.nombre_completo || '?').charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.nombre || u.nombre_completo}</span>
                    </div>
                  </td>
                  <td style={{ color: '#888' }}>{u.email}</td>
                  <td><span className={`admin-badge admin-badge--${u.rol}`}>{u.rol}</span></td>
                  <td>
                    {u.bloqueado
                      ? <span className="admin-badge admin-badge--amber">Bloqueado</span>
                      : <span className="admin-badge admin-badge--green">Activo</span>
                    }
                  </td>
                  <td style={{ color: '#999' }}>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-CO') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => setDetailModal(u)}><Eye size={13} /></button>
                      {u.bloqueado
                        ? <button className="admin-btn admin-btn--ghost" title="Desbloquear" style={{ color: '#10b981' }} onClick={() => handleDesbloquear(u.id_usuario)}><Shield size={13} /></button>
                        : <button className="admin-btn admin-btn--ghost" title="Bloquear" style={{ color: '#f59e0b' }} onClick={() => handleBloquear(u.id_usuario)}><ShieldOff size={13} /></button>
                      }
                      <button className="admin-btn admin-btn--ghost" title="Desactivar (soft delete)" style={{ color: '#888' }} onClick={() => handleSoftDelete(u.id_usuario)}><AlertTriangle size={13} /></button>
                      <button className="admin-btn admin-btn--ghost" title="Eliminar permanentemente" style={{ color: '#dc2626' }} onClick={() => handleHardDelete(u.id_usuario)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Detalles del usuario</h3>
              <button className="admin-btn admin-btn--ghost" onClick={() => setDetailModal(null)}><X size={16} /></button>
            </div>
            <div className="admin-modal__body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="admin-avatar admin-avatar--navy" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
                  {(detailModal.nombre || detailModal.nombre_completo || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0A0F2C' }}>{detailModal.nombre || detailModal.nombre_completo}</p>
                  <p style={{ fontSize: '0.72rem', color: '#888' }}>{detailModal.email}</p>
                </div>
              </div>
              <div className="admin-detail-grid">
                <div><strong>ID:</strong> {detailModal.id_usuario}</div>
                <div><strong>Rol:</strong> {detailModal.rol}</div>
                <div><strong>Teléfono:</strong> {detailModal.telefono || '—'}</div>
                <div><strong>Registro:</strong> {detailModal.fecha_registro ? new Date(detailModal.fecha_registro).toLocaleDateString('es-CO') : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
