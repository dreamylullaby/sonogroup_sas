import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { api, parseApiError } from '../../config/api'
import { validators, validateForm } from '../../utils/validation'
import '../../styles/pages/Contact.css'

const Contact = () => {
  const { user } = useAuth()
  const { t } = usePreferences()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', asunto: '', mensaje: ''
  })

  // Pre-fill from user data when available
  useState(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre || user.nombre_completo || '',
        email: user.email || ''
      }))
      // Fetch full profile for phone
      api.get('/api/usuarios/perfil').then(res => {
        const perfil = res.data.usuario
        if (perfil?.telefono) {
          setFormData(prev => ({ ...prev, telefono: perfil.telefono }))
        }
      }).catch(() => {})
    }
  })

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(false); setFieldErrors({})
    setLoading(true)

    // Validaciones alineadas con BD v3.4
    const { isValid, errors } = validateForm(formData, {
      nombre: [(v) => validators.required(v, 'Nombre')],
      email: [validators.email],
      asunto: [(v) => validators.required(v, 'Asunto')],
      mensaje: [validators.mensaje] // min 10 chars por constraint BD
    })

    if (!isValid) {
      setFieldErrors(errors)
      setError('Corrige los campos marcados')
      setLoading(false)
      return
    }

    try {
      await api.post('/api/contactos-general', formData)
      setSuccess(true)
      setFormData(prev => ({ ...prev, asunto: '', mensaje: '' }))
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1>{t('contactanosTitle')}</h1>
          <p>{t('contactanosDesc')}</p>
        </div>

        <div className="contact-content">
          <div className="contact-form-section">
            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              {error && <div className="error-message" role="alert">{error}</div>}
              {success && <div className="success-message" role="status">{t('mensajeExitoso')}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">{t('nombreLabel')} *</label>
                  <input type="text" id="nombre" name="nombre" value={formData.nombre}
                    onChange={handleChange} disabled={loading} required
                    readOnly={!!user} style={user ? { opacity: 0.7 } : {}}
                    aria-invalid={!!fieldErrors.nombre} />
                  {fieldErrors.nombre && <small className="field-error">{fieldErrors.nombre}</small>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">{t('emailLabel')} *</label>
                  <input type="email" id="email" name="email" value={formData.email}
                    onChange={handleChange} disabled={loading} required
                    readOnly={!!user} style={user ? { opacity: 0.7 } : {}}
                    aria-invalid={!!fieldErrors.email} />
                  {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">{t('telefonoLabel')}</label>
                  <input type="tel" id="telefono" name="telefono" value={formData.telefono}
                    onChange={handleChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label htmlFor="asunto">{t('asuntoLabel')} *</label>
                  <select id="asunto" name="asunto" value={formData.asunto}
                    onChange={handleChange} disabled={loading} required
                    aria-invalid={!!fieldErrors.asunto}>
                    <option value="">{t('seleccionaAsunto')}</option>
                    <option value="consulta-general">{t('consultaGeneral')}</option>
                    <option value="informacion-propiedad">{t('infoPropiedad')}</option>
                    <option value="agendar-visita">{t('agendarVisita')}</option>
                    <option value="cotizacion">{t('cotizacion')}</option>
                    <option value="vender-propiedad">{t('venderPropiedad')}</option>
                    <option value="arrendar-propiedad">{t('arrendarPropiedad')}</option>
                    <option value="asesoria-inversion">{t('asesoriaInversion')}</option>
                    <option value="financiamiento">{t('financiamiento')}</option>
                    <option value="queja-reclamo">{t('quejaReclamo')}</option>
                    <option value="otro">{t('otro')}</option>
                  </select>
                  {fieldErrors.asunto && <small className="field-error">{fieldErrors.asunto}</small>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mensaje">{t('mensajeLabel')} *</label>
                <textarea id="mensaje" name="mensaje" value={formData.mensaje}
                  onChange={handleChange} disabled={loading} rows="6" required
                  aria-invalid={!!fieldErrors.mensaje}
                  placeholder="Escribe tu mensaje (mínimo 10 caracteres)" />
                {fieldErrors.mensaje && <small className="field-error">{fieldErrors.mensaje}</small>}
                <small>{formData.mensaje.length}/10 caracteres mínimo</small>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? t('enviando') : t('enviarMensaje')}
              </button>
            </form>
          </div>

          <div className="contact-info-section">
            <div className="info-card">
              <h3>{t('infoContacto')}</h3>
              <div className="info-item">
                <div><strong>{t('direccion')}</strong><p>Calle Principal 123, Ciudad</p></div>
              </div>
              <div className="info-item">
                <div><strong>{t('telefonoLabel')}</strong><p>+57 300 123 4567</p></div>
              </div>
              <div className="info-item">
                <div><strong>{t('emailLabel')}</strong><p>info@sonogroup.com</p></div>
              </div>
              <div className="info-item">
                <div>
                  <strong>{t('horario')}</strong>
                  <p>{t('horarioSemana')}</p>
                  <p>{t('horarioSabado')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact


