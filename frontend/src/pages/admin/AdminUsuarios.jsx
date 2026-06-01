import { useState, useEffect } from 'react'
import { Users, Trash2, Search, Eye, ShieldOff, ChevronLeft, ChevronRight, Mail, Phone, Calendar } from 'lucide-react'
import { api } from '../../config/api'
import UserProfileCard from '../../components/admin/shared/UserProfileCard'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [letterFilter, setLetterFilter] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [page, setPage] = useState(1)
  const perPage = 20

  const fetchData = () => {
    setLoading(true)
    api.get('/api/usuarios')
      .then(res => setUsuarios(res.data.usuarios || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  // Apply filters
  let filtered = usuarios

  // Search
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(u =>
      (u.nombre || u.nombre_completo || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }

  // Status filter
  if (statusFilter === 'activos') filtered = filtered.filter(u => u.activo !== false)
  else if (statusFilter === 'bloqueados') filtered = filtered.filter(u => u.bloqueado === true)
  else if (statusFilter === 'eliminados') filtered = filtered.filter(u => u.activo === false)

  // Letter filter
  if (letterFilter) {
    filtered = filtered.filter(u => {
      const name = (u.nombre || u.nombre_completo || '').toUpperCase()
      return name.startsWith(letterFilter)
    })
  }

  const admins = filtered.filter(u => u.rol === 'admin')
  const clientes = filtered.filter(u => u.rol !== 'admin')
  const totalPages = Math.ceil(clientes.length / perPage)
  const paginatedClientes = clientes.slice((page - 1) * perPage, page * perPage)

  // Counts for filter badges
  const countAll = usuarios.length
  const countActivos = usuarios.filter(u => u.activo !== false).length
  const countBloqueados = usuarios.filter(u => u.bloqueado === true).length
  const countEliminados = usuarios.filter(u => u.activo === false).length

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este usuario permanentemente?')) return
    await api.delete(`/api/usuarios/${id}`)
    fetchData()
  }

  const handleBlock = async (id) => {
    if (!window.confirm('Bloquear este usuario?')) return
    try { await api.put(`/api/usuarios/${id}`, { activo: false }); fetchData() } catch {}
  }

  const UserCard = ({ u }) => {
    const nombre = u.nombre || u.nombre_completo || 'Usuario'
    const inicial = nombre.charAt(0).toUpperCase()
    const fecha = u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }) : ''

    return (
      <div className="upc-mini">
        <div className="upc-mini__blob1"></div>
        <div className="upc-mini__blob2"></div>
        <div className="upc-mini__content">
          <div className="upc-mini__avatar">
            <span>{inicial}</span>
          </div>
          <h3 className="upc-mini__name">{nombre}</h3>
          <span className="upc-mini__role">{u.rol}</span>
          <div className="upc-mini__info">
            <span><Mail size={11} /> {u.email}</span>
            {u.telefono && <span><Phone size={11} /> {u.telefono}</span>}
            {fecha && <span><Calendar size={11} /> {fecha}</span>}
          </div>
          <div className="upc-mini__actions">
            <button className="admin-btn admin-btn--outline admin-btn--sm" title="Ver detalles" onClick={() => setDetailModal(u)}><Eye size={12} /> Ver</button>
            <button className="upc-mini__btn-block" title="Bloquear" onClick={() => handleBlock(u.id_usuario)}>Bloquear</button>
            <button className="upc-mini__btn-delete" title="Eliminar" onClick={() => handleDelete(u.id_usuario)}>Eliminar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="admin-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page__title">Usuarios</h1>
          <p className="admin-page__subtitle">{filtered.length} usuarios registrados</p>
        </div>
        <div className="admin-search" style={{ maxWidth: '280px' }}>
          <Search size={14} />
          <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Status filter */}
      <div className="upc-filters">
        <span className="upc-filters__label">Filtrar:</span>
        <button className={`upc-filter-btn ${statusFilter === 'todos' ? 'upc-filter-btn--active' : ''}`} onClick={() => { setStatusFilter('todos'); setPage(1) }}>
          Todos <span className="upc-filter-btn__count">{countAll}</span>
        </button>
        <button className={`upc-filter-btn ${statusFilter === 'activos' ? 'upc-filter-btn--active' : ''}`} onClick={() => { setStatusFilter('activos'); setPage(1) }}>
          Activos <span className="upc-filter-btn__count">{countActivos}</span>
        </button>
        <button className={`upc-filter-btn ${statusFilter === 'bloqueados' ? 'upc-filter-btn--active' : ''}`} onClick={() => { setStatusFilter('bloqueados'); setPage(1) }}>
          Bloqueados <span className="upc-filter-btn__count">{countBloqueados}</span>
        </button>
        <button className={`upc-filter-btn ${statusFilter === 'eliminados' ? 'upc-filter-btn--active' : ''}`} onClick={() => { setStatusFilter('eliminados'); setPage(1) }}>
          Eliminados <span className="upc-filter-btn__count">{countEliminados}</span>
        </button>
      </div>

      {/* Alphabet filter */}
      <div className="upc-alphabet">
        <span className="upc-alphabet__label">Saltar a letra:</span>
        <div className="upc-alphabet__letters">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              className={`upc-alphabet__letter ${letterFilter === letter ? 'upc-alphabet__letter--active' : ''}`}
              onClick={() => { setLetterFilter(letterFilter === letter ? '' : letter); setPage(1) }}
            >
              {letter}
            </button>
          ))}
          {(search || statusFilter !== 'todos' || letterFilter) && (
            <button
              className="upc-reset-btn"
              onClick={() => { setSearch(''); setStatusFilter('todos'); setLetterFilter(''); setPage(1) }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-card"><div className="admin-card__empty"><p>Cargando usuarios...</p></div></div>
      ) : filtered.length === 0 ? (
        <div className="admin-card"><div className="admin-card__empty"><Users size={32} /><p>No se encontraron usuarios</p></div></div>
      ) : (
        <>
          {/* Admins */}
          {admins.length > 0 && (
            <>
              <div className="upc-section-label">Administradores</div>
              <div className="upc-grid">
                {admins.map(u => <UserCard key={u.id_usuario} u={u} />)}
              </div>
            </>
          )}

          {/* Divider */}
          {admins.length > 0 && clientes.length > 0 && (
            <div className="upc-divider"><span>Usuarios</span></div>
          )}

          {/* Clients */}
          {paginatedClientes.length > 0 && (
            <>
              {admins.length === 0 && <div className="upc-section-label">Usuarios</div>}
              <div className="upc-grid">
                {paginatedClientes.map(u => <UserCard key={u.id_usuario} u={u} />)}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="upc-pagination">
              <button className="upc-pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              <span className="upc-pagination__info">Pagina {page} de {totalPages}</span>
              <button className="upc-pagination__btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          )}
        </>
      )}

      {detailModal && <UserProfileCard user={detailModal} onClose={() => setDetailModal(null)} />}
    </div>
  )
}
