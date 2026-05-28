import React, { useState } from 'react'
import { ENUMS, ENUM_LABELS } from '../config/api'
import './PropertyFilters.css'

const PropertyFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    tipo_inmueble: '',
    tipo_operacion: '',
    precioMin: '',
    precioMax: '',
    habitaciones: '',
    banos: '',
    ubicacion: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    // Mapear a los nombres que espera Properties.jsx
    onFilterChange({
      tipo: newFilters.tipo_inmueble,
      estado: newFilters.tipo_operacion,
      precioMin: newFilters.precioMin,
      precioMax: newFilters.precioMax,
      habitaciones: newFilters.habitaciones,
      banos: newFilters.banos,
      ubicacion: newFilters.ubicacion
    })
  }

  const handleReset = () => {
    const resetFilters = {
      tipo_inmueble: '', tipo_operacion: '', precioMin: '',
      precioMax: '', habitaciones: '', banos: '', ubicacion: ''
    }
    setFilters(resetFilters)
    onFilterChange({ tipo: '', estado: '', precioMin: '', precioMax: '', habitaciones: '', banos: '', ubicacion: '' })
  }

  return (
    <div className="property-filters">
      <div className="filters-header">
        <h2>Filtrar Propiedades</h2>
        <button onClick={handleReset} className="btn-reset">Limpiar Filtros</button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="tipo_inmueble">Tipo de Propiedad</label>
          <select id="tipo_inmueble" name="tipo_inmueble" value={filters.tipo_inmueble} onChange={handleChange}>
            <option value="">Todos</option>
            {ENUMS.tipo_inmueble.map(t => (
              <option key={t} value={t}>{ENUM_LABELS.tipo_inmueble[t]}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="tipo_operacion">Tipo de Operación</label>
          <select id="tipo_operacion" name="tipo_operacion" value={filters.tipo_operacion} onChange={handleChange}>
            <option value="">Todos</option>
            {ENUMS.tipo_operacion.map(t => (
              <option key={t} value={t}>{ENUM_LABELS.tipo_operacion[t]}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="ubicacion">Ubicación</label>
          <input type="text" id="ubicacion" name="ubicacion" placeholder="Ciudad, barrio..."
            value={filters.ubicacion} onChange={handleChange} />
        </div>

        <div className="filter-group">
          <label htmlFor="precioMin">Precio Mínimo</label>
          <input type="number" id="precioMin" name="precioMin" placeholder="$0"
            value={filters.precioMin} onChange={handleChange} min="0" />
        </div>

        <div className="filter-group">
          <label htmlFor="precioMax">Precio Máximo</label>
          <input type="number" id="precioMax" name="precioMax" placeholder="$1,000,000,000"
            value={filters.precioMax} onChange={handleChange} min="0" />
        </div>

        <div className="filter-group">
          <label htmlFor="habitaciones">Habitaciones</label>
          <select id="habitaciones" name="habitaciones" value={filters.habitaciones} onChange={handleChange}>
            <option value="">Cualquiera</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="banos">Baños</label>
          <select id="banos" name="banos" value={filters.banos} onChange={handleChange}>
            <option value="">Cualquiera</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default PropertyFilters
