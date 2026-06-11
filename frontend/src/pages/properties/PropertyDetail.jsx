import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError } from '../../config/api'
import { validators } from '../../utils/validation'
import '../../styles/pages/PropertyDetail.css'

const PropertyDetail = () => {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editSolicitud, setEditSolicitud] = useState(null)
  const [revisionPendiente, setRevisionPendiente] = useState(false)
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false)
  const [editRequestLoading, setEditRequestLoading] = useState(false)
  const [editJustificacion, setEditJustificacion] = useState('')
  const [deleteSolicitud, setDeleteSolicitud] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteMotivo, setDeleteMotivo] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchProperty = useCallback(async () => {
    if (!id || id === 'undefined') {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await api.get(`/api/inmuebles/${id}`)
      
      if (response.data) {
        setProperty(response.data)
      } else {
        setProperty(null)
      }
    } catch (error) {
      console.error('Error al cargar propiedad:', error)
      setProperty(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const checkFavorite = useCallback(async () => {
    // Solo verificar favoritos si hay un usuario autenticado
    if (!user || !id || id === 'undefined') {
      setIsFavorite(false)
      return
    }
    
    const token = localStorage.getItem('token')
    if (!token) {
      setIsFavorite(false)
      return
    }
    
    try {
      const response = await api.get('/api/favoritos')
      const favorites = response.data.favoritos || []
      setIsFavorite(favorites.some(f => f.id_inmueble === parseInt(id)))
    } catch (error) {
      if (error.response?.status === 401) {
        setIsFavorite(false)
      }
    }
  }, [id, user])

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchProperty()
    }
  }, [id, fetchProperty])

  useEffect(() => {
    // Solo verificar favoritos después de que la autenticación haya terminado de cargar
    // Y verificar que realmente haya un token válido
    if (!authLoading && user && id && id !== 'undefined') {
      const token = localStorage.getItem('token')
      // Solo llamar checkFavorite si hay un token
      if (token && token.length > 20) {
        checkFavorite()
      } else {
        setIsFavorite(false)
      }
    } else {
      setIsFavorite(false)
    }
  }, [user, id, checkFavorite, authLoading])

  // Verificar solicitud de edición para usuarios dueños
  useEffect(() => {
    if (!authLoading && user && user.rol !== 'admin' && property && property.id_usuario === user.id_usuario) {
      api.get(`/api/propiedades-pendientes/solicitud-edicion/${id}`)
        .then(res => setEditSolicitud(res.data.solicitud))
        .catch(() => setEditSolicitud(null))
      // Verificar si hay una revision_edicion pendiente
      api.get('/api/propiedades-pendientes/mis-propiedades')
        .then(res => {
          const sols = res.data.propiedades || []
          const revPendiente = sols.find(s =>
            s.tipo_solicitud === 'revision_edicion' &&
            s.id_inmueble === parseInt(id) &&
            s.estado_aprobacion === 'pendiente'
          )
          setRevisionPendiente(!!revPendiente)
        })
        .catch(() => setRevisionPendiente(false))
    }
  }, [user, property, id, authLoading])

  const handleRequestEdit = async () => {
    if (editJustificacion.trim().length < 20) return
    setEditRequestLoading(true)
    try {
      await api.post('/api/propiedades-pendientes/solicitud-edicion', {
        id_inmueble: parseInt(id),
        motivo: editJustificacion.trim()
      })
      // Refrescar estado
      const res = await api.get(`/api/propiedades-pendientes/solicitud-edicion/${id}`)
      setEditSolicitud(res.data.solicitud)
      setShowEditConfirmModal(false)
      setEditJustificacion('')
    } catch (err) {
      alert(parseApiError(err))
    } finally {
      setEditRequestLoading(false)
    }
  }

  // Verificar solicitud de eliminación
  useEffect(() => {
    if (!authLoading && user && user.rol !== 'admin' && property && property.id_usuario === user.id_usuario) {
      api.get(`/api/propiedades-pendientes/solicitud-eliminacion/${id}`)
        .then(res => setDeleteSolicitud(res.data.solicitud))
        .catch(() => setDeleteSolicitud(null))
    }
  }, [user, property, id, authLoading])

  const handleRequestDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.post('/api/propiedades-pendientes/solicitud-eliminacion', {
        id_inmueble: parseInt(id),
        motivo: deleteMotivo.trim() || null
      })
      const res = await api.get(`/api/propiedades-pendientes/solicitud-eliminacion/${id}`)
      setDeleteSolicitud(res.data.solicitud)
      setShowDeleteModal(false)
      setDeleteMotivo('')
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar solicitud')
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      if (isFavorite) {
        await api.delete(`/api/favoritos/${id}`)
        setIsFavorite(false)
      } else {
        await api.post('/api/favoritos', { id_inmueble: id })
        setIsFavorite(true)
      }
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        alert(parseApiError(error))
      }
    }
  }

  const handleContact = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setShowContactForm(true)
  }

  const formatPrice = (price) => {
    if (!price) return '$ 0'
    return '$ ' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const capitalize = (str) => {
    if (!str) return ''
    return str.replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Cargando propiedad...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="error">
        <p>Propiedad no encontrada</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="property-detail">
      {/* Header con botón volver y acciones */}
      <div className="detail-top-bar">
        <button onClick={() => navigate(-1)} className="btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
        <div className="top-actions">
          {user?.rol === 'admin' && (
            <button 
              onClick={() => navigate(`/editar-propiedad/${id}`)} 
              className="btn-edit-admin"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
          )}
          {/* Botón de edición para usuario dueño */}
          {user && user.rol !== 'admin' && property && property.id_usuario === user.id_usuario && (
            (() => {
              // Si existe solicitud revision_edicion pendiente, mostrar "Cambios en revisión"
              if (editSolicitud?.estado_aprobacion === 'aprobado' && editSolicitud?.motivo_rechazo === 'en_revision') {
                return (
                  <button disabled className="btn-edit-admin" style={{ opacity: 0.6, cursor: 'not-allowed', background: '#F59E0B', color: '#fff', border: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Cambios en revisión
                  </button>
                )
              }
              if (!editSolicitud || editSolicitud.estado_aprobacion === 'rechazado' || editSolicitud.estado_aprobacion === 'no_resuelto') {
                return (
                  <button onClick={() => setShowEditConfirmModal(true)} className="btn-edit-admin" style={{ background: '#6B3FA0', color: '#fff', border: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Solicitar edición
                  </button>
                )
              }
              if (['pendiente', 'recibido'].includes(editSolicitud.estado_aprobacion)) {
                return (
                  <button disabled className="btn-edit-admin" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Solicitud enviada
                  </button>
                )
              }
              if (editSolicitud.estado_aprobacion === 'aprobado') {
                // Si ya hay una revision pendiente, deshabilitar
                if (revisionPendiente) {
                  return (
                    <button disabled className="btn-edit-admin" style={{ opacity: 0.6, cursor: 'not-allowed', background: '#F59E0B', color: '#fff', border: 'none' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Cambios en revisión
                    </button>
                  )
                }
                return (
                  <button onClick={() => navigate(`/editar-propiedad/${id}`)} className="btn-edit-admin" style={{ background: '#059669', color: '#fff', border: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                  </button>
                )
              }
              return null
            })()
          )}
          {/* Botón de eliminación para usuario dueño */}
          {user && user.rol !== 'admin' && property && property.id_usuario === user.id_usuario && (
            (() => {
              if (deleteSolicitud?.estado_aprobacion === 'pendiente') {
                return (
                  <button disabled className="btn-edit-admin" style={{ opacity: 0.6, cursor: 'not-allowed', background: '#DC2626', color: '#fff', border: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Eliminación pendiente
                  </button>
                )
              }
              return (
                <button onClick={() => setShowDeleteModal(true)} className="btn-edit-admin" style={{ background: '#DC2626', color: '#fff', border: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Solicitar eliminación
                </button>
              )
            })()
          )}
          <button className="btn-share">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Compartir
          </button>
          <button 
            onClick={toggleFavorite} 
            className={`btn-favorite-top ${isFavorite ? 'active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Guardar
          </button>
        </div>
      </div>

      {/* Título y ubicación */}
      <div className="detail-header-info">
        <h1>{property.descripcion || `${capitalize(property.tipo_inmueble)} en ${capitalize(property.ubicaciones?.municipio) || 'venta'}`}</h1>
        <div className="header-meta">
          <span className="location-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {capitalize(property.ubicaciones?.barrio_vereda) ? `${capitalize(property.ubicaciones.barrio_vereda)}, ` : ''}
            {capitalize(property.ubicaciones?.municipio)}
            {property.ubicaciones?.departamento && property.ubicaciones.departamento !== 'Colombia' ? `, ${capitalize(property.ubicaciones.departamento)}` : ''}
          </span>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="detail-content">
        <div className="detail-main">
          {/* Owner banner */}
          {user && property.id_usuario === user.id_usuario && (
            <div className="detail-owner-banner">
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Esta es tu publicación
              </span>
              <button onClick={() => navigate(user.rol === 'admin' ? `/editar-propiedad/${id}` : '/mis-propiedades')}>Editar propiedad</button>
            </div>
          )}

          {/* Galería de imágenes */}
          <div className="detail-image-gallery-grid">
            {property.fotografias && property.fotografias.length > 0 ? (
              <>
                <div className="main-image">
                  <img src={property.fotografias[0]?.url_foto} alt="Principal" />
                </div>
                <div className="secondary-images">
                  {property.fotografias.slice(1, 5).map((foto, i) => (
                    <div key={i} className="secondary-image">
                      <img src={foto.url_foto} alt={`Vista ${i + 2}`} />
                      {i === 3 && property.fotografias.length > 5 && (
                        <button className="btn-show-all">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                          </svg>
                          +{property.fotografias.length - 5} fotos
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="detail-no-images">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c0b8d0" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Sin imágenes disponibles</span>
              </div>
            )}
          </div>

          <div className="detail-price-section">
            <div className="detail-badges">
              <span className={`detail-badge ${property.tipo_operacion}`}>
                {property.tipo_operacion === 'venta' ? 'En Venta' : 'En Arriendo'}
              </span>
              <span className="detail-badge tipo">{capitalize(property.tipo_inmueble)}</span>
              {property.estrato && <span className="detail-badge estrato">Estrato {property.estrato}</span>}
            </div>
            <h2 className="detail-price">{formatPrice(property.valor)}</h2>
            <span className="detail-price-currency">COP{property.tipo_operacion === 'arriendo' ? ' / mes' : ''}</span>
            {property.valor_administracion > 0 && (
              <span className="detail-admin-fee">Administración: {formatPrice(property.valor_administracion)}/mes</span>
            )}

            {/* Quick stats chips */}
            {property.caracteristicas && (
              <div className="detail-quick-stats">
                {property.caracteristicas.area_construida && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.area_construida} m²</span><span className="quick-chip-label">Área</span></div>
                )}
                {property.caracteristicas.area_total && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.area_total} m²</span><span className="quick-chip-label">Área total</span></div>
                )}
                {property.caracteristicas.habitaciones && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.habitaciones}</span><span className="quick-chip-label">Habitaciones</span></div>
                )}
                {property.caracteristicas.banos && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.banos}</span><span className="quick-chip-label">Baños</span></div>
                )}
                {property.caracteristicas.parqueadero_cantidad > 0 && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.parqueadero_cantidad}</span><span className="quick-chip-label">Parqueaderos</span></div>
                )}
                {property.caracteristicas.pisos && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.pisos}</span><span className="quick-chip-label">Pisos</span></div>
                )}
                {property.caracteristicas.piso && (
                  <div className="quick-chip"><span className="quick-chip-value">{property.caracteristicas.piso}</span><span className="quick-chip-label">Piso</span></div>
                )}
              </div>
            )}
          </div>

          {/* Información General */}
          <div className="detail-info-card">
            <h3>Detalles</h3>
            <div className="detail-info-rows">
              <div className="detail-info-row">
                <span className="detail-info-label">Tipo de inmueble</span>
                <span className="detail-info-value">{capitalize(property.tipo_inmueble)}</span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">Estado</span>
                <span className="detail-info-value">{capitalize(property.estado_inmueble)}</span>
              </div>
              {property.estrato && (
                <div className="detail-info-row">
                  <span className="detail-info-label">Estrato</span>
                  <span className="detail-info-value">{property.estrato}</span>
                </div>
              )}
              <div className="detail-info-row">
                <span className="detail-info-label">Zona</span>
                <span className="detail-info-value">{capitalize(property.zona)}</span>
              </div>
            </div>
          </div>

          {/* Características del Inmueble */}
          {property.caracteristicas && Object.keys(property.caracteristicas).length > 0 && (
            <div className="detail-characteristics">
              <h3>Características</h3>
              <div className="characteristics-grid">
                {Object.entries(property.caracteristicas).map(([key, value]) => {
                  if (key === 'id_inmueble' || key.startsWith('id_') || value === null || typeof value === 'boolean') return null
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <div key={key} className="char-item">
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </div>
                  )
                })}
              </div>
              {/* Amenidades (boolean fields) */}
              <div className="detail-amenities">
                <span className="amenities-label">Amenidades</span>
                <div className="amenities-chips">
                  {Object.entries(property.caracteristicas).filter(([key, value]) => typeof value === 'boolean' && !key.startsWith('id_')).map(([key, value]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    return (
                      <span key={key} className={`amenity-chip ${value ? 'amenity-chip--yes' : 'amenity-chip--no'}`}>
                        {value ? '✓' : '✗'} {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="detail-description">
            <h3>Descripción</h3>
            <p>{property.descripcion || 'Sin descripción disponible'}</p>
          </div>

          {/* Servicios Públicos */}
          {property.servicios_publicos && (
            <div className="detail-services">
              <h3>Servicios Públicos</h3>
              <div className="services-grid">
                {property.servicios_publicos.acueducto && <span className="service-badge">✓ Acueducto</span>}
                {property.servicios_publicos.energia && <span className="service-badge">✓ Energía</span>}
                {property.servicios_publicos.alcantarillado && <span className="service-badge">✓ Alcantarillado</span>}
                {property.servicios_publicos.gas && <span className="service-badge">✓ Gas</span>}
                {property.servicios_publicos.internet && <span className="service-badge">✓ Internet</span>}
              </div>
            </div>
          )}

          {/* Ubicación Detallada */}
          {property.ubicaciones && (
            <div className="detail-location-info">
              <h3>Ubicación</h3>
              <div className="location-details">
                {property.ubicaciones.direccion && <p><strong>Dirección:</strong> {capitalize(property.ubicaciones.direccion)}</p>}
                {property.ubicaciones.barrio_vereda && (
                  <p><strong>Barrio/Vereda:</strong> {capitalize(property.ubicaciones.barrio_vereda)}</p>
                )}
                <p><strong>Municipio:</strong> {capitalize(property.ubicaciones.municipio)}</p>
                <p><strong>Departamento:</strong> {property.ubicaciones.departamento && property.ubicaciones.departamento !== 'Colombia' ? capitalize(property.ubicaciones.departamento) : <em style={{ color: '#8097B7' }}>No especificado</em>}</p>
              </div>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          {/* Contacto con formulario inline */}
          <div className="contact-card">
            <h3>¿Interesado en esta propiedad?</h3>
            <p>Envía un mensaje a Sonogroup</p>
            <div className="sidebar-contact-form">
              <input type="text" placeholder="Tu nombre" defaultValue={user?.nombre || ''} readOnly={!!user} />
              <input type="tel" placeholder="Teléfono" defaultValue={user?.telefono || ''} />
              <input type="email" placeholder="Correo electrónico" defaultValue={user?.email || ''} readOnly={!!user} />
              <textarea rows="3" defaultValue={`Hola, vi esta propiedad en Sonogroup y me interesa recibir más información. ¡Gracias!`} />
              <button className="btn-send-msg" onClick={handleContact}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Contactar
              </button>
            </div>
            {property.usuarios?.telefono && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <a href={`tel:+57${property.usuarios.telefono.replace(/\D/g, '')}`} className="btn-whatsapp" style={{ flex: 1, color: '#3D518C', borderColor: '#c0c8f0' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                  Llamar
                </a>
                <a href={`https://wa.me/57${property.usuarios.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp" style={{ flex: 1 }}>
                  <img src="/src/assets/images/logo_whatsapp.png" alt="WhatsApp" style={{ width: '16px', height: '16px' }} />
                  WhatsApp
                </a>
              </div>
            )}
            {!user && (
              <p className="login-hint"><Link to="/login">Inicia sesión</Link> para contactar</p>
            )}
          </div>

          <div className="info-card">
            <h4>Información de la publicación</h4>
            <div className="pub-info-row">
              <span>Operación</span>
              <strong>{property.tipo_operacion === 'venta' ? 'Venta' : 'Arriendo'}</strong>
            </div>
            <div className="pub-info-row">
              <span>Publicado</span>
              <strong>{property.fecha_registro ? new Date(property.fecha_registro).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</strong>
            </div>
          </div>
        </div>
      </div>

      {showContactForm && (
        <ContactModal 
          property={property}
          onClose={() => setShowContactForm(false)}
        />
      )}

      {/* Modal de confirmación para solicitar edición */}
      {showEditConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowEditConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Solicitar edición</h2>
              <button className="modal-close" onClick={() => setShowEditConfirmModal(false)}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#4A3F55', lineHeight: 1.5, margin: '0 0 16px' }}>
                Para editar tu propiedad debes enviar una solicitud al administrador. Una vez aprobada podrás modificar los datos.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5A4864', marginBottom: '6px' }}>
                  Describe brevemente qué quieres modificar <span style={{ color: '#CC1E2B' }}>*</span>
                </label>
                <textarea
                  value={editJustificacion}
                  onChange={(e) => setEditJustificacion(e.target.value)}
                  placeholder="Ej: Necesito actualizar el precio y agregar nuevas fotos..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '13px', color: '#241929',
                    border: '1px solid #e0d8ec', borderRadius: '8px', background: '#F4F0F8',
                    resize: 'vertical', outline: 'none', fontFamily: 'inherit'
                  }}
                  autoFocus
                />
                {editJustificacion.trim().length > 0 && editJustificacion.trim().length < 20 && (
                  <p style={{ fontSize: '11px', color: '#8C1132', marginTop: '4px' }}>Mínimo 20 caracteres</p>
                )}
              </div>
              {editSolicitud?.estado_aprobacion === 'rechazado' && editSolicitud?.motivo_rechazo && (
                <div style={{ padding: '10px', background: '#FEE2E2', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#991B1B' }}>
                  <strong>Motivo del rechazo anterior:</strong> {editSolicitud.motivo_rechazo}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowEditConfirmModal(false); setEditJustificacion('') }}
                  style={{ padding: '8px 16px', fontSize: '12px', background: 'transparent', border: '1px solid #e0d8ec', borderRadius: '8px', cursor: 'pointer', color: '#5A4864' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestEdit}
                  disabled={editRequestLoading || editJustificacion.trim().length < 20}
                  style={{
                    padding: '8px 18px', fontSize: '12px',
                    background: editJustificacion.trim().length >= 20 ? '#6B3FA0' : '#e0d8ec',
                    color: editJustificacion.trim().length >= 20 ? '#fff' : '#8097B7',
                    border: 'none', borderRadius: '8px',
                    cursor: editJustificacion.trim().length >= 20 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {editRequestLoading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para solicitar eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#DC2626' }}>Solicitar eliminación</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#4A3F55', lineHeight: 1.5, margin: '0 0 16px' }}>
                ¿Estás seguro de que quieres solicitar la eliminación de esta propiedad? Esta acción no se puede deshacer si el administrador la aprueba.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5A4864', marginBottom: '6px' }}>
                  Motivo (opcional)
                </label>
                <textarea
                  value={deleteMotivo}
                  onChange={(e) => setDeleteMotivo(e.target.value)}
                  placeholder="Ej: La propiedad ya fue vendida..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '13px', color: '#241929',
                    border: '1px solid #e0d8ec', borderRadius: '8px', background: '#F4F0F8',
                    resize: 'vertical', outline: 'none', fontFamily: 'inherit'
                  }}
                />
              </div>
              {deleteSolicitud?.estado_aprobacion === 'rechazado' && deleteSolicitud?.motivo_rechazo && (
                <div style={{ padding: '10px', background: '#FEE2E2', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#991B1B' }}>
                  <strong>Rechazo anterior:</strong> {deleteSolicitud.motivo_rechazo}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteMotivo('') }}
                  style={{ padding: '8px 16px', fontSize: '12px', background: 'transparent', border: '1px solid #e0d8ec', borderRadius: '8px', cursor: 'pointer', color: '#5A4864' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestDelete}
                  disabled={deleteLoading}
                  style={{ padding: '8px 18px', fontSize: '12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {deleteLoading ? 'Enviando...' : 'Confirmar eliminación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ContactModal = ({ property, onClose }) => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const msgErr = validators.mensaje(message)
    if (msgErr) { setError(msgErr); return }

    setLoading(true)
    try {
      await api.post('/api/contactos', {
        id_inmueble: property.id_inmueble,
        mensaje: message
      })
      alert('Mensaje enviado exitosamente')
      onClose()
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Contactar sobre: {property.titulo}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message" role="alert">⚠️ {error}</div>}
          <div className="form-group">
            <label>Mensaje (mínimo 10 caracteres)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows="5"
              required
              disabled={loading}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PropertyDetail


