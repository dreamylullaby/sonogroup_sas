import axios from 'axios'

// Configuración de la API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Helper para construir URLs de API
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('/api')) {
    return `${API_URL}${endpoint}`
  }
  return `${API_BASE_URL}${endpoint}`
}

// ============================================================
// ENUMS válidos según BD v3.4
// ============================================================
export const ENUMS = {
  tipo_operacion: ['venta', 'arriendo'],
  tipo_inmueble: ['lote', 'local', 'bodega', 'finca', 'casa', 'apartamento', 'apartaestudio'],
  estado_inmueble: ['nuevo', 'usado', 'remodelado'],
  zona_tipo: ['rural', 'urbano'],
  rol_usuario: ['cliente', 'comisionista', 'admin'],
  estado_aprobacion: ['pendiente', 'aprobado', 'rechazado'],
  estado_contacto: ['pendiente', 'respondido', 'cerrado'],
  tipo_cocina: ['integral', 'semi_integral', 'sencilla'],
  tipo_sala_comedor: ['sala', 'comedor', 'sala_comedor', 'separados'],
  tipo_parqueadero_casa: ['interno', 'externo', 'cubierto', 'descubierto', 'ninguno'],
  tipo_parqueadero_apto: ['privado', 'comun', 'ninguno'],
  tipo_topografia: ['plana', 'inclinada', 'irregular', 'semiondulada', 'ondulada'],
  tipo_via_acceso: ['pavimentada', 'afirmada', 'trocha', 'sin_via'],
  tipo_zona_local: ['comercial', 'residencial', 'mixta'],
  tipo_zona_lavanderia: ['interna', 'externa'],
  unidad_area_finca: ['m2', 'hectareas', 'fanegadas', 'cuadras']
}

// Labels para mostrar en UI
export const ENUM_LABELS = {
  tipo_inmueble: {
    lote: 'Lote', local: 'Local', bodega: 'Bodega',
    finca: 'Finca', casa: 'Casa', apartamento: 'Apartamento', apartaestudio: 'Apartaestudio'
  },
  tipo_operacion: { venta: 'Venta', arriendo: 'Arriendo' },
  estado_inmueble: { nuevo: 'Nuevo', usado: 'Usado', remodelado: 'Remodelado' },
  zona_tipo: { rural: 'Rural', urbano: 'Urbano' },
  rol_usuario: { cliente: 'Cliente', comisionista: 'Comisionista', admin: 'Administrador' }
}

// ============================================================
// Error parser centralizado
// ============================================================
export function parseApiError(error) {
  if (!error.response) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.'
  }

  const status = error.response.status
  const data = error.response.data

  switch (status) {
    case 400:
      return data?.error || 'Datos inválidos. Revisa los campos del formulario.'
    case 401:
      return 'Sesión expirada. Por favor inicia sesión de nuevo.'
    case 403:
      return 'No tienes permisos para realizar esta acción.'
    case 404:
      return data?.error || 'Recurso no encontrado.'
    case 409:
      return data?.error || 'Ya existe un registro con esos datos.'
    case 500:
      return data?.detalles || data?.error || 'Error interno del servidor. Intenta más tarde.'
    default:
      return data?.error || `Error inesperado (${status}).`
  }
}

// ============================================================
// Axios instance configurada
// ============================================================
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es 401, limpiar sesión
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/registro') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
