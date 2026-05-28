// ============================================================
// Validaciones centralizadas para formularios
// Alineadas con constraints de BD v3.4
// ============================================================

export const validators = {
  // Email: regex igual a la BD
  email: (value) => {
    if (!value) return 'El email es requerido'
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!regex.test(value)) return 'Email inválido'
    return null
  },

  // Password: mínimo 6 caracteres (bcrypt genera hash >= 60)
  password: (value) => {
    if (!value) return 'La contraseña es requerida'
    if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return null
  },

  // Nombre: mínimo 3 caracteres (constraint chk_usuario_nombre)
  nombre: (value) => {
    if (!value) return 'El nombre es requerido'
    if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres'
    return null
  },

  // Teléfono: formato 7-20 dígitos (constraint chk_telefono_format)
  telefono: (value) => {
    if (!value) return null // opcional
    const regex = /^[0-9()+\-\s]{7,20}$/
    if (!regex.test(value)) return 'Teléfono inválido (7-20 caracteres, solo números y símbolos)'
    return null
  },

  // Mensaje de contacto: mínimo 10 caracteres (constraint en BD)
  mensaje: (value) => {
    if (!value) return 'El mensaje es requerido'
    if (value.trim().length < 10) return 'El mensaje debe tener al menos 10 caracteres'
    return null
  },

  // Valor/precio: BD v3.4 constraint: valor >= 200000 AND valor <= 50000000000
  valor: (value) => {
    if (!value) return 'El precio es requerido'
    const num = parseFloat(value)
    if (num < 200000) return 'El precio mínimo es $200.000'
    if (num > 50000000000) return 'El precio máximo es $50.000.000.000'
    return null
  },

  // Descripción inmueble: mínimo 10 si se proporciona (constraint chk_descripcion_min)
  descripcion: (value) => {
    if (!value) return null // opcional
    if (value.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres'
    return null
  },

  // Requerido genérico
  required: (value, fieldName = 'Este campo') => {
    if (!value && value !== 0 && value !== false) return `${fieldName} es requerido`
    return null
  }
}

// Validar un formulario completo
export function validateForm(data, rules) {
  const errors = {}
  for (const [field, validatorFns] of Object.entries(rules)) {
    const fns = Array.isArray(validatorFns) ? validatorFns : [validatorFns]
    for (const fn of fns) {
      const error = fn(data[field])
      if (error) {
        errors[field] = error
        break
      }
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
