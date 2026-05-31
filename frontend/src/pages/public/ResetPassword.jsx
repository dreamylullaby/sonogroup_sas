import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { api, parseApiError } from '../../config/api'
import { validators } from '../../utils/validation'
import '../../styles/pages/Login.css'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setError('No se proporcionó un token válido.')
      return
    }
    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await api.get(`/api/auth/verify-reset-token?token=${token}`)
      setTokenValid(response.data.valid)
      if (!response.data.valid) {
        setError(response.data.error || 'Token inválido o expirado.')
      }
    } catch (err) {
      setTokenValid(false)
      setError('No se pudo verificar el token.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const passErr = validators.password(password)
    if (passErr) { setError(passErr); return }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/auth/reset-password', { token, password })
      setSuccess(response.data.mensaje || 'Contraseña actualizada exitosamente.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Verificando...</h1>
            <p>Validando tu enlace de recuperación.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Restablecer Contraseña</h1>
          <p className="brand-subtitle">SONOGROUP S.A.S</p>
          {tokenValid && <p>Ingresa tu nueva contraseña.</p>}
        </div>

        {!tokenValid ? (
          <div className="login-form">
            <div className="error-message" role="alert">⚠️ {error}</div>
            <div className="login-footer">
              <p><Link to="/forgot-password">Solicitar un nuevo enlace</Link></p>
              <p><Link to="/login">← Volver a Iniciar Sesión</Link></p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && <div className="error-message" role="alert">⚠️ {error}</div>}
            {success && <div className="success-message" role="status">✅ {success}</div>}

            <div className="form-group">
              <label htmlFor="password">Nueva Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!success}
                required
              />
              <small>Mínimo 6 caracteres</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !!success}
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading || !!success}>
              {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
            </button>

            <div className="login-footer">
              <p><Link to="/login">← Volver a Iniciar Sesión</Link></p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword


