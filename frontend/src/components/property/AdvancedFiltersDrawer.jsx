import { useEffect, useRef } from 'react'
import { ENUMS, ENUM_LABELS } from '../../config/api'
import { DEPARTAMENTOS, getMunicipios } from '../../config/ubicaciones-colombia'
import '../../styles/components/AdvancedFiltersDrawer.css'

const DISTRIBUTION_OPTIONS = ['', '1', '2', '3', '4']
const ESTRATO_OPTIONS = [1, 2, 3, 4, 5, 6]

const CARACTERISTICAS = [
  { key: 'balcon', label: 'Balcón' },
  { key: 'ascensor', label: 'Ascensor' },
  { key: 'vigilancia', label: 'Vigilancia' },
  { key: 'piscina', label: 'Piscina' },
  { key: 'gimnasio', label: 'Gimnasio' },
  { key: 'terraza', label: 'Terraza' },
  { key: 'patio', label: 'Patio' },
  { key: 'deposito', label: 'Depósito' },
  { key: 'zona_bbq', label: 'Zona BBQ' },
  { key: 'zona_infantil', label: 'Zona Infantil' },
  { key: 'conjunto_cerrado', label: 'Conjunto Cerrado' },
  { key: 'mascotas', label: 'Mascotas Permitidas' }
]

