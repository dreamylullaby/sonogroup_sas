import { useState, useCallback } from 'react'

/**
 * Validation configuration with Spanish error messages for all 4 steps.
 * Each field maps to { required?, validate?, message }.
 */
const validationConfig = {
  step1: {
    tipo_inmueble: { required: true, message: 'Selecciona una opción' },
    tipo_operacion: { required: true, message: 'Selecciona una opción' }
  },
  step2: {
    valor: {
      required: true,
      validate: (v) => !v || parseFloat(v) <= 0,
      message: 'Ingresa un precio válido mayor a $0'
    },
    valor_administracion: {
      required: true,
      validate: (v) => {
        if (v === '' || v === undefined || v === null) return true
        const num = parseFloat(v)
        if (isNaN(num)) return true
        return num < 0
      },
      message: 'Ingresa 0 si no aplica administración'
    },
    descripcion: {
      required: true,
      validate: (v) => {
        if (!v || v.trim().length === 0) return true
        if (v.trim().length < 10) return true
        return false
      },
      message: 'El título debe tener al menos 10 caracteres'
    },
    estado_inmueble: {
      required: true,
      message: 'Selecciona el estado del inmueble'
    },
    zona: {
      required: true,
      message: 'Selecciona la zona del inmueble'
    },
    estrato: {
      required: true,
      validate: (v) => {
        // 'no_aplica' is a valid selection, only empty/null/undefined is invalid
        if (v === '' || v === undefined || v === null) return true
        return false
      },
      message: 'Selecciona una opción'
    }
  },
  step3: {
    municipio: { required: true, message: 'Selecciona el municipio del inmueble' },
    departamento: { required: true, message: 'Selecciona el departamento' },
    barrio_vereda: { required: true, message: 'Ingresa el barrio o sector del inmueble' },
    direccion: { required: true, message: 'Ingresa la dirección completa del inmueble' }
  }
  // step4 is dynamic — handled via getStep4Config
}

/** Default fallback message for required fields without a specific message */
const FALLBACK_MESSAGE = 'Este campo es obligatorio'

/**
 * Build step 4 validation config dynamically based on camposPorTipo.
 * ALL fields are required. Checkboxes are excluded (they are always valid as boolean).
 * Numeric fields that must be > 0 get a special validator.
 * Select fields get "Selecciona una opción" message.
 * Text/textarea fields get "Este campo es obligatorio" message.
 */
function getStep4Config(camposPorTipo, tipoInmueble) {
  const campos = camposPorTipo[tipoInmueble] || []
  const config = {}

  // Numeric fields that do NOT accept 0 (must be > 0)
  const noZeroFields = new Set([
    'area_total', 'area_construida', 'area_lote', 'frente', 'fondo',
    'habitaciones', 'banos', 'pisos', 'altura', 'altura_libre',
    'area_cultivable', 'area_construcciones'
  ])

  for (const campo of campos) {
    // Skip checkboxes — they are always valid as boolean true/false
    if (campo.type === 'checkbox') continue

    if (campo.type === 'number') {
      const mustBePositive = noZeroFields.has(campo.name)
      config[campo.name] = {
        required: true,
        validate: (v) => {
          if (v === '' || v === undefined || v === null) return true
          const num = Number(v)
          if (num < 0) return true
          if (mustBePositive && num === 0) return true
          return false
        },
        message: mustBePositive ? 'El valor debe ser mayor a 0' : 'Este campo es obligatorio'
      }
    } else if (campo.type === 'select') {
      config[campo.name] = {
        required: true,
        message: 'Selecciona una opción'
      }
    } else {
      // text, textarea
      config[campo.name] = {
        required: true,
        message: 'Este campo es obligatorio'
      }
    }
  }
  return config
}

/**
 * Validate a single field given its value and rule config.
 * Returns the error message string or null if valid.
 */
export function validateField(value, rule) {
  if (!rule) return null

  // Custom validate function takes priority
  if (rule.validate) {
    if (rule.validate(value)) {
      return rule.message || FALLBACK_MESSAGE
    }
    // If validate passes but field is required and empty, still check required
    if (rule.required && !value && value !== 0 && value !== false) {
      return rule.message || FALLBACK_MESSAGE
    }
    return null
  }

  // Required check
  if (rule.required) {
    if (!value && value !== 0 && value !== false) {
      return rule.message || FALLBACK_MESSAGE
    }
  }

  return null
}

/**
 * Get the error message for a field name given its value.
 * Uses the static config for steps 1-3, or a provided step4 config.
 */
export function getErrorForField(fieldName, value, step4Config = {}) {
  // Search all static steps
  for (const stepKey of ['step1', 'step2', 'step3']) {
    const rule = validationConfig[stepKey][fieldName]
    if (rule) return validateField(value, rule)
  }
  // Check step4 dynamic config
  const rule = step4Config[fieldName]
  if (rule) return validateField(value, rule)

  return null
}


/**
 * useFormValidation — manages touched state, validation errors, and step validation
 * for the PublishProperty multi-step form.
 *
 * @param {Function} getFormValues - Returns current form values as a flat object { fieldName: value }
 * @param {Object} camposPorTipo - The camposPorTipo config from PublishProperty
 * @param {string} tipoInmueble - Current tipo_inmueble value
 */
export function useFormValidation(getFormValues, camposPorTipo = {}, tipoInmueble = 'casa') {
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const step4Config = getStep4Config(camposPorTipo, tipoInmueble)

  /** Get the config for a given step number */
  const getStepConfig = useCallback((stepNumber) => {
    switch (stepNumber) {
      case 1: return validationConfig.step1
      case 2: return validationConfig.step2
      case 3: return validationConfig.step3
      case 4: return step4Config
      default: return {}
    }
  }, [step4Config])

  /** Get field names for a given step */
  const getStepFields = useCallback((stepNumber) => {
    return Object.keys(getStepConfig(stepNumber))
  }, [getStepConfig])

  /** Validate a single field by name, update errors state */
  const runFieldValidation = useCallback((fieldName) => {
    const values = getFormValues()
    const value = values[fieldName]
    const error = getErrorForField(fieldName, value, step4Config)
    setErrors(prev => ({ ...prev, [fieldName]: error }))
    return error
  }, [getFormValues, step4Config])

  /** Mark a field as touched and run validation on it */
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    runFieldValidation(fieldName)
  }, [runFieldValidation])

  /** Mark all given fields as touched */
  const markAllTouched = useCallback((fieldNames) => {
    setTouched(prev => {
      const next = { ...prev }
      for (const name of fieldNames) {
        next[name] = true
      }
      return next
    })
  }, [])

  /** Validate all fields in a step. Returns { isValid, errorCount, errors } */
  const validateStep = useCallback((stepNumber) => {
    const config = getStepConfig(stepNumber)
    const values = getFormValues()
    const stepErrors = {}

    for (const [fieldName, rule] of Object.entries(config)) {
      const value = values[fieldName]
      const error = validateField(value, rule)
      if (error) {
        stepErrors[fieldName] = error
      }
    }

    // Update errors state for all fields in this step
    setErrors(prev => {
      const next = { ...prev }
      for (const fieldName of Object.keys(config)) {
        next[fieldName] = stepErrors[fieldName] || null
      }
      return next
    })

    const errorCount = Object.keys(stepErrors).length
    return { isValid: errorCount === 0, errorCount, errors: stepErrors }
  }, [getStepConfig, getFormValues])

  /** Get the current state for a field: { error, touched } */
  const getFieldState = useCallback((fieldName) => {
    return {
      error: errors[fieldName] || null,
      touched: !!touched[fieldName]
    }
  }, [errors, touched])

  return {
    touched,
    errors,
    handleBlur,
    markAllTouched,
    validateStep,
    getFieldState,
    getStepFields,
    hasAttemptedSubmit,
    setHasAttemptedSubmit
  }
}

export { validationConfig, getStep4Config, FALLBACK_MESSAGE }
