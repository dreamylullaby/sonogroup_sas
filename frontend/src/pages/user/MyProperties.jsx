import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../../context/PreferencesContext'
import { api, parseApiError } from '../../config/api'
import { Search, Trash2, Eye, X, EyeOff, Edit3 } from 'lucide-react'
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
  const [filterTipoSol, setFilterTipoSol] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [solDetailModal, setSolDetailModal] = useState(null)
  const [solDetailProperty, setSolDetailProperty] = useState(null)
  const [solDetailLoading, setSolDetailLoading] = useState(false)

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
          (d.motivo || '').toLowerCase().includes(q) ||
          (d.tipo_operacion || '').toLowerCase().includes(q) ||
          String(d.valor || '').includes(q) ||
          String(s.id_inmueble || '').includes(q)
      })
    }
    if (filterTipo) items = items.filter(s => (s.datos?.tipo_inmueble || '') === filterTipo)
    if (filterOp) items = items.filter(s => (s.datos?.tipo_operacion || '') === filterOp)
    if (filterEstado) items = items.filter(s => s.estado_aprobacion === filterEstado)
    if (filterTipoSol) items = items.filter(s => (s.tipo_solicitud || 'publicacion') === filterTipoSol)
    return items
  }, [solicitudes, search, filterTipo, filterOp, filterEstado, filterTipoSol, deletedIds, showDeleted])

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

  // Open solicitud detail modal
  const openSolDetail = async (solicitud) => {
    setSolDetailModal(solicitud)
    setSolDetailProperty(null)
    // If has id_inmueble, fetch property data
    if (solicitud.id_inmueble) {
      setSolDetailLoading(true)
      try {
        const res = await api.get(`/api/inmuebles/${solicitud.id_inmueble}`)
        setSolDetailProperty(res.data)
      } catch { setSolDetailProperty(null) }
      finally { setSolDetailLoading(false) }
    }
  }

  // Reset filters
  const resetFilters = () => { setSearch(''); setFilterTipo(''); setFilterOp(''); setFilterEstado(''); setFilterTipoSol(''); setShowDeleted(false) }

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
            {tab === 'solicitudes' && (
              <select value={filterTipoSol} onChange={e => { setFilterTipoSol(e.target.value); setPageSol(1) }}>
                <option value="">Tipo solicitud</option>
                <option value="publicacion">Publicación</option>
                <option value="edicion">Edición</option>
                <option value="revision_edicion">Revisión cambios</option>
                <option value="eliminacion">Eliminación</option>
              </select>
            )}
            {(search || filterTipo || filterOp || filterEstado || filterTipoSol) && (
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
                  const tipoSol = s.tipo_solicitud || 'publicacion'
                  const tipoSolConf = { publicacion: { label: 'Publicación', color: '#2563EB', bg: '#DBEAFE' }, edicion: { label: 'Edición', color: '#7C3AED', bg: '#EDE9FE' }, revision_edicion: { label: 'Rev. cambios', color: '#B45309', bg: '#FEF3C7' }, eliminacion: { label: 'Eliminación', color: '#991B1B', bg: '#FEE2E2' } }[tipoSol] || { label: tipoSol, color: '#666', bg: '#eee' }
                  return (
                    <div key={s.id_solicitud} className="myp-solicitud-card">
                      <div className="sol-info">
                        <div className="sol-tipo" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 7px', borderRadius: '8px', fontSize: '9px', fontWeight: 600, color: tipoSolConf.color, background: tipoSolConf.bg, textTransform: 'uppercase' }}>{tipoSolConf.label}</span>
                          {s.estado_aprobacion === 'pendiente' && s.motivo_rechazo && (
                            <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: 600, background: '#FEF3C7', color: '#B45309', textTransform: 'uppercase' }}>↻ Reenvío</span>
                          )}
                          {tipoSol === 'publicacion' && datos.tipo_inmueble && <span style={{ textTransform: 'capitalize', fontWeight: 500, fontSize: '13px' }}>{datos.tipo_inmueble}</span>}
                          {tipoSol === 'publicacion' && datos.tipo_operacion && <span className="sol-op">{datos.tipo_operacion}</span>}
                          {(tipoSol === 'edicion' || tipoSol === 'revision_edicion') && s.id_inmueble && <span style={{ fontSize: '12px', color: '#5A4864' }}>Propiedad #{s.id_inmueble}</span>}
                          {tipoSol === 'eliminacion' && s.id_inmueble && <span style={{ fontSize: '12px', color: '#5A4864' }}>Propiedad #{s.id_inmueble}</span>}
                          {tipoSol === 'eliminacion' && datos.tipo_inmueble && <span style={{ textTransform: 'capitalize', fontSize: '12px', color: '#5A4864' }}> · {datos.tipo_inmueble}</span>}
                        </div>
                        {tipoSol === 'publicacion' && <p className="sol-precio">{datos.valor ? formatPrecio(datos.valor) : '—'}</p>}
                        {tipoSol === 'publicacion' && <p className="sol-ubicacion">{datos.ubicacion?.municipio || '—'}{datos.ubicacion?.barrio_vereda ? ` · ${datos.ubicacion.barrio_vereda}` : ''}</p>}
                        {tipoSol === 'edicion' && <p style={{ fontSize: '12px', color: '#5A4864', fontStyle: 'italic', margin: '4px 0 0' }}>"{datos.motivo || 'Solicitud de edición'}"</p>}
                        {tipoSol === 'revision_edicion' && <p style={{ fontSize: '12px', color: '#5A4864', margin: '4px 0 0' }}>Cambios enviados para revisión</p>}
                        {tipoSol === 'eliminacion' && (
                          <>
                            {datos.valor && <p className="sol-precio">{formatPrecio(datos.valor)}</p>}
                            {datos.motivo && <p style={{ fontSize: '12px', color: '#991B1B', fontStyle: 'italic', margin: '4px 0 0' }}>"{datos.motivo}"</p>}
                          </>
                        )}
                        <p className="sol-fecha">{t('enviado')} {formatFecha(s.fecha_solicitud)}</p>
                      </div>
                      <div className="sol-estado">
                        <span className="estado-badge" style={{ color: badge.color, background: badge.bg, padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>{badge.label}</span>
                        {s.estado_aprobacion === 'rechazado' && s.motivo_rechazo && s.motivo_rechazo !== 'completada' && s.motivo_rechazo !== 'en_revision' && (
                          <p className="sol-motivo" style={{ fontSize: '11px', color: '#991B1B', marginTop: '4px' }}>{s.motivo_rechazo}</p>
                        )}
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', alignItems: 'center' }}>
                          <button className="btn-ver-detail" onClick={() => openSolDetail(s)} title="Ver detalles" style={{ padding: '4px 8px', fontSize: '11px', background: '#F3EEFF', color: '#6B3FA0', border: '1px solid #E0D8EC', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Eye size={11} /> Ver
                          </button>
                          {showDeleted ? (
                            <>
                              <button className="btn-restaurar" onClick={() => restore(s.id_solicitud, 'sol')}>Restaurar</button>
                              <button className="btn-eliminar-hard" onClick={() => setHardDeleteModal({ id: s.id_solicitud, type: 'sol' })}>Eliminar</button>
                            </>
                          ) : (
                            <>
                              {s.estado_aprobacion === 'rechazado' && tipoSol === 'publicacion' && (
                                <button onClick={() => navigate('/publicar', { state: { reenvioSolicitud: s } })} title="Editar y reenviar" style={{ padding: '4px 8px', fontSize: '10px', background: '#F3EEFF', color: '#6B3FA0', border: '1px solid #E0D8EC', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Edit3 size={10} /> Editar y reenviar
                                </button>
                              )}
                              <button className="btn-eliminar-sm" onClick={() => setDeleteModal({ id: s.id_solicitud, type: 'sol' })}><Trash2 size={12} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPagesSol > 1 && <Pagination page={pageSol} total={totalPagesSol} onChange={setPageSol} />}
            </>
          )
        )}

        {/* SOLICITUD DETAIL MODAL */}
        {solDetailModal && (
          <SolicitudDetailModalUser
            solicitud={solDetailModal}
            property={solDetailProperty}
            loading={solDetailLoading}
            onClose={() => { setSolDetailModal(null); setSolDetailProperty(null) }}
          />
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



export default MyProperties

// Detail modal for user's solicitudes
function SolicitudDetailModalUser({ solicitud, property, loading, onClose }) {
  if (!solicitud) return null
  const datos = solicitud.datos || {}
  const tipoSol = solicitud.tipo_solicitud || 'publicacion'
  const formatPrice = (v) => v ? '$ ' + Number(v).toLocaleString('es-CO') : '—'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  const estadoConf = { pendiente: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' }, aprobado: { label: 'Aprobado', color: '#059669', bg: '#D1FAE5' }, rechazado: { label: 'Rechazado', color: '#DC2626', bg: '#FEE2E2' } }[solicitud.estado_aprobacion] || { label: solicitud.estado_aprobacion, color: '#666', bg: '#eee' }
  const tipoConf = { publicacion: { label: 'Publicación', color: '#2563EB', bg: '#DBEAFE' }, edicion: { label: 'Edición', color: '#7C3AED', bg: '#EDE9FE' }, revision_edicion: { label: 'Revisión cambios', color: '#B45309', bg: '#FEF3C7' }, eliminacion: { label: 'Eliminación', color: '#991B1B', bg: '#FEE2E2' } }[tipoSol] || { label: tipoSol, color: '#666', bg: '#eee' }

  // Para publicacion, datos tiene toda la info del formulario
  // Para edicion/revision_edicion, se carga la property por API
  const propData = tipoSol === 'publicacion' ? datos : property
  const c = tipoSol === 'publicacion' ? (datos.caracteristicas || {}) : (property?.caracteristicas || {})
  const u = tipoSol === 'publicacion' ? (datos.ubicacion || {}) : (property?.ubicaciones || {})

  const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f4f0f8' }
  const labelStyle = { fontSize: '10px', color: '#8097B7', fontWeight: 500 }
  const valueStyle = { fontSize: '11px', color: '#241929', fontWeight: 500 }
  const sectionLabel = { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#5A4864', marginBottom: '6px' }

  // Amenidades
  const amenities = []
  if (c.balcon) amenities.push('Balcón')
  if (c.ascensor) amenities.push('Ascensor')
  if (c.vigilancia) amenities.push('Vigilancia')
  if (c.patio) amenities.push('Patio')
  if (c.jardin) amenities.push('Jardín')
  if (c.terraza) amenities.push('Terraza')
  if (c.chimenea) amenities.push('Chimenea')
  if (c.deposito) amenities.push('Depósito')
  if (c.piscina) amenities.push('Piscina')
  if (c.zona_lavanderia) amenities.push('Zona lavandería')
  if (c.cocina_equipada) amenities.push('Cocina equipada')
  if (c.cuarto_servicio) amenities.push('Cuarto servicio')
  if (c.bano_servicio) amenities.push('Baño servicio')
  if (c.amoblado) amenities.push('Amoblado')
  if (c.banos === true) amenities.push('Baño privado')
  if (c.jacuzzi) amenities.push('Jacuzzi')
  if (c.cancha) amenities.push('Cancha')
  if (c.parqueadero) amenities.push('Parqueadero')
  if (c.antejadin) amenities.push('Antejardín')
  if (c.casa_principal) amenities.push('Casa principal')
  if (c.lago_estanque) amenities.push('Lago/Estanque')
  if (c.mezzanine) amenities.push('Mezanine')
  if (c.vitrina) amenities.push('Vitrina')
  if (c.sotano) amenities.push('Sótano')
  if (c.oficinas) amenities.push('Oficinas')
  if (c.vestier) amenities.push('Vestier')
  if (c.rampa_cargue) amenities.push('Rampa cargue')
  if (c.acceso_camiones) amenities.push('Acceso camiones')
  if (c.cabana_mayordomo) amenities.push('Cabaña mayordomo')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflow: 'auto', border: '0.5px solid #e0d8ec' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#241929', margin: '0 0 6px' }}>Solicitud #{solicitud.id_solicitud}</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 600, color: tipoConf.color, background: tipoConf.bg, textTransform: 'uppercase' }}>{tipoConf.label}</span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 600, color: estadoConf.color, background: estadoConf.bg, textTransform: 'uppercase' }}>{estadoConf.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8097B7' }}><X size={18} /></button>
        </div>

        <p style={{ fontSize: '11px', color: '#8097B7', marginBottom: '14px' }}>Enviada el {formatDate(solicitud.fecha_solicitud)}</p>

        {/* Indicador de reenvío con correcciones */}
        {solicitud.estado_aprobacion === 'pendiente' && solicitud.motivo_rechazo && (
          <div style={{ marginBottom: '14px', padding: '8px 12px', background: '#FEF3C7', borderRadius: '8px', borderLeft: '3px solid #B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>↻</span>
            <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 500 }}>Reenvío con correcciones — fue rechazada anteriormente y se corrigió según las observaciones del admin</span>
          </div>
        )}

        {/* Motivo de rechazo del admin (PROMINENTE) */}
        {solicitud.estado_aprobacion === 'rechazado' && solicitud.motivo_rechazo && solicitud.motivo_rechazo !== 'completada' && solicitud.motivo_rechazo !== 'en_revision' && (
          <div style={{ marginBottom: '14px', padding: '12px', background: '#FEE2E2', borderRadius: '8px', borderLeft: '4px solid #DC2626' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', marginBottom: '4px' }}>Respuesta del administrador</p>
            <p style={{ fontSize: '13px', color: '#991B1B', margin: 0, lineHeight: 1.5 }}>{solicitud.motivo_rechazo}</p>
            {solicitud.fecha_rechazo && <p style={{ fontSize: '10px', color: '#B91C1C', marginTop: '6px', opacity: 0.7 }}>Rechazada el {formatDate(solicitud.fecha_rechazo)}</p>}
          </div>
        )}

        {/* Justificación para edición */}
        {tipoSol === 'edicion' && datos.motivo && (
          <div style={{ marginBottom: '14px', padding: '12px', background: '#F3EEFF', borderRadius: '8px', borderLeft: '4px solid #7C3AED' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', marginBottom: '4px' }}>Tu justificación</p>
            <p style={{ fontSize: '13px', color: '#241929', margin: 0, lineHeight: 1.5 }}>{datos.motivo}</p>
          </div>
        )}

        {tipoSol === 'revision_edicion' && (
          <div style={{ marginBottom: '14px', padding: '10px', background: '#FEF3C7', borderRadius: '8px', borderLeft: '4px solid #B45309' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#B45309', textTransform: 'uppercase', marginBottom: '2px' }}>Estado</p>
            <p style={{ fontSize: '12px', color: '#78350F', margin: 0 }}>Cambios enviados para revisión del administrador.</p>
          </div>
        )}

        {/* INFORMACIÓN DE LA PROPIEDAD */}
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8097B7', fontSize: '12px' }}>Cargando información de la propiedad...</div>
        ) : (propData || tipoSol === 'publicacion') ? (
          <div style={{ background: '#F9F7FB', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Precio y tipo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#241929' }}>{formatPrice(propData?.valor)}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(propData?.tipo_inmueble || datos.tipo_inmueble) && <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, background: '#DBEAFE', color: '#2563EB', textTransform: 'capitalize' }}>{propData?.tipo_inmueble || datos.tipo_inmueble}</span>}
                {(propData?.tipo_operacion || datos.tipo_operacion) && <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, background: '#D1FAE5', color: '#059669', textTransform: 'capitalize' }}>{propData?.tipo_operacion || datos.tipo_operacion}</span>}
              </div>
            </div>

            {/* Administración */}
            {propData?.valor_administracion > 0 && <div style={{ fontSize: '11px', color: '#5A4864' }}>Administración: {formatPrice(propData.valor_administracion)}/mes</div>}

            {/* Ubicación */}
            {(u.municipio || u.direccion) && (
              <div>
                <div style={sectionLabel}>UBICACIÓN</div>
                <p style={{ fontSize: '12px', color: '#5A4864', margin: 0 }}>
                  📍 {u.direccion && `${u.direccion}, `}{u.barrio_vereda && `${u.barrio_vereda}, `}{u.municipio || ''}{u.departamento && u.departamento !== 'Colombia' ? `, ${u.departamento}` : ''}
                </p>
              </div>
            )}

            {/* Info general */}
            <div>
              <div style={sectionLabel}>INFORMACIÓN GENERAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {(propData?.estrato || datos.estrato) && <div style={rowStyle}><span style={labelStyle}>Estrato</span><span style={valueStyle}>{propData?.estrato || datos.estrato}</span></div>}
                {(propData?.zona || datos.zona) && <div style={rowStyle}><span style={labelStyle}>Zona</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{propData?.zona || datos.zona}</span></div>}
                {(propData?.estado_inmueble || datos.estado_inmueble) && <div style={rowStyle}><span style={labelStyle}>Estado</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{propData?.estado_inmueble || datos.estado_inmueble}</span></div>}
                {(propData?.acepta_permuta || datos.acepta_permuta) && <div style={rowStyle}><span style={labelStyle}>Permuta</span><span style={valueStyle}>Acepta</span></div>}
                {propData?.numero_matricula && <div style={rowStyle}><span style={labelStyle}>Matrícula</span><span style={valueStyle}>{propData.numero_matricula}</span></div>}
                {propData?.codigo_catastral && <div style={rowStyle}><span style={labelStyle}>Código catastral</span><span style={valueStyle}>{propData.codigo_catastral}</span></div>}
              </div>
            </div>

            {/* Características */}
            {Object.keys(c).length > 0 && (
              <div>
                <div style={sectionLabel}>CARACTERÍSTICAS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {c.area_total && <div style={rowStyle}><span style={labelStyle}>Área total</span><span style={valueStyle}>{c.area_total} m²</span></div>}
                  {c.area_construida && <div style={rowStyle}><span style={labelStyle}>Área construida</span><span style={valueStyle}>{c.area_construida} m²</span></div>}
                  {c.area_lote && <div style={rowStyle}><span style={labelStyle}>Área lote</span><span style={valueStyle}>{c.area_lote} m²</span></div>}
                  {c.frente && <div style={rowStyle}><span style={labelStyle}>Frente</span><span style={valueStyle}>{c.frente} m</span></div>}
                  {c.fondo && <div style={rowStyle}><span style={labelStyle}>Fondo</span><span style={valueStyle}>{c.fondo} m</span></div>}
                  {c.altura && <div style={rowStyle}><span style={labelStyle}>Altura</span><span style={valueStyle}>{c.altura} m</span></div>}
                  {c.altura_libre && <div style={rowStyle}><span style={labelStyle}>Altura libre</span><span style={valueStyle}>{c.altura_libre} m</span></div>}
                  {c.pisos && <div style={rowStyle}><span style={labelStyle}>Pisos</span><span style={valueStyle}>{c.pisos}</span></div>}
                  {c.piso && <div style={rowStyle}><span style={labelStyle}>Piso</span><span style={valueStyle}>{c.piso}</span></div>}
                  {c.torre && <div style={rowStyle}><span style={labelStyle}>Torre</span><span style={valueStyle}>{c.torre}</span></div>}
                  {c.numero_apartamento && <div style={rowStyle}><span style={labelStyle}>Apartamento</span><span style={valueStyle}>{c.numero_apartamento}</span></div>}
                  {c.habitaciones && <div style={rowStyle}><span style={labelStyle}>Habitaciones</span><span style={valueStyle}>{c.habitaciones}</span></div>}
                  {c.banos != null && typeof c.banos === 'number' && <div style={rowStyle}><span style={labelStyle}>Baños</span><span style={valueStyle}>{c.banos}</span></div>}
                  {c.anio_construccion && <div style={rowStyle}><span style={labelStyle}>Año construcción</span><span style={valueStyle}>{c.anio_construccion}</span></div>}
                  {c.cantidad_duenos && <div style={rowStyle}><span style={labelStyle}>Dueños</span><span style={valueStyle}>{c.cantidad_duenos}</span></div>}
                  {c.sala_comedor && <div style={rowStyle}><span style={labelStyle}>Sala/Comedor</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{String(c.sala_comedor).replace(/_/g, ' ')}</span></div>}
                  {c.tipo_cocina && <div style={rowStyle}><span style={labelStyle}>Cocina</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{String(c.tipo_cocina).replace(/_/g, ' ')}</span></div>}
                  {c.tipo_parqueadero && <div style={rowStyle}><span style={labelStyle}>Parqueadero</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{String(c.tipo_parqueadero).replace(/_/g, ' ')}</span></div>}
                  {c.parqueadero_cantidad > 0 && <div style={rowStyle}><span style={labelStyle}>Cant. parqueaderos</span><span style={valueStyle}>{c.parqueadero_cantidad}</span></div>}
                  {c.vigilancia_valor && <div style={rowStyle}><span style={labelStyle}>Vigilancia</span><span style={valueStyle}>{formatPrice(c.vigilancia_valor)}/mes</span></div>}
                  {c.topografia && <div style={rowStyle}><span style={labelStyle}>Topografía</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.topografia}</span></div>}
                  {c.tipo_via_acceso && <div style={rowStyle}><span style={labelStyle}>Vía acceso</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{String(c.tipo_via_acceso).replace(/_/g, ' ')}</span></div>}
                  {c.uso_pot && <div style={rowStyle}><span style={labelStyle}>Uso suelo</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.uso_pot}</span></div>}
                  {c.zona_local && <div style={rowStyle}><span style={labelStyle}>Zona local</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.zona_local}</span></div>}
                  {c.minutos_cabecera && <div style={rowStyle}><span style={labelStyle}>Min. a cabecera</span><span style={valueStyle}>{c.minutos_cabecera} min</span></div>}
                </div>
              </div>
            )}

            {/* Amenidades */}
            {amenities.length > 0 && (
              <div>
                <div style={sectionLabel}>COMODIDADES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {amenities.map(a => <span key={a} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>✓ {a}</span>)}
                </div>
              </div>
            )}

            {/* Descripción */}
            {(propData?.descripcion || datos.descripcion) && (
              <div>
                <div style={sectionLabel}>DESCRIPCIÓN</div>
                <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{propData?.descripcion || datos.descripcion}</p>
              </div>
            )}

            {/* Acabados */}
            {c.descripcion_acabados && (
              <div>
                <div style={sectionLabel}>ACABADOS</div>
                <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0, lineHeight: 1.5 }}>{c.descripcion_acabados}</p>
              </div>
            )}

            {/* Servicios */}
            {c.servicios_disponibles && Array.isArray(c.servicios_disponibles) && c.servicios_disponibles.length > 0 && (
              <div>
                <div style={sectionLabel}>SERVICIOS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {c.servicios_disponibles.map(s => <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: '#F4F0F8', color: '#5A4864', textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>)}
                </div>
              </div>
            )}
            {c.servicios_publicos && Array.isArray(c.servicios_publicos) && c.servicios_publicos.length > 0 && (
              <div>
                <div style={sectionLabel}>SERVICIOS PÚBLICOS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {c.servicios_publicos.map(s => <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: '#F4F0F8', color: '#5A4864', textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '14px', background: '#F9F7FB', borderRadius: '10px', fontSize: '12px', color: '#8097B7', textAlign: 'center' }}>
            No se pudo cargar la información de la propiedad
          </div>
        )}

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', fontSize: '11px', background: 'transparent', border: '1px solid #e0d8ec', borderRadius: '8px', cursor: 'pointer', color: '#5A4864' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
