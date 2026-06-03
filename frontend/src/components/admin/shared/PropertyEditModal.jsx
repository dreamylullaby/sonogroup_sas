import { useState, useEffect, useRef } from 'react'
import { X, Save, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Ruler, DoorOpen, Star, ClipboardList } from 'lucide-react'
import { api, ENUMS, ENUM_LABELS } from '../../../config/api'
import { buildInmueblePayload } from '../../../utils/payloadMappers'
import { DEPARTAMENTOS, getMunicipios } from '../../../config/ubicaciones-colombia'

const CURRENT_YEAR = new Date().getFullYear()
const STEPS = ['Tipo', 'Detalles', 'Ubicación', 'Características']

const AMENIDADES_CASA = [
  { key: 'patio', label: 'Patio' }, { key: 'jardin', label: 'Jardín' }, { key: 'antejardin', label: 'Antejardín' },
  { key: 'terraza', label: 'Terraza' }, { key: 'balcon', label: 'Balcón' }, { key: 'zona_lavanderia', label: 'Zona lavandería' },
  { key: 'cocina_equipada', label: 'Cocina equipada' }, { key: 'cuarto_servicio', label: 'Cuarto de servicio' },
  { key: 'bano_servicio', label: 'Baño de servicio' }, { key: 'chimenea', label: 'Chimenea' }, { key: 'deposito', label: 'Depósito' }
]
const AMENIDADES_APTO = [
  { key: 'balcon', label: 'Balcón' }, { key: 'terraza', label: 'Terraza' }, { key: 'zona_lavanderia', label: 'Zona lavandería' },
  { key: 'cocina_equipada', label: 'Cocina equipada' }, { key: 'cuarto_servicio', label: 'Cuarto de servicio' },
  { key: 'bano_servicio', label: 'Baño de servicio' }, { key: 'deposito', label: 'Depósito' },
  { key: 'gimnasio', label: 'Gimnasio' }, { key: 'piscina', label: 'Piscina' }
]

// Maps DB column names to the form field names used by Step4 subcomponents
function mapDbToForm(dbData, tipo) {
  const m = { ...dbData }
  if (tipo === 'casa') {
    if (m.anio_construccion != null) m.ano_construccion = m.anio_construccion
    if (m.parqueadero_cantidad != null) m.parqueaderos = m.parqueadero_cantidad
    // DB antejadin → form uses antejardin (chip key)
    if (m.antejadin != null) m.antejardin = m.antejadin
  }
  if (tipo === 'apartamento') {
    if (m.anio_construccion != null) m.ano_construccion = m.anio_construccion
    if (m.parqueadero_cantidad != null) m.parqueaderos = m.parqueadero_cantidad
    // zonas_comunes is a JSONB array like ["piscina","gimnasio"] — map to individual booleans
    if (m.zonas_comunes) {
      try {
        const zonas = typeof m.zonas_comunes === 'string' ? JSON.parse(m.zonas_comunes) : m.zonas_comunes
        if (Array.isArray(zonas)) {
          zonas.forEach(z => { m[z] = true })
        }
      } catch { /* ignore */ }
    }
  }
  if (tipo === 'apartaestudio') {
    // DB only has area_total and piso, no frente/fondo/area_construida
    // Keep whatever the DB returns as-is
  }
  if (tipo === 'local') {
    // DB: mezzanine → form chip key: mezanine
    if (m.mezzanine != null) m.mezanine = m.mezzanine
    // DB: banos (boolean) → form chip key: bano_privado
    if (m.banos != null) m.bano_privado = m.banos
    // DB: parqueaderos (number > 0) → form chip key: parqueadero
    if (m.parqueaderos != null && m.parqueaderos > 0) m.parqueadero = true
    // DB: vitrina → already matches chip key
    // deposito removed — not in DB for local
  }
  if (tipo === 'bodega') {
    if (m.altura_libre != null) m.altura = m.altura_libre
    // DB: oficinas → form chip key: oficina
    if (m.oficinas != null) m.oficina = m.oficinas
    // DB: banos (boolean) → form chip key: bano
    if (m.banos != null) m.bano = m.banos
    // DB: rampa_cargue → form chip key: muelle_carga
    if (m.rampa_cargue != null) m.muelle_carga = m.rampa_cargue
    // DB: parqueaderos (number > 0) → form chip key: parqueadero
    if (m.parqueaderos != null && m.parqueaderos > 0) m.parqueadero = true
    // vigilancia removed — not in DB for bodega
  }
  if (tipo === 'finca') {
    // Always map area_construcciones to area_construida for the form
    if (m.area_construcciones != null) m.area_construida = m.area_construcciones
    // DB: casa_principal → matches chip key
    // DB: lago_estanque → form chip key: lago
    if (m.lago_estanque != null) m.lago = m.lago_estanque
    // DB: fuentes_agua contains 'rio' → form chip key: rio
    if (m.fuentes_agua && typeof m.fuentes_agua === 'string' && m.fuentes_agua.toLowerCase().includes('rio')) m.rio = true
    // DB: cultivos_actuales → form chip key: cultivos (if non-empty)
    if (m.cultivos_actuales) m.cultivos = true
    // DB: animales → form chip key: ganado (if non-empty)
    if (m.animales) m.ganado = true
    // DB: cabana_mayordomo → form chip key: casa_trabajadores
    if (m.cabana_mayordomo != null) m.casa_trabajadores = m.cabana_mayordomo
    // establo, corral removed — not in DB schema
  }
  if (tipo === 'lote') {
    // DB: pendiente → form chip keys: inclinado / plano
    // null/undefined → neither chip active; false → plano; true → inclinado
    if (m.pendiente === true) {
      m.inclinado = true
    } else if (m.pendiente === false) {
      m.plano = true
    }
    // Remove raw DB field so form state only uses chip keys (plano/inclinado)
    delete m.pendiente
    // DB: topografia → could indicate esquinero
    if (m.topografia === 'esquinero') m.esquinero = true
    // DB: servicios_disponibles (JSONB array) → form chip key: servicios_publicos
    if (m.servicios_disponibles) {
      try {
        const servs = typeof m.servicios_disponibles === 'string' ? JSON.parse(m.servicios_disponibles) : m.servicios_disponibles
        if (Array.isArray(servs) && servs.length > 0) m.servicios_publicos = true
      } catch { /* ignore */ }
    }
    // DB: tiene_documento → form chip key: escrituras
    if (m.tiene_documento != null) m.escrituras = m.tiene_documento
  }
  return m
}

