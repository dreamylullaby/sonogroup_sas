import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useNavigate } from 'react-router-dom'
import { api, parseApiError } from '../../config/api'
import '../../styles/pages/Profile.css'

const Profile = () => {
  const { user } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [stats, setStats] = useState({ propiedades: 0, favoritos: 0, mensajes: 0 })
  const [adminStats, setAdminStats] = useState({ aprobadas: 0, pendientes: 0, mensajes_sin_responder: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ nombre: '', email: '', telefono: '' })
  const [saveMsg, setSaveMsg] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)

  const isAdmin = user?.rol === 'admin'

  useEffect(() => {
    fetchPerfil()
  }, [])

  const fetchPerfil = async () => {
    try {
      setLoading(true)
      const [perfilRes, inmueblesRes] = await Promise.all([
        api.get('/api/usuarios/perfil'),
        api.get(`/api/inmuebles/usuario/${user.id_usuario}`)
      ])
      setPerfil(perfilRes.data.usuario)
      setStats(prev => ({ ...prev, propiedades: inmueblesRes.data.total || 0 }))

      // Load role-specific stats
      if (isAdmin) {
        try {
          const statsRes = await api.get('/api/admin/stats/dashboard')
          const kpis = statsRes.data?.data?.kpis || {}
          setAdminStats({
            aprobadas: kpis.propiedadesAprobadas || 0,
            pendientes: kpis.propiedadesPendientes || 0,
            mensajes_sin_responder: kpis.contactosSinResponder || 0
          })
        } catch { /* silent */ }
      } else {
        try {
          const favRes = await api.get('/api/favoritos')
          setStats(prev => ({ ...prev, favoritos: favRes.data.favoritos?.length || favRes.data.total || 0 }))
        } catch { /* silent */ }
      }
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setEditData({ nombre: perfil?.nombre || '', email: perfil?.email || '', telefono: perfil?.telefono || '' })
    setEditing(true)
    setSaveMsg(null)
  }

  const handleSaveProfile = async () => {
    setSaveLoading(true)
    setSaveMsg(null)
    try {
      await api.put('/api/usuarios/perfil', editData)
      setPerfil(prev => ({ ...prev, ...editData }))
      setEditing(false)
      setSaveMsg({ tipo: 'ok', texto: 'Perfil actualizado correctamente' })
    } catch (err) {
      setSaveMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al guardar' })
    } finally { setSaveLoading(false) }
    setTimeout(() => setSaveMsg(null), 4000)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const getRolLabel = (rol) => {
    const labels = { admin: 'Administrador', comisionista: 'Comisionista', cliente: 'Cliente' }
    return labels[rol] || rol
  }

  if (loading) return (
    <div className="profile-loading">
      <div className="loading-spinner"></div>
      <p>Cargando perfil...</p>
    </div>
  )

  if (error) return (
    <div className="profile-error"><p>⚠️ {error}</p></div>
  )

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* HEADER */}
        <div className="profile-header-card">
          <div className="profile-cover"></div>
          <div className="profile-header-content">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-xl" style={{ background: perfil?.rol === 'admin' ? '#3D518C' : '#241929' }}>
                {perfil?.nombre?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="profile-header-info">
              <div className="profile-name-row">
                <h1>{perfil?.nombre}</h1>
                <span className={`profile-rol-badge ${perfil?.rol}`}>
                  {getRolLabel(perfil?.rol)}
                </span>
              </div>
              <p className="profile-email">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {perfil?.email}
              </p>
              <p className="profile-since">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {t('miembroDesde')} {formatFecha(perfil?.fecha_registro)}
              </p>
            </div>
            {!editing && (
              <button className="profile-edit-btn" onClick={startEditing}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar
              </button>
            )}
          </div>
        </div>

        <div className="profile-body">

          {/* DATOS BÁSICOS */}
          <div className="profile-card">
            <div className="profile-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <h2>{t('informacionPersonal')}</h2>
            </div>
            {saveMsg && <div className={`profile-msg ${saveMsg.tipo}`}>{saveMsg.texto}</div>}
            {editing ? (
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="field-label">Nombre completo</span>
                  <input className="profile-edit-input" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} placeholder="Tu nombre" />
                </div>
                <div className="profile-field">
                  <span className="field-label">Correo electrónico</span>
                  <input className="profile-edit-input" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} placeholder="correo@ejemplo.com" type="email" />
                </div>
                <div className="profile-field">
                  <span className="field-label">Teléfono</span>
                  <input className="profile-edit-input" value={editData.telefono} onChange={e => setEditData({...editData, telefono: e.target.value})} placeholder="+57 300 000 0000" />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saveLoading}>
                    {saveLoading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button className="profile-cancel-btn" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="field-label">Nombre completo</span>
                  <span className="field-value">{perfil?.nombre || <span className="field-value--empty">Sin registrar</span>}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Correo electrónico</span>
                  <span className="field-value">{perfil?.email || <span className="field-value--empty">Sin registrar</span>}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Teléfono</span>
                  <span className="field-value">{perfil?.telefono || <span className="field-value--empty">Sin registrar</span>}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Rol</span>
                  <span className={`profile-rol-badge ${perfil?.rol}`} style={{ position: 'static', border: 'none' }}>
                    {getRolLabel(perfil?.rol)}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Fecha de registro</span>
                  <span className="field-value">{formatFecha(perfil?.fecha_registro)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVIDAD */}
          <div className="profile-card">
            <div className="profile-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <h2>{t('actividad')}</h2>
            </div>

            {isAdmin ? (
              /* ── ADMIN ACTIVITY ── */
              <div className="profile-stats">
                <div className="activity-chip activity-chip--green" onClick={() => navigate('/admin')}>
                  {adminStats.aprobadas > 0 && <span className="urgency-dot" style={{ background: '#1a7a48' }}></span>}
                  <div className="chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <span className="chip-number">{adminStats.aprobadas}</span>
                  <span className="chip-label">Propiedades aprobadas</span>
                </div>

                <div className="activity-chip activity-chip--blue" onClick={() => navigate('/admin')}>
                  {adminStats.pendientes > 0 && <span className="urgency-dot"></span>}
                  <div className="chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <span className="chip-number">{adminStats.pendientes}</span>
                  <span className="chip-label">Pendientes de revisión</span>
                </div>

                <div className="activity-chip activity-chip--red" onClick={() => navigate('/admin')}>
                  {adminStats.mensajes_sin_responder > 0 && <span className="urgency-dot"></span>}
                  <div className="chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      <line x1="12" y1="8" x2="12" y2="11"></line>
                      <line x1="12" y1="14" x2="12.01" y2="14"></line>
                    </svg>
                  </div>
                  <span className="chip-number">{adminStats.mensajes_sin_responder}</span>
                  <span className="chip-label">Mensajes sin responder</span>
                </div>

                <button className="profile-admin-btn" onClick={() => navigate('/admin')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                  </svg>
                  Ir al panel administrativo
                </button>
              </div>
            ) : (
              /* ── USER ACTIVITY ── */
              <div className="profile-stats">
                <div className="activity-chip activity-chip--navy" onClick={() => navigate('/mis-propiedades')}>
                  <div className="chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <span className="chip-number">{stats.propiedades}</span>
                  <span className="chip-label">Propiedades publicadas</span>
                </div>

                <div className="activity-chip activity-chip--red" onClick={() => navigate('/favoritos')}>
                  <div className="chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </div>
                  <span className="chip-number">{stats.favoritos || '—'}</span>
                  <span className="chip-label">Favoritos guardados</span>
                </div>

                <div className="activity-chip activity-chip--purple" onClick={() => navigate('/contacto')}>
                  <div className="chip-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </div>
                  <span className="chip-number">{stats.mensajes || '—'}</span>
                  <span className="chip-label">Mensajes enviados</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile


