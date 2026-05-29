import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PropertyCard.css'

const PropertyCard = ({ property, onRemoveFavorite, isFavorite = false }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const formatPrice = (price) => {
    if (!price) return '$0'
    return '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
  }

  // Extract features from caracteristicas or direct property fields
  const getFeatures = () => {
    const c = property.caracteristicas || {}
    const features = []
    const hab = c.habitaciones || property.habitaciones
    const ban = c.banos || property.banos
    const area = c.area_construida || c.area_total || c.area_lote || property.area

    if (hab) features.push({ icon: 'bed', label: `${hab} Hab` })
    if (ban) features.push({ icon: 'bath', label: `${ban} Baño${ban > 1 ? 's' : ''}` })
    if (area) features.push({ icon: 'area', label: `${area} m²` })
    return features
  }

  const features = getFeatures()

  const handleViewDetails = () => {
    navigate(`/propiedad/${property.id_inmueble}`)
  }

  const handleRemoveFavorite = (e) => {
    e.stopPropagation()
    if (onRemoveFavorite) onRemoveFavorite(property.id_inmueble)
  }

  const FeatureIcon = ({ type }) => {
    switch (type) {
      case 'bed':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
          </svg>
        )
      case 'bath':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2.25"/>
          </svg>
        )
      case 'area':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18"/><path d="M9 3v18"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="property-card" onClick={handleViewDetails}>
      <div className="property-image">
        <img
          src={property.fotografias?.[0]?.url_foto || property.imagen || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
          alt={property.descripcion || 'Propiedad'}
        />
        <span className={`property-badge ${property.tipo_operacion}`}>
          {property.tipo_operacion === 'venta' ? 'En venta' : 'Arriendo'}
        </span>
        {isFavorite && user && (
          <button className="btn-remove-favorite" onClick={handleRemoveFavorite} title="Quitar de favoritos">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className="property-content">
        <h3 className="property-title">{property.descripcion?.substring(0, 50) || property.tipo_inmueble || 'Propiedad'}</h3>
        <p className="property-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {property.ubicaciones?.municipio || property.ubicacion || '—'}
        </p>
        <p className="property-price">{formatPrice(property.valor || property.precio)}</p>

        {features.length > 0 && (
          <div className="property-features">
            {features.map((f, i) => (
              <span className="feature" key={i}>
                <FeatureIcon type={f.icon} />
                {f.label}
              </span>
            ))}
          </div>
        )}

        <button className="btn-view-details" onClick={handleViewDetails}>
          Ver detalles
        </button>
      </div>
    </div>
  )
}

export default PropertyCard
