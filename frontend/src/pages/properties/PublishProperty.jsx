import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, parseApiError, ENUMS, ENUM_LABELS } from '../config/api'
import { buildInmueblePayload } from '../utils/payloadMappers'
import { validators } from '../utils/validation'
import '../../styles/pages/PublishProperty.css'

const PublishProperty = ({ editMode = false, propertyId = null }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(editMode)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [formDataComun, setFormDataComun] = useState({
    valor: '', valor_administracion: '', estrato: '3', descripcion: '',
    numero_matricula: '', codigo_catastral: '',
    tipo_operacion: 'venta', tipo_inmueble: 'casa', estado_inmueble: 'nuevo',
    zona: 'urbano', acepta_permuta: false
  })

  const [ubicacion, setUbicacion] = useState({
    direccion: '', barrio_vereda: '', municipio: '', departamento: 'Colombia'
  })

  const [servicios, setServicios] = useState({
    acueducto: true, energia: true, alcantarillado: true, gas: false, internet: false
  })

  const [caracteristicasEspecificas, setCaracteristicasEspecificas] = useState({})

  // Campos específicos por tipo - nombres alineados con BD v3.4
  const camposPorTipo = {
    casa: [
      { name: 'frente', label: 'Frente (m)', type: 'number', step: '0.01' },
      { name: 'fondo', label: 'Fondo (m)', type: 'number', step: '0.01' },
      { name: 'area_lote', label: 'Área Lote (m²)', type: 'number', step: '0.01' },
      { name: 'area_construida', label: 'Área Construida (m²)', type: 'number', step: '0.01' },
      { name: 'anos_construccion', label: 'Año de Construcción', type: 'number' },
      { name: 'cantidad_duenos', label: 'Cantidad de Dueños', type: 'number' },
      { name: 'pisos', label: 'Número de Pisos', type: 'number' },
      { name: 'habitaciones', label: 'Habitaciones', type: 'number', required: true },
      { name: 'banos', label: 'Baños', type: 'number', required: true },
      { name: 'parqueadero_cantidad', label: 'Cantidad Parqueaderos', type: 'number' },
      { name: 'patio', label: 'Patio', type: 'checkbox' },
      { name: 'jardin', label: 'Jardín', type: 'checkbox' },
      { name: 'antejadin', label: 'Antejardín', type: 'checkbox' },
      { name: 'terraza', label: 'Terraza', type: 'checkbox' },
      { name: 'balcon', label: 'Balcón', type: 'checkbox' },
      { name: 'zona_lavanderia', label: 'Zona Lavandería', type: 'checkbox' },
      { name: 'cocina_equipada', label: 'Cocina Equipada', type: 'checkbox' },
      { name: 'cuarto_servicio', label: 'Cuarto de Servicio', type: 'checkbox' },
      { name: 'bano_servicio', label: 'Baño de Servicio', type: 'checkbox' },
      { name: 'chimenea', label: 'Chimenea', type: 'checkbox' },
      { name: 'deposito', label: 'Depósito', type: 'checkbox' },
      { name: 'descripcion_acabados', label: 'Descripción de Acabados', type: 'textarea' },
      { name: 'sala_comedor', label: 'Sala/Comedor', type: 'select', options: ['sala', 'comedor', 'sala_comedor'] },
      { name: 'cocina', label: 'Tipo de Cocina', type: 'select', options: ['integral', 'semi_integral', 'sencilla'] },
      { name: 'zona_lavanderia_tipo', label: 'Tipo Lavandería', type: 'select', options: ['interna', 'externa'] },
      { name: 'parqueadero', label: 'Tipo Parqueadero', type: 'select', options: ['interno', 'externo', 'cubierto', 'descubierto', 'ninguno'] }
    ],
    apartamento: [
      { name: 'frente', label: 'Frente (m)', type: 'number', step: '0.01' },
      { name: 'fondo', label: 'Fondo (m)', type: 'number', step: '0.01' },
      { name: 'area_construida', label: 'Área Construida (m²)', type: 'number', step: '0.01' },
      { name: 'anos_construccion', label: 'Año de Construcción', type: 'number' },
      { name: 'cantidad_duenos', label: 'Cantidad de Dueños', type: 'number' },
      { name: 'piso', label: 'Piso', type: 'number' },
      { name: 'torre', label: 'Torre/Bloque', type: 'number' },
      { name: 'numero_apartamento', label: 'Número Apartamento', type: 'text' },
      { name: 'habitaciones', label: 'Habitaciones', type: 'number', required: true },
      { name: 'banos', label: 'Baños', type: 'number', required: true },
      { name: 'balcon', label: 'Balcón', type: 'checkbox' },
      { name: 'ascensor', label: 'Ascensor', type: 'checkbox' },
      { name: 'vigilancia', label: 'Vigilancia 24h', type: 'checkbox' },
      { name: 'cuarto_servicio', label: 'Cuarto de Servicio', type: 'checkbox' },
      { name: 'bano_servicio', label: 'Baño de Servicio', type: 'checkbox' },
      { name: 'valor_vigilancia', label: 'Valor Vigilancia ($)', type: 'number', step: '0.01' },
      { name: 'zonas_comunes', label: 'Zonas Comunes', type: 'text' },
      { name: 'descripcion_acabados', label: 'Descripción de Acabados', type: 'textarea' },
      { name: 'sala_comedor', label: 'Sala/Comedor', type: 'select', options: ['sala', 'comedor', 'sala_comedor'] },
      { name: 'cocina', label: 'Tipo de Cocina', type: 'select', options: ['integral', 'semi_integral', 'sencilla'] },
      { name: 'parqueadero', label: 'Parqueadero', type: 'select', options: ['privado', 'comun', 'ninguno'] }
    ],
    apartaestudio: [
      { name: 'area_total', label: 'Área Total (m²)', type: 'number', step: '0.01', required: true },
      { name: 'piso', label: 'Piso', type: 'number' },
      { name: 'tiene_bano', label: 'Baño Privado', type: 'checkbox' },
      { name: 'parqueadero', label: 'Parqueadero', type: 'checkbox' },
      { name: 'balcon', label: 'Balcón', type: 'checkbox' },
      { name: 'amoblado', label: 'Amoblado', type: 'checkbox' },
      { name: 'deposito', label: 'Depósito', type: 'checkbox' },
      { name: 'ascensor', label: 'Ascensor', type: 'checkbox' },
      { name: 'vigilancia', label: 'Vigilancia', type: 'checkbox' },
      { name: 'cocina', label: 'Tipo de Cocina', type: 'select', options: ['integral', 'semi_integral', 'sencilla'] },
      { name: 'descripcion_acabados', label: 'Descripción de Acabados', type: 'textarea' }
    ],
    local: [
      { name: 'area_total', label: 'Área Total (m²)', type: 'number', step: '0.01', required: true },
      { name: 'frente', label: 'Frente (m)', type: 'number', step: '0.01' },
      { name: 'fondo', label: 'Fondo (m)', type: 'number', step: '0.01' },
      { name: 'altura', label: 'Altura (m)', type: 'number', step: '0.01' },
      { name: 'piso', label: 'Piso', type: 'number' },
      { name: 'parqueaderos', label: 'Parqueaderos (cantidad)', type: 'number' },
      { name: 'mezzanine', label: 'Mezzanine', type: 'checkbox' },
      { name: 'banos', label: 'Baños', type: 'checkbox' },
      { name: 'vitrina', label: 'Vitrina', type: 'checkbox' },
      { name: 'sotano', label: 'Sótano', type: 'checkbox' },
      { name: 'descripcion_acabados', label: 'Descripción de Acabados', type: 'textarea' },
      { name: 'uso_suelo', label: 'Uso del Suelo (POT)', type: 'text' },
      { name: 'zona_local', label: 'Zona del Local', type: 'select', options: ['comercial', 'residencial', 'mixta'] }
    ],
    bodega: [
      { name: 'area_construida', label: 'Área Construida (m²)', type: 'number', step: '0.01', required: true },
      { name: 'frente', label: 'Frente (m)', type: 'number', step: '0.01', required: true },
      { name: 'fondo', label: 'Fondo (m)', type: 'number', step: '0.01', required: true },
      { name: 'area_lote', label: 'Área Lote (m²)', type: 'number', step: '0.01' },
      { name: 'altura_libre', label: 'Altura Libre (m)', type: 'number', step: '0.01' },
      { name: 'parqueaderos', label: 'Parqueaderos (cantidad)', type: 'number' },
      { name: 'oficinas', label: 'Oficinas', type: 'checkbox' },
      { name: 'banos', label: 'Baños', type: 'checkbox' },
      { name: 'vestier', label: 'Vestier', type: 'checkbox' },
      { name: 'acceso_camiones', label: 'Acceso Camiones', type: 'checkbox' },
      { name: 'rampa_cargue', label: 'Rampa de Cargue', type: 'checkbox' },
      { name: 'capacidad_carga', label: 'Capacidad de Carga', type: 'text' },
      { name: 'tipo_puerta_carga', label: 'Tipo Portón', type: 'text' }
    ],
    finca: [
      { name: 'area_total', label: 'Área Total', type: 'number', step: '0.01', required: true },
      { name: 'area_cultivable', label: 'Área Cultivable', type: 'number', step: '0.01' },
      { name: 'area_construcciones', label: 'Área Construcciones (m²)', type: 'number', step: '0.01' },
      { name: 'numero_casas', label: 'Número de Casas', type: 'number' },
      { name: 'minutos_cabecera', label: 'Minutos a Cabecera Municipal', type: 'number' },
      { name: 'fuentes_agua', label: 'Fuentes de Agua', type: 'text' },
      { name: 'casa_principal', label: 'Casa Principal', type: 'checkbox' },
      { name: 'piscina', label: 'Piscina', type: 'checkbox' },
      { name: 'jacuzzi', label: 'Jacuzzi', type: 'checkbox' },
      { name: 'chimenea', label: 'Chimenea', type: 'checkbox' },
      { name: 'cancha', label: 'Cancha', type: 'checkbox' },
      { name: 'lago_estanque', label: 'Lago/Estanque', type: 'checkbox' },
      { name: 'cabana_mayordomo', label: 'Cabaña Mayordomo', type: 'checkbox' },
      { name: 'otras_construcciones', label: 'Otras Construcciones', type: 'textarea' },
      { name: 'cultivos_actuales', label: 'Cultivos Actuales', type: 'textarea' },
      { name: 'animales', label: 'Animales', type: 'textarea' },
      { name: 'descripcion_via', label: 'Descripción Vía de Acceso', type: 'textarea' },
      { name: 'unidad_area', label: 'Unidad de Área', type: 'select', options: ['m2', 'hectareas', 'fanegadas', 'cuadras'] },
      { name: 'topografia', label: 'Topografía', type: 'select', options: ['plana', 'inclinada', 'irregular', 'semiondulada', 'ondulada'] },
      { name: 'vias_acceso', label: 'Vías de Acceso', type: 'select', options: ['pavimentada', 'afirmada', 'trocha', 'sin_via'] }
    ],
    lote: [
      { name: 'area_total', label: 'Área Total (m²)', type: 'number', step: '0.01', required: true },
      { name: 'frente', label: 'Frente (m)', type: 'number', step: '0.01' },
      { name: 'fondo', label: 'Fondo (m)', type: 'number', step: '0.01' },
      { name: 'pendiente', label: 'Tiene Pendiente', type: 'checkbox' },
      { name: 'tiene_casa', label: 'Tiene Casa', type: 'checkbox' },
      { name: 'tiene_documento', label: 'Tiene Documento (Matrícula/Catastro)', type: 'checkbox' },
      { name: 'uso_suelo', label: 'Uso del Suelo (POT)', type: 'text' },
      { name: 'descripcion_via', label: 'Descripción Vía de Acceso', type: 'textarea' },
      { name: 'topografia', label: 'Topografía', type: 'select', options: ['plana', 'inclinada', 'irregular', 'semiondulada', 'ondulada'] },
      { name: 'vias_acceso', label: 'Vías de Acceso', type: 'select', options: ['pavimentada', 'afirmada', 'trocha', 'sin_via'] }
    ]
  }

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (editMode && propertyId) loadPropertyData()
  }, [editMode, propertyId])

  const loadPropertyData = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/api/inmuebles/${propertyId}`)
      const property = response.data

      setFormDataComun({
        valor: property.valor || '',
        valor_administracion: property.valor_administracion || '',
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

      if (property.ubicaciones) {
        setUbicacion({
          direccion: property.ubicaciones.direccion || '',
          barrio_vereda: property.ubicaciones.barrio_vereda || '',
          municipio: property.ubicaciones.municipio || '',
          departamento: property.ubicaciones.departamento || 'Colombia'
        })
      }

      if (property.caracteristicas) {
        const { id_inmueble, ...resto } = property.caracteristicas
        setCaracteristicasEspecificas(resto)
      }
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoadingData(false)
    }
  }

  // Resetear características cuando cambia el tipo
  useEffect(() => {
    if (!editMode) setCaracteristicasEspecificas({})
  }, [formDataComun.tipo_inmueble, editMode])

  const handleCommonChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormDataComun(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleUbicacionChange = (e) => {
    const { name, value } = e.target
    setUbicacion(prev => ({ ...prev, [name]: value }))
  }

  const handleServiciosChange = (e) => {
    const { name, checked } = e.target
    setServicios(prev => ({ ...prev, [name]: checked }))
  }

  const handleEspecificasChange = (e) => {
    const { name, value, type, checked } = e.target
    setCaracteristicasEspecificas(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value)
    }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validaciones
    const valorErr = validators.valor(formDataComun.valor)
    if (valorErr) { setError(valorErr); setLoading(false); return }

    if (!ubicacion.municipio) {
      setError('El municipio es requerido'); setLoading(false); return
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
      const payload = buildInmueblePayload(formDataComun, ubicacion, servicios, caracteristicasEspecificas)

      let response
      if (editMode && propertyId) {
        response = await api.put(`/api/inmuebles/${propertyId}`, payload)
        setSuccess('¡Propiedad actualizada exitosamente!')
        setTimeout(() => navigate('/'), 1500)
      } else if (user.rol === 'admin') {
        response = await api.post('/api/inmuebles-admin', payload)
        setSuccess('¡Propiedad publicada exitosamente!')
        setTimeout(() => navigate('/admin'), 1500)
      } else {
        response = await api.post('/api/inmuebles', payload)
        setSuccess('¡Propiedad enviada para revisión!')
        setTimeout(() => navigate('/mis-propiedades'), 1500)
      }
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!user) { navigate('/login'); return null }
  if (loadingData) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Cargando datos de la propiedad...</p>
      </div>
    )
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
        if (!ubicacion.municipio) { setError('El municipio es requerido'); return false }
        break
      case 4:
        const requeridos = camposActuales.filter(c => c.required)
        for (const campo of requeridos) {
          if (!caracteristicasEspecificas[campo.name] && caracteristicasEspecificas[campo.name] !== 0) {
            setError(`Campo requerido: ${campo.label}`); return false
          }
        }
        break
    }
    return true
  }

  const nextStep = () => { setError(''); if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, totalSteps)) }
  const prevStep = () => { setError(''); setCurrentStep(prev => Math.max(prev - 1, 1)) }

  return (
    <div className="publish-property-page">
      <div className="publish-container">
        <div className="publish-header">
          <h1>{editMode ? 'Editar Propiedad' : 'Publicar Propiedad'}</h1>
          <p>
            {editMode
              ? 'Modifica los datos de la propiedad'
              : (user?.rol === 'admin'
                  ? 'Completa el formulario para publicar inmediatamente'
                  : 'Completa el formulario y envíalo para revisión')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}>
                <div className="step-circle">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Tipo'}
                  {step === 2 && 'Detalles'}
                  {step === 3 && 'Ubicación'}
                  {step === 4 && 'Características'}
                </div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="publish-form" noValidate>
          {error && <div className="error-message" role="alert" aria-live="polite">⚠️ {error}</div>}
          {success && <div className="success-message" role="status" aria-live="polite">✅ {success}</div>}

          {/* PASO 1: TIPO */}
          {currentStep === 1 && (
            <div className="form-section step-content">
              <h3>Tipo de Inmueble y Operación</h3>
              <div className="form-group">
                <label htmlFor="tipo_inmueble">¿Qué tipo de inmueble? *</label>
                <select id="tipo_inmueble" name="tipo_inmueble" value={formDataComun.tipo_inmueble}
                  onChange={handleCommonChange} disabled={loading} required>
                  {ENUMS.tipo_inmueble.map(t => (
                    <option key={t} value={t}>{ENUM_LABELS.tipo_inmueble[t]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="tipo_operacion">¿Venta o arriendo? *</label>
                <select id="tipo_operacion" name="tipo_operacion" value={formDataComun.tipo_operacion}
                  onChange={handleCommonChange} disabled={loading} required>
                  {ENUMS.tipo_operacion.map(t => (
                    <option key={t} value={t}>{ENUM_LABELS.tipo_operacion[t]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* PASO 2: DETALLES */}
          {currentStep === 2 && (
            <div className="form-section step-content">
              <h3>Detalles Básicos</h3>
              <div className="form-group">
                <label htmlFor="valor">Precio (COP) *</label>
                <input type="number" id="valor" name="valor" placeholder="Ej: 250000000"
                  value={formDataComun.valor} onChange={handleCommonChange} disabled={loading}
                  required min="1" step="0.01" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="valor_administracion">Valor Administración (COP)</label>
                  <input type="number" id="valor_administracion" name="valor_administracion" placeholder="Ej: 350000"
                    value={formDataComun.valor_administracion} onChange={handleCommonChange} disabled={loading}
                    min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label htmlFor="estrato">Estrato</label>
                  <select id="estrato" name="estrato" value={formDataComun.estrato}
                    onChange={handleCommonChange} disabled={loading}>
                    <option value="">No aplica</option>
                    {[1, 2, 3, 4, 5, 6].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea id="descripcion" name="descripcion" placeholder="Describe la propiedad (mínimo 10 caracteres si se llena)..."
                  value={formDataComun.descripcion} onChange={handleCommonChange} disabled={loading} rows="4" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estado_inmueble">Estado</label>
                  <select id="estado_inmueble" name="estado_inmueble" value={formDataComun.estado_inmueble}
                    onChange={handleCommonChange} disabled={loading}>
                    {ENUMS.estado_inmueble.map(e => (
                      <option key={e} value={e}>{ENUM_LABELS.estado_inmueble[e]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="zona">Zona</label>
                  <select id="zona" name="zona" value={formDataComun.zona}
                    onChange={handleCommonChange} disabled={loading}>
                    {ENUMS.zona_tipo.map(z => (
                      <option key={z} value={z}>{ENUM_LABELS.zona_tipo[z]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="numero_matricula">Número Matrícula</label>
                  <input type="text" id="numero_matricula" name="numero_matricula" placeholder="Matrícula ORIP"
                    value={formDataComun.numero_matricula} onChange={handleCommonChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label htmlFor="codigo_catastral">Código Catastral</label>
                  <input type="text" id="codigo_catastral" name="codigo_catastral" placeholder="Ficha predial IGAC"
                    value={formDataComun.codigo_catastral} onChange={handleCommonChange} disabled={loading} />
                </div>
              </div>
              <div className="form-group">
                <label className="feature-checkbox">
                  <input type="checkbox" name="acepta_permuta" checked={!!formDataComun.acepta_permuta}
                    onChange={handleCommonChange} disabled={loading} />
                  <span>Acepta Permuta</span>
                </label>
              </div>
            </div>
          )}

          {/* PASO 3: UBICACIÓN */}
          {currentStep === 3 && (
            <div className="form-section step-content">
              <h3>Ubicación</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="municipio">Municipio/Ciudad *</label>
                  <input type="text" id="municipio" name="municipio" placeholder="Ej: Medellín"
                    value={ubicacion.municipio} onChange={handleUbicacionChange} disabled={loading} required />
                </div>
                <div className="form-group">
                  <label htmlFor="departamento">Departamento</label>
                  <input type="text" id="departamento" name="departamento" placeholder="Ej: Antioquia"
                    value={ubicacion.departamento} onChange={handleUbicacionChange} disabled={loading} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="barrio_vereda">Barrio/Vereda</label>
                  <input type="text" id="barrio_vereda" name="barrio_vereda" placeholder="Ej: El Poblado"
                    value={ubicacion.barrio_vereda} onChange={handleUbicacionChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label htmlFor="direccion">Dirección</label>
                  <input type="text" id="direccion" name="direccion" placeholder="Ej: Calle 123 #45-67"
                    value={ubicacion.direccion} onChange={handleUbicacionChange} disabled={loading} />
                </div>
              </div>

              <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Servicios Públicos</h4>
              <div className="features-grid">
                {Object.keys(servicios).map(servicio => (
                  <label key={servicio} className="feature-checkbox">
                    <input type="checkbox" name={servicio} checked={servicios[servicio]}
                      onChange={handleServiciosChange} disabled={loading} />
                    <span>{servicio.charAt(0).toUpperCase() + servicio.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* PASO 4: CARACTERÍSTICAS ESPECÍFICAS */}
          {currentStep === 4 && (
            <div className="form-section step-content">
              <h3>Características de {ENUM_LABELS.tipo_inmueble[formDataComun.tipo_inmueble]}</h3>
              <div className="characteristics-grid">
                {/* Campos numéricos */}
                <div className="char-group">
                  <h4>Dimensiones y Espacios</h4>
                  {camposActuales.filter(c => c.type === 'number').map(campo => (
                    <div key={campo.name} className="form-group compact">
                      <label htmlFor={campo.name}>{campo.label} {campo.required && '*'}</label>
                      <input type="number" id={campo.name} name={campo.name}
                        value={caracteristicasEspecificas[campo.name] ?? ''}
                        onChange={handleEspecificasChange} disabled={loading} step={campo.step || '1'} />
                    </div>
                  ))}
                </div>

                {/* Selects */}
                {camposActuales.filter(c => c.type === 'select').length > 0 && (
                  <div className="char-group">
                    <h4>Características Adicionales</h4>
                    {camposActuales.filter(c => c.type === 'select').map(campo => (
                      <div key={campo.name} className="form-group compact">
                        <label htmlFor={campo.name}>{campo.label}</label>
                        <select id={campo.name} name={campo.name}
                          value={caracteristicasEspecificas[campo.name] || ''}
                          onChange={handleEspecificasChange} disabled={loading}>
                          <option value="">Seleccionar...</option>
                          {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Checkboxes */}
                {camposActuales.filter(c => c.type === 'checkbox').length > 0 && (
                  <div className="char-group full-width">
                    <h4>Amenidades</h4>
                    <div className="amenities-grid">
                      {camposActuales.filter(c => c.type === 'checkbox').map(campo => (
                        <label key={campo.name} className="feature-checkbox">
                          <input type="checkbox" name={campo.name}
                            checked={!!caracteristicasEspecificas[campo.name]}
                            onChange={handleEspecificasChange} disabled={loading} />
                          <span>{campo.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Textos y textareas */}
                {camposActuales.filter(c => c.type === 'text' || c.type === 'textarea').length > 0 && (
                  <div className="char-group full-width">
                    <h4>Información Adicional</h4>
                    {camposActuales.filter(c => c.type === 'text' || c.type === 'textarea').map(campo => (
                      <div key={campo.name} className="form-group">
                        <label htmlFor={campo.name}>{campo.label}</label>
                        {campo.type === 'textarea' ? (
                          <textarea id={campo.name} name={campo.name}
                            value={caracteristicasEspecificas[campo.name] || ''}
                            onChange={handleEspecificasChange} disabled={loading} rows="3" />
                        ) : (
                          <input type="text" id={campo.name} name={campo.name}
                            value={caracteristicasEspecificas[campo.name] || ''}
                            onChange={handleEspecificasChange} disabled={loading} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-navigation">
            <button type="button" className="btn-back"
              onClick={currentStep === 1 ? () => navigate('/') : prevStep} disabled={loading}>
              {currentStep === 1 ? 'Cancelar' : '← Anterior'}
            </button>

            {currentStep < totalSteps ? (
              <button type="button" className="btn-next" onClick={nextStep} disabled={loading}>
                Siguiente →
              </button>
            ) : (
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading
                  ? 'Procesando...'
                  : editMode ? 'Actualizar' : (user?.rol === 'admin' ? 'Publicar' : 'Enviar para Revisión')}
              </button>
            )}
          </div>

          {!editMode && user?.rol !== 'admin' && (
            <div className="form-note">
              <p><strong>Nota:</strong> Tu propiedad será revisada por un administrador antes de ser publicada.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default PublishProperty

