import React, { useState, useEffect } from 'react'
import { ENUMS, ENUM_LABELS } from '../../config/api'
import { validators } from '../utils/validation'
import '../../styles/components/UserModal.css'

const UserModal = ({ isOpen, onClose, onSave, user, mode = 'add' }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'cliente'
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        password: '',
        rol: user.rol || 'cliente'
      })
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        rol: 'cliente'
      })
    }
    setError('')
    setFieldErrors({})
  }, [user, mode, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validaciones
    const errors = {}
    const nombreErr = validators.nombre(formData.nombre)
    if (nombreErr) errors.nombre = nombreErr
    const emailErr = validators.email(formData.email)
    if (emailErr) errors.email = emailErr
    const telErr = validators.telefono(formData.telefono)
    if (telErr) errors.telefono = telErr

    if (mode === 'add') {
      const passErr = validators.password(formData.password)
      if (passErr) errors.password = passErr
    } else if (formData.password) {
      if (formData.password.length < 6) errors.password = 'Mínimo 6 caracteres'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Corrige los campos marcados')
      return
    }

    setLoading(true)
    const result = await onSave(formData)
    setLoading(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Error al guardar usuario')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'add' ? '➕ Agregar Usuario' : '✏️ Editar Usuario'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="usuario@ejemplo.com"
              disabled={loading || mode === 'edit'}
              required
            />
            {mode === 'edit' && (
              <small style={{ color: 'var(--text-light)' }}>
                El email no se puede modificar
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="1234567890"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Contraseña {mode === 'add' ? '*' : '(dejar vacío para no cambiar)'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required={mode === 'add'}
            />
            <small style={{ color: 'var(--text-light)' }}>
              Mínimo 6 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="rol">Rol *</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              disabled={loading}
              required
            >
              {ENUMS.rol_usuario.map(rol => (
                <option key={rol} value={rol}>{ENUM_LABELS.rol_usuario[rol]}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={loading}
            >
              {loading ? 'Guardando...' : mode === 'add' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal


