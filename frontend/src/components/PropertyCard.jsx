import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PropertyCard.css'

const PropertyCard = ({ property, onRemoveFavorite, isFavorite = false }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleViewDetails = () => {
    navigate(`/propiedad/${property.id_inmueble}`)
  }

  const handleRemoveFavorite = (e) => {
    e.stopPropagation()
    if (onRemoveFavorite) {
      onRemoveFavorite(property.id_inmueble)
    }
  }

  return (
    <div className="property-card" onClick={handleViewDetails}>
      <div className="property-image">
        <img 
          src={property.imagen || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'} 
          alt={property.descripcion || property.titulo}
        />
        <span className={`property-badge ${property.tipo_operacion || property.estado}`}>
          {(property.tipo_operacion === 'venta' || property.estado === 'venta') ? 'En Venta' : 'En Alquiler'}
        </span>
        {isFavorite && user && (
          <button 
            className="btn-remove-favorite"
            onClick={handleRemoveFavorite}
            title="Quitar de favoritos"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="property-content">
        <h3 className="property-title">{property.descripcion?.substring(0, 60) || property.titulo}</h3>
        <p className="property-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {property.ubicaciones?.municipio || property.ubicacion}
        </p>
        <p className="property-price">{formatPrice(property.valor || property.precio)}</p>

        <div className="property-features">
          {property.habitaciones && (
            <span className="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              {property.habitaciones} hab.
            </span>
          )}
          {property.banos && (
            <span className="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l-6 6 6 6"></path>
                <path d="M20 4v2.5c0 1.5-1 2.5-2.5 2.5H4"></path>
              </svg>
              {property.banos} baños
            </span>
          )}
          {property.area && (
            <span className="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              {property.area} m²
            </span>
          )}
        </div>

        <p className="property-description">
          {property.descripcion?.substring(60, 160) || ''}
          {property.descripcion?.length > 160 ? '...' : ''}
        </p>

        <button className="btn-view-details" onClick={handleViewDetails}>
          Ver Detalles
        </button>
      </div>
    </div>
  )
}

export default PropertyCard
