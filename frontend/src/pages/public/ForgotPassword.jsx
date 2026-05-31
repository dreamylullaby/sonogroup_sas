import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, parseApiError } from '../../config/api'
import { validators } from '../../utils/validation'
import '../../styles/pages/Login.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const emailErr = validators.email(email)
    if (emailErr) { setError(emailErr); return }

    setLoading(true)
    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      setSuccess(response.data.mensaje || 'Revisa tu correo electrónico para las instrucciones.')
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Recuperar Contraseña</h1>
          <p className="brand-subtitle">SONOGROUP S.A.S</p>
          <p>Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && <div className="error-message" role="alert">⚠️ {error}</div>}
          {success && <div className="success-message" role="status">✅ {success}</div>}

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!success}
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading || !!success}>
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div className="login-footer">
          <p><Link to="/login">← Volver a Iniciar Sesión</Link></p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword


