import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { api, parseApiError } from '../../config/api'
import '../../styles/pages/Profile.css'

const Profile = () => {
  const { user } = useAuth()
  const { t } = usePreferences()
  const [perfil, setPerfil] = useState(null)
  const [stats, setStats] = useState({ propiedades: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      setStats({ propiedades: inmueblesRes.data.total || 0 })
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
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
              <div className="profile-avatar-xl">
                {perfil?.nombre?.charAt(0).toUpperCase()}
              </div>
              <span className={`profile-rol-badge ${perfil?.rol}`}>
                {getRolLabel(perfil?.rol)}
              </span>
            </div>
            <div className="profile-header-info">
              <h1>{perfil?.nombre}</h1>
              <p className="profile-email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {perfil?.email}
              </p>
              <p className="profile-since">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {t('miembroDesde')} {formatFecha(perfil?.fecha_registro)}
              </p>
            </div>
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
            <div className="profile-fields">
              <div className="profile-field">
                <span className="field-label">Nombre completo</span>
                <span className="field-value">{perfil?.nombre || '—'}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Correo electrónico</span>
                <span className="field-value">{perfil?.email || '—'}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Teléfono</span>
                <span className="field-value">{perfil?.telefono || '—'}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Rol</span>
                <span className="field-value">{getRolLabel(perfil?.rol)}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Fecha de registro</span>
                <span className="field-value">{formatFecha(perfil?.fecha_registro)}</span>
              </div>
            </div>
          </div>

          {/* ACTIVIDAD */}
          <div className="profile-card">
            <div className="profile-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <h2>{t('actividad')}</h2>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{stats.propiedades}</span>
                  <span className="stat-label">{t('propiedadesPublicadas')}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">—</span>
                  <span className="stat-label">{t('favoritosGuardados')}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">—</span>
                  <span className="stat-label">{t('mensajesEnviados')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile


