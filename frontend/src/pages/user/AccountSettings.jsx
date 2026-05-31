import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useNavigate } from 'react-router-dom'
import { api, parseApiError } from '../../config/api'
import '../../styles/pages/AccountSettings.css'

const AccountSettings = () => {
  const { user, logout } = useAuth()
  const { tema, idioma, t, cambiarTema, cambiarIdioma } = usePreferences()
  const navigate = useNavigate()
  const [tab, setTab] = useState('seguridad')

  // Seguridad
  const [pwd, setPwd] = useState({ actual: '', nuevo: '', confirmar: '' })
  const [pwdMsg, setPwdMsg] = useState(null)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [dos_pasos, setDosPasos] = useState(false)

  // Configuración
  const [config, setConfig] = useState({
    idioma: idioma, tema: tema,
    notificaciones_email: true, notificaciones_app: true,
    perfil_publico: true, permitir_contacto: true, ocultar_informacion: false
  })
  const [configMsg, setConfigMsg] = useState(null)
  const [configLoading, setConfigLoading] = useState(false)

  // Sesiones
  const [sesiones, setSesiones] = useState([])

  // Modal eliminar cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMsg, setDeleteMsg] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [cfgRes, segRes, sesRes] = await Promise.all([
        api.get('/api/configuracion'),
        api.get('/api/configuracion/seguridad'),
        api.get('/api/configuracion/sesiones')
      ])
      const c = cfgRes.data.configuracion
      if (c) setConfig({
        idioma: c.idioma || 'es',
        tema: c.tema || 'claro',
        notificaciones_email: c.notificaciones_email ?? true,
        notificaciones_app: c.notificaciones_app ?? true,
        perfil_publico: c.perfil_publico ?? true,
        permitir_contacto: c.permitir_contacto ?? true,
        ocultar_informacion: c.ocultar_informacion ?? false
      })
      setDosPasos(segRes.data.seguridad?.verificacion_dos_pasos ?? false)
      setSesiones(sesRes.data.sesiones || [])
    } catch { /* silencioso */ }
  }

  // ── CONTRASEÑA ──────────────────────────────────────────────
  const handlePassword = async (e) => {
    e.preventDefault()
    setPwdMsg(null)
    if (pwd.nuevo !== pwd.confirmar) return setPwdMsg({ tipo: 'error', texto: 'Las contraseñas no coinciden' })
    setPwdLoading(true)
    try {
      await api.put('/api/configuracion/seguridad/password', {
        password_actual: pwd.actual, password_nuevo: pwd.nuevo
      })
      setPwdMsg({ tipo: 'ok', texto: 'Contraseña actualizada correctamente' })
      setPwd({ actual: '', nuevo: '', confirmar: '' })
    } catch (err) {
      setPwdMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al actualizar' })
    } finally { setPwdLoading(false) }
  }

  // ── 2FA ─────────────────────────────────────────────────────
  const toggle2FA = async (val) => {
    setDosPasos(val)
    try { await api.put('/api/configuracion/seguridad/2fa', { verificacion_dos_pasos: val }) }
    catch { setDosPasos(!val) }
  }

  // ── CONFIGURACIÓN ────────────────────────────────────────────
  const handleConfig = async (campo, valor) => {
    const nuevo = { ...config, [campo]: valor }
    setConfig(nuevo)
    // Aplicar inmediatamente al DOM
    if (campo === 'tema') cambiarTema(valor)
    if (campo === 'idioma') cambiarIdioma(valor)
    try { await api.put('/api/configuracion', nuevo) }
    catch { setConfig(config) }
  }

  const guardarConfig = async () => {
    setConfigLoading(true)
    setConfigMsg(null)
    try {
      await api.put('/api/configuracion', config)
      setConfigMsg({ tipo: 'ok', texto: 'Configuración guardada' })
    } catch {
      setConfigMsg({ tipo: 'error', texto: 'Error al guardar' })
    } finally { setConfigLoading(false) }
  }

  // ── SESIONES ─────────────────────────────────────────────────
  const cerrarSesion = async (id) => {
    try {
      await api.delete(`/api/configuracion/sesiones/${id}`)
      setSesiones(prev => prev.filter(s => s.id_sesion !== id))
    } catch { alert('Error al cerrar sesión') }
  }

  const cerrarTodas = async () => {
    if (!window.confirm('¿Cerrar todas las sesiones excepto la actual?')) return
    try {
      await api.delete('/api/configuracion/sesiones', { data: {} })
      await cargarDatos()
    } catch { alert('Error') }
  }

  // ── ELIMINAR CUENTA ──────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteMsg(null)
    setDeleteLoading(true)
    try {
      // Crear solicitud de eliminación (flujo con revisión admin según BD v3.4)
      await api.post('/api/solicitudes-cuenta', {
        motivo: 'Solicitud del usuario desde configuración de cuenta'
      })
      setShowDeleteModal(false)
      setDeletePassword('')
      alert('Tu solicitud de eliminación ha sido enviada. Un administrador la revisará.')
    } catch (err) {
      setDeleteMsg(parseApiError(err))
    } finally { setDeleteLoading(false) }
  }

  const formatFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="settings-page">
      <div className="settings-container">

        <div className="settings-header">
          <h1>{t('configuracionTitle')}</h1>
          <p>{t('configuracionDesc')}</p>
        </div>

        <div className="settings-layout">

          {/* SIDEBAR */}
          <nav className="settings-nav">
            {[
              { id: 'seguridad', label: t('seguridad'), icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
              { id: 'preferencias', label: t('preferencias'), icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
              { id: 'privacidad', label: t('privacidad'), icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> }
            ].map(item => (
              <button key={item.id} className={`settings-nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                {item.label}
              </button>
            ))}
            <div className="settings-nav-divider"/>
            <button className="settings-nav-item danger" onClick={() => setShowDeleteModal(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {t('eliminarCuenta')}
            </button>
          </nav>

          {/* CONTENT */}
          <div className="settings-content">

            {/* ── SEGURIDAD ── */}
            {tab === 'seguridad' && (
              <div className="settings-sections">

                <div className="settings-card">
                  <h2>Cambiar contraseña</h2>
                  <form onSubmit={handlePassword} className="pwd-form">
                    {pwdMsg && <div className={`settings-msg ${pwdMsg.tipo}`}>{pwdMsg.texto}</div>}
                    <div className="form-group">
                      <label>Contraseña actual</label>
                      <input type="password" value={pwd.actual} onChange={e => setPwd({...pwd, actual: e.target.value})} placeholder="••••••••" required/>
                    </div>
                    <div className="form-group">
                      <label>Nueva contraseña</label>
                      <input type="password" value={pwd.nuevo} onChange={e => setPwd({...pwd, nuevo: e.target.value})} placeholder="••••••••" required/>
                    </div>
                    <div className="form-group">
                      <label>Confirmar nueva contraseña</label>
                      <input type="password" value={pwd.confirmar} onChange={e => setPwd({...pwd, confirmar: e.target.value})} placeholder="••••••••" required/>
                    </div>
                    <button type="submit" className="btn-save" disabled={pwdLoading}>
                      {pwdLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </form>
                </div>

                <div className="settings-card">
                  <h2>Verificación en dos pasos</h2>
                  <p className="settings-desc">Añade una capa extra de seguridad a tu cuenta.</p>
                  <div className="toggle-row">
                    <span>Activar verificación en dos pasos</span>
                    <Toggle value={dos_pasos} onChange={toggle2FA}/>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-header-row">
                    <h2>Dispositivos conectados</h2>
                    {sesiones.length > 1 && (
                      <button className="btn-link-danger" onClick={cerrarTodas}>Cerrar todas</button>
                    )}
                  </div>
                  {sesiones.length === 0 ? (
                    <p className="settings-desc">No hay sesiones activas registradas.</p>
                  ) : (
                    <div className="sesiones-list">
                      {sesiones.map(s => (
                        <div key={s.id_sesion} className="sesion-item">
                          <div className="sesion-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                          </div>
                          <div className="sesion-info">
                            <p className="sesion-device">{s.dispositivo || 'Dispositivo desconocido'} · {s.navegador || '—'}</p>
                            <p className="sesion-meta">
                              {s.direccion_ip || '—'} · {[s.ciudad, s.pais].filter(Boolean).join(', ') || 'Ubicación desconocida'}
                            </p>
                            <p className="sesion-fecha">Última actividad: {formatFecha(s.ultima_actividad)}</p>
                          </div>
                          <button className="btn-cerrar-sesion" onClick={() => cerrarSesion(s.id_sesion)}>Cerrar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PREFERENCIAS ── */}
            {tab === 'preferencias' && (
              <div className="settings-sections">
                <div className="settings-card">
                  <h2>Preferencias</h2>
                  {configMsg && <div className={`settings-msg ${configMsg.tipo}`}>{configMsg.texto}</div>}

                  <div className="pref-group">
                    <label>Idioma</label>
                    <select value={config.idioma} onChange={e => handleConfig('idioma', e.target.value)}>
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="pref-group">
                    <label>Tema visual</label>
                    <div className="tema-options">
                      {['claro', 'oscuro'].map(temaOpt => (
                        <button key={temaOpt} className={`tema-btn ${config.tema === temaOpt ? 'active' : ''}`} onClick={() => handleConfig('tema', temaOpt)}>
                          {temaOpt === 'claro'
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                          }
                          {temaOpt === 'claro' ? t('modoClaro') : t('modoOscuro')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pref-group">
                    <label>Notificaciones</label>
                    <div className="toggle-row">
                      <span>Recibir notificaciones por correo</span>
                      <Toggle value={config.notificaciones_email} onChange={v => handleConfig('notificaciones_email', v)}/>
                    </div>
                    <div className="toggle-row">
                      <span>Notificaciones dentro de la plataforma</span>
                      <Toggle value={config.notificaciones_app} onChange={v => handleConfig('notificaciones_app', v)}/>
                    </div>
                  </div>

                  <button className="btn-save" onClick={guardarConfig} disabled={configLoading}>
                    {configLoading ? 'Guardando...' : 'Guardar preferencias'}
                  </button>
                </div>
              </div>
            )}

            {/* ── PRIVACIDAD ── */}
            {tab === 'privacidad' && (
              <div className="settings-sections">
                <div className="settings-card">
                  <h2>Privacidad</h2>
                  {configMsg && <div className={`settings-msg ${configMsg.tipo}`}>{configMsg.texto}</div>}

                  <div className="toggle-row">
                    <div>
                      <p className="toggle-label">Perfil público</p>
                      <p className="toggle-desc">Tu perfil será visible para otros usuarios</p>
                    </div>
                    <Toggle value={config.perfil_publico} onChange={v => handleConfig('perfil_publico', v)}/>
                  </div>

                  <div className="toggle-row">
                    <div>
                      <p className="toggle-label">Permitir contacto</p>
                      <p className="toggle-desc">Otros usuarios pueden contactarte desde tus publicaciones</p>
                    </div>
                    <Toggle value={config.permitir_contacto} onChange={v => handleConfig('permitir_contacto', v)}/>
                  </div>

                  <div className="toggle-row">
                    <div>
                      <p className="toggle-label">Ocultar información personal</p>
                      <p className="toggle-desc">Oculta teléfono y correo en tus publicaciones</p>
                    </div>
                    <Toggle value={config.ocultar_informacion} onChange={v => handleConfig('ocultar_informacion', v)}/>
                  </div>

                  <button className="btn-save" onClick={guardarConfig} disabled={configLoading}>
                    {configLoading ? 'Guardando...' : 'Guardar privacidad'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL ELIMINAR CUENTA */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-delete" onClick={e => e.stopPropagation()}>
            <div className="modal-delete-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Eliminar cuenta</h3>
            <p>Tu solicitud será revisada por un administrador. Si es aprobada, tu cuenta quedará desactivada.</p>
            {deleteMsg && <div className="settings-msg error">{deleteMsg}</div>}
            <div className="modal-delete-actions">
              <button className="btn-cancel" onClick={() => { setShowDeleteModal(false); setDeleteMsg(null) }}>
                Cancelar
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? 'Enviando...' : 'Solicitar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Toggle reutilizable
const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    className={`toggle-switch ${value ? 'on' : ''}`}
    onClick={() => onChange(!value)}
    aria-checked={value}
    role="switch"
  >
    <span className="toggle-thumb"/>
  </button>
)

export default AccountSettings