export default function PropertyEditModal({ property, onClose, onSaved }) {
  if (!property) return null

  const formRef = useRef(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [step4ShowErrors, setStep4ShowErrors] = useState(false)

  const [formData, setFormData] = useState({
    valor: property.valor || '',
    valor_administracion: property.valor_administracion != null ? property.valor_administracion : '',
    estrato: property.estrato?.toString() || '3',
    descripcion: property.descripcion || '',
    numero_matricula: property.numero_matricula || '',
    codigo_catastral: property.codigo_catastral || '',
    tipo_operacion: property.tipo_operacion || 'venta',
    tipo_inmueble: property.tipo_inmueble || 'casa',
    estado_inmueble: property.estado_inmueble || 'nuevo',
    zona: property.zona || 'urbano',
    acepta_permuta: property.acepta_permuta || false
  })

  const [ubicacion, setUbicacion] = useState(() => {
    if (property.ubicaciones) return {
      direccion: property.ubicaciones.direccion || '',
      barrio_vereda: property.ubicaciones.barrio_vereda || '',
      municipio: property.ubicaciones.municipio || '',
      departamento: property.ubicaciones.departamento || ''
    }
    return { direccion: '', barrio_vereda: '', municipio: '', departamento: '' }
  })

  const [servicios, setServicios] = useState(() => {
    if (property.servicios) return {
      acueducto: property.servicios.acueducto ?? true,
      energia: property.servicios.energia ?? true,
      alcantarillado: property.servicios.alcantarillado ?? true,
      gas: property.servicios.gas ?? false,
      internet: property.servicios.internet ?? false
    }
    return { acueducto: true, energia: true, alcantarillado: true, gas: false, internet: false }
  })

  const [caract, setCaract] = useState(() => {
    if (property.caracteristicas) {
      const { id_inmueble: _id, ...rest } = property.caracteristicas
      return mapDbToForm(rest, property.tipo_inmueble)
    }
    return {}
  })
  const [loadingData] = useState(false)

  // Reset caract only when user manually changes tipo_inmueble
  const prevTipoRef = useRef(formData.tipo_inmueble)
  useEffect(() => {
    if (prevTipoRef.current === formData.tipo_inmueble) return
    prevTipoRef.current = formData.tipo_inmueble
    setCaract({})
  }, [formData.tipo_inmueble])

  useEffect(() => {
    if (formData.tipo_operacion === 'arriendo') {
      setFormData(prev => ({ ...prev, acepta_permuta: false }))
    }
  }, [formData.tipo_operacion])

  useEffect(() => {
    if (step === 4) { setStep4ShowErrors(false); setErrors({}) }
  }, [step])

  // --- Handlers ---
  const formatPrice = (val) => {
    if (!val && val !== 0) return ''
    const num = String(val).replace(/\D/g, '')
    return num ? `$ ${Number(num).toLocaleString('es-CO')}` : ''
  }

  const handlePriceChange = (name, value) => {
    const num = value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, [name]: num }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleUbicacion = (name, value) => {
    const newUbi = { ...ubicacion, [name]: value }
    if (name === 'departamento') newUbi.municipio = ''
    setUbicacion(newUbi)
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleCaract = (name, value) => {
    setCaract(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const toggleCaract = (name) => setCaract(prev => ({ ...prev, [name]: !prev[name] }))
  const incrementCaract = (name, max = 20) => setCaract(prev => ({ ...prev, [name]: Math.min((parseInt(prev[name]) || 0) + 1, max) }))
  const decrementCaract = (name, min = 0) => setCaract(prev => ({ ...prev, [name]: Math.max((parseInt(prev[name]) || 0) - 1, min) }))
  const toggleServicio = (name) => setServicios(prev => ({ ...prev, [name]: !prev[name] }))

  const calcAreaLote = () => {
    const f = parseFloat(caract.frente) || 0
    const fo = parseFloat(caract.fondo) || 0
    return f > 0 && fo > 0 ? (f * fo).toFixed(2) : null
  }

  // --- Validation ---
  const validateStep = (stepNum, { show = true } = {}) => {
    const newErrors = {}
    switch (stepNum) {
      case 1:
        if (!formData.tipo_inmueble) newErrors.tipo_inmueble = 'Selecciona una opción válida'
        if (!formData.tipo_operacion) newErrors.tipo_operacion = 'Selecciona una opción válida'
        break
      case 2:
        if (!formData.valor || String(formData.valor).trim() === '') {
          newErrors.valor = 'Este campo es obligatorio'
        } else if (Number(formData.valor) < 0) {
          newErrors.valor = 'El precio no puede ser negativo'
        } else if (Number(formData.valor) <= 0) {
          newErrors.valor = 'El precio debe ser mayor a $0'
        } else if (Number(formData.valor) < 200000) {
          newErrors.valor = 'El precio mínimo es $200.000'
        } else if (Number(formData.valor) > 50000000000) {
          newErrors.valor = 'El precio no puede superar $50.000.000.000'
        }
        if (formData.valor_administracion === '' || formData.valor_administracion === null || formData.valor_administracion === undefined) {
          newErrors.valor_administracion = 'Ingresa 0 si no aplica administración'
        } else if (Number(formData.valor_administracion) < 0) {
          newErrors.valor_administracion = 'El valor no puede ser negativo'
        }
        if (!formData.estrato && formData.estrato !== '0') {
          newErrors.estrato = 'Selecciona una opción válida'
        }
        if (!formData.descripcion || formData.descripcion.trim().length === 0) {
          newErrors.descripcion = 'Este campo es obligatorio'
        } else if (formData.descripcion.trim().length < 10) {
          newErrors.descripcion = 'El título debe tener al menos 10 caracteres'
        } else if (formData.descripcion.trim().length > 2000) {
          newErrors.descripcion = 'La descripción no puede superar 2000 caracteres'
        }
        if (!formData.estado_inmueble) newErrors.estado_inmueble = 'Selecciona una opción válida'
        if (!formData.zona) newErrors.zona = 'Selecciona una opción válida'
        if (formData.numero_matricula && formData.numero_matricula.trim() !== '') {
          if (!/^[A-Za-z0-9\-]+$/.test(formData.numero_matricula.trim())) {
            newErrors.numero_matricula = 'Formato inválido. Ej: 070-12345'
          }
        }
        if (formData.codigo_catastral && formData.codigo_catastral.trim() !== '') {
          if (!/^[0-9\-]+$/.test(formData.codigo_catastral.trim())) {
            newErrors.codigo_catastral = 'Formato inválido. Ej: 00-00-0000-0000-000'
          }
        }
        break
      case 3:
        if (!ubicacion.departamento) newErrors.departamento = 'Selecciona el departamento'
        if (!ubicacion.municipio) newErrors.municipio = 'Ingresa el municipio o ciudad'
        if (!ubicacion.barrio_vereda || ubicacion.barrio_vereda.trim().length === 0) {
          newErrors.barrio_vereda = 'Este campo es obligatorio'
        } else if (ubicacion.barrio_vereda.trim().length < 3) {
          newErrors.barrio_vereda = 'El barrio o vereda debe tener al menos 3 caracteres'
        } else if (ubicacion.barrio_vereda.trim().length > 100) {
          newErrors.barrio_vereda = 'El barrio o vereda no puede superar 100 caracteres'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-]+$/.test(ubicacion.barrio_vereda.trim())) {
          newErrors.barrio_vereda = 'El barrio solo puede contener letras, números, espacios y guiones'
        }
        if (!ubicacion.direccion || ubicacion.direccion.trim().length === 0) {
          newErrors.direccion = 'Este campo es obligatorio'
        } else if (ubicacion.direccion.trim().length < 8) {
          newErrors.direccion = 'La dirección debe tener al menos 8 caracteres'
        } else if (ubicacion.direccion.trim().length > 200) {
          newErrors.direccion = 'La dirección no puede superar 200 caracteres'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s#.,\-\/]+$/.test(ubicacion.direccion.trim())) {
          newErrors.direccion = 'La dirección contiene caracteres no permitidos'
        }
        break
      case 4: {
        const tipo = formData.tipo_inmueble
        const validateMustBePositive = (val, field, zeroMsg) => {
          if (val === '' || val === undefined || val === null) {
            newErrors[field] = 'Este campo es obligatorio'
          } else if (Number(val) < 0) {
            newErrors[field] = 'El valor no puede ser negativo'
          } else if (Number(val) === 0) {
            newErrors[field] = zeroMsg || 'El valor debe ser mayor a 0'
          }
        }
        if (['casa', 'apartamento', 'local', 'bodega', 'lote'].includes(tipo)) {
          validateMustBePositive(caract.frente, 'frente', 'El frente debe ser mayor a 0')
        }
        if (['casa', 'apartamento', 'local', 'bodega', 'lote'].includes(tipo)) {
          validateMustBePositive(caract.fondo, 'fondo', 'El fondo debe ser mayor a 0')
        }
        if (['casa', 'apartamento', 'apartaestudio', 'bodega', 'finca'].includes(tipo)) {
          validateMustBePositive(caract.area_construida, 'area_construida', 'El área construida debe ser mayor a 0 m²')
        }
        if (['apartaestudio', 'lote', 'finca', 'local'].includes(tipo)) {
          validateMustBePositive(caract.area_total, 'area_total', 'El área debe ser mayor a 0 m²')
        }
        if (['casa', 'apartamento'].includes(tipo)) {
          if (caract.habitaciones === undefined || caract.habitaciones === '' || caract.habitaciones === null) {
            newErrors.habitaciones = 'Ingresa un número entero de habitaciones'
          } else if (Number(caract.habitaciones) < 0 || !Number.isInteger(Number(caract.habitaciones))) {
            newErrors.habitaciones = 'Ingresa un número entero de habitaciones'
          }
        }
        if (['casa', 'apartamento'].includes(tipo)) {
          if (caract.banos === undefined || caract.banos === '' || caract.banos === null) {
            newErrors.banos = 'Ingresa un número entero de baños'
          } else if (Number(caract.banos) < 0 || !Number.isInteger(Number(caract.banos))) {
            newErrors.banos = 'Ingresa un número entero de baños'
          }
        }
        if (['casa', 'apartamento'].includes(tipo)) {
          const parkVal = caract.parqueaderos
          if (parkVal !== '' && parkVal !== undefined && parkVal !== null) {
            if (Number(parkVal) < 0) {
              newErrors.parqueaderos = 'El número de parqueaderos no puede ser negativo'
            } else if (!Number.isInteger(Number(parkVal))) {
              newErrors.parqueaderos = 'Ingresa un número entero (0, 1, 2...)'
            }
          }
        }
        if (tipo === 'casa') {
          if (caract.pisos === undefined || caract.pisos === '' || caract.pisos === null) {
            newErrors.pisos = 'Este campo es obligatorio'
          } else if (Number(caract.pisos) < 1 || !Number.isInteger(Number(caract.pisos))) {
            newErrors.pisos = 'El número de pisos debe ser 1 o mayor'
          }
        }
        if (['apartamento', 'apartaestudio'].includes(tipo)) {
          if (caract.piso === undefined || caract.piso === '' || caract.piso === null) {
            newErrors.piso = 'Este campo es obligatorio'
          } else if (Number(caract.piso) < 1 || !Number.isInteger(Number(caract.piso))) {
            newErrors.piso = 'El piso debe ser 1 o mayor'
          }
        }
        if (['casa', 'apartamento'].includes(tipo)) {
          if (caract.ano_construccion === undefined || caract.ano_construccion === '' || caract.ano_construccion === null) {
            newErrors.ano_construccion = 'Este campo es obligatorio'
          } else {
            const anio = parseInt(caract.ano_construccion)
            if (isNaN(anio) || anio < 1900 || anio > CURRENT_YEAR) {
              newErrors.ano_construccion = `Debe estar entre 1900 y ${CURRENT_YEAR}`
            }
          }
        }
        if (tipo === 'casa') {
          validateMustBePositive(caract.cantidad_duenos, 'cantidad_duenos', 'Debe haber al menos 1 dueño o propietario')
        }
        if (tipo === 'bodega') {
          validateMustBePositive(caract.altura, 'altura', 'La altura debe ser mayor a 0')
        }
        break
      }
    }
    if (show) {
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) {
        setTimeout(() => {
          const el = formRef.current?.querySelector('.pem__input--error, .pem__textarea--error')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  // --- Navigation ---
  const next = () => {
    const result = validateStep(step, { show: true })
    if (result.isValid) {
      setErrors({})
      setStep4ShowErrors(false)
      setStep(s => Math.min(s + 1, 4))
    }
  }

  const prev = () => {
    setErrors({})
    setStep4ShowErrors(false)
    setStep(s => Math.max(s - 1, 1))
  }

  const handleSave = async () => {
    setStep4ShowErrors(true)
    const result = validateStep(4, { show: true })
    if (!result.isValid) return

    setSaving(true)
    setErrors({})
    try {
      const payload = buildInmueblePayload({ ...formData }, ubicacion, servicios, caract)
      await api.put(`/api/inmuebles/${property.id_inmueble}`, payload)
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Error al guardar los cambios' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div className="pdm" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()} ref={formRef}>
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
          {errors.general && <p style={{ color: '#CC1E2B', fontSize: '0.72rem', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#FCE8EC', borderRadius: '8px' }}>{errors.general}</p>}
          {loadingData && step === 4 && <p style={{ fontSize: '0.72rem', color: '#888', textAlign: 'center', padding: '2rem 0' }}>Cargando características...</p>}

          {/* Step 1: Tipo */}
          {step === 1 && (
            <div className="pem__form-grid">
              <div className="pem__field">
                <label className="pem__label">Tipo de inmueble <span style={{ color: '#CC1E2B' }}>*</span></label>
                <select className={`pem__input ${errors.tipo_inmueble ? 'pem__input--error' : ''}`} value={formData.tipo_inmueble} onChange={(e) => handleChange('tipo_inmueble', e.target.value)}>
                  {ENUMS.tipo_inmueble.map(t => <option key={t} value={t}>{ENUM_LABELS.tipo_inmueble[t]}</option>)}
                </select>
                {errors.tipo_inmueble && <span className="pem__error"><AlertCircle size={11} /> {errors.tipo_inmueble}</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Tipo de operación <span style={{ color: '#CC1E2B' }}>*</span></label>
                <select className={`pem__input ${errors.tipo_operacion ? 'pem__input--error' : ''}`} value={formData.tipo_operacion} onChange={(e) => handleChange('tipo_operacion', e.target.value)}>
                  {ENUMS.tipo_operacion.map(t => <option key={t} value={t}>{ENUM_LABELS.tipo_operacion[t]}</option>)}
                </select>
                {errors.tipo_operacion && <span className="pem__error"><AlertCircle size={11} /> {errors.tipo_operacion}</span>}
              </div>
            </div>
          )}

          {/* Step 2: Detalles */}
          {step === 2 && (
            <div className="pem__form-grid">
              <div className="pem__field" style={{ gridColumn: 'span 2' }}>
                <label className="pem__label">Precio (COP) <span style={{ color: '#CC1E2B' }}>*</span></label>
                <input className={`pem__input ${errors.valor ? 'pem__input--error' : ''}`} type="text" placeholder="$ 0" value={formatPrice(formData.valor)} onChange={(e) => handlePriceChange('valor', e.target.value)} />
                {errors.valor && <span className="pem__error"><AlertCircle size={11} /> {errors.valor}</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Administración (COP) <span style={{ color: '#CC1E2B' }}>*</span></label>
                <input className={`pem__input ${errors.valor_administracion ? 'pem__input--error' : ''}`} type="text" placeholder="$ 0" value={formatPrice(formData.valor_administracion)} onChange={(e) => handlePriceChange('valor_administracion', e.target.value)} />
                {errors.valor_administracion && <span className="pem__error"><AlertCircle size={11} /> {errors.valor_administracion}</span>}
                {!errors.valor_administracion && <span className="pem__hint">Ingresa 0 si no aplica</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Estrato <span style={{ color: '#CC1E2B' }}>*</span></label>
                <select className={`pem__input ${errors.estrato ? 'pem__input--error' : ''}`} value={formData.estrato} onChange={(e) => handleChange('estrato', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {[1, 2, 3, 4, 5, 6].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                {errors.estrato && <span className="pem__error"><AlertCircle size={11} /> {errors.estrato}</span>}
              </div>
              <div className="pem__field" style={{ gridColumn: 'span 2' }}>
                <label className="pem__label">Descripción / Título <span style={{ color: '#CC1E2B' }}>*</span></label>
                <textarea className={`pem__textarea ${errors.descripcion ? 'pem__textarea--error' : ''}`} placeholder="Describe la propiedad (mínimo 10 caracteres)..." value={formData.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} rows={3} maxLength={2000} />
                {errors.descripcion && <span className="pem__error"><AlertCircle size={11} /> {errors.descripcion}</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Estado <span style={{ color: '#CC1E2B' }}>*</span></label>
                <select className={`pem__input ${errors.estado_inmueble ? 'pem__input--error' : ''}`} value={formData.estado_inmueble} onChange={(e) => handleChange('estado_inmueble', e.target.value)}>
                  {ENUMS.estado_inmueble.map(e => <option key={e} value={e}>{ENUM_LABELS.estado_inmueble[e]}</option>)}
                </select>
                {errors.estado_inmueble && <span className="pem__error"><AlertCircle size={11} /> {errors.estado_inmueble}</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Zona <span style={{ color: '#CC1E2B' }}>*</span></label>
                <select className={`pem__input ${errors.zona ? 'pem__input--error' : ''}`} value={formData.zona} onChange={(e) => handleChange('zona', e.target.value)}>
                  {ENUMS.zona_tipo.map(z => <option key={z} value={z}>{ENUM_LABELS.zona_tipo[z]}</option>)}
                </select>
                {errors.zona && <span className="pem__error"><AlertCircle size={11} /> {errors.zona}</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Matrícula ORIP <span style={{ color: '#888', fontSize: '0.65rem' }}>(Opcional)</span></label>
                <input className={`pem__input ${errors.numero_matricula ? 'pem__input--error' : ''}`} type="text" placeholder="Número de registro" value={formData.numero_matricula} onChange={(e) => handleChange('numero_matricula', e.target.value)} />
                {errors.numero_matricula && <span className="pem__error"><AlertCircle size={11} /> {errors.numero_matricula}</span>}
              </div>
              <div className="pem__field">
                <label className="pem__label">Código catastral <span style={{ color: '#888', fontSize: '0.65rem' }}>(Opcional)</span></label>
                <input className={`pem__input ${errors.codigo_catastral ? 'pem__input--error' : ''}`} type="text" placeholder="Ficha predial" value={formData.codigo_catastral} onChange={(e) => handleChange('codigo_catastral', e.target.value)} />
                {errors.codigo_catastral && <span className="pem__error"><AlertCircle size={11} /> {errors.codigo_catastral}</span>}
              </div>
              {formData.tipo_operacion !== 'arriendo' && (
                <div className="pem__field" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!formData.acepta_permuta} onChange={(e) => handleCheckboxChange('acepta_permuta', e.target.checked)} />
                    <span>¿Acepta permuta?</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Ubicación */}
          {step === 3 && (
            <div>
              <div className="pem__form-grid">
                <div className="pem__field">
                  <label className="pem__label">Departamento <span style={{ color: '#CC1E2B' }}>*</span></label>
                  <select className={`pem__input ${errors.departamento ? 'pem__input--error' : ''}`} value={ubicacion.departamento} onChange={(e) => handleUbicacion('departamento', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.departamento && <span className="pem__error"><AlertCircle size={11} /> {errors.departamento}</span>}
                </div>
                <div className="pem__field">
                  <label className="pem__label">Municipio / Ciudad <span style={{ color: '#CC1E2B' }}>*</span></label>
                  <select className={`pem__input ${errors.municipio ? 'pem__input--error' : ''}`} value={ubicacion.municipio} onChange={(e) => handleUbicacion('municipio', e.target.value)} disabled={!ubicacion.departamento}>
                    <option value="">Seleccionar...</option>
                    {getMunicipios(ubicacion.departamento).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errors.municipio && <span className="pem__error"><AlertCircle size={11} /> {errors.municipio}</span>}
                </div>
                <div className="pem__field">
                  <label className="pem__label">Barrio / Vereda <span style={{ color: '#CC1E2B' }}>*</span></label>
                  <input className={`pem__input ${errors.barrio_vereda ? 'pem__input--error' : ''}`} type="text" placeholder="Ej: El Poblado" value={ubicacion.barrio_vereda} onChange={(e) => handleUbicacion('barrio_vereda', e.target.value)} />
                  {errors.barrio_vereda && <span className="pem__error"><AlertCircle size={11} /> {errors.barrio_vereda}</span>}
                </div>
                <div className="pem__field">
                  <label className="pem__label">Dirección <span style={{ color: '#CC1E2B' }}>*</span></label>
                  <input className={`pem__input ${errors.direccion ? 'pem__input--error' : ''}`} type="text" placeholder="Ej: Calle 123 #45-67" value={ubicacion.direccion} onChange={(e) => handleUbicacion('direccion', e.target.value)} />
                  {errors.direccion && <span className="pem__error"><AlertCircle size={11} /> {errors.direccion}</span>}
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label className="pem__label" style={{ marginBottom: '0.5rem', display: 'block' }}>Servicios públicos</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {Object.entries(servicios).map(([key, val]) => (
                    <div key={key} onClick={() => toggleServicio(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.68rem', cursor: 'pointer', border: val ? '1px solid #4CAF50' : '1px solid #ddd', background: val ? '#E8F5E9' : '#fafafa', color: val ? '#2E7D32' : '#666' }}>
                      {val ? <CheckCircle size={11} /> : <span style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid currentColor', display: 'inline-block' }}></span>}
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Características */}
          {step === 4 && !loadingData && (
            <ModalStep4
              key={`step4-${formData.tipo_inmueble}`}
              tipo={formData.tipo_inmueble}
              caract={caract}
              onCaractChange={handleCaract}
              onToggle={toggleCaract}
              onIncrement={incrementCaract}
              onDecrement={decrementCaract}
              calcAreaLote={calcAreaLote}
              errors={errors}
              showErrors={step4ShowErrors}
            />
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


/* --- MODAL STEP 4 --- */
function ModalStep4({ tipo, caract, onCaractChange, onToggle, onIncrement, onDecrement, calcAreaLote, errors, showErrors }) {
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (!showErrors) setTouched({})
  }, [showErrors, tipo])

  const handleBlur = (name) => setTouched(prev => ({ ...prev, [name]: true }))

  const visibleErrors = {}
  for (const key of Object.keys(errors || {})) {
    if (showErrors || touched[key]) visibleErrors[key] = errors[key]
  }

  switch (tipo) {
    case 'casa': return <ModalCasaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} onInc={onIncrement} onDec={onDecrement} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'apartamento': return <ModalApartamentoForm caract={caract} onChange={onCaractChange} onToggle={onToggle} onInc={onIncrement} onDec={onDecrement} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'apartaestudio': return <ModalApartaestudioForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'local': return <ModalLocalForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'bodega': return <ModalBodegaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'finca': return <ModalFincaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} errors={visibleErrors} onBlur={handleBlur} />
    case 'lote': return <ModalLoteForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    default: return <p style={{ fontSize: '0.72rem', color: '#888' }}>Tipo no soportado</p>
  }
}

/* --- SHARED --- */
function ModalCounter({ label, value, onInc, onDec, min = 0, max = 20, required }) {
  const val = parseInt(value) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0' }}>
      <span style={{ fontSize: '0.72rem', color: '#333' }}>{label} {required && <span style={{ color: '#CC1E2B' }}>*</span>}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button type="button" onClick={onDec} disabled={val <= min} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #ddd', background: '#fafafa', cursor: val <= min ? 'not-allowed' : 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
        <span style={{ minWidth: 28, textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>{val}</span>
        <button type="button" onClick={onInc} disabled={val >= max} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #ddd', background: '#fafafa', cursor: val >= max ? 'not-allowed' : 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>
    </div>
  )
}

function ModalDimensionCalc({ caract, onChange, calcArea, showAreaConstruida = true, errors, onBlur }) {
  const areaLote = calcArea()
  const areaConstruida = parseFloat(caract.area_construida) || 0
  const showWarning = showAreaConstruida && areaLote && areaConstruida > parseFloat(areaLote)
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <>
      <div className="pem__form-grid">
        <div className="pem__field">
          <label className="pem__label">Frente (m) <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.frente ? 'pem__input--error' : ''}`} type="number" step="0.1" min="1" placeholder="0.0" value={caract.frente || ''} onChange={(e) => onChange('frente', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('frente')} />
          {errors?.frente && <span className="pem__error"><AlertCircle size={11} /> {errors.frente}</span>}
        </div>
        <div className="pem__field">
          <label className="pem__label">Fondo (m) <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.fondo ? 'pem__input--error' : ''}`} type="number" step="0.1" min="1" placeholder="0.0" value={caract.fondo || ''} onChange={(e) => onChange('fondo', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('fondo')} />
          {errors?.fondo && <span className="pem__error"><AlertCircle size={11} /> {errors.fondo}</span>}
        </div>
      </div>
      {areaLote && <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f0f9f0', borderRadius: '8px', margin: '0.5rem 0' }}><span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2E7D32' }}>{areaLote} m²</span><br /><span style={{ fontSize: '0.62rem', color: '#666' }}>Área lote calculada</span></div>}
      {showAreaConstruida && (
        <div className="pem__field">
          <label className="pem__label">Área construida (m²) <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.area_construida ? 'pem__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_construida || ''} onChange={(e) => onChange('area_construida', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_construida')} />
          {errors?.area_construida && <span className="pem__error"><AlertCircle size={11} /> {errors.area_construida}</span>}
          {showWarning && !errors?.area_construida && <span style={{ fontSize: '0.65rem', color: '#E65100' }}><AlertCircle size={11} /> Área construida supera el área del lote</span>}
        </div>
      )}
    </>
  )
}

function ModalChipsGrid({ items, caract, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {items.map(item => (
        <div key={item.key} onClick={() => onToggle(item.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.68rem', cursor: 'pointer', border: caract[item.key] ? '1px solid #4CAF50' : '1px solid #ddd', background: caract[item.key] ? '#E8F5E9' : '#fafafa', color: caract[item.key] ? '#2E7D32' : '#666' }}>
          {caract[item.key] ? <CheckCircle size={10} /> : null}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* --- FORM SUBCOMPONENTS PER TYPE --- */
function ModalCasaForm({ caract, onChange, onToggle, onInc, onDec, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones y área</p>
      <ModalDimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
      <div className="pem__form-grid" style={{ marginTop: '0.5rem' }}>
        <div className="pem__field">
          <label className="pem__label">Año de construcción <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.ano_construccion ? 'pem__input--error' : ''}`} type="number" min="1900" max={CURRENT_YEAR} placeholder="Ej: 2015" value={caract.ano_construccion || ''} onChange={(e) => onChange('ano_construccion', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('ano_construccion')} />
          {errors?.ano_construccion && <span className="pem__error"><AlertCircle size={11} /> {errors.ano_construccion}</span>}
        </div>
        <div className="pem__field">
          <label className="pem__label">Cantidad de dueños <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.cantidad_duenos ? 'pem__input--error' : ''}`} type="number" min="1" placeholder="1" value={caract.cantidad_duenos || ''} onChange={(e) => onChange('cantidad_duenos', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('cantidad_duenos')} />
          {errors?.cantidad_duenos && <span className="pem__error"><AlertCircle size={11} /> {errors.cantidad_duenos}</span>}
        </div>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <ModalCounter label="Número de pisos" value={caract.pisos} onInc={() => onInc('pisos', 50)} onDec={() => onDec('pisos', 1)} min={1} max={50} required />
        {errors?.pisos && <span className="pem__error"><AlertCircle size={11} /> {errors.pisos}</span>}
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><DoorOpen size={13} /> Espacios</p>
      <ModalCounter label="Habitaciones" value={caract.habitaciones} onInc={() => onInc('habitaciones')} onDec={() => onDec('habitaciones')} required />
      <ModalCounter label="Baños" value={caract.banos} onInc={() => onInc('banos')} onDec={() => onDec('banos')} required />
      <ModalCounter label="Parqueaderos" value={caract.parqueaderos} onInc={() => onInc('parqueaderos', 10)} onDec={() => onDec('parqueaderos')} required />
      {errors?.habitaciones && <span className="pem__error"><AlertCircle size={11} /> {errors.habitaciones}</span>}
      {errors?.banos && <span className="pem__error"><AlertCircle size={11} /> {errors.banos}</span>}
      {errors?.parqueaderos && <span className="pem__error"><AlertCircle size={11} /> {errors.parqueaderos}</span>}
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Amenidades</p>
      <ModalChipsGrid items={AMENIDADES_CASA} caract={caract} onToggle={onToggle} />
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><ClipboardList size={13} /> Características adicionales</p>
      <div className="pem__form-grid">
        <div className="pem__field">
          <label className="pem__label">Sala / Comedor</label>
          <select className="pem__input" value={caract.sala_comedor || ''} onChange={(e) => onChange('sala_comedor', e.target.value || null)}>
            <option value="">No aplica</option><option value="sala">Sala</option><option value="comedor">Comedor</option><option value="sala_comedor">Sala-Comedor</option><option value="separados">Separados</option>
          </select>
        </div>
        <div className="pem__field">
          <label className="pem__label">Tipo de cocina</label>
          <select className="pem__input" value={caract.tipo_cocina || ''} onChange={(e) => onChange('tipo_cocina', e.target.value || null)}>
            <option value="">No aplica</option><option value="integral">Integral</option><option value="semi_integral">Semi-integral</option><option value="sencilla">Sencilla</option>
          </select>
        </div>
        <div className="pem__field">
          <label className="pem__label">Zona lavandería</label>
          <select className="pem__input" value={caract.zona_lavanderia_tipo || ''} onChange={(e) => { onChange('zona_lavanderia_tipo', e.target.value || null); if (e.target.value) onToggle('zona_lavanderia') }}>
            <option value="">No tiene</option><option value="interna">Interna</option><option value="externa">Externa</option>
          </select>
        </div>
        <div className="pem__field">
          <label className="pem__label">Tipo parqueadero</label>
          <select className="pem__input" value={caract.tipo_parqueadero || ''} onChange={(e) => onChange('tipo_parqueadero', e.target.value || null)}>
            <option value="">Ninguno</option><option value="interno">Interno</option><option value="externo">Externo</option><option value="cubierto">Cubierto</option><option value="descubierto">Descubierto</option>
          </select>
        </div>
      </div>
      <div className="pem__field" style={{ marginTop: '0.5rem' }}>
        <label className="pem__label">Descripción de acabados</label>
        <textarea className="pem__textarea" rows={3} placeholder="Pisos en porcelanato, cocina en granito..." value={caract.descripcion_acabados || ''} onChange={(e) => onChange('descripcion_acabados', e.target.value)} />
      </div>
    </div>
  )
}

function ModalApartamentoForm({ caract, onChange, onToggle, onInc, onDec, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones y área</p>
      <ModalDimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
      <div className="pem__form-grid" style={{ marginTop: '0.5rem' }}>
        <div className="pem__field">
          <label className="pem__label">Piso del apartamento <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.piso ? 'pem__input--error' : ''}`} type="number" min="1" placeholder="Ej: 5" value={caract.piso || ''} onChange={(e) => onChange('piso', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('piso')} />
          {errors?.piso && <span className="pem__error"><AlertCircle size={11} /> {errors.piso}</span>}
        </div>
        <div className="pem__field">
          <label className="pem__label">Año de construcción <span style={{ color: '#CC1E2B' }}>*</span></label>
          <input className={`pem__input ${errors?.ano_construccion ? 'pem__input--error' : ''}`} type="number" min="1900" max={CURRENT_YEAR} placeholder="Ej: 2018" value={caract.ano_construccion || ''} onChange={(e) => onChange('ano_construccion', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('ano_construccion')} />
          {errors?.ano_construccion && <span className="pem__error"><AlertCircle size={11} /> {errors.ano_construccion}</span>}
        </div>
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><DoorOpen size={13} /> Espacios</p>
      <ModalCounter label="Habitaciones" value={caract.habitaciones} onInc={() => onInc('habitaciones')} onDec={() => onDec('habitaciones')} required />
      <ModalCounter label="Baños" value={caract.banos} onInc={() => onInc('banos')} onDec={() => onDec('banos')} required />
      <ModalCounter label="Parqueaderos" value={caract.parqueaderos} onInc={() => onInc('parqueaderos', 10)} onDec={() => onDec('parqueaderos')} required />
      {errors?.habitaciones && <span className="pem__error"><AlertCircle size={11} /> {errors.habitaciones}</span>}
      {errors?.banos && <span className="pem__error"><AlertCircle size={11} /> {errors.banos}</span>}
      {errors?.parqueaderos && <span className="pem__error"><AlertCircle size={11} /> {errors.parqueaderos}</span>}
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Amenidades</p>
      <ModalChipsGrid items={AMENIDADES_APTO} caract={caract} onToggle={onToggle} />
    </div>
  )
}

function ModalApartaestudioForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones y área</p>
      <div className="pem__field">
        <label className="pem__label">Área total (m²) <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.area_total ? 'pem__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
        {errors?.area_total && <span className="pem__error"><AlertCircle size={11} /> {errors.area_total}</span>}
      </div>
      <div className="pem__field" style={{ marginTop: '0.5rem' }}>
        <label className="pem__label">Piso <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.piso ? 'pem__input--error' : ''}`} type="number" min="1" placeholder="Ej: 3" value={caract.piso || ''} onChange={(e) => onChange('piso', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('piso')} />
        {errors?.piso && <span className="pem__error"><AlertCircle size={11} /> {errors.piso}</span>}
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Amenidades</p>
      <ModalChipsGrid items={[{ key: 'balcon', label: 'Balcón' }, { key: 'zona_lavanderia', label: 'Zona lavandería' }, { key: 'cocina_equipada', label: 'Cocina equipada' }, { key: 'deposito', label: 'Depósito' }]} caract={caract} onToggle={onToggle} />
    </div>
  )
}

function ModalLocalForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones y área</p>
      <ModalDimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} showAreaConstruida={false} errors={errors} onBlur={onBlur} />
      <div className="pem__field" style={{ marginTop: '0.5rem' }}>
        <label className="pem__label">Área total (m²) <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.area_total ? 'pem__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
        {errors?.area_total && <span className="pem__error"><AlertCircle size={11} /> {errors.area_total}</span>}
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Características</p>
      <ModalChipsGrid items={[{ key: 'bano_privado', label: 'Baño privado' }, { key: 'mezanine', label: 'Mezanine' }, { key: 'vitrina', label: 'Vitrina' }, { key: 'parqueadero', label: 'Parqueadero' }]} caract={caract} onToggle={onToggle} />
    </div>
  )
}

function ModalBodegaForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones y área</p>
      <ModalDimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
      <div className="pem__field" style={{ marginTop: '0.5rem' }}>
        <label className="pem__label">Altura (m) <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.altura ? 'pem__input--error' : ''}`} type="number" step="0.1" min="1" placeholder="0.0" value={caract.altura || ''} onChange={(e) => onChange('altura', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('altura')} />
        {errors?.altura && <span className="pem__error"><AlertCircle size={11} /> {errors.altura}</span>}
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Características</p>
      <ModalChipsGrid items={[{ key: 'oficina', label: 'Oficina' }, { key: 'bano', label: 'Baño' }, { key: 'muelle_carga', label: 'Muelle de carga' }, { key: 'parqueadero', label: 'Parqueadero' }]} caract={caract} onToggle={onToggle} />
    </div>
  )
}

function ModalFincaForm({ caract, onChange, onToggle, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  const val = (v) => (v != null && v !== '') ? v : ''
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones</p>
      <div className="pem__field">
        <label className="pem__label">Área total (m² o hectáreas) <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.area_total ? 'pem__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={val(caract.area_total)} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
        {errors?.area_total && <span className="pem__error"><AlertCircle size={11} /> {errors.area_total}</span>}
      </div>
      <div className="pem__field" style={{ marginTop: '0.5rem' }}>
        <label className="pem__label">Área construida (m²) <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.area_construida ? 'pem__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={val(caract.area_construida)} onChange={(e) => onChange('area_construida', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_construida')} />
        {errors?.area_construida && <span className="pem__error"><AlertCircle size={11} /> {errors.area_construida}</span>}
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Características</p>
      <ModalChipsGrid items={[{ key: 'piscina', label: 'Piscina' }, { key: 'lago', label: 'Lago' }, { key: 'rio', label: 'Río' }, { key: 'cultivos', label: 'Cultivos' }, { key: 'ganado', label: 'Ganado' }, { key: 'casa_principal', label: 'Casa principal' }, { key: 'casa_trabajadores', label: 'Casa trabajadores' }]} caract={caract} onToggle={onToggle} />
    </div>
  )
}

function ModalLoteForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div>
      <p className="pem__section-title"><Ruler size={13} /> Dimensiones y área</p>
      <ModalDimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} showAreaConstruida={false} errors={errors} onBlur={onBlur} />
      <div className="pem__field" style={{ marginTop: '0.5rem' }}>
        <label className="pem__label">Área total (m²) <span style={{ color: '#CC1E2B' }}>*</span></label>
        <input className={`pem__input ${errors?.area_total ? 'pem__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
        {errors?.area_total && <span className="pem__error"><AlertCircle size={11} /> {errors.area_total}</span>}
      </div>
      <p className="pem__section-title" style={{ marginTop: '1rem' }}><Star size={13} /> Características del terreno</p>
      <ModalChipsGrid items={[{ key: 'esquinero', label: 'Esquinero' }, { key: 'plano', label: 'Plano' }, { key: 'inclinado', label: 'Inclinado' }, { key: 'servicios_publicos', label: 'Servicios públicos' }, { key: 'escrituras', label: 'Escrituras' }]} caract={caract} onToggle={onToggle} />
    </div>
  )
}
