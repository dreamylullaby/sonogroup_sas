import { useState, useEffect } from 'react'
import { Building2, Plus, Eye, Edit2, EyeOff, Trash2, Search, FileText, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../config/api'
import PropertyDetailModal from '../../components/admin/shared/PropertyDetailModal'
import PropertyEditModal from '../../components/admin/shared/PropertyEditModal'

export default function AdminPropiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [borradores, setBorradores] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [vista, setVista] = useState('publicadas') // 'publicadas' | 'borradores'
  const [detailModal, setDetailModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/inmuebles?estado_aprobacion=aprobado'),
      api.get('/api/borradores')
    ]).then(([resProp, resBorr]) => {
      const data = resProp.data.inmuebles || []
      setPropiedades(data)
      setFiltered(data)
      setBorradores(resBorr.data.borradores || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (vista === 'borradores') return
    if (!search.trim()) { setFiltered(propiedades); return }
    const q = search.toLowerCase()
    setFiltered(propiedades.filter(p =>
      (p.tipo_inmueble || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q) ||
      (p.ubicaciones?.municipio || '').toLowerCase().includes(q) ||
      String(p.id_inmueble).includes(q) ||
      String(p.valor).includes(q)
    ))
  }, [search, propiedades, vista])

  const handleOcultar = async (id) => {
    if (!window.confirm('¿Ocultar esta propiedad? No será visible al público.')) return
    try {
      await api.put(`/api/inmuebles/${id}`, { activo: false, fecha_eliminacion: new Date().toISOString() })
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar permanentemente esta propiedad? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/inmuebles/${id}`)
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleEliminarBorrador = async (id) => {
    try {
      await api.delete(`/api/borradores/${id}`)
      setDeleteModal(null)
      fetchData()
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleContinuarBorrador = (borrador) => {
    // Save draft to localStorage and navigate to publish form
    const datos = borrador.datos || {}
    localStorage.setItem('property_draft', JSON.stringify(datos))
    navigate('/publicar')
  }

  return (
    <div>
      <div className="admin-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page__title">Propiedades</h1>
          <p className="admin-page__subtitle">
            {vista === 'publicadas'
              ? `Gestiona todas las propiedades · ${filtered.length} de ${propiedades.length}`
              : `Borradores guardados · ${borradores.length}`
            }
          </p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => navigate('/publicar')}>
          <Plus size={14} /> Nueva propiedad
        </button>
      </div>

      {/* Tabs switch */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1rem' }}>
        <button
          onClick={() => setVista('publicadas')}
          style={{
            padding: '8px 18px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            border: '1px solid #e0d8ec', borderRadius: '8px 0 0 8px',
            background: vista === 'publicadas' ? '#CC1E2B' : '#fff',
            color: vista === 'publicadas' ? '#fff' : '#5A4864'
          }}
        >
          <Building2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Publicadas ({propiedades.length})
        </button>
        <button
          onClick={() => setVista('borradores')}
          style={{
            padding: '8px 18px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            border: '1px solid #e0d8ec', borderLeft: 'none', borderRadius: '0 8px 8px 0',
            background: vista === 'borradores' ? '#CC1E2B' : '#fff',
            color: vista === 'borradores' ? '#fff' : '#5A4864'
          }}
        >
          <FileText size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Borradores ({borradores.length})
        </button>
      </div>

      {vista === 'publicadas' ? (
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-search" style={{ maxWidth: '400px', flex: 1 }}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar por tipo, ubicación, descripción, ID o valor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="admin-card__empty"><p>Cargando propiedades...</p></div>
          ) : filtered.length === 0 ? (
            <div className="admin-card__empty"><Building2 size={32} /><p>No se encontraron propiedades</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Tipo</th><th>Ubicación</th><th>Operación</th><th>Valor</th><th>Estado</th><th>Fecha</th><th style={{ textAlign: 'center' }}>Acciones</th></tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map(p => (
                  <tr key={p.id_inmueble}>
                    <td style={{ fontWeight: 600 }}>#{p.id_inmueble}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.tipo_inmueble}</td>
                    <td>{p.ubicaciones?.municipio || '—'}</td>
                    <td><span className="admin-badge admin-badge--venta">{p.tipo_operacion}</span></td>
                    <td style={{ fontWeight: 600 }}>$ {Number(p.valor).toLocaleString('es-CO')}</td>
                    <td><span className="admin-badge admin-badge--aprobado">{p.estado_aprobacion}</span></td>
                    <td style={{ color: '#999' }}>{new Date(p.fecha_registro).toLocaleDateString('es-CO')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button className="admin-btn admin-btn--ghost" title="Ver detalles" onClick={() => setDetailModal(p)}><Eye size={13} /></button>
                        <button className="admin-btn admin-btn--ghost" title="Editar" onClick={() => setEditModal(p)}><Edit2 size={13} /></button>
                        <button className="admin-btn admin-btn--ghost" title="Ocultar" onClick={() => handleOcultar(p.id_inmueble)}><EyeOff size={13} /></button>
                        <button className="admin-btn admin-btn--ghost" title="Eliminar" style={{ color: '#dc2626' }} onClick={() => handleEliminar(p.id_inmueble)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="admin-card">
          {loading ? (
            <div className="admin-card__empty"><p>Cargando borradores...</p></div>
          ) : borradores.length === 0 ? (
            <div className="admin-card__empty"><FileText size={32} /><p>No tienes borradores guardados</p><p className="sub">Los borradores aparecerán aquí cuando guardes un formulario incompleto</p></div>
          ) : (
            <div className="admin-card__body">
              {borradores.map(b => {
                const d = b.datos || {}
                const fd = d.formData || {}
                return (
                  <div key={b.id_borrador} className="admin-list-item">
                    <div className="admin-list-item__content">
                      <div className="admin-list-item__title">
                        <span className="admin-badge admin-badge--venta" style={{ marginRight: '0.5rem' }}>{fd.tipo_inmueble || 'Sin tipo'}</span>
                        {b.titulo || (fd.tipo_operacion === 'arriendo' ? 'Arriendo' : 'Venta')}
                      </div>
                      <div className="admin-list-item__meta">
                        <span><Clock size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Paso {b.paso_actual}/4</span>
                        <span>$ {Number(fd.valor || 0).toLocaleString('es-CO')}</span>
                        <span>{d.ubicacion?.municipio || 'Sin ubicación'}</span>
                        <span style={{ color: '#8097B7' }}>{new Date(b.fecha_actualizacion).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => handleContinuarBorrador(b)}>
                        <Edit2 size={12} /> Continuar
                      </button>
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" title="Eliminar borrador" style={{ color: '#CC1E2B' }} onClick={() => setDeleteModal(b)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <PropertyDetailModal
          property={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={(p) => { setDetailModal(null); setEditModal(p) }}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <PropertyEditModal property={editModal} onClose={() => setEditModal(null)} onSaved={fetchData} />
      )}

      {/* Delete Borrador Modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '380px', border: '0.5px solid #e0d8ec' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FCE8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={22} color="#CC1E2B" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#241929', margin: '0 0 8px' }}>¿Eliminar borrador?</h3>
              <p style={{ fontSize: '13px', color: '#5A4864', lineHeight: 1.6, margin: 0 }}>
                Esta acción eliminará permanentemente el borrador
                {deleteModal.titulo ? ` "${deleteModal.titulo}"` : ''}.
                No se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => handleEliminarBorrador(deleteModal.id_borrador)}
                style={{ width: '100%', background: '#CC1E2B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
              >
                <Trash2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Eliminar permanentemente
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                style={{ width: '100%', background: 'transparent', color: '#5A4864', border: 'none', padding: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
