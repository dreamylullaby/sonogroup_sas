import { X, Edit, MapPin, Maximize, BedDouble, Bath, Car, Star, Building2, Layers, Hash, Calendar, Users as UsersIcon, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PropertyDetailModal({ property, onClose }) {
  const navigate = useNavigate()
  if (!property) return null

  const p = property
  const c = p.caracteristicas || {}
  const u = p.ubicaciones || {}

  const formatPrice = (val) => '$ ' + Number(val || 0).toLocaleString('es-CO')

  // Amenities as chips
  const amenities = []
  if (c.balcon) amenities.push('Balcon')
  if (c.ascensor) amenities.push('Ascensor')
  if (c.vigilancia) amenities.push('Vigilancia')
  if (c.patio) amenities.push('Patio')
  if (c.jardin) amenities.push('Jardin')
  if (c.terraza) amenities.push('Terraza')
  if (c.chimenea) amenities.push('Chimenea')
  if (c.deposito) amenities.push('Deposito')
  if (c.piscina) amenities.push('Piscina')
  if (c.zona_lavanderia) amenities.push('Zona lavanderia')
  if (c.cocina_equipada) amenities.push('Cocina equipada')
  if (c.cuarto_servicio) amenities.push('Cuarto servicio')
  if (c.bano_servicio) amenities.push('Bano servicio')
  if (c.parqueadero || c.tipo_parqueadero) amenities.push('Parqueadero')

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div className="pdm" onClick={e => e.stopPropagation()}>
        {/* Header sticky */}
        <div className="pdm__header">
          <div className="pdm__header-left">
            <h2 className="pdm__title">Propiedad #{p.id_inmueble}</h2>
            <div className="pdm__badges">
              <span className="admin-badge admin-badge--venta">{p.tipo_inmueble}</span>
              <span className={`admin-badge admin-badge--${p.tipo_operacion === 'arriendo' ? 'arriendo' : 'venta'}`}>{p.tipo_operacion}</span>
              <span className="admin-badge admin-badge--aprobado">{p.estado_aprobacion}</span>
            </div>
          </div>
          <div className="pdm__header-actions">
            <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => { onClose(); navigate(`/editar-propiedad/${p.id_inmueble}`) }}>
              <Edit size={12} /> Editar
            </button>
            <button className="pdm__close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Content scrollable */}
        <div className="pdm__body">
          {/* Hero summary */}
          <div className="pdm__hero">
            <div className="pdm__price">{formatPrice(p.valor)}</div>
            <div className="pdm__location">
              <MapPin size={14} /> {u.barrio_vereda || ''}{u.barrio_vereda ? ', ' : ''}{u.municipio || 'Sin ubicacion'}
            </div>
            <div className="pdm__quick-stats">
              {(c.area_construida || c.area_total) && (
                <div className="pdm__stat"><Maximize size={14} /> <span>{c.area_construida || c.area_total} m²</span></div>
              )}
              {c.habitaciones && (
                <div className="pdm__stat"><BedDouble size={14} /> <span>{c.habitaciones} hab.</span></div>
              )}
              {c.banos && (
                <div className="pdm__stat"><Bath size={14} /> <span>{c.banos} banos</span></div>
              )}
              {(c.parqueadero_cantidad || c.tipo_parqueadero) && (
                <div className="pdm__stat"><Car size={14} /> <span>{c.parqueadero_cantidad || 1} parq.</span></div>
              )}
              {p.estrato && (
                <div className="pdm__stat"><Star size={14} /> <span>Estrato {p.estrato}</span></div>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="pdm__section">
            <h3 className="pdm__section-title">Informacion general</h3>
            <div className="pdm__info-grid">
              {p.numero_matricula && <div className="pdm__info-card"><span className="pdm__info-label">Matricula</span><span className="pdm__info-value">{p.numero_matricula}</span></div>}
              {u.departamento && <div className="pdm__info-card"><span className="pdm__info-label">Departamento</span><span className="pdm__info-value">{u.departamento}</span></div>}
              {u.municipio && <div className="pdm__info-card"><span className="pdm__info-label">Municipio</span><span className="pdm__info-value">{u.municipio}</span></div>}
              {u.barrio_vereda && <div className="pdm__info-card"><span className="pdm__info-label">Barrio</span><span className="pdm__info-value">{u.barrio_vereda}</span></div>}
              {u.direccion && <div className="pdm__info-card"><span className="pdm__info-label">Direccion</span><span className="pdm__info-value">{u.direccion}</span></div>}
              {c.anio_construccion && <div className="pdm__info-card"><span className="pdm__info-label">Ano construccion</span><span className="pdm__info-value">{c.anio_construccion}</span></div>}
              {c.cantidad_duenos && <div className="pdm__info-card"><span className="pdm__info-label">Duenos</span><span className="pdm__info-value">{c.cantidad_duenos}</span></div>}
              {p.zona && <div className="pdm__info-card"><span className="pdm__info-label">Zona</span><span className="pdm__info-value">{p.zona}</span></div>}
              {p.estado_inmueble && <div className="pdm__info-card"><span className="pdm__info-label">Estado</span><span className="pdm__info-value">{p.estado_inmueble}</span></div>}
            </div>
          </div>

          {/* Characteristics */}
          {Object.keys(c).length > 0 && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Caracteristicas del inmueble</h3>
              <div className="pdm__chars-grid">
                {c.area_construida && <div className="pdm__char"><span className="pdm__char-label">Area construida</span><span className="pdm__char-value">{c.area_construida} m²</span></div>}
                {c.frente && <div className="pdm__char"><span className="pdm__char-label">Frente</span><span className="pdm__char-value">{c.frente} m</span></div>}
                {c.fondo && <div className="pdm__char"><span className="pdm__char-label">Fondo</span><span className="pdm__char-value">{c.fondo} m</span></div>}
                {c.piso && <div className="pdm__char"><span className="pdm__char-label">Piso</span><span className="pdm__char-value">{c.piso}</span></div>}
                {c.torre && <div className="pdm__char"><span className="pdm__char-label">Torre</span><span className="pdm__char-value">{c.torre}</span></div>}
                {c.numero_apartamento && <div className="pdm__char"><span className="pdm__char-label">Apartamento</span><span className="pdm__char-value">{c.numero_apartamento}</span></div>}
                {c.sala_comedor && <div className="pdm__char"><span className="pdm__char-label">Sala/Comedor</span><span className="pdm__char-value">{c.sala_comedor}</span></div>}
                {c.tipo_cocina && <div className="pdm__char"><span className="pdm__char-label">Cocina</span><span className="pdm__char-value">{c.tipo_cocina}</span></div>}
                {c.tipo_parqueadero && <div className="pdm__char"><span className="pdm__char-label">Parqueadero</span><span className="pdm__char-value">{c.tipo_parqueadero}</span></div>}
                {c.vigilancia_valor && <div className="pdm__char"><span className="pdm__char-label">Vigilancia</span><span className="pdm__char-value">$ {Number(c.vigilancia_valor).toLocaleString('es-CO')}/mes</span></div>}
              </div>
            </div>
          )}

          {/* Amenities chips */}
          {amenities.length > 0 && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Comodidades</h3>
              <div className="pdm__amenities">
                {amenities.map(a => (
                  <span key={a} className="pdm__amenity"><CheckCircle size={12} /> {a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {p.descripcion && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Descripcion</h3>
              <p className="pdm__description">{p.descripcion}</p>
            </div>
          )}

          {/* Acabados */}
          {c.descripcion_acabados && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Acabados y detalles</h3>
              <p className="pdm__description">{c.descripcion_acabados}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
