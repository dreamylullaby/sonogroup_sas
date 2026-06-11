import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, parseApiError, ENUMS, ENUM_LABELS } from '../../config/api'
import { buildInmueblePayload } from '../../utils/payloadMappers'
import { DEPARTAMENTOS, getMunicipios } from '../../config/ubicaciones-colombia'
import {
  Home, DollarSign, MapPin, Zap, Ruler, DoorOpen, Star, ClipboardList,
  X, Save, ArrowLeft, ArrowRight, Send, CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react'
import '../../styles/pages/PublishProperty.css'

const CURRENT_YEAR = new Date().getFullYear()

const PublishProperty = ({ editMode = false, propertyId = null, modoRevision = false }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const formRef = useRef(null)
  const originalDataRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(editMode)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [toast, setToast] = useState(null)
  const totalSteps = 4

  const [formData, setFormData] = useState({
    valor: '', valor_administracion: '', estrato: '3', descripcion: '',
    numero_matricula: '', codigo_catastral: '',
    tipo_operacion: 'venta', tipo_inmueble: 'casa', estado_inmueble: 'nuevo',
    zona: 'urbano', acepta_permuta: false
  })

  const [ubicacion, setUbicacion] = useState({
    direccion: '', barrio_vereda: '', municipio: '', departamento: ''
  })

  const [servicios, setServicios] = useState({
    acueducto: true, energia: true, alcantarillado: true, gas: false, internet: false
  })

  const [caract, setCaract] = useState({})
  const [isReenvio] = useState(() => !!location.state?.reenvioSolicitud)
  const [step4ShowErrors, setStep4ShowErrors] = useState(false)
  const [solicitudBloqueante, setSolicitudBloqueante] = useState(null)

  // Verificar si el usuario ya tiene una solicitud pendiente (solo para nueva publicación)
  useEffect(() => {
    if (!editMode && !isReenvio && user?.rol !== 'admin') {
      api.get('/api/propiedades-pendientes/puede-solicitar?tipo_solicitud=publicacion')
        .then(res => {
          if (!res.data.puede) {
            setSolicitudBloqueante(res.data.mensaje)
          }
        })
        .catch(() => {})
    }
  }, [editMode, isReenvio, user])

  useEffect(() => {
    if (editMode && propertyId) loadPropertyData()
    else if (location.state?.reenvioSolicitud) loadReenvioData(location.state.reenvioSolicitud)
    else loadDraft()
  }, [editMode, propertyId])

  const loadDraft = async () => {
    try {
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

  // Cargar datos de una solicitud rechazada para reenvío
  const loadReenvioData = (solicitud) => {
    const d = solicitud.datos || {}
    if (d.valor !== undefined) setFormData(prev => ({
      ...prev,
      valor: d.valor || '', valor_administracion: d.valor_administracion || '',
      estrato: d.estrato?.toString() || '3', descripcion: d.descripcion || '',
      numero_matricula: d.numero_matricula || '', codigo_catastral: d.codigo_catastral || '',
      tipo_operacion: d.tipo_operacion || 'venta', tipo_inmueble: d.tipo_inmueble || 'casa',
      estado_inmueble: d.estado_inmueble || 'nuevo', zona: d.zona || 'urbano',
      acepta_permuta: d.acepta_permuta || false
    }))
    if (d.ubicacion) setUbicacion(d.ubicacion)
    if (d.servicios) setServicios(d.servicios)
    if (d.caracteristicas) {
      // Reverse-map backend field names to frontend form names
      const c = d.caracteristicas
      const mapped = { ...c }
      // anio_construccion (BD) → ano_construccion (form)
      if (c.anio_construccion !== undefined && c.ano_construccion === undefined) {
        mapped.ano_construccion = c.anio_construccion
      }
      // altura_libre (BD) → altura (form for bodega)
      if (c.altura_libre !== undefined && c.altura === undefined) {
        mapped.altura = c.altura_libre
      }
      // Remove the id_inmueble if present
      delete mapped.id_inmueble
      setCaract(mapped)
    }
  }

  useEffect(() => {
    if (!editMode && !isReenvio) setCaract({})
  }, [formData.tipo_inmueble, editMode, isReenvio])

  useEffect(() => {
    if (currentStep === 4) {
      setStep4ShowErrors(false)
      setErrors({})
    }
  }, [currentStep])

  useEffect(() => {
    if (formData.tipo_operacion === 'arriendo') {
      setFormData(prev => ({ ...prev, acepta_permuta: false }))
    }
  }, [formData.tipo_operacion])

  const loadPropertyData = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/api/inmuebles/${propertyId}`)
      const p = response.data
      setFormData({
        valor: p.valor || '', valor_administracion: p.valor_administracion || '',
        estrato: p.estrato?.toString() || '3', descripcion: p.descripcion || '',
        numero_matricula: p.numero_matricula || '', codigo_catastral: p.codigo_catastral || '',
        tipo_operacion: p.tipo_operacion || 'venta', tipo_inmueble: p.tipo_inmueble || 'casa',
        estado_inmueble: p.estado_inmueble || 'nuevo', zona: p.zona || 'urbano',
        acepta_permuta: p.acepta_permuta || false
      })
      if (p.ubicaciones) {
        setUbicacion({
          direccion: p.ubicaciones.direccion || '', barrio_vereda: p.ubicaciones.barrio_vereda || '',
          municipio: p.ubicaciones.municipio || '', departamento: p.ubicaciones.departamento || ''
        })
      }
      if (p.caracteristicas) {
        const { id_inmueble, anio_construccion, ...rest } = p.caracteristicas
        setCaract({ ...rest, ano_construccion: anio_construccion || rest.ano_construccion || '' })
      }

      // Guardar datos originales para comparación en modo revisión
      if (modoRevision) {
        originalDataRef.current = {
          formData: {
            valor: p.valor || '', valor_administracion: p.valor_administracion || '',
            estrato: p.estrato?.toString() || '3', descripcion: p.descripcion || '',
            numero_matricula: p.numero_matricula || '', codigo_catastral: p.codigo_catastral || '',
            tipo_operacion: p.tipo_operacion || 'venta', tipo_inmueble: p.tipo_inmueble || 'casa',
            estado_inmueble: p.estado_inmueble || 'nuevo', zona: p.zona || 'urbano',
            acepta_permuta: p.acepta_permuta || false
          },
          ubicacion: {
            direccion: p.ubicaciones?.direccion || '', barrio_vereda: p.ubicaciones?.barrio_vereda || '',
            municipio: p.ubicaciones?.municipio || '', departamento: p.ubicaciones?.departamento || ''
          },
          servicios: { ...servicios },
          caract: p.caracteristicas ? (() => { const { id_inmueble: _id, anio_construccion: _anio, ...r } = p.caracteristicas; return { ...r, ano_construccion: _anio || r.ano_construccion || '' } })() : {}
        }
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

  const validateStep = (step, { show = true } = {}) => {
    const newErrors = {}
    switch (step) {
      case 1:
        if (!formData.tipo_inmueble) newErrors.tipo_inmueble = 'Selecciona una opción válida'
        if (!formData.tipo_operacion) newErrors.tipo_operacion = 'Selecciona una opción válida'
        break
      case 2:
        // Precio - requerido, > 0, min 200000, max 50000000000
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
        // Valor administración - requerido, acepta 0
        if (formData.valor_administracion === '' || formData.valor_administracion === null || formData.valor_administracion === undefined) {
          newErrors.valor_administracion = 'Ingresa 0 si no aplica administración'
        } else if (Number(formData.valor_administracion) < 0) {
          newErrors.valor_administracion = 'El valor no puede ser negativo'
        }
        // Estrato - requerido
        if (!formData.estrato && formData.estrato !== '0') {
          newErrors.estrato = 'Selecciona una opción válida'
        }
        // Descripción - requerido, min 10, max 2000
        if (!formData.descripcion || formData.descripcion.trim().length === 0) {
          newErrors.descripcion = 'Este campo es obligatorio'
        } else if (formData.descripcion.trim().length < 10) {
          newErrors.descripcion = 'El título debe tener al menos 10 caracteres'
        } else if (formData.descripcion.trim().length > 2000) {
          newErrors.descripcion = 'La descripción no puede superar 2000 caracteres'
        }
        // Estado inmueble - requerido
        if (!formData.estado_inmueble) newErrors.estado_inmueble = 'Selecciona una opción válida'
        // Zona - requerido
        if (!formData.zona) newErrors.zona = 'Selecciona una opción válida'
        // numero_matricula - OPCIONAL, pero if filled validate format
        if (formData.numero_matricula && formData.numero_matricula.trim() !== '') {
          if (!/^[A-Za-z0-9\-]+$/.test(formData.numero_matricula.trim())) {
            newErrors.numero_matricula = 'Formato inválido. Ej: 070-12345'
          }
        }
        // codigo_catastral - OPCIONAL, but if filled validate format
        if (formData.codigo_catastral && formData.codigo_catastral.trim() !== '') {
          if (!/^[0-9\-]+$/.test(formData.codigo_catastral.trim())) {
            newErrors.codigo_catastral = 'Formato inválido. Ej: 00-00-0000-0000-000'
          }
        }
        break
      case 3:
        if (!ubicacion.departamento) newErrors.departamento = 'Selecciona el departamento'
        if (!ubicacion.municipio) newErrors.municipio = 'Ingresa el municipio o ciudad'
        // Barrio/Vereda: requerido, min 3, max 100, regex permisivo
        if (!ubicacion.barrio_vereda || ubicacion.barrio_vereda.trim().length === 0) {
          newErrors.barrio_vereda = 'Este campo es obligatorio'
        } else if (ubicacion.barrio_vereda.trim().length < 3) {
          newErrors.barrio_vereda = 'El barrio o vereda debe tener al menos 3 caracteres'
        } else if (ubicacion.barrio_vereda.trim().length > 100) {
          newErrors.barrio_vereda = 'El barrio o vereda no puede superar 100 caracteres'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-]+$/.test(ubicacion.barrio_vereda.trim())) {
          newErrors.barrio_vereda = 'El barrio solo puede contener letras, números, espacios y guiones'
        }
        // Dirección: requerido, min 8, max 200, regex flexible
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

        // --- Helpers ---
        // Numeric > 0 (no zero allowed)
        const validateMustBePositive = (val, field, zeroMsg) => {
          if (val === '' || val === undefined || val === null) {
            newErrors[field] = 'Este campo es obligatorio'
          } else if (Number(val) < 0) {
            newErrors[field] = 'El valor no puede ser negativo'
          } else if (Number(val) === 0) {
            newErrors[field] = zeroMsg || 'El valor debe ser mayor a 0'
          }
        }
        // Numeric >= 0 (zero allowed), integer required
        const validateIntNonNeg = (val, field, msg) => {
          if (val === '' || val === undefined || val === null) {
            newErrors[field] = 'Este campo es obligatorio'
          } else if (Number(val) < 0) {
            newErrors[field] = 'El valor no puede ser negativo'
          } else if (!Number.isInteger(Number(val))) {
            newErrors[field] = msg || 'Ingresa un número entero'
          }
        }
        // Numeric >= 0 (zero allowed), decimal ok
        const validateNumNonNeg = (val, field) => {
          if (val === '' || val === undefined || val === null) {
            newErrors[field] = 'Este campo es obligatorio'
          } else if (Number(val) < 0) {
            newErrors[field] = 'El valor no puede ser negativo'
          }
        }

        // --- FRENTE: required, > 0 for all types that show it ---
        if (['casa', 'apartamento', 'local', 'bodega', 'lote'].includes(tipo)) {
          validateMustBePositive(caract.frente, 'frente', 'El frente debe ser mayor a 0')
        }
        // --- FONDO: required, > 0 for all types that show it ---
        if (['casa', 'apartamento', 'local', 'bodega', 'lote'].includes(tipo)) {
          validateMustBePositive(caract.fondo, 'fondo', 'El fondo debe ser mayor a 0')
        }
        // --- AREA CONSTRUIDA: required, > 0 for types that show it ---
        if (['casa', 'apartamento', 'bodega', 'finca'].includes(tipo)) {
          validateMustBePositive(caract.area_construida, 'area_construida', 'El área construida debe ser mayor a 0 m²')
        }
        // --- AREA TOTAL: required, > 0 ---
        if (['apartaestudio', 'lote', 'finca', 'local'].includes(tipo)) {
          validateMustBePositive(caract.area_total, 'area_total', 'El área debe ser mayor a 0 m²')
        }
        // --- HABITACIONES: required, integer >= 0 ---
        if (['casa', 'apartamento'].includes(tipo)) {
          if (caract.habitaciones === undefined || caract.habitaciones === '' || caract.habitaciones === null) {
            newErrors.habitaciones = 'Ingresa un número entero de habitaciones'
          } else if (Number(caract.habitaciones) < 0 || !Number.isInteger(Number(caract.habitaciones))) {
            newErrors.habitaciones = 'Ingresa un número entero de habitaciones'
          }
        }
        // --- BAÑOS: required, integer >= 0 ---
        if (['casa', 'apartamento'].includes(tipo)) {
          if (caract.banos === undefined || caract.banos === '' || caract.banos === null) {
            newErrors.banos = 'Ingresa un número entero de baños'
          } else if (Number(caract.banos) < 0 || !Number.isInteger(Number(caract.banos))) {
            newErrors.banos = 'Ingresa un número entero de baños'
          }
        }
        // --- PARQUEADEROS: integer >= 0, default 0 is valid ---
        if (['casa'].includes(tipo)) {
          const parkVal = caract.parqueaderos
          if (parkVal !== '' && parkVal !== undefined && parkVal !== null) {
            if (Number(parkVal) < 0) {
              newErrors.parqueaderos = 'El número de parqueaderos no puede ser negativo'
            } else if (!Number.isInteger(Number(parkVal))) {
              newErrors.parqueaderos = 'Ingresa un número entero (0, 1, 2...)'
            }
          }
          // If undefined/empty, Counter shows 0 which is valid — no error
        }
        // --- PISOS: required, integer >= 1 (casa) ---
        if (tipo === 'casa') {
          if (caract.pisos === undefined || caract.pisos === '' || caract.pisos === null) {
            newErrors.pisos = 'Este campo es obligatorio'
          } else if (Number(caract.pisos) < 1 || !Number.isInteger(Number(caract.pisos))) {
            newErrors.pisos = 'El número de pisos debe ser 1 o mayor'
          }
        }
        // --- PISO: required, integer >= 1 (apartamento, apartaestudio) ---
        if (['apartamento', 'apartaestudio'].includes(tipo)) {
          if (caract.piso === undefined || caract.piso === '' || caract.piso === null) {
            newErrors.piso = 'Este campo es obligatorio'
          } else if (Number(caract.piso) < 1 || !Number.isInteger(Number(caract.piso))) {
            newErrors.piso = 'El piso debe ser 1 o mayor'
          }
        }
        // --- AÑO DE CONSTRUCCIÓN: required for casa/apartamento, validate range ---
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
        // --- CANTIDAD DE DUEÑOS: required, > 0 (casa) ---
        if (tipo === 'casa') {
          validateMustBePositive(caract.cantidad_duenos, 'cantidad_duenos', 'Debe haber al menos 1 dueño o propietario')
        }
        // --- ALTURA: required, > 0 (bodega) ---
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
          const el = formRef.current?.querySelector('.field__input--error, .field__select--error')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  const nextStep = () => {
    const result = validateStep(currentStep, { show: true })
    if (result.isValid) {
      setErrors({})
      setStep4ShowErrors(false)
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }
  const prevStep = () => { setErrors({}); setStep4ShowErrors(false); setCurrentStep(prev => Math.max(prev - 1, 1)) }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    // Only submit from step 4
    if (currentStep !== totalSteps) return
    setStep4ShowErrors(true)
    const result = validateStep(4, { show: true })
    if (!result.isValid) return

    setLoading(true)
    try {
      const payload = buildInmueblePayload({ ...formData }, ubicacion, servicios, caract)

      // Reenvío de solicitud rechazada: actualiza la misma solicitud en BD
      if (isReenvio && location.state?.reenvioSolicitud) {
        const solicitudId = location.state.reenvioSolicitud.id_solicitud
        await api.put(`/api/propiedades-pendientes/${solicitudId}/reenviar-corregido`, { datos: payload })
        setSuccess('Solicitud corregida y reenviada para revisión.')
        setTimeout(() => navigate('/mis-propiedades'), 1500)
        return
      }

      // Modo revisión: usuario envía cambios para revisión del admin (edición de propiedad publicada)
      if (modoRevision && editMode && propertyId) {
        const original = originalDataRef.current
        if (!original) {
          setErrors({ general: 'Error: no se pudieron cargar los datos originales para comparar.' })
          return
        }

        // Detectar cambios
        const payloadActual = { formData: { ...formData }, ubicacion: { ...ubicacion }, servicios: { ...servicios }, caract: { ...caract } }
        const camposModificados = detectarCambios(original, payloadActual)

        if (Object.keys(camposModificados).length === 0) {
          setErrors({ general: 'No has realizado ningún cambio en la propiedad.' })
          return
        }

        // Crear solicitud de revisión
        await api.post('/api/propiedades-pendientes/revision-edicion', {
          id_inmueble: parseInt(propertyId),
          snapshot_cambios: {
            ...payload,
            _meta: { campos_modificados: camposModificados }
          }
        })

        setSuccess('Tus cambios fueron enviados al administrador para revisión.')
        setTimeout(() => navigate(`/propiedad/${propertyId}`), 1500)
        return
      }

      // Flujo normal: admin edita directo
      if (editMode && propertyId) {
        const response = await api.put(`/api/inmuebles/${propertyId}`, payload)
        if (response.data?.codigo === 'REVISION_CREADA') {
          setSuccess('Cambios enviados para revisión del administrador')
        } else {
          setSuccess('Propiedad actualizada exitosamente')
        }
        setTimeout(() => navigate(-1), 1500)
      } else if (user.rol === 'admin') {
        await api.post('/api/inmuebles-admin', payload)
        setSuccess('Propiedad publicada exitosamente')
        localStorage.removeItem('property_draft')
        try { const r = await api.get('/api/borradores'); if (r.data?.borradores?.[0]) await api.delete(`/api/borradores/${r.data.borradores[0].id_borrador}`) } catch { }
        setTimeout(() => navigate('/admin'), 1500)
      } else {
        await api.post('/api/inmuebles', payload)
        setSuccess('Propiedad enviada para revisión')
        localStorage.removeItem('property_draft')
        try { const r = await api.get('/api/borradores'); if (r.data?.borradores?.[0]) await api.delete(`/api/borradores/${r.data.borradores[0].id_borrador}`) } catch { }
        setTimeout(() => navigate('/mis-propiedades'), 1500)
      }
    } catch (err) {
      setErrors({ general: parseApiError(err) })
    } finally {
      setLoading(false)
    }
  }

  // Detectar cambios entre datos originales y actuales
  function detectarCambios(original, actual) {
    const cambios = {}
    // Comparar formData
    for (const key of Object.keys(actual.formData || {})) {
      const valOrig = JSON.stringify(original.formData?.[key] ?? null)
      const valNew = JSON.stringify(actual.formData?.[key] ?? null)
      if (valOrig !== valNew) cambios[`formData.${key}`] = { anterior: original.formData?.[key], nuevo: actual.formData?.[key] }
    }
    // Comparar ubicacion
    for (const key of Object.keys(actual.ubicacion || {})) {
      const valOrig = JSON.stringify(original.ubicacion?.[key] ?? null)
      const valNew = JSON.stringify(actual.ubicacion?.[key] ?? null)
      if (valOrig !== valNew) cambios[`ubicacion.${key}`] = { anterior: original.ubicacion?.[key], nuevo: actual.ubicacion?.[key] }
    }
    // Comparar servicios
    for (const key of Object.keys(actual.servicios || {})) {
      const valOrig = JSON.stringify(original.servicios?.[key] ?? null)
      const valNew = JSON.stringify(actual.servicios?.[key] ?? null)
      if (valOrig !== valNew) cambios[`servicios.${key}`] = { anterior: original.servicios?.[key], nuevo: actual.servicios?.[key] }
    }
    // Comparar caract
    const allCaractKeys = new Set([...Object.keys(original.caract || {}), ...Object.keys(actual.caract || {})])
    for (const key of allCaractKeys) {
      const valOrig = JSON.stringify(original.caract?.[key] ?? null)
      const valNew = JSON.stringify(actual.caract?.[key] ?? null)
      if (valOrig !== valNew) cambios[`caract.${key}`] = { anterior: original.caract?.[key], nuevo: actual.caract?.[key] }
    }
    return cambios
  }

  const handleSaveDraft = async () => {
    try {
      const datos = { formData, ubicacion, servicios, caract, currentStep }
      const titulo = formData.tipo_inmueble ? `${formData.tipo_inmueble} - ${ubicacion.municipio || 'Sin ubicación'}` : null
      const response = await api.post('/api/borradores', { datos, paso_actual: currentStep, titulo })
      localStorage.setItem('property_draft', JSON.stringify({ ...datos, savedAt: new Date().toISOString() }))
      const msg = response.status === 201 ? 'Borrador guardado correctamente' : 'Borrador anterior reemplazado con los datos actuales'
      setToast({ type: 'success', message: msg })
    } catch (err) {
      const codigo = err.response?.data?.codigo
      if (codigo === 'BORRADOR_DUPLICADO') {
        setToast({ type: 'info', message: 'Ya tienes este borrador guardado. No se creó uno nuevo.' })
      } else if (codigo === 'LIMITE_ALCANZADO') {
        setToast({ type: 'error', message: err.response.data.error })
      } else {
        const draft = { formData, ubicacion, servicios, caract, currentStep, savedAt: new Date().toISOString() }
        localStorage.setItem('property_draft', JSON.stringify(draft))
        setToast({ type: 'success', message: 'Borrador guardado localmente' })
      }
    }
    setTimeout(() => setToast(null), 4000)
  }

  const handleSaveDraftAndExit = async () => {
    try {
      const datos = { formData, ubicacion, servicios, caract, currentStep }
      const titulo = formData.tipo_inmueble ? `${formData.tipo_inmueble} - ${ubicacion.municipio || 'Sin ubicación'}` : null
      await api.post('/api/borradores', { datos, paso_actual: currentStep, titulo })
    } catch (err) {
      const codigo = err.response?.data?.codigo
      if (codigo === 'BORRADOR_DUPLICADO') { /* Ya existe */ }
      else if (codigo === 'LIMITE_ALCANZADO') {
        setToast({ type: 'error', message: err.response.data.error })
        setShowCancelModal(false)
        setTimeout(() => setToast(null), 4000)
        return
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
  if (loadingData) return <div className="publish-property-page"><div className="publish-container" style={{ padding: '60px', textAlign: 'center', color: '#5A4864' }}>Cargando...</div></div>

  return (
    <div className="publish-property-page">
      <div className="publish-container">
        <div className="publish-header">
          <h1>{isReenvio ? 'Corregir y Reenviar' : modoRevision ? 'Editar Propiedad' : editMode ? 'Editar Propiedad' : 'Publicar Propiedad'}</h1>
          <p>{isReenvio ? 'Corrige los datos según las observaciones del administrador y reenvía' : modoRevision ? 'Modifica los datos y envía los cambios para revisión del administrador' : editMode ? 'Modifica los datos de tu inmueble' : user?.rol === 'admin' ? 'Publicación directa como administrador' : 'Completa el formulario para enviar a revisión'}</p>
        </div>

        {/* Warning banner: solicitud pendiente bloqueante */}
        {solicitudBloqueante && (
          <div style={{ margin: '0 0 16px', padding: '12px 16px', background: '#FEF3C7', borderRadius: '10px', borderLeft: '4px solid #D97706', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', margin: '0 0 4px' }}>Solicitud pendiente</p>
              <p style={{ fontSize: '12px', color: '#78350F', margin: 0, lineHeight: 1.4 }}>{solicitudBloqueante}</p>
              <p style={{ fontSize: '11px', color: '#A16207', margin: '6px 0 0' }}>Solo puedes tener una solicitud de publicación pendiente a la vez. Espera a que el administrador la apruebe o rechace.</p>
            </div>
          </div>
        )}

        <Stepper currentStep={currentStep} />

        <form onSubmit={handleSubmit} className="publish-form" noValidate ref={formRef} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault() }}>
          {success && <div className="success-message">{success}</div>}
          {errors.general && <div className="field__error" style={{ marginBottom: 12 }}><AlertCircle size={12} /> {errors.general}</div>}

          {currentStep === 1 && <Step1 formData={formData} onChange={handleChange} errors={errors} loading={loading} />}
          {currentStep === 2 && <Step2 formData={formData} onChange={handleChange} onPriceChange={handlePriceChange} onCheckboxChange={handleCheckboxChange} formatPrice={formatPrice} errors={errors} loading={loading} />}
          {currentStep === 3 && <Step3 ubicacion={ubicacion} onUbicacionChange={handleUbicacion} servicios={servicios} onToggleServicio={toggleServicio} errors={errors} loading={loading} />}
          {currentStep === 4 && (
            <Step4
              key={`step4-${currentStep}-${formData.tipo_inmueble}`}
              tipo={formData.tipo_inmueble}
              caract={caract}
              onCaractChange={handleCaract}
              onToggle={toggleCaract}
              onIncrement={incrementCaract}
              onDecrement={decrementCaract}
              calcAreaLote={calcAreaLote}
              errors={errors}
              loading={loading}
              showErrors={step4ShowErrors}
            />
          )}
          <div className="form-action-bar">
            <div className="action-bar-left">
              <button type="button" className="btn-cancel-pub" onClick={() => setShowCancelModal(true)} disabled={loading}>
                <X size={12} /> Cancelar
              </button>
              {/*{currentStep > 1 && !editMode && (
                <button type="button" className="btn-save-draft" onClick={handleSaveDraft} disabled={loading}>
                  <Save size={12} /> Guardar borrador
                </button>
              )}*/}
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
                <button type="button" className="btn-next" onClick={handleSubmit} disabled={loading || (!!solicitudBloqueante && !editMode && !isReenvio)}>
                  {loading ? 'Procesando...' : isReenvio ? 'Reenviar para revisión' : modoRevision ? 'Enviar cambios para revisión' : editMode ? 'Actualizar' : 'Publicar propiedad'} <Send size={12} />
                </button>
              )}
            </div>
          </div>

          {!editMode && user?.rol !== 'admin' && (
            <div className="form-note"><p>Tu propiedad será revisada por un administrador antes de ser publicada.</p></div>
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
            <h3 className="cancel-modal__title">¿Cancelar publicación?</h3>
            <p className="cancel-modal__desc">Si cancelas ahora perderás todo el progreso no guardado. Puedes guardar un borrador antes de salir para continuar más tarde.</p>
            <div className="cancel-modal__actions">
              <button className="cancel-modal__btn-draft" onClick={handleSaveDraftAndExit}><Save size={12} /> Guardar borrador y salir</button>
              <button className="cancel-modal__btn-exit" onClick={handleExitWithoutSaving}><X size={12} /> Salir sin guardar</button>
              <button className="cancel-modal__btn-continue" onClick={() => setShowCancelModal(false)}>Continuar editando</button>
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
    { num: 3, label: 'Ubicación' },
    { num: 4, label: 'Características' }
  ]
  const getState = (num) => num < currentStep ? 'completed' : num === currentStep ? 'active' : 'pending'
  return (
    <div className="stepper">
      <div className="stepper__steps">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div className={`stepper__step stepper__step--${getState(step.num)}`}>
              <div className="stepper__circle">{getState(step.num) === 'completed' ? <CheckCircle size={14} /> : step.num}</div>
              <span className="stepper__label">{step.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`stepper__line ${currentStep > step.num ? 'stepper__line--completed' : ''}`} />}
          </React.Fragment>
        ))}
      </div>
      <div className="stepper__progress"><div className="stepper__progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} /></div>
    </div>
  )
}

/* --- STEP 1 --- */
function Step1({ formData, onChange, errors, loading }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Home size={16} /></span><h3 className="form-card__title">Tipo de inmueble y operación</h3></div>
        <div className="field">
          <label className="field__label">Tipo de inmueble <span className="field__required">*</span></label>
          <select className={`field__select ${errors.tipo_inmueble ? 'field__select--error' : ''}`} value={formData.tipo_inmueble} onChange={(e) => onChange('tipo_inmueble', e.target.value)} disabled={loading}>
            {ENUMS.tipo_inmueble.map(t => <option key={t} value={t}>{ENUM_LABELS.tipo_inmueble[t]}</option>)}
          </select>
          {errors.tipo_inmueble && <span className="field__error"><AlertCircle size={11} /> {errors.tipo_inmueble}</span>}
        </div>
        <div className="field">
          <label className="field__label">Tipo de operación <span className="field__required">*</span></label>
          <select className={`field__select ${errors.tipo_operacion ? 'field__select--error' : ''}`} value={formData.tipo_operacion} onChange={(e) => onChange('tipo_operacion', e.target.value)} disabled={loading}>
            {ENUMS.tipo_operacion.map(t => <option key={t} value={t}>{ENUM_LABELS.tipo_operacion[t]}</option>)}
          </select>
          {errors.tipo_operacion && <span className="field__error"><AlertCircle size={11} /> {errors.tipo_operacion}</span>}
        </div>
      </div>
    </div>
  )
}

/* --- STEP 2 --- */
function Step2({ formData, onChange, onPriceChange, onCheckboxChange, formatPrice, errors, loading }) {
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><DollarSign size={16} /></span><h3 className="form-card__title">Detalles básicos</h3></div>
        <div className="field">
          <label className="field__label">Precio (COP) <span className="field__required">*</span></label>
          <input className={`field__input ${errors.valor ? 'field__input--error' : ''}`} type="text" placeholder="$ 0" value={formatPrice(formData.valor)} onChange={(e) => onPriceChange('valor', e.target.value)} disabled={loading} />
          {errors.valor && <span className="field__error"><AlertCircle size={11} /> {errors.valor}</span>}
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Administración (COP) <span className="field__required">*</span></label>
            <input className={`field__input ${errors.valor_administracion ? 'field__input--error' : ''}`} type="text" placeholder="$ 0" value={formatPrice(formData.valor_administracion)} onChange={(e) => onPriceChange('valor_administracion', e.target.value)} disabled={loading} />
            {errors.valor_administracion && <span className="field__error"><AlertCircle size={11} /> {errors.valor_administracion}</span>}
            <span className="field__hint">Ingresa 0 si no aplica</span>
          </div>
          <div className="field">
            <label className="field__label">Estrato <span className="field__required">*</span></label>
            <select className={`field__select ${errors.estrato ? 'field__select--error' : ''}`} value={formData.estrato} onChange={(e) => onChange('estrato', e.target.value)} disabled={loading}>
              <option value="">Seleccionar...</option>
              {[1, 2, 3, 4, 5, 6].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {errors.estrato && <span className="field__error"><AlertCircle size={11} /> {errors.estrato}</span>}
          </div>
        </div>
        <div className="field">
          <label className="field__label">Descripción / Título <span className="field__required">*</span></label>
          <textarea className={`field__textarea ${errors.descripcion ? 'field__input--error' : ''}`} placeholder="Describe la propiedad (mínimo 10 caracteres)..." value={formData.descripcion} onChange={(e) => onChange('descripcion', e.target.value)} disabled={loading} rows={3} maxLength={2000} />
          {errors.descripcion && <span className="field__error"><AlertCircle size={11} /> {errors.descripcion}</span>}
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Estado <span className="field__required">*</span></label>
            <select className={`field__select ${errors.estado_inmueble ? 'field__select--error' : ''}`} value={formData.estado_inmueble} onChange={(e) => onChange('estado_inmueble', e.target.value)} disabled={loading}>
              {ENUMS.estado_inmueble.map(e => <option key={e} value={e}>{ENUM_LABELS.estado_inmueble[e]}</option>)}
            </select>
            {errors.estado_inmueble && <span className="field__error"><AlertCircle size={11} /> {errors.estado_inmueble}</span>}
          </div>
          <div className="field">
            <label className="field__label">Zona <span className="field__required">*</span></label>
            <select className={`field__select ${errors.zona ? 'field__select--error' : ''}`} value={formData.zona} onChange={(e) => onChange('zona', e.target.value)} disabled={loading}>
              {ENUMS.zona_tipo.map(z => <option key={z} value={z}>{ENUM_LABELS.zona_tipo[z]}</option>)}
            </select>
            {errors.zona && <span className="field__error"><AlertCircle size={11} /> {errors.zona}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Matrícula ORIP <span className="field__optional">(Opcional)</span></label>
            <input className={`field__input ${errors.numero_matricula ? 'field__input--error' : ''}`} type="text" placeholder="Número de registro" value={formData.numero_matricula} onChange={(e) => onChange('numero_matricula', e.target.value)} disabled={loading} />
            {errors.numero_matricula && <span className="field__error"><AlertCircle size={11} /> {errors.numero_matricula}</span>}
            {!errors.numero_matricula && <span className="field__hint">Registro en la Oficina de Instrumentos Públicos</span>}
          </div>
          <div className="field">
            <label className="field__label">Código catastral <span className="field__optional">(Opcional)</span></label>
            <input className={`field__input ${errors.codigo_catastral ? 'field__input--error' : ''}`} type="text" placeholder="Ficha predial" value={formData.codigo_catastral} onChange={(e) => onChange('codigo_catastral', e.target.value)} disabled={loading} />
            {errors.codigo_catastral && <span className="field__error"><AlertCircle size={11} /> {errors.codigo_catastral}</span>}
            {!errors.codigo_catastral && <span className="field__hint">Ficha predial asignada por el IGAC</span>}
          </div>
        </div>
        {formData.tipo_operacion !== 'arriendo' && (
          <div className="permuta-section">
            <label className="permuta-checkbox">
              <input type="checkbox" name="acepta_permuta" checked={!!formData.acepta_permuta} onChange={(e) => onCheckboxChange('acepta_permuta', e.target.checked)} disabled={loading} />
              <div className="permuta-label-group">
                <span>¿Acepta permuta?</span>
                <small>Indica si considerarías un intercambio parcial o total del inmueble.</small>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- STEP 3 --- */
function Step3({ ubicacion, onUbicacionChange, servicios, onToggleServicio, errors, loading }) {
  const municipios = getMunicipios(ubicacion.departamento)
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><MapPin size={16} /></span><h3 className="form-card__title">Ubicación</h3></div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Departamento <span className="field__required">*</span></label>
            <select className={`field__select ${errors.departamento ? 'field__select--error' : ''}`} value={ubicacion.departamento} onChange={(e) => onUbicacionChange('departamento', e.target.value)} disabled={loading}>
              <option value="">Seleccionar...</option>
              {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.departamento && <span className="field__error"><AlertCircle size={11} /> {errors.departamento}</span>}
          </div>
          <div className="field">
            <label className="field__label">Municipio / Ciudad <span className="field__required">*</span></label>
            <select className={`field__select ${errors.municipio ? 'field__select--error' : ''}`} value={ubicacion.municipio} onChange={(e) => onUbicacionChange('municipio', e.target.value)} disabled={loading || !ubicacion.departamento}>
              <option value="">Seleccionar...</option>
              {municipios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.municipio && <span className="field__error"><AlertCircle size={11} /> {errors.municipio}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Barrio / Vereda <span className="field__required">*</span></label>
            <input className={`field__input ${errors.barrio_vereda ? 'field__input--error' : ''}`} type="text" placeholder="Ej: El Poblado" value={ubicacion.barrio_vereda} onChange={(e) => onUbicacionChange('barrio_vereda', e.target.value)} disabled={loading} />
            {errors.barrio_vereda && <span className="field__error"><AlertCircle size={11} /> {errors.barrio_vereda}</span>}
          </div>
          <div className="field">
            <label className="field__label">Dirección <span className="field__required">*</span></label>
            <input className={`field__input ${errors.direccion ? 'field__input--error' : ''}`} type="text" placeholder="Ej: Calle 123 #45-67" value={ubicacion.direccion} onChange={(e) => onUbicacionChange('direccion', e.target.value)} disabled={loading} />
            {errors.direccion && <span className="field__error"><AlertCircle size={11} /> {errors.direccion}</span>}
          </div>
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Zap size={16} /></span><h3 className="form-card__title">Servicios públicos</h3></div>
        <div className="services-grid">
          {Object.entries(servicios).map(([key, val]) => (
            <div key={key} className={`service-chip ${val ? 'service-chip--active' : ''}`} onClick={() => onToggleServicio(key)}>
              {val ? <CheckCircle size={12} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid currentColor', display: 'inline-block' }}></span>}
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* --- STEP 4 --- */
function Step4({
  tipo,
  caract,
  onCaractChange,
  onToggle,
  onIncrement,
  onDecrement,
  calcAreaLote,
  errors,
  showErrors
}) {
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (!showErrors) {
      setTouched({})
    }
  }, [showErrors, tipo])

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const visibleErrors = {}
  for (const key of Object.keys(errors || {})) {
    if (showErrors || touched[key]) {
      visibleErrors[key] = errors[key]
    }
  }

  switch (tipo) {
    case 'casa': return <CasaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} onInc={onIncrement} onDec={onDecrement} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'apartamento': return <ApartamentoForm caract={caract} onChange={onCaractChange} onToggle={onToggle} onInc={onIncrement} onDec={onDecrement} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'apartaestudio': return <ApartaestudioForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'local': return <LocalForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'bodega': return <BodegaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    case 'finca': return <FincaForm caract={caract} onChange={onCaractChange} onToggle={onToggle} errors={visibleErrors} onBlur={handleBlur} />
    case 'lote': return <LoteForm caract={caract} onChange={onCaractChange} onToggle={onToggle} calcArea={calcAreaLote} errors={visibleErrors} onBlur={handleBlur} />
    default: return <div className="step-content"><div className="form-card"><p>Tipo no soportado</p></div></div>
  }
}

/* --- SHARED --- */
function Counter({ label, value, onInc, onDec, min = 0, max = 20, required }) {
  const val = parseInt(value) || 0
  return (
    <div className="counter">
      <span className="counter__label">{label} {required && <span style={{ color: 'var(--pp-red)' }}>*</span>}</span>
      <div className="counter__controls">
        <button type="button" className="counter__btn" onClick={onDec} disabled={val <= min}>-</button>
        <input className="counter__value" type="text" value={val} readOnly />
        <button type="button" className="counter__btn" onClick={onInc} disabled={val >= max}>+</button>
      </div>
    </div>
  )
}

function DimensionCalc({ caract, onChange, calcArea, showAreaConstruida = true, errors, onBlur }) {
  const areaLote = calcArea()
  const areaConstruida = parseFloat(caract.area_construida) || 0
  const showWarning = showAreaConstruida && areaLote && areaConstruida > parseFloat(areaLote)
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <>
      <div className="form-row">
        <div className="field">
          <label className="field__label">Frente (m) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.frente ? 'field__input--error' : ''}`} type="number" step="0.1" min="1" placeholder="0.0" value={caract.frente || ''} onChange={(e) => onChange('frente', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('frente')} />
          {errors?.frente && <span className="field__error"><AlertCircle size={11} /> {errors.frente}</span>}
        </div>
        <div className="field">
          <label className="field__label">Fondo (m) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.fondo ? 'field__input--error' : ''}`} type="number" step="0.1" min="1" placeholder="0.0" value={caract.fondo || ''} onChange={(e) => onChange('fondo', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('fondo')} />
          {errors?.fondo && <span className="field__error"><AlertCircle size={11} /> {errors.fondo}</span>}
        </div>
      </div>
      {areaLote && <div className="calc-display"><div className="calc-display__value">{areaLote} m²</div><div className="calc-display__label">Área lote calculada</div></div>}
      {showAreaConstruida && (
        <div className="field">
          <label className="field__label">Área construida (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_construida ? 'field__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_construida || ''} onChange={(e) => onChange('area_construida', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_construida')} />
          {errors?.area_construida && <span className="field__error"><AlertCircle size={11} /> {errors.area_construida}</span>}
          {showWarning && !errors?.area_construida && <span className="field__warning"><AlertCircle size={11} /> Área construida supera el área del lote</span>}
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

function CasaForm({ caract, onChange, onToggle, onInc, onDec, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones y área</h3></div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
        <div className="form-row">
          <div className="field">
            <label className="field__label">Año de construcción <span className="field__required">*</span></label>
            <input className={`field__input ${errors?.ano_construccion ? 'field__input--error' : ''}`} type="number" min="1900" max={CURRENT_YEAR} placeholder="Ej: 2015" value={caract.ano_construccion || ''} onChange={(e) => onChange('ano_construccion', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('ano_construccion')} />
            {errors?.ano_construccion && <span className="field__error"><AlertCircle size={11} /> {errors.ano_construccion}</span>}
          </div>
          <div className="field">
            <label className="field__label">Cantidad de dueños <span className="field__required">*</span></label>
            <input className={`field__input ${errors?.cantidad_duenos ? 'field__input--error' : ''}`} type="number" min="1" placeholder="1" value={caract.cantidad_duenos || ''} onChange={(e) => onChange('cantidad_duenos', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('cantidad_duenos')} />
            {errors?.cantidad_duenos && <span className="field__error"><AlertCircle size={11} /> {errors.cantidad_duenos}</span>}
          </div>
        </div>
        <Counter label="Número de pisos" value={caract.pisos} onInc={() => onInc('pisos', 50)} onDec={() => onDec('pisos', 1)} min={1} max={50} required />
        {errors?.pisos && <span className="field__error"><AlertCircle size={11} /> {errors.pisos}</span>}
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><DoorOpen size={16} /></span><h3 className="form-card__title">Espacios</h3></div>
        <div className="counters-grid">
          <Counter label="Habitaciones" value={caract.habitaciones} onInc={() => onInc('habitaciones')} onDec={() => onDec('habitaciones')} required />
          <Counter label="Baños" value={caract.banos} onInc={() => onInc('banos')} onDec={() => onDec('banos')} required />
          <Counter label="Parqueaderos" value={caract.parqueaderos} onInc={() => onInc('parqueaderos', 10)} onDec={() => onDec('parqueaderos')} required />
        </div>
        {errors?.habitaciones && <span className="field__error"><AlertCircle size={11} /> {errors.habitaciones}</span>}
        {errors?.banos && <span className="field__error"><AlertCircle size={11} /> {errors.banos}</span>}
        {errors?.parqueaderos && <span className="field__error"><AlertCircle size={11} /> {errors.parqueaderos}</span>}
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Amenidades</h3></div>
        <ChipsGrid items={AMENIDADES_CASA} caract={caract} onToggle={onToggle} />
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><ClipboardList size={16} /></span><h3 className="form-card__title">Características adicionales</h3></div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Sala / Comedor</label>
            <select className="field__select" value={caract.sala_comedor || ''} onChange={(e) => onChange('sala_comedor', e.target.value || null)}>
              <option value="">No aplica</option><option value="sala">Sala</option><option value="comedor">Comedor</option><option value="sala_comedor">Sala-Comedor</option><option value="separados">Separados</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Tipo de cocina</label>
            <select className="field__select" value={caract.tipo_cocina || ''} onChange={(e) => onChange('tipo_cocina', e.target.value || null)}>
              <option value="">No aplica</option><option value="integral">Integral</option><option value="semi_integral">Semi-integral</option><option value="sencilla">Sencilla</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field__label">Zona lavandería</label>
            <select className="field__select" value={caract.zona_lavanderia_tipo || ''} onChange={(e) => { onChange('zona_lavanderia_tipo', e.target.value || null); if (e.target.value) onToggle('zona_lavanderia') }}>
              <option value="">No tiene</option><option value="interna">Interna</option><option value="externa">Externa</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Tipo parqueadero</label>
            <select className="field__select" value={caract.tipo_parqueadero || ''} onChange={(e) => onChange('tipo_parqueadero', e.target.value || null)}>
              <option value="">Ninguno</option><option value="interno">Interno</option><option value="externo">Externo</option><option value="cubierto">Cubierto</option><option value="descubierto">Descubierto</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field__label">Descripción de acabados</label>
          <textarea className="field__textarea" rows={3} placeholder="Pisos en porcelanato, cocina en granito..." value={caract.descripcion_acabados || ''} onChange={(e) => onChange('descripcion_acabados', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function ApartamentoForm({ caract, onChange, onToggle, onInc, onDec, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones y área</h3></div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
        <div className="form-row">
          <div className="field">
            <label className="field__label">Piso del apartamento <span className="field__required">*</span></label>
            <input className={`field__input ${errors?.piso ? 'field__input--error' : ''}`} type="number" min="1" placeholder="Ej: 5" value={caract.piso || ''} onChange={(e) => onChange('piso', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('piso')} />
            {errors?.piso && <span className="field__error"><AlertCircle size={11} /> {errors.piso}</span>}
          </div>
          <div className="field">
            <label className="field__label">Año de construcción <span className="field__required">*</span></label>
            <input className={`field__input ${errors?.ano_construccion ? 'field__input--error' : ''}`} type="number" min="1900" max={CURRENT_YEAR} placeholder="Ej: 2018" value={caract.ano_construccion || ''} onChange={(e) => onChange('ano_construccion', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('ano_construccion')} />
            {errors?.ano_construccion && <span className="field__error"><AlertCircle size={11} /> {errors.ano_construccion}</span>}
          </div>
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><DoorOpen size={16} /></span><h3 className="form-card__title">Espacios</h3></div>
        <div className="counters-grid">
          <Counter label="Habitaciones" value={caract.habitaciones} onInc={() => onInc('habitaciones')} onDec={() => onDec('habitaciones')} required />
          <Counter label="Baños" value={caract.banos} onInc={() => onInc('banos')} onDec={() => onDec('banos')} required />
        </div>
        {errors?.habitaciones && <span className="field__error"><AlertCircle size={11} /> {errors.habitaciones}</span>}
        {errors?.banos && <span className="field__error"><AlertCircle size={11} /> {errors.banos}</span>}
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Amenidades</h3></div>
        <ChipsGrid items={AMENIDADES_APTO} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function ApartaestudioForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones y área</h3></div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} showAreaConstruida={true} errors={errors} onBlur={onBlur} />
        <div className="field">
          <label className="field__label">Área total (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
        <div className="field">
          <label className="field__label">Piso <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.piso ? 'field__input--error' : ''}`} type="number" min="1" placeholder="Ej: 3" value={caract.piso || ''} onChange={(e) => onChange('piso', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('piso')} />
          {errors?.piso && <span className="field__error"><AlertCircle size={11} /> {errors.piso}</span>}
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Amenidades</h3></div>
        <ChipsGrid items={[{ key: 'balcon', label: 'Balcón' }, { key: 'deposito', label: 'Depósito' }, { key: 'parqueadero', label: 'Parqueadero' }, { key: 'ascensor', label: 'Ascensor' }, { key: 'vigilancia', label: 'Vigilancia' }, { key: 'amoblado', label: 'Amoblado' }]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function LocalForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones y área</h3></div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
        <div className="field">
          <label className="field__label">Área total (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Características</h3></div>
        <ChipsGrid items={[{ key: 'bano_privado', label: 'Baño privado' }, { key: 'mezanine', label: 'Mezanine' }, { key: 'vitrina', label: 'Vitrina' }, { key: 'deposito', label: 'Depósito' }, { key: 'parqueadero', label: 'Parqueadero' }]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function BodegaForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones y área</h3></div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} errors={errors} onBlur={onBlur} />
        <div className="field">
          <label className="field__label">Altura (m) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.altura ? 'field__input--error' : ''}`} type="number" step="0.1" min="1" placeholder="0.0" value={caract.altura || ''} onChange={(e) => onChange('altura', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('altura')} />
          {errors?.altura && <span className="field__error"><AlertCircle size={11} /> {errors.altura}</span>}
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Características</h3></div>
        <ChipsGrid items={[{ key: 'oficina', label: 'Oficina' }, { key: 'bano', label: 'Baño' }, { key: 'muelle_carga', label: 'Muelle de carga' }, { key: 'parqueadero', label: 'Parqueadero' }, { key: 'vigilancia', label: 'Vigilancia' }]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function FincaForm({ caract, onChange, onToggle, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }
  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones</h3></div>
        <div className="field">
          <label className="field__label">Área total (m² o hectáreas) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
        <div className="field">
          <label className="field__label">Área construida (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_construida ? 'field__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_construida || ''} onChange={(e) => onChange('area_construida', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_construida')} />
          {errors?.area_construida && <span className="field__error"><AlertCircle size={11} /> {errors.area_construida}</span>}
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Características</h3></div>
        <ChipsGrid items={[{ key: 'piscina', label: 'Piscina' }, { key: 'lago', label: 'Lago' }, { key: 'rio', label: 'Río' }, { key: 'cultivos', label: 'Cultivos' }, { key: 'ganado', label: 'Ganado' }, { key: 'casa_principal', label: 'Casa principal' }, { key: 'casa_trabajadores', label: 'Casa trabajadores' }, { key: 'establo', label: 'Establo' }, { key: 'corral', label: 'Corral' }]} caract={caract} onToggle={onToggle} />
      </div>
    </div>
  )
}

function LoteForm({ caract, onChange, onToggle, calcArea, errors, onBlur }) {
  const blockKeys = (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault() }

  // plano and inclinado are mutually exclusive
  const handleLoteToggle = (key) => {
    if (key === 'plano') {
      if (caract.plano) {
        onChange('plano', false)
      } else {
        onChange('plano', true)
        onChange('inclinado', false)
      }
    } else if (key === 'inclinado') {
      if (caract.inclinado) {
        onChange('inclinado', false)
      } else {
        onChange('inclinado', true)
        onChange('plano', false)
      }
    } else {
      onToggle(key)
    }
  }

  return (
    <div className="step-content">
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Ruler size={16} /></span><h3 className="form-card__title">Dimensiones y área</h3></div>
        <DimensionCalc caract={caract} onChange={onChange} calcArea={calcArea} showAreaConstruida={false} errors={errors} onBlur={onBlur} />
        <div className="field">
          <label className="field__label">Área total (m²) <span className="field__required">*</span></label>
          <input className={`field__input ${errors?.area_total ? 'field__input--error' : ''}`} type="number" step="0.01" min="1" placeholder="0" value={caract.area_total || ''} onChange={(e) => onChange('area_total', e.target.value)} onKeyDown={blockKeys} onBlur={() => onBlur && onBlur('area_total')} />
          {errors?.area_total && <span className="field__error"><AlertCircle size={11} /> {errors.area_total}</span>}
        </div>
      </div>
      <div className="form-card">
        <div className="form-card__header"><span className="form-card__icon"><Star size={16} /></span><h3 className="form-card__title">Características del terreno</h3></div>
        <ChipsGrid items={[{ key: 'plano', label: 'Plano' }, { key: 'inclinado', label: 'Inclinado' }, { key: 'servicios_publicos', label: 'Servicios públicos' }, { key: 'escrituras', label: 'Escrituras' }]} caract={caract} onToggle={handleLoteToggle} />
      </div>
    </div>
  )
}
