import { useState, useEffect } from 'react'
import { Building2, Plus, Eye, Edit2, EyeOff, Trash2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../config/api'
import PropertyDetailModal from '../../components/admin/shared/PropertyDetailModal'

export default function AdminPropiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    api.get('/api/inmuebles?estado_aprobacion=aprobado')
      .then(res => {
        const data = res.data.inmuebles || []
        setPropiedades(data)
        setFiltered(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(propiedades); return }
    const q = search.toLowerCase()
    setFiltered(propiedades.filter(p =>
      (p.tipo_inmueble || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q) ||
      (p.ubicaciones?.municipio || '').toLowerCase().includes(q) ||
      String(p.id_inmueble).includes(q) ||
      String(p.valor).includes(q)
    ))
  }, [search, propiedades])

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

  return (
    <div>
      <div className="admin-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page__title">Propiedades</h1>
          <p className="admin-page__subtitle">Gestiona todas las propiedades · {filtered.length} de {propiedades.length}</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => navigate('/publicar')}>
          <Plus size={14} /> Nueva propiedad
        </button>
      </div>

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
                      <button className="admin-btn admin-btn--ghost" title="Editar" onClick={() => navigate(`/editar-propiedad/${p.id_inmueble}`)}><Edit2 size={13} /></button>
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

      {/* Detail Modal */}
      {detailModal && (
        <PropertyDetailModal property={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  )
}
