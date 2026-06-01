import { useState, useEffect } from 'react'
import { X, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, ENUMS } from '../../../config/api'

const STEPS = ['Tipo', 'Detalles', 'Ubicacion', 'Caracteristicas']

export default function PropertyEditModal({ property, onClose, onSaved }) {
  if (!property) return null

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [comun, setComun] = useState({
    valor: property.valor || '',
    valor_administracion: property.valor_administracion || '',
    estrato: property.estrato || '',
    descripcion: property.descripcion || '',
    numero_matricula: property.numero_matricula || '',
    codigo_catastral: property.codigo_catastral || '',
    tipo_operacion: property.tipo_operacion || 'venta',
    tipo_inmueble: property.tipo_inmueble || 'casa',
    estado_inmueble: property.estado_inmueble || 'nuevo',
    zona: property.zona || 'urbano',
    acepta_permuta: property.acepta_permuta || false,
  })

  const [ubicacion, setUbicacion] = useState({
    direccion: property.ubicaciones?.direccion || '',
    barrio_vereda: property.ubicaciones?.barrio_vereda || '',
    municipio: property.ubicaciones?.municipio || '',
    departamento: property.ubicaciones?.departamento || '',
  })

  const [caract, setCaract] = useState(property.caracteristicas || {})

  const handleComun = (e) => {
    const { name, value, type, checked } = e.target
    setComun(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleUbicacion = (e) => {
    const { name, value } = e.target
    setUbicacion(prev => ({ ...prev, [name]: value }))
  }

  const handleCaract = (e) => {
    const { name, value, type, checked } = e.target
    setCaract(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value) }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/inmuebles/${property.id_inmueble}`, {
        ...comun,
        valor: parseFloat(comun.valor),
        valor_administracion: comun.valor_administracion ? parseFloat(comun.valor_administracion) : null,
        estrato: parseInt(comun.estrato) || null,
        ubicacion,
        caracteristicas: caract,
      })
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const next = () => setStep(s => Math.min(s + 1, 4))
  const prev = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div className="pdm" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pdm__header">
          <div className="pdm__header-left">
            <h2 className="pdm__title">Editar propiedad #{property.id_inmueble}</h2>
            <p style={{ fontSize: '0.68rem', color: '#888', margin: 0 }}>Modifica los datos de la propiedad</p>
          </div>
          <div className="pdm__header-actions">
            <button className="pdm__close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="pem__steps">
          {STEPS.map((label, i) => (
            <div key={i} className={`pem__step ${step === i + 1 ? 'pem__step--active' : ''} ${step > i + 1 ? 'pem__step--done' : ''}`} onClick={() => setStep(i + 1)}>
              <span className="pem__step-num">{i + 1}</span>
              <span className="pem__step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="pdm__body">
          {error && <p style={{ color: '#CC1E2B', fontSize: '0.72rem', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#FCE8EC', borderRadius: '8px' }}>{error}</p>}

          {/* Step 1: Tipo */}
          {step === 1 && (
            <div className="pem__form-grid">
              <div className="pem__field">
                <label className="pem__label">Tipo de inmueble</label>
                <select className="pem__input" name="tipo_inmueble" value={comun.tipo_inmueble} onChange={handleComun}>
                  {ENUMS.tipo_inmueble.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="pem__field">
                <label className="pem__label">Operacion</label>
                <select className="pem__input" name="tipo_operacion" value={comun.tipo_operacion} onChange={handleComun}>
                  <option value="venta">Venta</option>
                  <option value="arriendo">Arriendo</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Detalles */}
          {step === 2 && (
            <div className="pem__form-grid">
              <div className="pem__field">
                <label className="pem__label">Precio (COP)</label>
                <input className="pem__input" type="number" name="valor" value={comun.valor} onChange={handleComun} />
              </div>
              <div className="pem__field">
                <label className="pem__label">Administracion</label>
                <input className="pem__input" type="number" name="valor_administracion" value={comun.valor_administracion} onChange={handleComun} />
              </div>
              <div className="pem__field">
                <label className="pem__label">Estrato</label>
                <select className="pem__input" name="estrato" value={comun.estrato} onChange={handleComun}>
                  <option value="">No aplica</option>
                  {[1,2,3,4,5,6].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="pem__field">
                <label className="pem__label">Estado</label>
                <select className="pem__input" name="estado_inmueble" value={comun.estado_inmueble} onChange={handleComun}>
                  {ENUMS.estado_inmueble.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="pem__field">
                <label className="pem__label">Zona</label>
                <select className="pem__input" name="zona" value={comun.zona} onChange={handleComun}>
                  <option value="urbano">Urbano</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div className="pem__field">
                <label className="pem__label">Matricula</label>
                <input className="pem__input" type="text" name="numero_matricula" value={comun.numero_matricula} onChange={handleComun} />
              </div>
              <div className="pem__field" style={{ gridColumn: 'span 2' }}>
                <label className="pem__label">Descripcion</label>
                <textarea className="pem__textarea" name="descripcion" value={comun.descripcion} onChange={handleComun} rows="3" />
              </div>
            </div>
          )}

          {/* Step 3: Ubicacion */}
          {step === 3 && (
            <div className="pem__form-grid">
              <div className="pem__field">
                <label className="pem__label">Municipio</label>
                <input className="pem__input" type="text" name="municipio" value={ubicacion.municipio} onChange={handleUbicacion} />
              </div>
              <div className="pem__field">
                <label className="pem__label">Departamento</label>
                <input className="pem__input" type="text" name="departamento" value={ubicacion.departamento} onChange={handleUbicacion} />
              </div>
              <div className="pem__field">
                <label className="pem__label">Barrio / Vereda</label>
                <input className="pem__input" type="text" name="barrio_vereda" value={ubicacion.barrio_vereda} onChange={handleUbicacion} />
              </div>
              <div className="pem__field">
                <label className="pem__label">Direccion</label>
                <input className="pem__input" type="text" name="direccion" value={ubicacion.direccion} onChange={handleUbicacion} />
              </div>
            </div>
          )}

          {/* Step 4: Caracteristicas */}
          {step === 4 && (
            <div>
              <div className="pem__form-grid">
                {caract.area_construida !== undefined && <div className="pem__field"><label className="pem__label">Area construida (m²)</label><input className="pem__input" type="number" name="area_construida" value={caract.area_construida || ''} onChange={handleCaract} /></div>}
                {caract.habitaciones !== undefined && <div className="pem__field"><label className="pem__label">Habitaciones</label><input className="pem__input" type="number" name="habitaciones" value={caract.habitaciones || ''} onChange={handleCaract} /></div>}
                {caract.banos !== undefined && <div className="pem__field"><label className="pem__label">Banos</label><input className="pem__input" type="number" name="banos" value={caract.banos || ''} onChange={handleCaract} /></div>}
                {caract.frente !== undefined && <div className="pem__field"><label className="pem__label">Frente (m)</label><input className="pem__input" type="number" step="0.01" name="frente" value={caract.frente || ''} onChange={handleCaract} /></div>}
                {caract.fondo !== undefined && <div className="pem__field"><label className="pem__label">Fondo (m)</label><input className="pem__input" type="number" step="0.01" name="fondo" value={caract.fondo || ''} onChange={handleCaract} /></div>}
                {caract.piso !== undefined && <div className="pem__field"><label className="pem__label">Piso</label><input className="pem__input" type="number" name="piso" value={caract.piso || ''} onChange={handleCaract} /></div>}
                {caract.torre !== undefined && <div className="pem__field"><label className="pem__label">Torre</label><input className="pem__input" type="number" name="torre" value={caract.torre || ''} onChange={handleCaract} /></div>}
                {caract.pisos !== undefined && <div className="pem__field"><label className="pem__label">Pisos</label><input className="pem__input" type="number" name="pisos" value={caract.pisos || ''} onChange={handleCaract} /></div>}
                {caract.area_total !== undefined && <div className="pem__field"><label className="pem__label">Area total (m²)</label><input className="pem__input" type="number" name="area_total" value={caract.area_total || ''} onChange={handleCaract} /></div>}
              </div>
              {caract.descripcion_acabados !== undefined && (
                <div className="pem__field" style={{ marginTop: '0.75rem' }}>
                  <label className="pem__label">Acabados</label>
                  <textarea className="pem__textarea" name="descripcion_acabados" value={caract.descripcion_acabados || ''} onChange={handleCaract} rows="2" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="pem__footer">
          <button className="admin-btn admin-btn--outline" onClick={step === 1 ? onClose : prev}>
            {step === 1 ? 'Cancelar' : <><ChevronLeft size={12} /> Anterior</>}
          </button>
          {step < 4 ? (
            <button className="admin-btn admin-btn--secondary" onClick={next}>
              Siguiente <ChevronRight size={12} />
            </button>
          ) : (
            <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              <Save size={12} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
