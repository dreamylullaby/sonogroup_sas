import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../config/api'
import '../../styles/components/PropertyCard.css'

const PropertyCard = ({ property, onRemoveFavorite, isFavorite: initialFavorite = false }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [favLoading, setFavLoading] = useState(false)
  const [favToast, setFavToast] = useState(null)

  const formatPrice = (price) => {
    if (!price) return '$0'
    return '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
  }

  const getArea = () => {
    const c = property.caracteristicas || {}
    return c.area_construida || c.area_total || c.area_lote || property.area || null
  }

  const getHabitaciones = () => {
    const c = property.caracteristicas || {}
    return c.habitaciones || property.habitaciones || null
  }

  const getBanos = () => {
    const c = property.caracteristicas || {}
    return c.banos || property.banos || null
  }

  const getParqueaderos = () => {
    const c = property.caracteristicas || {}
    return c.parqueadero_cantidad || c.parqueaderos || property.parqueaderos || null
  }

  const getLocation = () => {
    if (property.ubicaciones) {
      const parts = []
      if (property.ubicaciones.barrio_vereda) parts.push(property.ubicaciones.barrio_vereda)
      if (property.ubicaciones.municipio) parts.push(property.ubicaciones.municipio)
      if (property.ubicaciones.departamento) parts.push(property.ubicaciones.departamento)
      return parts.join(', ') || 'Ubicación no especificada'
    }
    return property.ubicacion || 'Ubicación no especificada'
  }

  const getImage = () => {
    if (property.fotografias?.length > 0) {
      const portada = property.fotografias.find(f => f.es_portada)
      return portada?.url_foto || property.fotografias[0].url_foto
    }
    return property.imagen || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
  }

  const getTitle = () => {
    if (property.descripcion && property.descripcion.length > 0) {
      return property.descripcion.substring(0, 60) + (property.descripcion.length > 60 ? '...' : '')
    }
    const tipo = property.tipo_inmueble?.charAt(0).toUpperCase() + property.tipo_inmueble?.slice(1)
    return `${tipo} en ${property.ubicaciones?.municipio || 'venta'}`
  }

  const getOperationLabel = () => {
    return property.tipo_operacion === 'venta' ? 'Venta' : 'Arriendo'
  }

  const handleViewDetails = (e) => {
    e.stopPropagation()
    navigate(`/propiedad/${property.id_inmueble}`)
  }

  const handleFavorite = async (e) => {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    if (onRemoveFavorite && isFavorite) {
      onRemoveFavorite(property.id_inmueble)
      setIsFavorite(false)
      return
    }
    try {
      setFavLoading(true)
      if (isFavorite) {
        await api.delete(`/api/favoritos/${property.id_inmueble}`)
        setIsFavorite(false)
      } else {
        await api.post('/api/favoritos', { id_inmueble: property.id_inmueble })
        setIsFavorite(true)
        setFavToast('Propiedad agregada a favoritos')
        setTimeout(() => setFavToast(null), 3000)
      }
    } catch {
      // Silently fail
    } finally {
      setFavLoading(false)
    }
  }

  const area = getArea()
  const habitaciones = getHabitaciones()
  const banos = getBanos()
  const parqueaderos = getParqueaderos()

  return (
    <article className="property-card" onClick={handleViewDetails} role="button" tabIndex={0} aria-label={`Ver detalles de ${getTitle()}`}>
      <div className="property-card__image">
        <img
          src={getImage()}
          alt={getTitle()}
          loading="lazy"
        />
        <span className={`property-card__badge property-card__badge--${property.tipo_operacion}`}>
          {getOperationLabel()}
        </span>
        <button
          className={`property-card__favorite ${isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
          disabled={favLoading}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        {property.estrato && (
          <span className="property-card__estrato">E{property.estrato}</span>
        )}
      </div>

      <div className="property-card__content">
        <div className="property-card__price">{formatPrice(property.valor || property.precio)}</div>

        <h3 className="property-card__title">{getTitle()}</h3>

        <p className="property-card__location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {getLocation()}
        </p>

        <div className="property-card__features">
          {area && (
            <span className="property-card__feature">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18"/><path d="M9 3v18"/>
              </svg>
              {area} m²
            </span>
          )}
          {habitaciones && (
            <span className="property-card__feature">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
              </svg>
              {habitaciones} Hab
            </span>
          )}
          {banos && (
            <span className="property-card__feature">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2.25"/>
              </svg>
              {banos} Baño{banos > 1 ? 's' : ''}
            </span>
          )}
          {parqueaderos > 0 && (
            <span className="property-card__feature">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
              </svg>
              {parqueaderos} Parq
            </span>
          )}
        </div>

        <button className="property-card__btn" onClick={handleViewDetails}>
          Ver Detalles
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </button>
      </div>

      {favToast && (
        <div className="property-card__toast-global">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{favToast}</span>
        </div>
      )}
    </article>
  )
}

export default PropertyCard
