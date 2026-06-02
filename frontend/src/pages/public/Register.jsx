import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { validators, validateForm } from '../../utils/validation'
import '../../styles/pages/Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '',
    tipo_identificacion: 'CC', numero_identificacion: '',
    password: '', confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpiar error del campo al escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    // Validaciones alineadas con BD v3.4
    const { isValid, errors } = validateForm(formData, {
      nombre: [validators.nombre],
      email: [validators.email],
      telefono: [validators.telefono],
      numero_identificacion: [(v) => validators.required(v, 'Número de identificación')],
      password: [validators.password]
    })

    if (!isValid) {
      setFieldErrors(errors)
      setError('Corrige los campos marcados')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden' })
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    const result = await register({
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      tipo_identificacion: formData.tipo_identificacion,
      numero_identificacion: formData.numero_identificacion,
      password: formData.password
    })

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>{t('crearCuenta')}</h1>
          <p className="brand-subtitle">SONOGROUP S.A.S</p>
          <p>{t('registrateAcceder')}</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {error && <div className="error-message" role="alert">⚠️ {error}</div>}

          <div className="form-group">
            <label htmlFor="nombre">{t('nombreCompleto')} *</label>
            <input type="text" id="nombre" name="nombre" placeholder="Juan Pérez"
              value={formData.nombre} onChange={handleChange} disabled={loading}
              required aria-invalid={!!fieldErrors.nombre} aria-describedby={fieldErrors.nombre ? 'nombre-error' : undefined} />
            {fieldErrors.nombre && <small id="nombre-error" className="field-error">{fieldErrors.nombre}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('emailLabel')} *</label>
            <input type="email" id="email" name="email" placeholder="tu@email.com"
              value={formData.email} onChange={handleChange} disabled={loading}
              required aria-invalid={!!fieldErrors.email} />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="telefono">{t('telefono')} *</label>
            <input type="tel" id="telefono" name="telefono" placeholder="3001234567"
              value={formData.telefono} onChange={handleChange} disabled={loading}
              required aria-invalid={!!fieldErrors.telefono} />
            {fieldErrors.telefono && <small className="field-error">{fieldErrors.telefono}</small>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo_identificacion">{t('tipoId')} *</label>
              <select id="tipo_identificacion" name="tipo_identificacion"
                value={formData.tipo_identificacion} onChange={handleChange} disabled={loading} required>
                <option value="CC">{t('cedula')}</option>
                <option value="CE">{t('cedulaExt')}</option>
                <option value="NIT">NIT</option>
                <option value="PA">{t('pasaporte')}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="numero_identificacion">{t('numeroId')} *</label>
              <input type="text" id="numero_identificacion" name="numero_identificacion"
                placeholder="123456789" value={formData.numero_identificacion}
                onChange={handleChange} disabled={loading} required
                aria-invalid={!!fieldErrors.numero_identificacion} />
              {fieldErrors.numero_identificacion && <small className="field-error">{fieldErrors.numero_identificacion}</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('passwordLabel')} *</label>
            <input type="password" id="password" name="password" placeholder="••••••••"
              value={formData.password} onChange={handleChange} disabled={loading}
              required aria-invalid={!!fieldErrors.password} />
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
            {!fieldErrors.password && <small>Mínimo 6 caracteres</small>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('confirmarPassword')} *</label>
            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="••••••••"
              value={formData.confirmPassword} onChange={handleChange} disabled={loading}
              required aria-invalid={!!fieldErrors.confirmPassword} />
            {fieldErrors.confirmPassword && <small className="field-error">{fieldErrors.confirmPassword}</small>}
          </div>

          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? t('creandoCuenta') : t('registrarse')}
          </button>
        </form>

        <div className="register-footer">
          <p>{t('yaTienesCuenta')} <Link to="/login">{t('iniciaSesionAqui')}</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Register


