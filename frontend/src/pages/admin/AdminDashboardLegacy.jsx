import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError, ENUM_LABELS } from '../../config/api'
import UserModal from '../../components/property/UserModal'
import '../../styles/pages/admin/AdminDashboard.css'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPropiedades: 0, totalUsuarios: 0, propiedadesVenta: 0, propiedadesAlquiler: 0,
    pendientes: 0, contactosSinResponder: 0, solicitudesCuenta: 0
  })
  const [usuarios, setUsuarios] = useState([])
  const [propiedadesPendientes, setPropiedadesPendientes] = useState([])
  const [propiedades, setPropiedades] = useState([])
  const [solicitudesCuenta, setSolicitudesCuenta] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeTab, setActiveTab] = useState('usuarios')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [usuariosRes, propiedadesRes, pendientesRes, solicitudesCuentaRes] = await Promise.all([
        api.get('/api/usuarios'),
        api.get('/api/inmuebles?estado_aprobacion=aprobado'),
        api.get('/api/propiedades-pendientes'),
        api.get('/api/solicitudes-cuenta').catch(() => ({ data: { solicitudes: [] } }))
      ])

      const usuariosData = usuariosRes.data.usuarios || []
      const propiedadesData = propiedadesRes.data.inmuebles || []
      const pendientesData = pendientesRes.data.propiedades || []
      const solicitudesData = solicitudesCuentaRes.data.solicitudes || []

      setUsuarios(usuariosData)
      setPropiedades(propiedadesData)
      setPropiedadesPendientes(pendientesData)
      setSolicitudesCuenta(solicitudesData)

      setStats({
        totalPropiedades: propiedadesData.length,
        totalUsuarios: usuariosData.length,
        propiedadesVenta: propiedadesData.filter(p => p.tipo_operacion === 'venta').length,
        propiedadesAlquiler: propiedadesData.filter(p => p.tipo_operacion === 'arriendo').length,
        pendientes: pendientesData.filter(p => p.estado_aprobacion === 'pendiente').length,
        solicitudesCuenta: solicitudesData.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision').length
      })
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }
  const handleAddUser = () => { setModalMode('add'); setSelectedUser(null); setModalOpen(true) }
  const handleEditUser = (usuario) => { setModalMode('edit'); setSelectedUser(usuario); setModalOpen(true) }

  const handleSaveUser = async (formData) => {
    try {
      if (modalMode === 'add') {
        const response = await api.post('/api/auth/registro', formData)
        setUsuarios([...usuarios, response.data.usuario])
        setStats(prev => ({ ...prev, totalUsuarios: prev.totalUsuarios + 1 }))
      } else {
        const response = await api.put(`/api/usuarios/${selectedUser.id_usuario}`, formData)
        setUsuarios(usuarios.map(u =>
          u.id_usuario === selectedUser.id_usuario ? response.data.usuario : u
        ))
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: parseApiError(err) }
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      await api.delete(`/api/usuarios/${id}`)
      setUsuarios(usuarios.filter(u => u.id_usuario !== id))
      setStats(prev => ({ ...prev, totalUsuarios: prev.totalUsuarios - 1 }))
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Cargando panel de administración...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>Panel de Administración</h1>
          <p>Bienvenido, {user?.nombre}</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </div>

      {error && <div className="error-message" role="alert">⚠️ {error}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-info"><h3>{stats.totalPropiedades}</h3><p>Total Propiedades</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>{stats.totalUsuarios}</h3><p>Total Usuarios</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>{stats.propiedadesVenta}</h3><p>En Venta</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>{stats.propiedadesAlquiler}</h3><p>En Arriendo</p></div>
        </div>
        {stats.solicitudesCuenta > 0 && (
          <div className="stat-card">
            <div className="stat-info"><h3>{stats.solicitudesCuenta}</h3><p>Solicitudes Cuenta</p></div>
          </div>
        )}
      </div>

      <div className="admin-tabs">
        <button className={`tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}>Usuarios</button>
        <button className={`tab-button ${activeTab === 'propiedades' ? 'active' : ''}`}
          onClick={() => setActiveTab('propiedades')}>Propiedades ({propiedades.length})</button>
        <button className={`tab-button ${activeTab === 'pendientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendientes')}>
          Pendientes ({propiedadesPendientes.filter(p => p.estado_aprobacion === 'pendiente').length})
        </button>
        {solicitudesCuenta.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision').length > 0 && (
          <button className={`tab-button ${activeTab === 'solicitudes-cuenta' ? 'active' : ''}`}
            onClick={() => setActiveTab('solicitudes-cuenta')}>
            Solicitudes Cuenta ({solicitudesCuenta.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision').length})
          </button>
        )}
      </div>

      {activeTab === 'usuarios' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Gestión de Usuarios</h2>
            <button className="btn-add" onClick={handleAddUser}>+ Agregar Usuario</button>
          </div>
          {usuarios.length === 0 ? (
            <div className="empty-state"><p>No hay usuarios registrados</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th>
                    <th>Rol</th><th>Fecha Registro</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario.id_usuario}>
                      <td>{usuario.id_usuario}</td>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.telefono || 'N/A'}</td>
                      <td><span className={`badge ${usuario.rol}`}>{ENUM_LABELS.rol_usuario[usuario.rol] || usuario.rol}</span></td>
                      <td>{new Date(usuario.fecha_registro).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon btn-edit" title="Editar" onClick={() => handleEditUser(usuario)}>✏️</button>
                          <button className="btn-icon btn-delete" title="Eliminar" onClick={() => handleDeleteUser(usuario.id_usuario)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'propiedades' && (
        <PropiedadesPublicadasSection propiedades={propiedades} onUpdate={fetchData} />
      )}

      {activeTab === 'pendientes' && (
        <PropiedadesPendientesSection propiedades={propiedadesPendientes} onUpdate={fetchData} />
      )}

      {activeTab === 'solicitudes-cuenta' && (
        <SolicitudesCuentaSection solicitudes={solicitudesCuenta} onUpdate={fetchData} />
      )}

      <UserModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSaveUser} user={selectedUser} mode={modalMode} />
    </div>
  )
}

const PropiedadesPublicadasSection = ({ propiedades, onUpdate }) => {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleEditar = (id) => navigate(`/editar-propiedad/${id}`)

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta propiedad?')) return
    try {
      await api.delete(`/api/inmuebles/${id}`)
      onUpdate()
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  return (
    <div className="admin-section">
      <div className="section-header"><h2>Propiedades Publicadas</h2></div>
      {error && <div className="error-message">⚠️ {error}</div>}
      {propiedades.length === 0 ? (
        <div className="empty-state"><p>No hay propiedades publicadas</p></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Descripción</th><th>Tipo</th><th>Operación</th>
                <th>Precio</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {propiedades.map(p => (
                <tr key={p.id_inmueble}>
                  <td>{p.id_inmueble}</td>
                  <td>{p.descripcion?.substring(0, 50) || '—'}...</td>
                  <td><span className="badge">{p.tipo_inmueble}</span></td>
                  <td><span className={`badge ${p.tipo_operacion}`}>{p.tipo_operacion}</span></td>
                  <td>${p.valor?.toLocaleString()}</td>
                  <td><span className="badge">{p.estado_inmueble}</span></td>
                  <td>{new Date(p.fecha_registro).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon btn-edit" onClick={() => handleEditar(p.id_inmueble)}>✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => handleEliminar(p.id_inmueble)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const PropiedadesPendientesSection = ({ propiedades, onUpdate }) => {
  const [showUserModal, setShowUserModal] = useState(null)
  const [error, setError] = useState('')

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Aprobar esta propiedad?')) return
    try {
      await api.put(`/api/propiedades-pendientes/${id}/aprobar`)
      onUpdate()
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  const handleRechazar = async (id) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return
    try {
      await api.put(`/api/propiedades-pendientes/${id}/rechazar`, { motivo })
      onUpdate()
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  const pendientes = propiedades.filter(p => p.estado_aprobacion === 'pendiente')

  return (
    <div className="admin-section">
      <div className="section-header"><h2>Propiedades Pendientes de Aprobación</h2></div>
      {error && <div className="error-message">⚠️ {error}</div>}
      {pendientes.length === 0 ? (
        <div className="empty-state"><p>No hay propiedades pendientes</p></div>
      ) : (
        <div className="properties-pending-grid">
          {pendientes.map(solicitud => {
            const datos = solicitud.datos || {}
            return (
              <div key={solicitud.id_solicitud} className="property-pending-card">
                <div className="property-pending-content">
                  <h3>{datos.tipo_inmueble ? ENUM_LABELS.tipo_inmueble[datos.tipo_inmueble] : '—'} en {datos.ubicacion?.municipio || 'Sin ubicación'}</h3>
                  <p className="property-pending-user">
                    👤 {solicitud.usuarios?.nombre || 'Usuario'}
                    {solicitud.usuarios && (
                      <button className="btn-view-user-small" onClick={() => setShowUserModal(solicitud)} title="Ver contacto">👁️</button>
                    )}
                  </p>
                  <p className="property-pending-price">${Number(datos.valor || 0).toLocaleString()}</p>
                  <p className="property-pending-location">📍 {datos.ubicacion?.municipio} {datos.ubicacion?.barrio_vereda ? `- ${datos.ubicacion.barrio_vereda}` : ''}</p>
                  <p className="property-pending-description">{datos.descripcion?.substring(0, 100) || 'Sin descripción'}</p>
                  <div className="property-pending-features">
                    {datos.caracteristicas?.habitaciones && <span>{datos.caracteristicas.habitaciones} hab.</span>}
                    {datos.caracteristicas?.banos && <span>{datos.caracteristicas.banos} baños</span>}
                    {datos.tipo_operacion && <span>{datos.tipo_operacion}</span>}
                  </div>
                  <div className="property-pending-actions">
                    <button className="btn-approve" onClick={() => handleAprobar(solicitud.id_solicitud)}>✅ Aprobar</button>
                    <button className="btn-reject" onClick={() => handleRechazar(solicitud.id_solicitud)}>❌ Rechazar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUserModal && showUserModal.usuarios && (
        <div className="modal-overlay" onClick={() => setShowUserModal(null)}>
          <div className="modal-content modal-user" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Información del Solicitante</h3>
              <button className="btn-close-modal" onClick={() => setShowUserModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <p><strong>Nombre:</strong> {showUserModal.usuarios.nombre}</p>
                <p><strong>Email:</strong> <a href={`mailto:${showUserModal.usuarios.email}`}>{showUserModal.usuarios.email}</a></p>
                {showUserModal.usuarios.telefono && (
                  <p><strong>Teléfono:</strong> <a href={`tel:${showUserModal.usuarios.telefono}`}>{showUserModal.usuarios.telefono}</a></p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SolicitudesCuentaSection = ({ solicitudes, onUpdate }) => {
  const [error, setError] = useState('')

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'en_revision')

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Aprobar la eliminación de esta cuenta? El usuario será desactivado.')) return
    try {
      await api.put(`/api/solicitudes-cuenta/${id}/aprobar`, { nota_admin: 'Aprobada por admin' })
      onUpdate()
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  const handleRechazar = async (id) => {
    const nota = prompt('Nota para el usuario (opcional):')
    try {
      await api.put(`/api/solicitudes-cuenta/${id}/rechazar`, { nota_admin: nota || '' })
      onUpdate()
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  return (
    <div className="admin-section">
      <div className="section-header"><h2>Solicitudes de Eliminación de Cuenta</h2></div>
      {error && <div className="error-message">⚠️ {error}</div>}
      {pendientes.length === 0 ? (
        <div className="empty-state"><p>No hay solicitudes pendientes</p></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Usuario</th><th>Email</th><th>Motivo</th>
                <th>Fecha</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map(s => (
                <tr key={s.id_solicitud}>
                  <td>{s.id_solicitud}</td>
                  <td>{s.usuarios?.nombre_completo || '—'}</td>
                  <td>{s.usuarios?.email || '—'}</td>
                  <td>{s.motivo?.substring(0, 50) || 'Sin motivo'}</td>
                  <td>{new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                  <td><span className="badge">{s.estado}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon btn-edit" title="Aprobar" onClick={() => handleAprobar(s.id_solicitud)}>✅</button>
                      <button className="btn-icon btn-delete" title="Rechazar" onClick={() => handleRechazar(s.id_solicitud)}>❌</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard



