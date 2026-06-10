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
  const [deleteModal, setDeleteModal] = useState(null)

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
    try {
      await api.delete(`/api/inmuebles/${id}`)
      setPublicadas(prev => prev.filter(p => p.id_inmueble !== id))
      setDeleteModal(null)
    } catch (err) {
      setError(parseApiError(err))
      setDeleteModal(null)
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
      pendiente: { label: t('pendiente'), cls: 'badge-pendiente', color: '#D97706', bg: '#FEF3C7' },
      recibido: { label: 'Recibido', cls: 'badge-recibido', color: '#2563EB', bg: '#DBEAFE' },
      aprobado: { label: t('aprobado'), cls: 'badge-aprobado', color: '#059669', bg: '#D1FAE5' },
      rechazado: { label: t('rechazado'), cls: 'badge-rechazado', color: '#DC2626', bg: '#FEE2E2' },
      resuelto: { label: 'Resuelto', cls: 'badge-resuelto', color: '#059669', bg: '#D1FAE5' },
      no_resuelto: { label: 'No resuelto', cls: 'badge-no-resuelto', color: '#DC2626', bg: '#FEE2E2' }
    }
    return map[estado] || { label: estado, cls: '', color: '#666', bg: '#eee' }
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
                      <button className="btn-eliminar" onClick={() => setDeleteModal(p)}>{t('eliminar')}</button>
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
                        {s.tipo_solicitud === 'edicion' && (
                          <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, background: '#EDE9FE', color: '#7C3AED' }}>EDICIÓN</span>
                        )}
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
                      <span className={`estado-badge ${badge.cls}`} style={{ color: badge.color, background: badge.bg, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                        {badge.label}
                      </span>
                      {s.estado_aprobacion === 'rechazado' && s.motivo_rechazo && (
                        <p className="sol-motivo">{t('motivo')} {s.motivo_rechazo}</p>
                      )}
                      {/* Botón reenviar para no_resuelto o rechazado */}
                      {['no_resuelto', 'rechazado'].includes(s.estado_aprobacion) && (
                        <ReenviarButton solicitud={s} onSuccess={cargarDatos} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="myp-modal-overlay">
          <div className="myp-modal">
            <div className="myp-modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC1E2B" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3>¿Solicitar eliminación?</h3>
            <p>Tu solicitud será revisada por un administrador. Si es aprobada, la propiedad será removida del portafolio.</p>
            <div className="myp-modal-actions">
              <button className="myp-modal-btn-delete" onClick={() => eliminarPropiedad(deleteModal.id_inmueble)}>
                Solicitar eliminación
              </button>
              <button className="myp-modal-btn-cancel" onClick={() => setDeleteModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProperties

// Componente para botón de reenvío con verificación de cambios
function ReenviarButton({ solicitud, onSuccess }) {
  const [checking, setChecking] = useState(false)
  const [hayCambios, setHayCambios] = useState(null)
  const [camposModificados, setCamposModificados] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Solo verificar cambios para solicitudes rechazadas con snapshot
    if (solicitud.estado_aprobacion === 'rechazado') {
      setChecking(true)
      api.get(`/api/propiedades-pendientes/${solicitud.id_solicitud}/verificar-cambios`)
        .then(res => {
          setHayCambios(res.data.hayCambios)
          setCamposModificados(res.data.camposModificados || [])
        })
        .catch(() => setHayCambios(true)) // En caso de error, permitir reenvío
        .finally(() => setChecking(false))
    } else {
      // Para no_resuelto, siempre permitir
      setHayCambios(true)
    }
  }, [solicitud])

  const handleReenviar = async () => {
    setSending(true)
    try {
      await api.post(`/api/propiedades-pendientes/${solicitud.id_solicitud}/reenviar`)
      onSuccess()
    } catch (err) {
      alert(parseApiError(err))
    } finally {
      setSending(false)
    }
  }

  if (checking) {
    return <p style={{ fontSize: '11px', color: '#8097B7', marginTop: '6px' }}>Verificando...</p>
  }

  const disabled = hayCambios === false
  const title = disabled ? 'Debes realizar cambios antes de reenviar' : 'Reenviar solicitud para revisión'

  return (
    <button
      onClick={handleReenviar}
      disabled={disabled || sending}
      title={title}
      style={{
        marginTop: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 500,
        background: disabled ? '#e0d8ec' : '#6B3FA0',
        color: disabled ? '#8097B7' : '#fff',
        border: 'none', borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {sending ? 'Reenviando...' : disabled ? '⚠ Realiza cambios para reenviar' : '↻ Reenviar solicitud'}
    </button>
  )
}


