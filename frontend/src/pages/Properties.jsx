import { useState, useEffect } from 'react'
import { usePreferences } from '../context/PreferencesContext'
import { api, parseApiError } from '../config/api'
import PropertyFilters from '../components/PropertyFilters'
import PropertyCard from '../components/PropertyCard'
import './Properties.css'

const Properties = () => {
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = usePreferences()

  useEffect(() => { fetchProperties() }, [])

  const transformInmueble = (inmueble) => ({
    id: inmueble.id_inmueble,
    id_inmueble: inmueble.id_inmueble,
    titulo: inmueble.descripcion?.substring(0, 50) || `${inmueble.tipo_inmueble} en ${inmueble.ubicaciones?.municipio || 'venta'}`,
    ubicacion: inmueble.ubicaciones?.municipio || inmueble.zona || 'Ubicación no especificada',
    precio: inmueble.valor,
    habitaciones: inmueble.caracteristicas?.habitaciones || 0,
    banos: inmueble.caracteristicas?.banos || 0,
    area: inmueble.caracteristicas?.area_total || inmueble.caracteristicas?.area_construida || 0,
    tipo: inmueble.tipo_inmueble,
    estado: inmueble.tipo_operacion,
    descripcion: inmueble.descripcion,
    imagen: inmueble.fotografias?.[0]?.url_foto || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
    estrato: inmueble.estrato,
    estado_inmueble: inmueble.estado_inmueble
  })

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/inmuebles')
      const transformed = (response.data.inmuebles || []).map(transformInmueble)
      setProperties(transformed)
      setFilteredProperties(transformed)
      setError(null)
    } catch (err) {
      setError(parseApiError(err))
      setProperties([])
      setFilteredProperties([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = async (filters) => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.tipo) params.append('tipo_inmueble', filters.tipo)
      if (filters.estado) params.append('tipo_operacion', filters.estado)
      if (filters.ubicacion) params.append('municipio', filters.ubicacion)
      if (filters.precioMin) params.append('precio_min', filters.precioMin)
      if (filters.precioMax) params.append('precio_max', filters.precioMax)

      const queryString = params.toString()
      const url = queryString ? `/api/inmuebles?${queryString}` : '/api/inmuebles'

      const response = await api.get(url)
      let transformed = (response.data.inmuebles || []).map(transformInmueble)

      // Filtros client-side para habitaciones y baños
      if (filters.habitaciones) {
        transformed = transformed.filter(p => p.habitaciones >= Number(filters.habitaciones))
      }
      if (filters.banos) {
        transformed = transformed.filter(p => p.banos >= Number(filters.banos))
      }

      setFilteredProperties(transformed)
      setError(null)
    } catch (err) {
      // Fallback: filtrar localmente
      let filtered = [...properties]
      if (filters.tipo) filtered = filtered.filter(p => p.tipo === filters.tipo)
      if (filters.estado) filtered = filtered.filter(p => p.estado === filters.estado)
      if (filters.ubicacion) filtered = filtered.filter(p => p.ubicacion.toLowerCase().includes(filters.ubicacion.toLowerCase()))
      if (filters.precioMin) filtered = filtered.filter(p => p.precio >= Number(filters.precioMin))
      if (filters.precioMax) filtered = filtered.filter(p => p.precio <= Number(filters.precioMax))
      if (filters.habitaciones) filtered = filtered.filter(p => p.habitaciones >= Number(filters.habitaciones))
      if (filters.banos) filtered = filtered.filter(p => p.banos >= Number(filters.banos))
      setFilteredProperties(filtered)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="properties-page">
      <section className="page-header">
        <h1>{t('nuestrasPropiedades')}</h1>
        <p>{t('exploraPortafolio')}</p>
      </section>

      <PropertyFilters onFilterChange={handleFilterChange} />

      <section className="properties-section">
        <div className="properties-header">
          <h2>{t('propiedadesDisponibles')}</h2>
          <span className="results-count">
            {filteredProperties.length} {filteredProperties.length === 1 ? t('resultado') : t('resultados')}
          </span>
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>{t('cargandoPropiedades')}</p>
          </div>
        )}

        {error && !loading && properties.length === 0 && (
          <div className="error"><p>⚠️ {error}</p></div>
        )}

        {!loading && filteredProperties.length === 0 && (
          <div className="no-results"><p>{t('noResultados')}</p></div>
        )}

        {!loading && filteredProperties.length > 0 && (
          <div className="properties-grid">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Properties
