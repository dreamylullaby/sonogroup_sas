import { useState, useCallback } from 'react'
import { validateForm } from '../utils/validation'

/**
 * Hook reutilizable para manejo de formularios con validación
 * 
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Object} schema - Schema de validación (campo → [validatorFns])
 * @param {Function} onSubmit - Función async a ejecutar al enviar
 */
export function useForm(initialValues, schema, onSubmit) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [globalSuccess, setGlobalSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setValues(prev => ({ ...prev, [name]: newValue }))

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
    if (globalError) setGlobalError('')
  }, [errors, globalError])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validar campo individual al perder foco
    if (schema && schema[name]) {
      const fns = Array.isArray(schema[name]) ? schema[name] : [schema[name]]
      for (const fn of fns) {
        const error = fn(values[name])
        if (error) {
          setErrors(prev => ({ ...prev, [name]: error }))
          break
        }
      }
    }
  }, [schema, values])

  const validate = useCallback(() => {
    if (!schema) return true
    const { isValid, errors: newErrors } = validateForm(values, schema)
    setErrors(newErrors)
    if (!isValid) {
      setGlobalError('Corrige los campos marcados')
    }
    return isValid
  }, [schema, values])

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault()
    setGlobalError('')
    setGlobalSuccess('')

    if (!validate()) return

    setLoading(true)
    try {
      const result = await onSubmit(values)
      if (result?.success === false) {
        setGlobalError(result.error || 'Error al procesar')
      } else if (result?.message) {
        setGlobalSuccess(result.message)
      }
      return result
    } catch (err) {
      setGlobalError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [values, validate, onSubmit])

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const reset = useCallback((newValues) => {
    setValues(newValues || initialValues)
    setErrors({})
    setGlobalError('')
    setGlobalSuccess('')
    setTouched({})
  }, [initialValues])

  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined
  }), [values, errors, handleChange, handleBlur])

  return {
    values,
    errors,
    touched,
    loading,
    globalError,
    globalSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    setFieldValue,
    setFieldError,
    setGlobalError,
    setGlobalSuccess,
    reset,
    setValues,
    getFieldProps
  }
}
