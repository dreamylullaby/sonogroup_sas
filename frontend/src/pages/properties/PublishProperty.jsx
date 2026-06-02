import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError, ENUMS, ENUM_LABELS } from '../../config/api'
import { buildInmueblePayload } from '../../utils/payloadMappers'
import { validators } from '../../utils/validation'
import FieldWrapper, { getInputClassName } from '../../components/ui/FieldWrapper'
import StepErrorBanner from '../../components/ui/StepErrorBanner'
import CountryAutocomplete from '../../components/ui/CountryAutocomplete'
import { useFormValidation } from '../../hooks/useFormValidation'
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat'
import { DEPARTAMENTOS, getMunicipios } from '../../config/ubicaciones-colombia'
import {
  Home, DollarSign, MapPin, Zap, Ruler, DoorOpen, Star, ClipboardList,
  X, Save, ArrowLeft, ArrowRight, Send, CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react'
import '../../styles/pages/PublishProperty.css'

const CURRENT_YEAR = new Date().getFullYear()

const PublishProperty = ({ editMode = false, propertyId = null }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(editMode)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [toast, setToast] = useState(null)
  const totalSteps = 4

  const [formDataComun, setFormDataComun] = useState({
    valor: '', valor_administracion: '', estrato: '', descripcion: '',
  const [formData, setFormData] = useState({
    valor: '', valor_administracion: '', estrato: '3', descripcion: '',
    numero_matricula: '', codigo_catastral: '',
    tipo_operacion: 'venta', tipo_inmueble: 'casa', estado_inmueble: 'nuevo',
    zona: 'urbano'
  })

  const [ubicacion, setUbicacion] = useState({
    direccion: '', barrio_vereda: '', municipio: '', departamento: ''
  })

  const [servicios, setServicios] = useState({
    acueducto: true, energia: true, alcantarillado: true, gas: false, internet: false
  })

  const [caract, setCaract] = useState({})

  useEffect(() => {
    if (editMode && propertyId) loadPropertyData()
    else loadDraft()
  }, [editMode, propertyId])

  const loadDraft = async () => {
    try {
      // Intentar cargar desde servidor
      const response = await api.get('/api/borradores')
      const borradores = response.data?.borradores
      if (borradores && borradores.length > 0) {
        const draft = borradores[0].datos
        if (draft.formData) setFormData(draft.formData)
        if (draft.ubicacion) setUbicacion(draft.ubicacion)
        if (draft.servicios) setServicios(draft.servicios)
        if (draft.caract) setCaract(draft.caract)
        if (draft.currentStep) setCurrentStep(draft.currentStep)
        return
      }
    } catch {
      // Fallback a localStorage si falla la API
      try {
        const saved = localStorage.getItem('property_draft')
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.formData) setFormData(draft.formData)
          if (draft.ubicacion) setUbicacion(draft.ubicacion)
          if (draft.servicios) setServicios(draft.servicios)
          if (draft.caract) setCaract(draft.caract)
          if (draft.currentStep) setCurrentStep(draft.currentStep)
        }
      } catch { /* ignore */ }
    }
  }

  useEffect(() => {
    if (!editMode) setCaract({})
  }, [formData.tipo_inmueble, editMode])

  const loadPropertyData = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/api/inmuebles/${propertyId}`)
      const property = response.data

      setFormDataComun({
        valor: property.valor || '',
        valor_administracion: (property.valor_administracion != null) ? String(property.valor_administracion) : '',
        estrato: property.estrato ? property.estrato.toString() : 'no_aplica',
        descripcion: property.descripcion || '',
        numero_matricula: property.numero_matricula || '',
        codigo_catastral: property.codigo_catastral || '',
        tipo_operacion: property.tipo_operacion || 'venta',
        tipo_inmueble: property.tipo_inmueble || 'casa',
        estado_inmueble: property.estado_inmueble || 'nuevo',
        zona: property.zona || 'urbano',
        acepta_permuta: property.acepta_permuta || false
      const p = response.data
      setFormData({
        valor: p.valor || '', valor_administracion: p.valor_administracion || '',
        estrato: p.estrato?.toString() || '3', descripcion: p.descripcion || '',
        numero_matricula: p.numero_matricula || '', codigo_catastral: p.codigo_catastral || '',
        tipo_operacion: p.tipo_operacion || 'venta', tipo_inmueble: p.tipo_inmueble || 'casa',
        estado_inmueble: p.estado_inmueble || 'nuevo', zona: p.zona || 'urbano'
      })
      if (p.ubicaciones) {
        setUbicacion({
          direccion: p.ubicaciones.direccion || '', barrio_vereda: p.ubicaciones.barrio_vereda || '',
          municipio: p.ubicaciones.municipio || '', departamento: p.ubicaciones.departamento || ''
        })
      }
      if (p.caracteristicas) {
        const { id_inmueble, ...rest } = p.caracteristicas
        setCaract(rest)
      }
    } catch (err) {
      setErrors({ general: parseApiError(err) })
    } finally {
      setLoadingData(false)
    }
  }

  const formatPrice = (val) => {
    if (!val) return ''
    const num = String(val).replace(/\D/g, '')
    return num ? `$ ${Number(num).toLocaleString('es-CO')}` : ''
  }

  // Resetear acepta_permuta cuando tipo_operacion cambia a arriendo
  useEffect(() => {
    if (formDataComun.tipo_operacion === 'arriendo') {
      setFormDataComun(prev => ({ ...prev, acepta_permuta: false }))
    }
  }, [formDataComun.tipo_operacion])

  const handleCommonChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormDataComun(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  const handlePriceChange = (name, value) => {
    const num = value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, [name]: num }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
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

  const validateStep = (step) => {
    const newErrors = {}
    switch (step) {
      case 1:
        if (!formData.tipo_inmueble) newErrors.tipo_inmueble = 'Selecciona un tipo'
        if (!formData.tipo_operacion) newErrors.tipo_operacion = 'Selecciona una operacion'
        break
      case 2:
        if (!formData.valor || parseInt(formData.valor) <= 0) newErrors.valor = 'Ingresa un precio valido'
        if (formData.descripcion && formData.descripcion.trim().length > 0 && formData.descripcion.trim().length < 10)
          newErrors.descripcion = 'Minimo 10 caracteres'
        break
      case 3:
        if (!ubicacion.departamento) newErrors.departamento = 'Selecciona un departamento'
        if (!ubicacion.municipio) newErrors.municipio = 'Selecciona un municipio'
        break
      case 4:
        const tipo = formData.tipo_inmueble
        if (['casa', 'apartamento'].includes(tipo)) {
          if (!caract.habitaciones && caract.habitaciones !== 0) newErrors.habitaciones = 'Requerido'
          if (!caract.banos && caract.banos !== 0) newErrors.banos = 'Requerido'
        }
        if (['apartaestudio', 'lote', 'finca', 'local'].includes(tipo)) {
          if (!caract.area_total) newErrors.area_total = 'Requerido'
        }
        if (['bodega'].includes(tipo)) {
          if (!caract.area_construida) newErrors.area_construida = 'Requerido'
          if (!caract.frente) newErrors.frente = 'Requerido'
          if (!caract.fondo) newErrors.fondo = 'Requerido'
        }
        // Validar año de construcción si fue ingresado
        if (caract.ano_construccion) {
          const anio = parseInt(caract.ano_construccion)
          if (anio < 1900 || anio > CURRENT_YEAR) newErrors.ano_construccion = `Debe estar entre 1900 y ${CURRENT_YEAR}`
        }
        break
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const el = formRef.current?.querySelector('.field__input--error, .field__select--error')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return false
    }
    return true
  }

  const nextStep = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, totalSteps)) }
  const prevStep = () => { setErrors({}); setCurrentStep(prev => Math.max(prev - 1, 1)) }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validateStep(4)) return
    setSuccess('')
    setLoading(true)

    // Validaciones
    const valorErr = validators.valor(formDataComun.valor)
    if (valorErr) { setError(valorErr); setLoading(false); return }

    if (!ubicacion.municipio || ubicacion.municipio.trim().length < 3) {
      setError('El municipio es requerido (mínimo 3 caracteres)'); setLoading(false); return
    }
    if (!ubicacion.barrio_vereda || ubicacion.barrio_vereda.trim().length < 3) {
      setError('El barrio/vereda es requerido (mínimo 3 caracteres)'); setLoading(false); return
    }
    if (!ubicacion.direccion || ubicacion.direccion.trim().length < 8) {
      setError('La dirección es requerida (mínimo 8 caracteres)'); setLoading(false); return
    }

    const descErr = validators.descripcion(formDataComun.descripcion)
    if (descErr) { setError(descErr); setLoading(false); return }

    // Validar campos requeridos de características
    const camposActuales = camposPorTipo[formDataComun.tipo_inmueble] || []
    const camposRequeridos = camposActuales.filter(c => c.required)
    for (const campo of camposRequeridos) {
      if (!caracteristicasEspecificas[campo.name] && caracteristicasEspecificas[campo.name] !== 0) {
        setError(`Campo requerido: ${campo.label}`)
        setLoading(false)
        return
      }
    }

    try {
      const payload = buildInmueblePayload({ ...formData, acepta_permuta: false }, ubicacion, servicios, caract)
      if (editMode && propertyId) {
        await api.put(`/api/inmuebles/${propertyId}`, payload)
        setSuccess('Propiedad actualizada exitosamente')
        setTimeout(() => navigate('/'), 1500)
      } else if (user.rol === 'admin') {
        await api.post('/api/inmuebles-admin', payload)
        setSuccess('Propiedad publicada exitosamente')
        localStorage.removeItem('property_draft')
        try { const r = await api.get('/api/borradores'); if (r.data?.borradores?.[0]) await api.delete(`/api/borradores/${r.data.borradores[0].id_borrador}`) } catch {}
        setTimeout(() => navigate('/admin'), 1500)
      } else {
        await api.post('/api/inmuebles', payload)
        setSuccess('Propiedad enviada para revision')
        localStorage.removeItem('property_draft')
        try { const r = await api.get('/api/borradores'); if (r.data?.borradores?.[0]) await api.delete(`/api/borradores/${r.data.borradores[0].id_borrador}`) } catch {}
        setTimeout(() => navigate('/mis-propiedades'), 1500)
      }
    } catch (err) {
      setErrors({ general: parseApiError(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const datos = { formData, ubicacion, servicios, caract, currentStep }
      const titulo = formData.tipo_inmueble ? `${formData.tipo_inmueble} - ${ubicacion.municipio || 'Sin ubicación'}` : null
      const response = await api.post('/api/borradores', { datos, paso_actual: currentStep, titulo })
      localStorage.setItem('property_draft', JSON.stringify({ ...datos, savedAt: new Date().toISOString() }))
      // Diferenciar si se creó nuevo o se reemplazó el anterior
      const msg = response.status === 201
        ? 'Borrador guardado correctamente'
        : 'Borrador anterior reemplazado con los datos actuales'
      setToast({ type: 'success', message: msg })
    } catch (err) {
      const codigo = err.response?.data?.codigo
      if (codigo === 'BORRADOR_DUPLICADO') {
        setToast({ type: 'info', message: 'Ya tienes este borrador guardado. No se creó uno nuevo.' })
      } else if (codigo === 'LIMITE_ALCANZADO') {
        setToast({ type: 'error', message: err.response.data.error })
      } else {
        // Fallback a localStorage
        const draft = { formData, ubicacion, servicios, caract, currentStep, savedAt: new Date().toISOString() }
        localStorage.setItem('property_draft', JSON.stringify(draft))
        setToast({ type: 'success', message: 'Borrador guardado localmente' })
      }
    }
    setTimeout(() => setToast(null), 4000)
  }

  const camposActuales = camposPorTipo[formDataComun.tipo_inmueble] || []

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formDataComun.tipo_inmueble || !formDataComun.tipo_operacion) {
          setError('Selecciona tipo de inmueble y operación'); return false
        }
        break
      case 2:
        if (!formDataComun.valor || parseFloat(formDataComun.valor) <= 0) {
          setError('Ingresa un precio válido'); return false
        }
        if (formDataComun.descripcion && formDataComun.descripcion.trim().length > 0 && formDataComun.descripcion.trim().length < 10) {
          setError('La descripción debe tener al menos 10 caracteres'); return false
        }
        break
      case 3:
        if (!ubicacion.municipio || ubicacion.municipio.trim().length < 3) { setError('El municipio es requerido (mínimo 3 caracteres)'); return false }
        if (!ubicacion.barrio_vereda || ubicacion.barrio_vereda.trim().length < 3) { setError('El barrio/vereda es requerido (mínimo 3 caracteres)'); return false }
        if (!ubicacion.direccion || ubicacion.direccion.trim().length < 8) { setError('La dirección es requerida (mínimo 8 caracteres)'); return false }
        if (!ubicacion.departamento) { setError('El país es requerido'); return false }
        break
      case 4:
        const requeridos = camposActuales.filter(c => c.required)
        for (const campo of requeridos) {
          if (!caracteristicasEspecificas[campo.name] && caracteristicasEspecificas[campo.name] !== 0) {
            setError(`Campo requerido: ${campo.label}`); return false
          }
        }
        break
  const handleSaveDraftAndExit = async () => {
    try {
      const datos = { formData, ubicacion, servicios, caract, currentStep }
      const titulo = formData.tipo_inmueble ? `${formData.tipo_inmueble} - ${ubicacion.municipio || 'Sin ubicación'}` : null
      await api.post('/api/borradores', { datos, paso_actual: currentStep, titulo })
    } catch (err) {
      const codigo = err.response?.data?.codigo
      if (codigo === 'BORRADOR_DUPLICADO') {
        // Ya existe, no hacer nada extra
      } else if (codigo === 'LIMITE_ALCANZADO') {
        setToast({ type: 'error', message: err.response.data.error })
        setShowCancelModal(false)
        setTimeout(() => setToast(null), 4000)
        return // No salir, mostrar el error
      } else {
        const draft = { formData, ubicacion, servicios, caract, currentStep, savedAt: new Date().toISOString() }
        localStorage.setItem('property_draft', JSON.stringify(draft))
      }
    }
    setShowCancelModal(false)
    navigate('/')
  }

  const handleExitWithoutSaving = async () => {
    localStorage.removeItem('property_draft')
    // Intentar eliminar borrador del servidor
    try {
      const response = await api.get('/api/borradores')
      const borradores = response.data?.borradores
      if (borradores && borradores.length > 0) {
        await api.delete(`/api/borradores/${borradores[0].id_borrador}`)
      }
    } catch { /* ignore */ }
    setShowCancelModal(false)
    navigate('/')
  }

  if (!user) { navigate('/login'); return null }
  if (loadingData) return <div className="publish-property-page"><div className="publish-container" style={{padding:'60px',textAlign:'center',color:'#5A4864'}}>Cargando...</div></div>

  return (
    <div className="publish-property-page">
      <div className="publish-container">
        <div className="publish-header">
          <h1>{editMode ? 'Editar Propiedad' : 'Publicar Propiedad'}</h1>
          <p>{editMode ? 'Modifica los datos de tu inmueble' : user?.rol === 'admin' ? 'Publicacion directa como administrador' : 'Completa el formulario para enviar a revision'}</p>
        </div>

        <Stepper currentStep={currentStep} />

          {/* PASO 2: DETALLES */}
          {currentStep === 2 && (
            <div className="form-section step-content">
              <h3>Detalles Básicos</h3>
              <p className="text-sm text-slate-400 italic mb-4">Los campos con * son obligatorios</p>
              <StepErrorBanner errorCount={stepErrorCount} />
              <FieldWrapper
                label="Precio (COP)"
                name="valor"
                required
                error={getFieldState('valor').error}
                touched={getFieldState('valor').touched}
              >
                <input
                  type="text"
                  id="valor"
                  name="valor"
                  placeholder="Ej: 250000000"
                  value={currencyValor.displayValue}
                  onChange={currencyValor.handleChange}
                  onFocus={currencyValor.handleFocus}
                  onBlur={() => { currencyValor.handleBlur(); validationHandleBlur('valor') }}
                  disabled={loading}
                  className={getInputClassName(getFieldState('valor').touched, getFieldState('valor').error)}
                />
              </FieldWrapper>
              <div className="form-row">
                <FieldWrapper
                  label="Valor Administración (COP)"
                  name="valor_administracion"
                  required
                  error={getFieldState('valor_administracion').error}
                  touched={getFieldState('valor_administracion').touched}
                >
                  <input
                    type="text"
                    id="valor_administracion"
                    name="valor_administracion"
                    placeholder="Ej: 350000"
                    value={currencyValorAdmin.displayValue}
                    onChange={currencyValorAdmin.handleChange}
                    onFocus={currencyValorAdmin.handleFocus}
                    onBlur={() => { currencyValorAdmin.handleBlur(); validationHandleBlur('valor_administracion') }}
                    disabled={loading}
                    className={getInputClassName(getFieldState('valor_administracion').touched, getFieldState('valor_administracion').error)}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Estrato"
                  name="estrato"
                  required
                  error={getFieldState('estrato').error}
                  touched={getFieldState('estrato').touched}
                >
                  <select
                    id="estrato"
                    name="estrato"
                    value={formDataComun.estrato}
                    onChange={handleCommonChange}
                    onBlur={() => validationHandleBlur('estrato')}
                    disabled={loading}
                    className={getInputClassName(getFieldState('estrato').touched, getFieldState('estrato').error)}
                  >
                    <option value="" disabled>-- Seleccionar --</option>
                    <option value="no_aplica">No aplica</option>
                    {[1, 2, 3, 4, 5, 6].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </FieldWrapper>
              </div>
              <FieldWrapper
                label="Título de la publicación"
                name="descripcion"
                required
                error={getFieldState('descripcion').error}
                touched={getFieldState('descripcion').touched}
              >
                <textarea
                  id="descripcion"
                  name="descripcion"
                  placeholder="Escribe el titulo para la publicación de la propiedad (mínimo 10 caracteres)"
                  value={formDataComun.descripcion}
                  onChange={handleCommonChange}
                  onBlur={() => validationHandleBlur('descripcion')}
                  disabled={loading}
                  rows="4"
                  className={getInputClassName(getFieldState('descripcion').touched, getFieldState('descripcion').error)}
                />
              </FieldWrapper>
              <div className="form-row">
                <FieldWrapper
                  label="Estado"
                  name="estado_inmueble"
                  required
                  error={getFieldState('estado_inmueble').error}
                  touched={getFieldState('estado_inmueble').touched}
                >
                  <select
                    id="estado_inmueble"
                    name="estado_inmueble"
                    value={formDataComun.estado_inmueble}
                    onChange={handleCommonChange}
                    onBlur={() => validationHandleBlur('estado_inmueble')}
                    disabled={loading}
                    className={getInputClassName(getFieldState('estado_inmueble').touched, getFieldState('estado_inmueble').error)}
                  >
                    {ENUMS.estado_inmueble.map(e => (
                      <option key={e} value={e}>{ENUM_LABELS.estado_inmueble[e]}</option>
                    ))}
                  </select>
                </FieldWrapper>
                <FieldWrapper
                  label="Zona"
                  name="zona"
                  required
                  error={getFieldState('zona').error}
                  touched={getFieldState('zona').touched}
                >
                  <select
                    id="zona"
                    name="zona"
                    value={formDataComun.zona}
                    onChange={handleCommonChange}
                    onBlur={() => validationHandleBlur('zona')}
                    disabled={loading}
                    className={getInputClassName(getFieldState('zona').touched, getFieldState('zona').error)}
                  >
                    {ENUMS.zona_tipo.map(z => (
                      <option key={z} value={z}>{ENUM_LABELS.zona_tipo[z]}</option>
                    ))}
                  </select>
                </FieldWrapper>
              </div>
              <div className="registral-section">
                <div className="registral-section__header">
                  <h4>Datos registrales del inmueble</h4>
                  <span className="registral-section__help">
                    Opcional. Recomendado para venta, no indispensable para arriendo.
                  </span>
                </div>
                <div className="form-row">
                  <FieldWrapper
                    label="Número de matrícula inmobiliaria"
                    name="numero_matricula"
                    error={getFieldState('numero_matricula').error}
                    touched={getFieldState('numero_matricula').touched}
                  >
                    <input
                      type="text"
                      id="numero_matricula"
                      name="numero_matricula"
                      placeholder="Ej: 050-123456"
                      value={formDataComun.numero_matricula}
                      onChange={handleCommonChange}
                      onBlur={() => validationHandleBlur('numero_matricula')}
                      disabled={loading}
                      className={getInputClassName(getFieldState('numero_matricula').touched, getFieldState('numero_matricula').error)}
                    />
                  </FieldWrapper>
                  <FieldWrapper
                    label="Código catastral"
                    name="codigo_catastral"
                    error={getFieldState('codigo_catastral').error}
                    touched={getFieldState('codigo_catastral').touched}
                  >
                    <input
                      type="text"
                      id="codigo_catastral"
                      name="codigo_catastral"
                      placeholder="Ej: 01-02-0003-0045-000"
                      value={formDataComun.codigo_catastral}
                      onChange={handleCommonChange}
                      onBlur={() => validationHandleBlur('codigo_catastral')}
                      disabled={loading}
                      className={getInputClassName(getFieldState('codigo_catastral').touched, getFieldState('codigo_catastral').error)}
                    />
                  </FieldWrapper>
                </div>
              </div>

              {formDataComun.tipo_operacion !== 'arriendo' && (
                <div className="permuta-section">
                  <label className="feature-checkbox permuta-checkbox">
                    <input
                      type="checkbox"
                      name="acepta_permuta"
                      checked={!!formDataComun.acepta_permuta}
                      onChange={handleCommonChange}
                      disabled={loading}
                    />
                    <div className="permuta-label-group">
                      <span>¿Acepta permuta?</span>
                      <small>Indica si considerarías un intercambio parcial o total del inmueble.</small>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: UBICACIÓN */}
          {currentStep === 3 && (
            <div className="form-section step-content">
              <h3>Ubicación</h3>
              <p className="text-sm text-slate-400 italic mb-4">Los campos con * son obligatorios</p>
              <StepErrorBanner errorCount={stepErrorCount} />
              <div className="form-row">
                <FieldWrapper
                  label="Municipio/Ciudad"
                  name="municipio"
                  required
                  error={getFieldState('municipio').error}
                  touched={getFieldState('municipio').touched}
                >
                  <input
                    type="text"
                    id="municipio"
                    name="municipio"
                    placeholder="Ej: Medellín, Pasto, Cali"
                    value={ubicacion.municipio}
                    onChange={handleUbicacionChange}
                    onBlur={() => validationHandleBlur('municipio')}
                    disabled={loading}
                    required
                    className={getInputClassName(getFieldState('municipio').touched, getFieldState('municipio').error)}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="País"
                  name="departamento"
                  required
                  error={getFieldState('departamento').error}
                  touched={getFieldState('departamento').touched}
                >
                  <CountryAutocomplete
                    id="departamento"
                    name="departamento"
                    value={ubicacion.departamento}
                    onChange={(country) => setUbicacion(prev => ({ ...prev, departamento: country }))}
                    onBlur={() => validationHandleBlur('departamento')}
                    disabled={loading}
                    touched={getFieldState('departamento').touched}
                    error={getFieldState('departamento').error}
                  />
                </FieldWrapper>
              </div>
              <div className="form-row">
                <FieldWrapper
                  label="Barrio/Vereda"
                  name="barrio_vereda"
                  required
                  error={getFieldState('barrio_vereda').error}
                  touched={getFieldState('barrio_vereda').touched}
                >
                  <input
                    type="text"
                    id="barrio_vereda"
                    name="barrio_vereda"
                    placeholder="Ej: El Poblado, Ciudad 2000, Sector 3"
                    value={ubicacion.barrio_vereda}
                    onChange={handleUbicacionChange}
                    onBlur={() => validationHandleBlur('barrio_vereda')}
                    disabled={loading}
                    required
                    className={getInputClassName(getFieldState('barrio_vereda').touched, getFieldState('barrio_vereda').error)}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Dirección"
                  name="direccion"
                  required
                  error={getFieldState('direccion').error}
                  touched={getFieldState('direccion').touched}
                >
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    placeholder="Ej: Calle 18 # 24-56, Cra 32A No. 15-40"
                    value={ubicacion.direccion}
                    onChange={handleUbicacionChange}
                    onBlur={() => validationHandleBlur('direccion')}
                    disabled={loading}
                    required
                    className={getInputClassName(getFieldState('direccion').touched, getFieldState('direccion').error)}
                  />
                </FieldWrapper>
              </div>
        <form onSubmit={handleSubmit} className="publish-form" noValidate ref={formRef}>
          {success && <div className="success-message">{success}</div>}
          {errors.general && <div className="field__error" style={{marginBottom:12}}><AlertCircle size={12} /> {errors.general}</div>}

          {currentStep === 1 && <Step1 formData={formData} onChange={handleChange} errors={errors} loading={loading} />}
          {currentStep === 2 && <Step2 formData={formData} onChange={handleChange} onPriceChange={handlePriceChange} formatPrice={formatPrice} errors={errors} loading={loading} />}
          {currentStep === 3 && <Step3 ubicacion={ubicacion} onUbicacionChange={handleUbicacion} servicios={servicios} onToggleServicio={toggleServicio} errors={errors} loading={loading} />}
          {currentStep === 4 && <Step4 tipo={formData.tipo_inmueble} caract={caract} onCaractChange={handleCaract} onToggle={toggleCaract} onIncrement={incrementCaract} onDecrement={decrementCaract} calcAreaLote={calcAreaLote} errors={errors} loading={loading} />}

          <div className="form-action-bar">
            <div className="action-bar-left">
              <button type="button" className="btn-cancel-pub" onClick={() => setShowCancelModal(true)} disabled={loading}>
                <X size={12} /> Cancelar
              </button>
              {currentStep > 1 && !editMode && (
                <button type="button" className="btn-save-draft" onClick={handleSaveDraft} disabled={loading}>
                  <Save size={12} /> Guardar borrador
                </button>
              )}
            </div>
            <div className="action-bar-divider"></div>
            <div className="action-bar-right">
              {currentStep > 1 && (
                <button type="button" className="btn-prev" onClick={prevStep} disabled={loading}>
                  <ArrowLeft size={12} /> Anterior
                </button>
              )}
              {currentStep < totalSteps ? (
                <button type="button" className="btn-next" onClick={nextStep} disabled={loading}>
                  Siguiente <ArrowRight size={12} />
                </button>
              ) : (
                <button type="submit" className="btn-next" disabled={loading}>
                  {loading ? 'Procesando...' : editMode ? 'Actualizar' : 'Publicar propiedad'} <Send size={12} />
                </button>
              )}
            </div>
          </div>

          {!editMode && user?.rol !== 'admin' && (
            <div className="form-note"><p>Tu propiedad sera revisada por un administrador antes de ser publicada.</p></div>
          )}
        </form>
      </div>

      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.message}
        </div>
      )}

      {showCancelModal && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal">
            <div className="cancel-modal__icon"><AlertTriangle size={22} /></div>
            <h3 className="cancel-modal__title">Cancelar publicacion?</h3>
            <p className="cancel-modal__desc">Si cancelas ahora perderas todo el progreso no guardado. Puedes guardar un borrador antes de salir para continuar mas tarde.</p>
            <div className="cancel-modal__actions">
              <button className="cancel-modal__btn-draft" onClick={handleSaveDraftAndExit}>
                <Save size={12} /> Guardar borrador y salir
              </button>
              <button className="cancel-modal__btn-exit" onClick={handleExitWithoutSaving}>
                <X size={12} /> Salir sin guardar
              </button>
              <button className="cancel-modal__btn-continue" onClick={() => setShowCancelModal(false)}>
                Continuar editando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublishProperty


/* --- STEPPER --- */
function Stepper({ currentStep }) {
  const steps = [
    { num: 1, label: 'Tipo' },
    { num: 2, label: 'Detalles' },
    { num: 3, label: 'Ubicacion' },
    { num: 4, label: 'Caracteristicas' }
  ]
  const getState = (num) => num < currentStep ? 'completed' : num === currentStep ? 'active' : 'pending'

  return (
    <div className="stepper">
      <div className="stepper__steps">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div className={`stepper__step stepper__step--${getState(step.num)}`}>
              <div className="stepper__circle">
                {getState(step.num) === 'completed' ? <CheckCircle size={14} /> : step.num}
              </div>
              <span className="stepper__label">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`stepper__line ${currentStep > step.num ? 'stepper__line--completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="stepper__progress">
        <div className="stepper__progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
      </div>
    </div>
  )
}

/* --- STEP 1: TIPO --- */
function Step1({ formData, onChange, errors, loading }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Home size={16} /></span>
          <h3 className="form-card__title">Tipo de inmueble y operacion</h3>
        </div>
        <div className="field">
          <label className="field__label">Tipo de inmueble <span className="field__required">*</span></label>
          <select className={`field__select ${errors.tipo_inmueble ? 'field__select--error' : ''}`}
            value={formData.tipo_inmueble} onChange={(e) => onChange('tipo_inmueble', e.target.value)} disabled={loading}>
            {ENUMS.tipo_inmueble.map(t => <option key={t} value={t}>{ENUM_LABELS.tipo_inmueble[t]}</option>)}
          </select>
          {errors.tipo_inmueble && <span className="field__error"><AlertCircle size={11} /> {errors.tipo_inmueble}</span>}
        </div>
        <div className="field">
          <label className="field__label">Tipo de operacion <span className="field__required">*</span></label>
          <select className={`field__select ${errors.tipo_operacion ? 'field__select--error' : ''}`}
            value={formData.tipo_operacion} onChange={(e) => onChange('tipo_operacion', e.target.value)} disabled={loading}>
            {ENUMS.tipo_operacion.map(t => <option key={t} value={t}>{ENUM_LABELS.tipo_operacion[t]}</option>)}
          </select>
          {errors.tipo_operacion && <span className="field__error"><AlertCircle size={11} /> {errors.tipo_operacion}</span>}
        </div>
      </div>
    </div>
  )
}

/* --- STEP 2: DETALLES --- */
function Step2({ formData, onChange, onPriceChange, formatPrice, errors, loading }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><DollarSign size={16} /></span>
          <h3 className="form-card__title">Detalles basicos</h3>
        </div>
        <div className="field">
          <label className="field__label">Precio (COP) <span className="field__required">*</span></label>
          <input className={`field__input ${errors.valor ? 'field__input--error' : ''}`}
            type="text" placeholder="$ 0" value={formatPrice(formData.valor)}
            onChange={(e) => onPriceChange('valor', e.target.value)} disabled={loading} />
          {errors.valor && <span className="field__error"><AlertCircle size={11} /> {errors.valor}</span>}
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Administracion (COP)</label>
            <input className="field__input" type="text" placeholder="$ 0"
              value={formatPrice(formData.valor_administracion)}
              onChange={(e) => onPriceChange('valor_administracion', e.target.value)} disabled={loading} />
          </div>
          <div className="field">
            <label className="field__label">Estrato</label>
            <select className="field__select" value={formData.estrato} onChange={(e) => onChange('estrato', e.target.value)} disabled={loading}>
              <option value="">No aplica</option>
              {[1,2,3,4,5,6].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field__label">Descripcion</label>
          <textarea className={`field__textarea ${errors.descripcion ? 'field__input--error' : ''}`}
            placeholder="Describe la propiedad..." value={formData.descripcion}
            onChange={(e) => onChange('descripcion', e.target.value)} disabled={loading} rows={3} />
          {errors.descripcion && <span className="field__error"><AlertCircle size={11} /> {errors.descripcion}</span>}
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Estado</label>
            <select className="field__select" value={formData.estado_inmueble} onChange={(e) => onChange('estado_inmueble', e.target.value)} disabled={loading}>
              {ENUMS.estado_inmueble.map(e => <option key={e} value={e}>{ENUM_LABELS.estado_inmueble[e]}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Zona</label>
            <select className="field__select" value={formData.zona} onChange={(e) => onChange('zona', e.target.value)} disabled={loading}>
              {ENUMS.zona_tipo.map(z => <option key={z} value={z}>{ENUM_LABELS.zona_tipo[z]}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Matricula ORIP <span className="field__optional">(Opcional)</span></label>
            <input className="field__input" type="text" placeholder="Numero de registro"
              value={formData.numero_matricula} onChange={(e) => onChange('numero_matricula', e.target.value)} disabled={loading} />
            <span className="field__hint">Registro en la Oficina de Instrumentos Publicos</span>
          </div>
          <div className="field">
            <label className="field__label">Codigo catastral <span className="field__optional">(Opcional)</span></label>
            <input className="field__input" type="text" placeholder="Ficha predial"
              value={formData.codigo_catastral} onChange={(e) => onChange('codigo_catastral', e.target.value)} disabled={loading} />
            <span className="field__hint">Ficha predial asignada por el IGAC</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- STEP 3: UBICACION --- */
function Step3({ ubicacion, onUbicacionChange, servicios, onToggleServicio, errors, loading }) {
  const municipios = getMunicipios(ubicacion.departamento)
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><MapPin size={16} /></span>
          <h3 className="form-card__title">Ubicacion</h3>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Departamento <span className="field__required">*</span></label>
            <select className={`field__select ${errors.departamento ? 'field__select--error' : ''}`}
              value={ubicacion.departamento} onChange={(e) => onUbicacionChange('departamento', e.target.value)} disabled={loading}>
              <option value="">Seleccionar...</option>
              {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.departamento && <span className="field__error"><AlertCircle size={11} /> {errors.departamento}</span>}
          </div>
          <div className="field">
            <label className="field__label">Municipio / Ciudad <span className="field__required">*</span></label>
            <select className={`field__select ${errors.municipio ? 'field__select--error' : ''}`}
              value={ubicacion.municipio} onChange={(e) => onUbicacionChange('municipio', e.target.value)}
              disabled={loading || !ubicacion.departamento}>
              <option value="">Seleccionar...</option>
              {municipios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.municipio && <span className="field__error"><AlertCircle size={11} /> {errors.municipio}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Barrio / Vereda</label>
            <input className="field__input" type="text" placeholder="Ej: El Poblado"
              value={ubicacion.barrio_vereda} onChange={(e) => onUbicacionChange('barrio_vereda', e.target.value)} disabled={loading} />
          </div>
          <div className="field">
            <label className="field__label">Direccion</label>
            <input className="field__input" type="text" placeholder="Ej: Calle 123 #45-67"
              value={ubicacion.direccion} onChange={(e) => onUbicacionChange('direccion', e.target.value)} disabled={loading} />
          </div>
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Zap size={16} /></span>
          <h3 className="form-card__title">Servicios publicos</h3>
        </div>
        <div className="services-grid">
          {Object.entries(servicios).map(([key, val]) => (
            <div key={key} className={`service-chip ${val ? 'service-chip--active' : ''}`} onClick={() => onToggleServicio(key)}>
              {val ? <CheckCircle size={12} /> : <span style={{width:12,height:12,borderRadius:'50%',border:'1.5px solid currentColor',display:'inline-block'}}></span>}
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* --- STEP 4: CARACTERISTICAS --- */
function Step4({ tipo, caract, onCaractChange, onToggle, onIncrement, onDecrement, calcAreaLote, errors }) {
  switch (tipo) {
    case 'casa': return <CasaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} onInc={onIncrement} onDec={onDecrement} calcArea={calcAreaLote} errors={errors} />
    case 'apartamento': return <ApartamentoForm caract={caract} onChange={onCaractChange} onToggle={onToggle} onInc={onIncrement} onDec={onDecrement} calcArea={calcAreaLote} errors={errors} />
    case 'apartaestudio': return <ApartaestudioForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={errors} />
    case 'local': return <LocalForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={errors} />
    case 'bodega': return <BodegaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={errors} />
    case 'finca': return <FincaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} errors={errors} />
    case 'lote': return <LoteForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={errors} />
    default: return <div className="step-content"><div className="form-card"><p>Tipo no soportado</p></div></div>
  }
}

/* --- SHARED COMPONENTS --- */
function Counter({ label, value, onInc, onDec, min = 0, max = 20, required }) {
  const val = parseInt(value) || 0
  return (
    <div className="counter">
      <span className="counter__label">{label} {required && <span style={{color:'var(--pp-red)'}}>*</span>}</span>
      <div className="counter__controls">
        <button type="button" className="counter__btn" onClick={onDec} disabled={val <= min}>-</button>
        <input className="counter__value" type="text" value={val} readOnly />
        <button type="button" className="counter__btn" onClick={onInc} disabled={val >= max}>+</button>
      </div>
    </div>
  )
}

function DimensionCalc({ caract, onChange, calcArea, showAreaConstruida = true, errors }) {
  const areaLote = calcArea()
  const areaConstruida = parseFloat(caract.area_construida) || 0
  const showWarning = showAreaConstruida && areaLote && areaConstruida > parseFloat(areaLote)
  return (
    <>
      <div className="form-row">
        <div className="field">
          <label className="field__label">Frente (m)</label>
          <input className={`field__input ${errors?.frente ? 'field__input--error' : ''}`} type="number" step="0.1" min="0"
            placeholder="0.0" value={caract.frente || ''} onChange={(e) => onChange('frente', e.target.value)} />
          {errors?.frente && <span className="field__error"><AlertCircle size={11} /> {errors.frente}</span>}
        </div>
        <div className="field">
          <label className="field__label">Fondo (m)</label>
          <input className={`field__input ${errors?.fondo ? 'field__input--error' : ''}`} type="number" step="0.1" min="0"
            placeholder="0.0" value={caract.fondo || ''} onChange={(e) => onChange('fondo', e.target.value)} />
          {errors?.fondo && <span className="field__error"><AlertCircle size={11} /> {errors.fondo}</span>}
        </div>
      </div>
      {areaLote && (
        <div className="calc-display">
          <div className="calc-display__value">{areaLote} m2</div>
          <div className="calc-display__label">Area lote - Calculado automaticamente</div>
        </div>
      )}
      {showAreaConstruida && (
        <div className="field">
          <label className="field__label">Area construida (m2)</label>
          <input className="field__input" type="number" step="0.01" min="0" placeholder="0"
            value={caract.area_construida || ''} onChange={(e) => onChange('area_construida', e.target.value)} />
          <span className="field__hint">Puede ser menor o igual al area lote</span>
          {showWarning && <span className="field__warning"><AlertCircle size={11} /> Area construida supera el area del lote</span>}
        </div>
      )}
    </>
  )
}

function ChipsGrid({ items, caract, onToggle }) {
  return (
    <div className="chips-grid">
      {items.map(item => (
        <div key={item.key} className={`chip ${caract[item.key] ? 'chip--active' : ''}`} onClick={() => onToggle(item.key)}>
          <span className="chip__check">{caract[item.key] ? <CheckCircle size={10} /> : null}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* --- PROPERTY TYPE FORMS --- */

const AMENIDADES_CASA = [
  { key: 'patio', label: 'Patio' },
  { key: 'jardin', label: 'Jardín' },
  { key: 'antejardin', label: 'Antejardín' },
  { key: 'terraza', label: 'Terraza' },
  { key: 'balcon', label: 'Balcón' },
  { key: 'zona_lavanderia', label: 'Zona lavandería' },
  { key: 'cocina_equipada', label: 'Cocina equipada' },
  { key: 'cuarto_servicio', label: 'Cuarto de servicio' },
  { key: 'bano_servicio', label: 'Baño de servicio' },
  { key: 'chimenea', label: 'Chimenea' },
  { key: 'deposito', label: 'Depósito' }
]

const AMENIDADES_APTO = [
  { key: 'balcon', label: 'Balcón' },
  { key: 'terraza', label: 'Terraza' },
  { key: 'zona_lavanderia', label: 'Zona lavandería' },
  { key: 'cocina_equipada', label: 'Cocina equipada' },
  { key: 'cuarto_servicio', label: 'Cuarto de servicio' },
  { key: 'bano_servicio', label: 'Baño de servicio' },
  { key: 'deposito', label: 'Depósito' },
  { key: 'gimnasio', label: 'Gimnasio' },
  { key: 'piscina', label: 'Piscina' }
]

function CasaForm({ caract, onChange, onToggle, onInc, onDec, calcArea, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones y área</h3>
        </div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} />
        <div className="form-row">
          <div className="field">
            <label className="field__label">Año de construcción</label>
            <input className={`field__input ${errors?.ano_construccion ? 'field__input--error' : ''}`} type="number" min="1900" max={CURRENT_YEAR}
              placeholder="Ej: 2015" value={caract.ano_construccion || ''} onChange={(e) => onChange('ano_construccion', e.target.value)} />
            {errors?.ano_construccion && <span className="field__error"><AlertCircle size={11} /> {errors.ano_construccion}</span>}
          </div>
          <div className="field">
            <label className="field__label">Cantidad de dueños</label>
            <input className="field__input" type="number" min="1" placeholder="1"
              value={caract.cantidad_duenos || ''} onChange={(e) => onChange('cantidad_duenos', e.target.value)} />
          </div>
        </div>
        <Counter label="Número de pisos" value={caract.pisos} onInc={() => onInc('pisos', 50)} onDec={() => onDec('pisos', 1)} min={1} max={50} />
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><DoorOpen size={16} /></span>
          <h3 className="form-card__title">Espacios</h3>
        </div>
        <div className="counters-grid">
          <Counter label="Habitaciones" value={caract.habitaciones} onInc={() => onInc('habitaciones')} onDec={() => onDec('habitaciones')} required errors={errors} />
          <Counter label="Baños" value={caract.banos} onInc={() => onInc('banos')} onDec={() => onDec('banos')} required errors={errors} />
          <Counter label="Parqueaderos" value={caract.parqueaderos} onInc={() => onInc('parqueaderos', 10)} onDec={() => onDec('parqueaderos')} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Amenidades</h3>
        </div>
        <ChipsGrid items={AMENIDADES_CASA} caract={caract} onToggle={onToggle} />
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><ClipboardList size={16} /></span>
          <h3 className="form-card__title">Características adicionales</h3>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Sala / Comedor</label>
            <select className="field__select" value={caract.sala_comedor || ''} onChange={(e) => onChange('sala_comedor', e.target.value || null)}>
              <option value="">No aplica</option>
              <option value="sala">Sala</option>
              <option value="comedor">Comedor</option>
              <option value="sala_comedor">Sala-Comedor</option>
              <option value="separados">Separados</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Tipo de cocina</label>
            <select className="field__select" value={caract.tipo_cocina || ''} onChange={(e) => onChange('tipo_cocina', e.target.value || null)}>
              <option value="">No aplica</option>
              <option value="integral">Integral</option>
              <option value="semi_integral">Semi-integral</option>
              <option value="sencilla">Sencilla</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Zona lavandería</label>
            <select className="field__select" value={caract.zona_lavanderia_tipo || ''} onChange={(e) => { onChange('zona_lavanderia_tipo', e.target.value || null); if (e.target.value) onToggle('zona_lavanderia') }}>
              <option value="">No tiene</option>
              <option value="interna">Interna</option>
              <option value="externa">Externa</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Tipo parqueadero</label>
            <select className="field__select" value={caract.tipo_parqueadero || ''} onChange={(e) => onChange('tipo_parqueadero', e.target.value || null)}>
              <option value="">Ninguno</option>
              <option value="interno">Interno</option>
              <option value="externo">Externo</option>
              <option value="cubierto">Cubierto</option>
              <option value="descubierto">Descubierto</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field__label">Descripción de acabados</label>
          <textarea className="field__textarea" rows={3} placeholder="Pisos en porcelanato, cocina en granito..."
            value={caract.descripcion_acabados || ''} onChange={(e) => onChange('descripcion_acabados', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function ApartamentoForm({ caract, onChange, onToggle, onInc, onDec, calcArea, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones y área</h3>
        </div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} />
        <div className="form-row">
          <div className="field">
            <label className="field__label">Piso del apartamento</label>
            <input className="field__input" type="number" min="1" placeholder="Ej: 5"
              value={caract.piso || ''} onChange={(e) => onChange('piso', e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Año de construcción</label>
            <input className={`field__input ${errors?.ano_construccion ? 'field__input--error' : ''}`} type="number" min="1900" max={CURRENT_YEAR}
              placeholder="Ej: 2018" value={caract.ano_construccion || ''} onChange={(e) => onChange('ano_construccion', e.target.value)} />
            {errors?.ano_construccion && <span className="field__error"><AlertCircle size={11} /> {errors.ano_construccion}</span>}
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><DoorOpen size={16} /></span>
          <h3 className="form-card__title">Espacios</h3>
        </div>
        <div className="counters-grid">
          <Counter label="Habitaciones" value={caract.habitaciones} onInc={() => onInc('habitaciones')} onDec={() => onDec('habitaciones')} required />
          <Counter label="Baños" value={caract.banos} onInc={() => onInc('banos')} onDec={() => onDec('banos')} required />
          <Counter label="Parqueaderos" value={caract.parqueaderos} onInc={() => onInc('parqueaderos', 10)} onDec={() => onDec('parqueaderos')} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Amenidades</h3>
        </div>
        <ChipsGrid items={AMENIDADES_APTO} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function ApartaestudioForm({ caract, onChange, onToggle, calcArea, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones y área</h3>
        </div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} showAreaConstruida={true} errors={errors} />
        <div className="field">
          <label className="field__label">Área total (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="0"
            placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
        <div className="field">
          <label className="field__label">Piso</label>
          <input className="field__input" type="number" min="1" placeholder="Ej: 3"
            value={caract.piso || ''} onChange={(e) => onChange('piso', e.target.value)} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Amenidades</h3>
        </div>
        <ChipsGrid items={[
          { key: 'balcon', label: 'Balcón' },
          { key: 'zona_lavanderia', label: 'Zona lavandería' },
          { key: 'cocina_equipada', label: 'Cocina equipada' },
          { key: 'deposito', label: 'Depósito' }
        ]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function LocalForm({ caract, onChange, onToggle, calcArea, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones y área</h3>
        </div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} />
        <div className="field">
          <label className="field__label">Área total (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="0"
            placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Características</h3>
        </div>
        <ChipsGrid items={[
          { key: 'bano_privado', label: 'Baño privado' },
          { key: 'mezanine', label: 'Mezanine' },
          { key: 'vitrina', label: 'Vitrina' },
          { key: 'deposito', label: 'Depósito' },
          { key: 'parqueadero', label: 'Parqueadero' }
        ]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function BodegaForm({ caract, onChange, onToggle, calcArea, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones y área</h3>
        </div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} />
        <div className="field">
          <label className="field__label">Altura (m)</label>
          <input className="field__input" type="number" step="0.1" min="0" placeholder="0.0"
            value={caract.altura || ''} onChange={(e) => onChange('altura', e.target.value)} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Características</h3>
        </div>
        <ChipsGrid items={[
          { key: 'oficina', label: 'Oficina' },
          { key: 'bano', label: 'Baño' },
          { key: 'muelle_carga', label: 'Muelle de carga' },
          { key: 'parqueadero', label: 'Parqueadero' },
          { key: 'vigilancia', label: 'Vigilancia' }
        ]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function FincaForm({ caract, onChange, onToggle, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones</h3>
        </div>
        <div className="field">
          <label className="field__label">Área total (m² o hectáreas) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="0"
            placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
        <div className="field">
          <label className="field__label">Área construida (m²)</label>
          <input className="field__input" type="number" step="0.01" min="0" placeholder="0"
            value={caract.area_construida || ''} onChange={(e) => onChange('area_construida', e.target.value)} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Características</h3>
        </div>
        <ChipsGrid items={[
          { key: 'piscina', label: 'Piscina' },
          { key: 'lago', label: 'Lago' },
          { key: 'rio', label: 'Río' },
          { key: 'cultivos', label: 'Cultivos' },
          { key: 'ganado', label: 'Ganado' },
          { key: 'casa_principal', label: 'Casa principal' },
          { key: 'casa_trabajadores', label: 'Casa trabajadores' },
          { key: 'establo', label: 'Establo' },
          { key: 'corral', label: 'Corral' }
        ]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function LoteForm({ caract, onChange, onToggle, calcArea, errors }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Ruler size={16} /></span>
          <h3 className="form-card__title">Dimensiones y área</h3>
        </div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} showAreaConstruida={false} errors={errors} />
        <div className="field">
          <label className="field__label">Área total (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="0"
            placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
      </div>

      <div className="form-card">
        <div className="form-card__header">
          <span className="form-card__icon"><Star size={16} /></span>
          <h3 className="form-card__title">Características del terreno</h3>
        </div>
        <ChipsGrid items={[
          { key: 'esquinero', label: 'Esquinero' },
          { key: 'plano', label: 'Plano' },
          { key: 'inclinado', label: 'Inclinado' },
          { key: 'servicios_publicos', label: 'Servicios públicos' },
          { key: 'escrituras', label: 'Escrituras' }
        ]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}
