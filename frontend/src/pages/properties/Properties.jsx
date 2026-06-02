import { useState, useEffect, useCallback } from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import { api, parseApiError } from '../../config/api'
import PropertySearchBar from '../../components/property/PropertySearchBar'
import PropertyCard from '../../components/property/PropertyCard'
import '../../styles/pages/Properties.css'

const SORT_OPTIONS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Precio menor a mayor' },
  { value: 'precio_desc', label: 'Precio mayor a menor' },
  { value: 'area_mayor', label: 'Mayor área' },
  { value: 'area_menor', label: 'Menor área' }
]

const Properties = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('recientes')
  const [currentFilters, setCurrentFilters] = useState({})
  const { t } = usePreferences()

  useEffect(() => { fetchProperties({}) }, [])

  const fetchProperties = async (searchParams) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          params.append(key, value)
        }
      })

      const queryString = params.toString()
      const url = queryString ? `/api/inmuebles/buscar?${queryString}` : '/api/inmuebles/buscar'

      const response = await api.get(url)
      setProperties(response.data.inmuebles || [])
    } catch (err) {
      setError(parseApiError(err))
      // Fallback to basic endpoint
      try {
        const response = await api.get('/api/inmuebles')
        setProperties(response.data.inmuebles || [])
        setError(null)
      } catch {
        setProperties([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((searchParams) => {
    setCurrentFilters(searchParams)
    fetchProperties({ ...searchParams, orden: sortBy })
  }, [sortBy])

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    fetchProperties({ ...currentFilters, orden: newSort })
  }

  return (
    <div className="properties-page">
      <section className="page-header">
        <h1>{t('nuestrasPropiedades') || 'Encuentra tu propiedad ideal'}</h1>
        <p>{t('exploraPortafolio') || 'Explora nuestro portafolio de propiedades'}</p>
      </section>

      <PropertySearchBar onSearch={handleSearch} loading={loading} />

      <section className="properties-section">
        <div className="properties-toolbar">
          <div className="properties-count">
            <span className="properties-count__number">{properties.length}</span>
            <span className="properties-count__text">
              {properties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
            </span>
          </div>

          <div className="properties-sort">
            <label htmlFor="sort-select" className="properties-sort__label">Ordenar por:</label>
            <select
              id="sort-select"
              className="properties-sort__select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="properties-loading">
            <div className="skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-card__image skeleton-pulse"></div>
                  <div className="skeleton-card__body">
                    <div className="skeleton-card__line skeleton-pulse" style={{ width: '70%' }}></div>
                    <div className="skeleton-card__line skeleton-pulse" style={{ width: '50%' }}></div>
                    <div className="skeleton-card__line skeleton-pulse" style={{ width: '40%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && !loading && properties.length === 0 && (
          <div className="properties-empty">
            <div className="properties-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            <h3>Error al cargar propiedades</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="properties-empty">
            <div className="properties-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
            <h3>No se encontraron propiedades</h3>
            <p>Intenta ajustar los filtros de búsqueda para encontrar más resultados.</p>
          </div>
        )}

        {!loading && properties.length > 0 && (
          <div className="properties-grid">
            {properties.map(property => (
              <PropertyCard key={property.id_inmueble} property={property} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Properties
