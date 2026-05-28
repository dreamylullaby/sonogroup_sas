// ============================================================
// Schemas de validación por dominio
// Cada schema define las reglas para un formulario específico
// ============================================================
import { validators } from './validation'
import { ENUMS } from '../config/api'

// ── AUTH ─────────────────────────────────────────────────────

export const loginSchema = {
  email: [validators.email],
  password: [(v) => !v ? 'La contraseña es requerida' : null]
}

export const registerSchema = {
  nombre: [validators.nombre],
  email: [validators.email],
  telefono: [validators.telefono],
  numero_identificacion: [(v) => validators.required(v, 'Número de identificación')],
  password: [validators.password]
}

// ── CONTACTO ─────────────────────────────────────────────────

export const contactoSchema = {
  nombre: [(v) => validators.required(v, 'Nombre')],
  email: [validators.email],
  asunto: [(v) => validators.required(v, 'Asunto')],
  mensaje: [validators.mensaje]
}

// ── INMUEBLE (paso a paso) ───────────────────────────────────

export const inmuebleStep1Schema = {
  tipo_inmueble: [(v) => {
    if (!v) return 'Selecciona un tipo de inmueble'
    if (!ENUMS.tipo_inmueble.includes(v)) return 'Tipo de inmueble inválido'
    return null
  }],
  tipo_operacion: [(v) => {
    if (!v) return 'Selecciona tipo de operación'
    if (!ENUMS.tipo_operacion.includes(v)) return 'Tipo de operación inválido'
    return null
  }]
}

export const inmuebleStep2Schema = {
  valor: [validators.valor],
  descripcion: [validators.descripcion],
  estado_inmueble: [(v) => {
    if (v && !ENUMS.estado_inmueble.includes(v)) return 'Estado inválido'
    return null
  }],
  zona: [(v) => {
    if (v && !ENUMS.zona_tipo.includes(v)) return 'Zona inválida'
    return null
  }]
}

export const inmuebleStep3Schema = {
  municipio: [(v) => {
    if (!v) return 'El municipio es requerido'
    if (v.trim().length < 2) return 'Municipio debe tener al menos 2 caracteres'
    return null
  }],
  departamento: [(v) => {
    if (!v) return 'El departamento es requerido'
    if (v.trim().length < 2) return 'Departamento debe tener al menos 2 caracteres'
    return null
  }]
}

// ── USUARIO (admin modal) ────────────────────────────────────

export const usuarioSchema = (mode) => ({
  nombre: [validators.nombre],
  email: [validators.email],
  telefono: [validators.telefono],
  password: mode === 'add'
    ? [validators.password]
    : [(v) => v && v.length < 6 ? 'Mínimo 6 caracteres' : null],
  rol: [(v) => {
    if (!v) return 'El rol es requerido'
    if (!ENUMS.rol_usuario.includes(v)) return 'Rol inválido'
    return null
  }]
})
