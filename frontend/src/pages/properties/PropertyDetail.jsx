import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError, ENUM_LABELS } from '../../config/api'
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
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
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
        <h1>{property.descripcion || 'Propiedad'}</h1>
        <div className="header-meta">
          <span className="location-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {property.ubicaciones?.municipio}, {property.ubicaciones?.departamento}
          </span>
          <span className="property-id">ID: {property.id_inmueble}</span>
        </div>
      </div>

      {/* Galería de imágenes estilo grid */}
      <div className="detail-image-gallery-grid">
        <div className="main-image">
          <img 
            src={property.imagen || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop'} 
            alt={property.descripcion}
          />
        </div>
        <div className="secondary-images">
          <div className="secondary-image">
            <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop" alt="Vista 2" />
          </div>
          <div className="secondary-image">
            <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop" alt="Vista 3" />
          </div>
          <div className="secondary-image">
            <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop" alt="Vista 4" />
          </div>
          <div className="secondary-image">
            <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop" alt="Vista 5" />
            <button className="btn-show-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Mostrar todas las fotos
            </button>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="detail-price-section">
            <span className={`detail-badge ${property.tipo_operacion}`}>
              {property.tipo_operacion === 'venta' ? 'En Venta' : 'En Arriendo'}
            </span>
            <h2 className="detail-price">{formatPrice(property.valor)}</h2>
          </div>

          {/* Información General */}
          <div className="detail-info-grid">
            <div className="info-item">
              <strong>Tipo de Inmueble:</strong>
              <span>{property.tipo_inmueble?.charAt(0).toUpperCase() + property.tipo_inmueble?.slice(1)}</span>
            </div>
            <div className="info-item">
              <strong>Estado:</strong>
              <span>{property.estado_inmueble?.charAt(0).toUpperCase() + property.estado_inmueble?.slice(1)}</span>
            </div>
            <div className="info-item">
              <strong>Estrato:</strong>
              <span>{property.estrato}</span>
            </div>
            <div className="info-item">
              <strong>Zona:</strong>
              <span>{property.zona?.charAt(0).toUpperCase() + property.zona?.slice(1)}</span>
            </div>
            {property.acepta_permuta && (
              <div className="info-item">
                <strong>Permuta:</strong>
                <span>Acepta permuta</span>
              </div>
            )}
            {property.valor_administracion && (
              <div className="info-item">
                <strong>Administración:</strong>
                <span>{formatPrice(property.valor_administracion)}/mes</span>
              </div>
            )}
            <div className="info-item">
              <strong>Matrícula:</strong>
              <span>{property.numero_matricula}</span>
            </div>
          </div>

          {/* Características del Inmueble */}
          {property.caracteristicas && Object.keys(property.caracteristicas).length > 0 && (
            <div className="detail-characteristics">
              <h3>Características</h3>
              <div className="characteristics-grid">
                {Object.entries(property.caracteristicas).map(([key, value]) => {
                  if (key === 'id_inmueble' || key === `id_${property.tipo_inmueble}` || value === null) return null
                  
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  
                  return (
                    <div key={key} className="char-item">
                      <strong>{label}:</strong>
                      <span>{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}</span>
                    </div>
                  )
                })}
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
                <p><strong>Dirección:</strong> {property.ubicaciones.direccion}</p>
                {property.ubicaciones.barrio_vereda && (
                  <p><strong>Barrio/Vereda:</strong> {property.ubicaciones.barrio_vereda}</p>
                )}
                <p><strong>Municipio:</strong> {property.ubicaciones.municipio}</p>
                <p><strong>Departamento:</strong> {property.ubicaciones.departamento}</p>
              </div>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          {/* Solo mostrar cuadro de contacto si NO es admin */}
          {user?.rol !== 'admin' && (
            <div className="contact-card">
              <h3>¿Interesado en esta propiedad?</h3>
              <p>Contáctanos para más información</p>
              <button onClick={handleContact} className="btn-contact">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Contactar
              </button>
              {!user && (
                <p className="login-hint">
                  <Link to="/login">Inicia sesión</Link> para contactar
                </p>
              )}
            </div>
          )}

          <div className="info-card">
            <h4>Información adicional</h4>
            <div className="info-item">
              <span>ID:</span>
              <strong>{property.id_inmueble}</strong>
            </div>
            <div className="info-item">
              <span>Publicado:</span>
              <strong>{property.fecha_registro ? new Date(property.fecha_registro).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'No disponible'}</strong>
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


