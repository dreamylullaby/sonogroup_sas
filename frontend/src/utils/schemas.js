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
  descripcion: [(v) => {
    if (!v || v.trim().length === 0) return 'Este campo es obligatorio'
    if (v.trim().length < 10) return 'El título debe tener al menos 10 caracteres'
    if (v.trim().length > 2000) return 'La descripción no puede superar 2000 caracteres'
    return null
  }],
  estado_inmueble: [(v) => {
    if (!v) return 'Selecciona una opción válida'
    if (!ENUMS.estado_inmueble.includes(v)) return 'Estado inválido'
    return null
  }],
  zona: [(v) => {
    if (!v) return 'Selecciona una opción válida'
    if (!ENUMS.zona_tipo.includes(v)) return 'Zona inválida'
    return null
  }],
  estrato: [(v) => {
    if (!v && v !== '0') return 'Selecciona una opción válida'
    return null
  }]
}

export const inmuebleStep3Schema = {
  municipio: [(v) => {
    if (!v) return 'Ingresa el municipio o ciudad'
    if (v.trim().length < 3) return 'Ingresa el municipio o ciudad'
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s''\-]+$/.test(v.trim())) return 'Municipio solo permite letras, espacios y tildes'
    return null
  }],
  departamento: [(v) => {
    if (!v) return 'Selecciona el departamento'
    if (v.trim().length < 2) return 'Selecciona el departamento'
    return null
  }],
  barrio_vereda: [(v) => {
    if (!v || v.trim().length === 0) return 'Este campo es obligatorio'
    if (v.trim().length < 3) return 'El barrio o vereda debe tener al menos 3 caracteres'
    if (v.trim().length > 100) return 'El barrio o vereda no puede superar 100 caracteres'
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-]+$/.test(v.trim())) return 'El barrio solo puede contener letras, números, espacios y guiones'
    return null
  }],
  direccion: [(v) => {
    if (!v || v.trim().length === 0) return 'Este campo es obligatorio'
    if (v.trim().length < 8) return 'La dirección debe tener al menos 8 caracteres'
    if (v.trim().length > 200) return 'La dirección no puede superar 200 caracteres'
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s#.,\-\/]+$/.test(v.trim())) return 'La dirección contiene caracteres no permitidos'
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
