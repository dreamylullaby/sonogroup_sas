import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../../context/PreferencesContext'
import { api, parseApiError } from '../../config/api'
import '../../styles/pages/MyProperties.css'

const MyProperties = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [tab, setTab] = useState('publicadas')
  const [publicadas, setPublicadas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { if (user) cargarDatos() }, [user])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [pubRes, solRes] = await Promise.all([
        api.get(`/api/inmuebles/usuario/${user.id_usuario}`),
        api.get('/api/propiedades-pendientes/mis-propiedades')
      ])
      setPublicadas(pubRes.data.inmuebles || [])
      setSolicitudes(solRes.data.propiedades || [])
      setError(null)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const eliminarPropiedad = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta propiedad?')) return
    try {
      await api.delete(`/api/inmuebles/${id}`)
      setPublicadas(prev => prev.filter(p => p.id_inmueble !== id))
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  const formatPrecio = (v) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(v)

  const formatFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  const estadoBadge = (estado) => {
    const map = {
      pendiente: { label: t('pendiente'), cls: 'badge-pendiente' },
      aprobado: { label: t('aprobado'), cls: 'badge-aprobado' },
      rechazado: { label: t('rechazado'), cls: 'badge-rechazado' }
    }
    return map[estado] || { label: estado, cls: '' }
  }

  if (loading) return (
    <div className="myp-loading">
      <div className="loading-spinner"></div>
      <p>{t('cargandoPropiedades')}</p>
    </div>
  )

  return (
    <div className="myp-page">
      <div className="myp-container">
        <div className="myp-header">
          <div>
            <h1>{t('misPropiedadesTitle')}</h1>
            <p>{t('gestionaTus')}</p>
          </div>
          <button className="btn-nueva" onClick={() => navigate('/publicar')}>
            + {t('nuevaPropiedad')}
          </button>
        </div>

        {error && <div className="myp-error" role="alert">⚠️ {error}</div>}

        <div className="myp-tabs">
          <button className={`myp-tab ${tab === 'publicadas' ? 'active' : ''}`} onClick={() => setTab('publicadas')}>
            {t('publicadas')} ({publicadas.length})
          </button>
          <button className={`myp-tab ${tab === 'solicitudes' ? 'active' : ''}`} onClick={() => setTab('solicitudes')}>
            {t('misSolicitudes')} ({solicitudes.length})
          </button>
        </div>

        {/* PUBLICADAS */}
        {tab === 'publicadas' && (
          publicadas.length === 0 ? (
            <div className="myp-empty">
              <h3>No tienes propiedades publicadas</h3>
              <p>{t('enviaUna')}</p>
              <button onClick={() => navigate('/publicar')}>{t('publicarPropiedad')}</button>
            </div>
          ) : (
            <div className="myp-grid">
              {publicadas.map(p => (
                <div key={p.id_inmueble} className="myp-card">
                  <div className="myp-card-img">
                    {p.fotografias?.[0]?.url_foto
                      ? <img src={p.fotografias[0].url_foto} alt="propiedad" />
                      : <div className="myp-no-img">Sin imagen</div>
                    }
                    <span className="myp-badge-tipo">{p.tipo_inmueble}</span>
                    <span className="myp-badge-op">{p.tipo_operacion}</span>
                  </div>
                  <div className="myp-card-body">
                    <p className="myp-precio">{formatPrecio(p.valor)}</p>
                    {p.ubicaciones && (
                      <p className="myp-ubicacion">📍 {p.ubicaciones.municipio || '—'}</p>
                    )}
                    {p.descripcion && (
                      <p className="myp-desc">{p.descripcion.substring(0, 90)}{p.descripcion.length > 90 ? '...' : ''}</p>
                    )}
                    <p className="myp-fecha">{formatFecha(p.fecha_registro)}</p>
                    <div className="myp-actions">
                      <button className="btn-ver" onClick={() => navigate(`/propiedad/${p.id_inmueble}`)}>{t('ver')}</button>
                      <button className="btn-eliminar" onClick={() => eliminarPropiedad(p.id_inmueble)}>{t('eliminar')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SOLICITUDES */}
        {tab === 'solicitudes' && (
          solicitudes.length === 0 ? (
            <div className="myp-empty">
              <h3>{t('noSolicitudes')}</h3>
              <p>{t('cuandoEnvies')}</p>
              <button onClick={() => navigate('/publicar')}>{t('enviarSolicitud')}</button>
            </div>
          ) : (
            <div className="myp-solicitudes">
              {solicitudes.map(s => {
                const datos = s.datos || {}
                const badge = estadoBadge(s.estado_aprobacion)
                return (
                  <div key={s.id_solicitud} className="myp-solicitud-card">
                    <div className="sol-info">
                      <div className="sol-tipo">
                        <span>{datos.tipo_inmueble || '—'}</span>
                        <span className="sol-op">{datos.tipo_operacion || ''}</span>
                      </div>
                      <p className="sol-precio">{datos.valor ? formatPrecio(datos.valor) : '—'}</p>
                      <p className="sol-ubicacion">
                        {datos.ubicacion?.municipio || '—'}
                        {datos.ubicacion?.barrio_vereda ? ` · ${datos.ubicacion.barrio_vereda}` : ''}
                      </p>
                      {datos.descripcion && (
                        <p className="sol-desc">{datos.descripcion.substring(0, 100)}{datos.descripcion.length > 100 ? '...' : ''}</p>
                      )}
                      <p className="sol-fecha">{t('enviado')} {formatFecha(s.fecha_solicitud)}</p>
                    </div>
                    <div className="sol-estado">
                      <span className={`estado-badge ${badge.cls}`}>{badge.label}</span>
                      {s.estado_aprobacion === 'rechazado' && s.motivo_rechazo && (
                        <p className="sol-motivo">{t('motivo')} {s.motivo_rechazo}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default MyProperties


