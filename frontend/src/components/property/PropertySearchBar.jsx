import { useState, useEffect, useCallback } from 'react'
import { ENUMS, ENUM_LABELS, api } from '../../config/api'
import { DEPARTAMENTOS, getMunicipios } from '../../config/ubicaciones-colombia'
import AdvancedFiltersDrawer from './AdvancedFiltersDrawer'
import '../../styles/components/PropertySearchBar.css'

const PRICE_RANGES = [
  { label: 'Cualquier precio', min: '', max: '' },
  { label: 'Menos de 100M', min: '', max: '100000000' },
  { label: '100M - 300M', min: '100000000', max: '300000000' },
  { label: '300M - 500M', min: '300000000', max: '500000000' },
  { label: '500M - 1.000M', min: '500000000', max: '1000000000' },
  { label: 'Más de 1.000M', min: '1000000000', max: '' }
]

const DEFAULT_FILTERS = {
  tipo_operacion: '',
  tipo_inmueble: '',
  departamento: '',
  municipio: '',
  barrio: '',
  precio_rango: '',
  precio_min: '',
  precio_max: '',
  area_min: '',
  area_max: '',
  habitaciones: '',
  banos: '',
  parqueaderos: '',
  estrato: '',
  estado_inmueble: '',
  antiguedad: '',
  balcon: false,
  ascensor: false,
  vigilancia: false,
  piscina: false,
  gimnasio: false,
  terraza: false,
  patio: false,
  deposito: false,
  zona_bbq: false,
  zona_infantil: false,
  conjunto_cerrado: false,
  mascotas: false,
  destacadas: false,
  dias_publicacion: '',
  orden: 'recientes'
}

const PropertySearchBar = ({ onSearch, loading }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [barrios, setBarrios] = useState([])

  // Cargar barrios desde la BD cuando cambia municipio (los barrios sí dependen de datos reales)
  useEffect(() => {
    if (filters.municipio && filters.departamento) {
      fetchBarrios(filters.departamento, filters.municipio)
    } else {
      setBarrios([])
    }
  }, [filters.municipio, filters.departamento])

  const fetchBarrios = async (departamento, municipio) => {
    try {
      const params = new URLSearchParams({ departamento, municipio })
      const response = await api.get(`/api/inmuebles/buscar/ubicaciones?${params.toString()}`)
      setBarrios(response.data.barrios || [])
    } catch {
      setBarrios([])
    }
  }

  // Datos de ubicación: departamentos estáticos, municipios derivados del departamento seleccionado
  const ubicaciones = {
    departamentos: DEPARTAMENTOS,
    municipios: getMunicipios(filters.departamento),
    barrios
  }

  const handleChange = (name, value) => {
    const newFilters = { ...filters, [name]: value }
    // Reset dependents
    if (name === 'departamento') {
      newFilters.municipio = ''
      newFilters.barrio = ''
    }
    if (name === 'municipio') {
      newFilters.barrio = ''
    }
    if (name === 'precio_rango') {
      const range = PRICE_RANGES[parseInt(value)] || PRICE_RANGES[0]
      newFilters.precio_min = range.min
      newFilters.precio_max = range.max
    }
    setFilters(newFilters)
  }

  const handleToggle = (name) => {
    setFilters(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const handleSearch = useCallback(() => {
    // Build search params
    const searchParams = {}
    if (filters.tipo_operacion) searchParams.tipo_operacion = filters.tipo_operacion
    if (filters.tipo_inmueble) searchParams.tipo_inmueble = filters.tipo_inmueble
    if (filters.departamento) searchParams.departamento = filters.departamento
    if (filters.municipio) searchParams.municipio = filters.municipio
    if (filters.barrio) searchParams.barrio = filters.barrio
    if (filters.precio_min) searchParams.precio_min = filters.precio_min
    if (filters.precio_max) searchParams.precio_max = filters.precio_max
    if (filters.area_min) searchParams.area_min = filters.area_min
    if (filters.area_max) searchParams.area_max = filters.area_max
    if (filters.habitaciones) searchParams.habitaciones = filters.habitaciones
    if (filters.banos) searchParams.banos = filters.banos
    if (filters.parqueaderos) searchParams.parqueaderos = filters.parqueaderos
    if (filters.estrato) searchParams.estrato = filters.estrato
    if (filters.estado_inmueble) searchParams.estado_inmueble = filters.estado_inmueble
    if (filters.balcon) searchParams.balcon = 'true'
    if (filters.ascensor) searchParams.ascensor = 'true'
    if (filters.vigilancia) searchParams.vigilancia = 'true'
    if (filters.piscina) searchParams.piscina = 'true'
    if (filters.gimnasio) searchParams.gimnasio = 'true'
    if (filters.terraza) searchParams.terraza = 'true'
    if (filters.patio) searchParams.patio = 'true'
    if (filters.deposito) searchParams.deposito = 'true'
    if (filters.zona_bbq) searchParams.zona_bbq = 'true'
    if (filters.zona_infantil) searchParams.zona_infantil = 'true'
    if (filters.conjunto_cerrado) searchParams.conjunto_cerrado = 'true'
    if (filters.mascotas) searchParams.mascotas = 'true'
    if (filters.destacadas) searchParams.destacadas = 'true'
    if (filters.dias_publicacion) searchParams.dias_publicacion = filters.dias_publicacion
    if (filters.orden) searchParams.orden = filters.orden

    // Antigüedad → anio_min/anio_max
    if (filters.antiguedad) {
      const currentYear = new Date().getFullYear()
      switch (filters.antiguedad) {
        case 'menos_5': searchParams.anio_min = currentYear - 5; break
        case '5_10': searchParams.anio_min = currentYear - 10; searchParams.anio_max = currentYear - 5; break
        case '10_20': searchParams.anio_min = currentYear - 20; searchParams.anio_max = currentYear - 10; break
        case 'mas_20': searchParams.anio_max = currentYear - 20; break
      }
    }

    onSearch(searchParams)
  }, [filters, onSearch])

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    onSearch({})
  }

  const getActiveFilters = () => {
    const active = []
    if (filters.tipo_operacion) active.push({ key: 'tipo_operacion', label: ENUM_LABELS.tipo_operacion[filters.tipo_operacion] })
    if (filters.tipo_inmueble) active.push({ key: 'tipo_inmueble', label: ENUM_LABELS.tipo_inmueble[filters.tipo_inmueble] })
    if (filters.departamento) active.push({ key: 'departamento', label: filters.departamento })
    if (filters.municipio) active.push({ key: 'municipio', label: filters.municipio })
    if (filters.barrio) active.push({ key: 'barrio', label: filters.barrio })
    if (filters.precio_rango && filters.precio_rango !== '0') active.push({ key: 'precio_rango', label: PRICE_RANGES[parseInt(filters.precio_rango)]?.label })
    if (filters.estrato) active.push({ key: 'estrato', label: `Estrato ${filters.estrato}` })
    if (filters.estado_inmueble) active.push({ key: 'estado_inmueble', label: ENUM_LABELS.estado_inmueble[filters.estado_inmueble] })
    if (filters.habitaciones) active.push({ key: 'habitaciones', label: `${filters.habitaciones}+ Hab` })
    if (filters.banos) active.push({ key: 'banos', label: `${filters.banos}+ Baños` })
    if (filters.parqueaderos) active.push({ key: 'parqueaderos', label: `${filters.parqueaderos}+ Parq` })
    if (filters.balcon) active.push({ key: 'balcon', label: 'Balcón' })
    if (filters.ascensor) active.push({ key: 'ascensor', label: 'Ascensor' })
    if (filters.vigilancia) active.push({ key: 'vigilancia', label: 'Vigilancia' })
    if (filters.piscina) active.push({ key: 'piscina', label: 'Piscina' })
    if (filters.gimnasio) active.push({ key: 'gimnasio', label: 'Gimnasio' })
    if (filters.terraza) active.push({ key: 'terraza', label: 'Terraza' })
    if (filters.patio) active.push({ key: 'patio', label: 'Patio' })
    if (filters.deposito) active.push({ key: 'deposito', label: 'Depósito' })
    if (filters.zona_bbq) active.push({ key: 'zona_bbq', label: 'Zona BBQ' })
    if (filters.zona_infantil) active.push({ key: 'zona_infantil', label: 'Zona Infantil' })
    if (filters.conjunto_cerrado) active.push({ key: 'conjunto_cerrado', label: 'Conjunto Cerrado' })
    if (filters.mascotas) active.push({ key: 'mascotas', label: 'Mascotas' })
    if (filters.dias_publicacion) active.push({ key: 'dias_publicacion', label: `Últimos ${filters.dias_publicacion} días` })
    return active
  }

  const removeFilter = (key) => {
    const newFilters = { ...filters }
    if (typeof newFilters[key] === 'boolean') {
      newFilters[key] = false
    } else {
      newFilters[key] = ''
    }
    if (key === 'precio_rango') {
      newFilters.precio_min = ''
      newFilters.precio_max = ''
    }
    if (key === 'departamento') {
      newFilters.municipio = ''
      newFilters.barrio = ''
    }
    if (key === 'municipio') {
      newFilters.barrio = ''
    }
    setFilters(newFilters)
  }

  const activeFilters = getActiveFilters()
  const advancedCount = activeFilters.length

  return (
    <div className="search-bar-wrapper">
      {/* Main filters row */}
      <div className="search-bar">
        <div className="search-bar__filters">
          <select
            className="search-bar__select"
            value={filters.tipo_operacion}
            onChange={(e) => handleChange('tipo_operacion', e.target.value)}
            aria-label="Tipo de operación"
          >
            <option value="">Operación</option>
            {ENUMS.tipo_operacion.map(t => (
              <option key={t} value={t}>{ENUM_LABELS.tipo_operacion[t]}</option>
            ))}
          </select>

          <select
            className="search-bar__select"
            value={filters.tipo_inmueble}
            onChange={(e) => handleChange('tipo_inmueble', e.target.value)}
            aria-label="Tipo de propiedad"
          >
            <option value="">Tipo</option>
            {ENUMS.tipo_inmueble.map(t => (
              <option key={t} value={t}>{ENUM_LABELS.tipo_inmueble[t]}</option>
            ))}
          </select>

          <select
            className="search-bar__select"
            value={filters.departamento}
            onChange={(e) => handleChange('departamento', e.target.value)}
            aria-label="Departamento"
          >
            <option value="">Departamento</option>
            {ubicaciones.departamentos.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="search-bar__select"
            value={filters.municipio}
            onChange={(e) => handleChange('municipio', e.target.value)}
            aria-label="Municipio"
            disabled={!filters.departamento}
          >
            <option value="">Municipio</option>
            {ubicaciones.municipios.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            className="search-bar__select"
            value={filters.precio_rango}
            onChange={(e) => handleChange('precio_rango', e.target.value)}
            aria-label="Rango de precio"
          >
            {PRICE_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="search-bar__actions">
          <button
            className="search-bar__btn-search"
            onClick={handleSearch}
            disabled={loading}
            aria-label="Buscar propiedades"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Buscar
          </button>

          <button
            className="search-bar__btn-more"
            onClick={() => setDrawerOpen(true)}
            aria-label="Más filtros"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
              <circle cx="8" cy="6" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><circle cx="10" cy="18" r="1.5" fill="currentColor"/>
            </svg>
            Más filtros
            {advancedCount > 0 && <span className="search-bar__badge">{advancedCount}</span>}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="search-bar__chips">
          <span className="search-bar__chips-label">Filtros activos:</span>
          {activeFilters.map(f => (
            <button
              key={f.key}
              className="search-bar__chip"
              onClick={() => removeFilter(f.key)}
              aria-label={`Remover filtro ${f.label}`}
            >
              {f.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          ))}
          <button className="search-bar__chip-clear" onClick={handleReset}>
            Limpiar todo
          </button>
        </div>
      )}

      {/* Advanced Filters Drawer */}
      <AdvancedFiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={handleChange}
        onToggle={handleToggle}
        onSearch={() => { setDrawerOpen(false); handleSearch() }}
        onReset={handleReset}
        ubicaciones={ubicaciones}
      />
    </div>
  )
}

export default PropertySearchBar