const AdvancedFiltersDrawer = ({
  open,
  onClose,
  filters,
  onChange,
  onToggle,
  onSearch,
  onReset,
  ubicaciones
}) => {
  const drawerRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    return new Intl.NumberFormat('es-CO').format(value)
  }

  const handlePriceInput = (name, value) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    onChange(name, numericValue)
  }

  if (!open) return null

  return (
    <div className="drawer-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Filtros avanzados">
      <div className="drawer" ref={drawerRef}>
        <div className="drawer__header">
          <h2 className="drawer__title">Filtros Avanzados</h2>
          <button className="drawer__close" onClick={onClose} aria-label="Cerrar filtros">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="drawer__body">
          {/* PRECIO */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Precio</h3>
            <div className="drawer__row">
              <div className="drawer__field">
                <label>Desde (COP)</label>
                <input
                  type="text"
                  placeholder="$ 0"
                  value={filters.precio_min ? `$ ${formatCurrency(filters.precio_min)}` : ''}
                  onChange={(e) => handlePriceInput('precio_min', e.target.value)}
                />
              </div>
              <div className="drawer__field">
                <label>Hasta (COP)</label>
                <input
                  type="text"
                  placeholder="$ Sin límite"
                  value={filters.precio_max ? `$ ${formatCurrency(filters.precio_max)}` : ''}
                  onChange={(e) => handlePriceInput('precio_max', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* UBICACIÓN */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Ubicación</h3>
            <div className="drawer__field">
              <label>Departamento</label>
              <select value={filters.departamento} onChange={(e) => onChange('departamento', e.target.value)}>
                <option value="">Todos</option>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="drawer__field">
              <label>Municipio</label>
              <select value={filters.municipio} onChange={(e) => onChange('municipio', e.target.value)} disabled={!filters.departamento}>
                <option value="">Todos</option>
                {getMunicipios(filters.departamento).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="drawer__field">
              <label>Barrio</label>
              <select value={filters.barrio} onChange={(e) => onChange('barrio', e.target.value)} disabled={!filters.municipio}>
                <option value="">Todos</option>
                {ubicaciones.barrios.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </section>

          {/* ÁREA */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Área (m²)</h3>
            <div className="drawer__row">
              <div className="drawer__field">
                <label>Mínima</label>
                <input type="number" placeholder="0" min="0" value={filters.area_min} onChange={(e) => onChange('area_min', e.target.value)} />
              </div>
              <div className="drawer__field">
                <label>Máxima</label>
                <input type="number" placeholder="Sin límite" min="0" value={filters.area_max} onChange={(e) => onChange('area_max', e.target.value)} />
              </div>
            </div>
          </section>

          {/* DISTRIBUCIÓN */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Distribución</h3>
            <div className="drawer__field">
              <label>Habitaciones</label>
              <div className="drawer__btn-group">
                {DISTRIBUTION_OPTIONS.map(opt => (
                  <button
                    key={`hab-${opt}`}
                    className={`drawer__btn-option ${filters.habitaciones === opt ? 'active' : ''}`}
                    onClick={() => onChange('habitaciones', opt)}
                  >
                    {opt === '' ? 'Cualquiera' : `${opt}+`}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer__field">
              <label>Baños</label>
              <div className="drawer__btn-group">
                {DISTRIBUTION_OPTIONS.map(opt => (
                  <button
                    key={`ban-${opt}`}
                    className={`drawer__btn-option ${filters.banos === opt ? 'active' : ''}`}
                    onClick={() => onChange('banos', opt)}
                  >
                    {opt === '' ? 'Cualquiera' : `${opt}+`}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer__field">
              <label>Parqueaderos</label>
              <div className="drawer__btn-group">
                {DISTRIBUTION_OPTIONS.map(opt => (
                  <button
                    key={`parq-${opt}`}
                    className={`drawer__btn-option ${filters.parqueaderos === opt ? 'active' : ''}`}
                    onClick={() => onChange('parqueaderos', opt)}
                  >
                    {opt === '' ? 'Cualquiera' : `${opt}+`}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* CARACTERÍSTICAS */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Características</h3>
            <div className="drawer__checkboxes">
              {CARACTERISTICAS.map(c => (
                <label key={c.key} className={`drawer__checkbox ${filters[c.key] ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filters[c.key]}
                    onChange={() => onToggle(c.key)}
                  />
                  <span className="drawer__checkbox-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/>{filters[c.key] && <path d="M9 12l2 2 4-4"/>}</svg>
                  </span>
                  <span className="drawer__checkbox-label">{c.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* CONDICIONES */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Condiciones</h3>
            <div className="drawer__field">
              <label>Estrato</label>
              <div className="drawer__btn-group">
                <button
                  className={`drawer__btn-option ${filters.estrato === '' ? 'active' : ''}`}
                  onClick={() => onChange('estrato', '')}
                >
                  Todos
                </button>
                {ESTRATO_OPTIONS.map(e => (
                  <button
                    key={e}
                    className={`drawer__btn-option ${filters.estrato === String(e) ? 'active' : ''}`}
                    onClick={() => onChange('estrato', String(e))}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer__field">
              <label>Estado del inmueble</label>
              <div className="drawer__btn-group">
                <button
                  className={`drawer__btn-option ${filters.estado_inmueble === '' ? 'active' : ''}`}
                  onClick={() => onChange('estado_inmueble', '')}
                >
                  Todos
                </button>
                {ENUMS.estado_inmueble.map(e => (
                  <button
                    key={e}
                    className={`drawer__btn-option ${filters.estado_inmueble === e ? 'active' : ''}`}
                    onClick={() => onChange('estado_inmueble', e)}
                  >
                    {ENUM_LABELS.estado_inmueble[e]}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer__field">
              <label>Antigüedad</label>
              <select value={filters.antiguedad} onChange={(e) => onChange('antiguedad', e.target.value)}>
                <option value="">Cualquiera</option>
                <option value="menos_5">Menos de 5 años</option>
                <option value="5_10">5 - 10 años</option>
                <option value="10_20">10 - 20 años</option>
                <option value="mas_20">Más de 20 años</option>
              </select>
            </div>
          </section>

          {/* PUBLICACIÓN */}
          <section className="drawer__section">
            <h3 className="drawer__section-title">Publicación</h3>
            <div className="drawer__field">
              <label>Publicadas recientemente</label>
              <div className="drawer__btn-group">
                <button
                  className={`drawer__btn-option ${filters.dias_publicacion === '' ? 'active' : ''}`}
                  onClick={() => onChange('dias_publicacion', '')}
                >
                  Todas
                </button>
                <button
                  className={`drawer__btn-option ${filters.dias_publicacion === '7' ? 'active' : ''}`}
                  onClick={() => onChange('dias_publicacion', '7')}
                >
                  7 días
                </button>
                <button
                  className={`drawer__btn-option ${filters.dias_publicacion === '15' ? 'active' : ''}`}
                  onClick={() => onChange('dias_publicacion', '15')}
                >
                  15 días
                </button>
                <button
                  className={`drawer__btn-option ${filters.dias_publicacion === '30' ? 'active' : ''}`}
                  onClick={() => onChange('dias_publicacion', '30')}
                >
                  30 días
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="drawer__footer">
          <button className="drawer__btn-reset" onClick={onReset}>Limpiar todo</button>
          <button className="drawer__btn-apply" onClick={onSearch}>Aplicar filtros</button>
        </div>
      </div>
    </div>
  )
}

export default AdvancedFiltersDrawer
