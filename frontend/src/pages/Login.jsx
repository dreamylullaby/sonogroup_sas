import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { validators } from '../utils/validation'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
            <input type="password" id="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} disabled={loading}
              required />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? t('iniciandoSesion') : t('iniciarSesionTitle')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('noTienesCuenta')} <Link to="/registro">{t('registrateAqui')}</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login
