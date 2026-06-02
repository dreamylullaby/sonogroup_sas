import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { validators } from '../../utils/validation'
import '../../styles/pages/Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const emailErr = validators.email(email)
    if (emailErr) { setError(emailErr); setLoading(false); return }
    if (!password) { setError('La contraseña es requerida'); setLoading(false); return }

    const result = await login(email, password)
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{t('iniciarSesionTitle')}</h1>
          <p className="brand-subtitle">SONOGROUP S.A.S</p>
          <p>{t('accedeTuCuenta')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && <div className="error-message" role="alert">⚠️ {error}</div>}

          <div className="form-group">
            <label htmlFor="email">{t('emailLabel')}</label>
            <input type="email" id="email" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
              required aria-invalid={!!error} />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('passwordLabel')}</label>
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} id="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} disabled={loading}
                required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? t('iniciandoSesion') : t('iniciarSesionTitle')}
          </button>

          <div className="forgot-password-link">
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
        </form>

        <div className="login-footer">
          <p>{t('noTienesCuenta')} <Link to="/registro">{t('registrateAqui')}</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login


