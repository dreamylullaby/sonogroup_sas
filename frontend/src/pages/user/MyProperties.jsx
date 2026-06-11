import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../../context/PreferencesContext'
import { api, parseApiError } from '../../config/api'
import { Search, Trash2, RefreshCw } from 'lucide-react'
import '../../styles/pages/MyProperties.css'

const ITEMS_PER_PAGE = 10

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
  const [hardDeleteModal, setHardDeleteModal] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterOp, setFilterOp] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  // Pagination
  const [pagePub, setPagePub] = useState(1)
  const [pageSol, setPageSol] = useState(1)

  // Soft-deleted items (stored locally per session)
  const [deletedIds, setDeletedIds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('myp_deleted') || '[]') } catch { return [] }
  })

  useEffect(() => { if (user) cargarDatos() }, [user])
  useEffect(() => { sessionStorage.setItem('myp_deleted', JSON.stringify(deletedIds)) }, [deletedIds])

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

  // Soft delete (hide from panel)
  const softDelete = (id, type) => {
    setDeletedIds(prev => [...prev, `${type}-${id}`])
    setDeleteModal(null)
  }

  // Hard delete (from DB)
  const hardDelete = async (id, type) => {
    try {
      if (type === 'pub') {
        await api.delete(`/api/inmuebles/${id}`)
        setPublicadas(prev => prev.filter(p => p.id_inmueble !== id))
      } else {
        await api.delete(`/api/propiedades-pendientes/${id}`)
        setSolicitudes(prev => prev.filter(s => s.id_solicitud !== id))
      }
      setDeletedIds(prev => prev.filter(d => d !== `${type}-${id}`))
      setHardDeleteModal(null)
    } catch (err) {
      setError(parseApiError(err))
      setHardDeleteModal(null)
    }
  }

  // Restore from soft delete
  const restore = (id, type) => {
    setDeletedIds(prev => prev.filter(d => d !== `${type}-${id}`))
  }

  // Filtered publicadas
  const filteredPub = useMemo(() => {
    let items = publicadas
    if (showDeleted) {
      items = items.filter(p => deletedIds.includes(`pub-${p.id_inmueble}`))
    } else {
      items = items.filter(p => !deletedIds.includes(`pub-${p.id_inmueble}`))
    }
    if (search) {
      const q = search.toLowerCase().trim()
      items = items.filter(p => 
        (p.descripcion || '').toLowerCase().includes(q) || 
        (p.ubicaciones?.municipio || '').toLowerCase().includes(q) ||
        (p.tipo_inmueble || '').toLowerCase().includes(q) ||
        String(p.valor || '').includes(q)
      )
    }
    if (filterTipo) items = items.filter(p => p.tipo_inmueble === filterTipo)
    if (filterOp) items = items.filter(p => p.tipo_operacion === filterOp)
    return items
  }, [publicadas, search, filterTipo, filterOp, deletedIds, showDeleted])

  // Filtered solicitudes
  const filteredSol = useMemo(() => {
    let items = solicitudes
    if (showDeleted) {
      items = items.filter(s => deletedIds.includes(`sol-${s.id_solicitud}`))
    } else {
      items = items.filter(s => !deletedIds.includes(`sol-${s.id_solicitud}`))
    }
    if (search) {
      const q = search.toLowerCase().trim()
      items = items.filter(s => {
        const d = s.datos || {}
        return (d.tipo_inmueble || '').toLowerCase().includes(q) || 
          (d.ubicacion?.municipio || '').toLowerCase().includes(q) || 
          (d.descripcion || '').toLowerCase().includes(q) ||
          (d.tipo_operacion || '').toLowerCase().includes(q) ||
          String(d.valor || '').includes(q)
      })
    }
    if (filterTipo) items = items.filter(s => (s.datos?.tipo_inmueble || '') === filterTipo)
    if (filterOp) items = items.filter(s => (s.datos?.tipo_operacion || '') === filterOp)
    if (filterEstado) items = items.filter(s => s.estado_aprobacion === filterEstado)
    return items
  }, [solicitudes, search, filterTipo, filterOp, filterEstado, deletedIds, showDeleted])

  // Pagination
  const totalPagesPub = Math.ceil(filteredPub.length / ITEMS_PER_PAGE)
  const totalPagesSol = Math.ceil(filteredSol.length / ITEMS_PER_PAGE)
  const paginatedPub = filteredPub.slice((pagePub - 1) * ITEMS_PER_PAGE, pagePub * ITEMS_PER_PAGE)
  const paginatedSol = filteredSol.slice((pageSol - 1) * ITEMS_PER_PAGE, pageSol * ITEMS_PER_PAGE)

  const formatPrecio = (v) => v ? '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(v) : '—'
  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  const estadoBadge = (estado) => {
    const map = {
      pendiente: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
      aprobado: { label: 'Aprobado', color: '#059669', bg: '#D1FAE5' },
      rechazado: { label: 'Rechazado', color: '#DC2626', bg: '#FEE2E2' }
    }
    return map[estado] || { label: estado, color: '#666', bg: '#eee' }
  }

  // Reset filters
  const resetFilters = () => { setSearch(''); setFilterTipo(''); setFilterOp(''); setFilterEstado(''); setShowDeleted(false) }

  if (loading) return (
    <div className="myp-loading"><div className="loading-spinner"></div><p>{t('cargandoPropiedades')}</p></div>
  )

  return (
    <div className="myp-page">
      <div className="myp-container">
        <div className="myp-header">
          <div>
            <h1>{t('misPropiedadesTitle')}</h1>
            <p>{t('gestionaTus')}</p>
          </div>
          <button className="btn-nueva" onClick={() => navigate('/publicar')}>+ {t('nuevaPropiedad')}</button>
        </div>

        {error && <div className="myp-error" role="alert">⚠️ {error}</div>}

        {/* TABS */}
        <div className="myp-tabs">
          <button className={`myp-tab ${tab === 'publicadas' ? 'active' : ''}`} onClick={() => { setTab('publicadas'); setPagePub(1) }}>
            {t('publicadas')} ({publicadas.filter(p => !deletedIds.includes(`pub-${p.id_inmueble}`)).length})
          </button>
          <button className={`myp-tab ${tab === 'solicitudes' ? 'active' : ''}`} onClick={() => { setTab('solicitudes'); setPageSol(1) }}>
            {t('misSolicitudes')} ({solicitudes.filter(s => !deletedIds.includes(`sol-${s.id_solicitud}`)).length})
          </button>
        </div>

        {/* FILTERS */}
        <div className="myp-filters">
          <div className="myp-filters-left">
            <div className="myp-search">
              <Search size={14} />
              <input type="text" placeholder="Buscar por tipo, ubicación, descripción..." value={search} onChange={e => { setSearch(e.target.value); setPagePub(1); setPageSol(1) }} />
            </div>
            <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPagePub(1); setPageSol(1) }}>
              <option value="">Tipo</option>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="apartaestudio">Apartaestudio</option>
              <option value="local">Local</option>
              <option value="bodega">Bodega</option>
              <option value="finca">Finca</option>
              <option value="lote">Lote</option>
            </select>
            <select value={filterOp} onChange={e => { setFilterOp(e.target.value); setPagePub(1); setPageSol(1) }}>
              <option value="">Operación</option>
              <option value="venta">Venta</option>
              <option value="arriendo">Arriendo</option>
            </select>
            {tab === 'solicitudes' && (
              <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPageSol(1) }}>
                <option value="">Estado</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            )}
            {(search || filterTipo || filterOp || filterEstado) && (
              <button className="myp-filter-reset" onClick={resetFilters}>Limpiar filtros</button>
            )}
          </div>
          <button className={`myp-deleted-btn ${showDeleted ? 'active' : ''}`} onClick={() => setShowDeleted(!showDeleted)}>
            <Trash2 size={13} />
            {showDeleted ? 'Volver a activos' : 'Ver eliminados'}
          </button>
        </div>

        {/* PUBLICADAS */}
        {tab === 'publicadas' && (
          filteredPub.length === 0 ? (
            <div className="myp-empty">
              <h3>{showDeleted ? 'No hay propiedades eliminadas' : 'No se encontraron propiedades'}</h3>
              <p>{showDeleted ? 'Las propiedades eliminadas aparecerán aquí' : t('enviaUna')}</p>
              {!showDeleted && <button onClick={() => navigate('/publicar')}>{t('publicarPropiedad')}</button>}
            </div>
          ) : (
            <>
              <div className="myp-grid">
                {paginatedPub.map(p => (
                  <div key={p.id_inmueble} className="myp-card">
                    <div className="myp-card-img">
                      {p.fotografias?.[0]?.url_foto ? <img src={p.fotografias[0].url_foto} alt="" /> : <div className="myp-no-img">Sin imagen</div>}
                      <span className="myp-badge-tipo">{p.tipo_inmueble}</span>
                      <span className="myp-badge-op">{p.tipo_operacion}</span>
                    </div>
                    <div className="myp-card-body">
                      <p className="myp-precio">{formatPrecio(p.valor)}</p>
                      {p.ubicaciones && <p className="myp-ubicacion">📍 {p.ubicaciones.municipio || '—'}</p>}
                      {p.descripcion && <p className="myp-desc">{p.descripcion.substring(0, 80)}...</p>}
                      <p className="myp-fecha">{formatFecha(p.fecha_registro)}</p>
                      <div className="myp-actions">
                        <button className="btn-ver" onClick={() => navigate(`/propiedad/${p.id_inmueble}`)}>{t('ver')}</button>
                        {showDeleted ? (
                          <>
                            <button className="btn-restaurar" onClick={() => restore(p.id_inmueble, 'pub')}>Restaurar</button>
                            <button className="btn-eliminar-hard" onClick={() => setHardDeleteModal({ id: p.id_inmueble, type: 'pub' })}>Eliminar definitivo</button>
                          </>
                        ) : (
                          <button className="btn-eliminar" onClick={() => setDeleteModal({ id: p.id_inmueble, type: 'pub' })}>{t('eliminar')}</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPagesPub > 1 && <Pagination page={pagePub} total={totalPagesPub} onChange={setPagePub} />}
            </>
          )
        )}

        {/* SOLICITUDES */}
        {tab === 'solicitudes' && (
          filteredSol.length === 0 ? (
            <div className="myp-empty">
              <h3>{showDeleted ? 'No hay solicitudes eliminadas' : t('noSolicitudes')}</h3>
              <p>{showDeleted ? 'Las solicitudes eliminadas aparecerán aquí' : t('cuandoEnvies')}</p>
              {!showDeleted && <button onClick={() => navigate('/publicar')}>{t('enviarSolicitud')}</button>}
            </div>
          ) : (
            <>
              <div className="myp-solicitudes">
                {paginatedSol.map(s => {
                  const datos = s.datos || {}
                  const badge = estadoBadge(s.estado_aprobacion)
                  return (
                    <div key={s.id_solicitud} className="myp-solicitud-card">
                      <div className="sol-info">
                        <div className="sol-tipo">
                          <span>{datos.tipo_inmueble || '—'}</span>
                          <span className="sol-op">{datos.tipo_operacion || ''}</span>
                          {s.tipo_solicitud === 'edicion' && <span className="sol-badge-edicion">EDICIÓN</span>}
                        </div>
                        <p className="sol-precio">{datos.valor ? formatPrecio(datos.valor) : '—'}</p>
                        <p className="sol-ubicacion">{datos.ubicacion?.municipio || '—'}</p>
                        <p className="sol-fecha">{t('enviado')} {formatFecha(s.fecha_solicitud)}</p>
                      </div>
                      <div className="sol-estado">
                        <span className="estado-badge" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                        {s.estado_aprobacion === 'rechazado' && s.motivo_rechazo && (
                          <p className="sol-motivo">{s.motivo_rechazo}</p>
                        )}
                        {showDeleted ? (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            <button className="btn-restaurar" onClick={() => restore(s.id_solicitud, 'sol')}>Restaurar</button>
                            <button className="btn-eliminar-hard" onClick={() => setHardDeleteModal({ id: s.id_solicitud, type: 'sol' })}>Eliminar</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            {s.estado_aprobacion === 'rechazado' && <ReenviarButton solicitud={s} onSuccess={cargarDatos} />}
                            <button className="btn-eliminar-sm" onClick={() => softDelete(s.id_solicitud, 'sol')}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPagesSol > 1 && <Pagination page={pageSol} total={totalPagesSol} onChange={setPageSol} />}
            </>
          )
        )}
      </div>

      {/* SOFT DELETE MODAL */}
      {deleteModal && (
        <div className="myp-modal-overlay">
          <div className="myp-modal">
            <div className="myp-modal-icon">
              <EyeOff size={22} color="#CC1E2B" />
            </div>
            <h3>¿Ocultar del panel?</h3>
            <p>La propiedad se ocultará de tu lista. Puedes restaurarla desde el filtro "Eliminados" o eliminarla permanentemente.</p>
            <div className="myp-modal-actions">
              <button className="myp-modal-btn-delete" onClick={() => softDelete(deleteModal.id, deleteModal.type)}>Ocultar</button>
              <button className="myp-modal-btn-cancel" onClick={() => setDeleteModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* HARD DELETE MODAL */}
      {hardDeleteModal && (
        <div className="myp-modal-overlay">
          <div className="myp-modal">
            <div className="myp-modal-icon">
              <Trash2 size={22} color="#CC1E2B" />
            </div>
            <h3>¿Eliminar definitivamente?</h3>
            <p>Esta propiedad será eliminada de forma permanente y no podrás recuperarla. ¿Estás seguro?</p>
            <div className="myp-modal-actions">
              <button className="myp-modal-btn-delete" onClick={() => hardDelete(hardDeleteModal.id, hardDeleteModal.type)}>Sí, eliminar</button>
              <button className="myp-modal-btn-cancel" onClick={() => setHardDeleteModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pagination component
function Pagination({ page, total, onChange }) {
  return (
    <div className="myp-pagination">
      <button disabled={page <= 1} onClick={() => onChange(p => p - 1)}>← Anterior</button>
      <span>Página {page} de {total}</span>
      <button disabled={page >= total} onClick={() => onChange(p => p + 1)}>Siguiente →</button>
    </div>
  )
}

// Reenviar button
function ReenviarButton({ solicitud, onSuccess }) {
  const [sending, setSending] = useState(false)

  const handleReenviar = async () => {
    setSending(true)
    try {
      await api.post(`/api/propiedades-pendientes/${solicitud.id_solicitud}/reenviar`)
      onSuccess()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reenviar')
    } finally { setSending(false) }
  }

  return (
    <button onClick={handleReenviar} disabled={sending} className="btn-reenviar">
      <RefreshCw size={11} /> {sending ? '...' : 'Reenviar'}
    </button>
  )
}

export default MyProperties
