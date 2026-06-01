import { X, MapPin, Maximize, BedDouble, Bath, Car, Star, Check, XCircle } from 'lucide-react'

export default function SolicitudDetailModal({ solicitud, onClose, onAprobar, onRechazar }) {
  if (!solicitud) return null

  const d = solicitud.datos || {}
  const c = d.caracteristicas || {}
  const u = d.ubicacion || {}

  const formatPrice = (val) => '$ ' + Number(val || 0).toLocaleString('es-CO')

  const amenities = []
  if (c.balcon) amenities.push('Balcon')
  if (c.ascensor) amenities.push('Ascensor')
  if (c.vigilancia) amenities.push('Vigilancia')
  if (c.patio) amenities.push('Patio')
  if (c.jardin) amenities.push('Jardin')
  if (c.terraza) amenities.push('Terraza')
  if (c.zona_lavanderia) amenities.push('Zona lavanderia')
  if (c.cocina_equipada) amenities.push('Cocina equipada')
  if (c.parqueadero) amenities.push('Parqueadero')
  if (c.amoblado) amenities.push('Amoblado')

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div className="pdm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pdm__header">
          <div className="pdm__header-left">
            <h2 className="pdm__title">Solicitud #{solicitud.id_solicitud}</h2>
            <div className="pdm__badges">
              {d.tipo_inmueble && <span className="admin-badge admin-badge--venta">{d.tipo_inmueble}</span>}
              {d.tipo_operacion && <span className="admin-badge admin-badge--arriendo">{d.tipo_operacion}</span>}
              <span className="admin-badge admin-badge--pendiente">{solicitud.estado_aprobacion}</span>
            </div>
          </div>
          <div className="pdm__header-actions">
            {solicitud.estado_aprobacion === 'pendiente' && (
              <>
                <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => onAprobar(solicitud.id_solicitud)}>
                  <Check size={12} /> Aprobar
                </button>
                <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => onRechazar(solicitud.id_solicitud)}>
                  <XCircle size={12} /> Rechazar
                </button>
              </>
            )}
            <button className="pdm__close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="pdm__body">
          {/* Hero */}
          <div className="pdm__hero">
            <div className="pdm__price">{formatPrice(d.valor)}</div>
            <div className="pdm__location">
              <MapPin size={14} /> {u.barrio_vereda || ''}{u.barrio_vereda ? ', ' : ''}{u.municipio || 'Sin ubicacion'}
            </div>
            <div className="pdm__quick-stats">
              {(c.area_construida || c.area_total) && <div className="pdm__stat"><Maximize size={14} /> <span>{c.area_construida || c.area_total} m²</span></div>}
              {c.habitaciones && <div className="pdm__stat"><BedDouble size={14} /> <span>{c.habitaciones} hab.</span></div>}
              {c.banos && <div className="pdm__stat"><Bath size={14} /> <span>{c.banos} banos</span></div>}
              {d.estrato && <div className="pdm__stat"><Star size={14} /> <span>Estrato {d.estrato}</span></div>}
            </div>
          </div>

          {/* Info */}
          <div className="pdm__section">
            <h3 className="pdm__section-title">Informacion general</h3>
            <div className="pdm__info-grid">
              {u.departamento && <div className="pdm__info-card"><span className="pdm__info-label">Departamento</span><span className="pdm__info-value">{u.departamento}</span></div>}
              {u.municipio && <div className="pdm__info-card"><span className="pdm__info-label">Municipio</span><span className="pdm__info-value">{u.municipio}</span></div>}
              {u.barrio_vereda && <div className="pdm__info-card"><span className="pdm__info-label">Barrio</span><span className="pdm__info-value">{u.barrio_vereda}</span></div>}
              {u.direccion && <div className="pdm__info-card"><span className="pdm__info-label">Direccion</span><span className="pdm__info-value">{u.direccion}</span></div>}
              {d.zona && <div className="pdm__info-card"><span className="pdm__info-label">Zona</span><span className="pdm__info-value">{d.zona}</span></div>}
              {d.estado_inmueble && <div className="pdm__info-card"><span className="pdm__info-label">Estado</span><span className="pdm__info-value">{d.estado_inmueble}</span></div>}
              {d.numero_matricula && <div className="pdm__info-card"><span className="pdm__info-label">Matricula</span><span className="pdm__info-value">{d.numero_matricula}</span></div>}
            </div>
          </div>

          {/* Characteristics */}
          {Object.keys(c).length > 0 && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Caracteristicas</h3>
              <div className="pdm__chars-grid">
                {c.area_construida && <div className="pdm__char"><span className="pdm__char-label">Area construida</span><span className="pdm__char-value">{c.area_construida} m²</span></div>}
                {c.frente && <div className="pdm__char"><span className="pdm__char-label">Frente</span><span className="pdm__char-value">{c.frente} m</span></div>}
                {c.fondo && <div className="pdm__char"><span className="pdm__char-label">Fondo</span><span className="pdm__char-value">{c.fondo} m</span></div>}
                {c.pisos && <div className="pdm__char"><span className="pdm__char-label">Pisos</span><span className="pdm__char-value">{c.pisos}</span></div>}
                {c.piso && <div className="pdm__char"><span className="pdm__char-label">Piso</span><span className="pdm__char-value">{c.piso}</span></div>}
                {c.habitaciones && <div className="pdm__char"><span className="pdm__char-label">Habitaciones</span><span className="pdm__char-value">{c.habitaciones}</span></div>}
                {c.banos && <div className="pdm__char"><span className="pdm__char-label">Banos</span><span className="pdm__char-value">{c.banos}</span></div>}
                {c.tipo_cocina && <div className="pdm__char"><span className="pdm__char-label">Cocina</span><span className="pdm__char-value">{c.tipo_cocina}</span></div>}
                {c.tipo_parqueadero && <div className="pdm__char"><span className="pdm__char-label">Parqueadero</span><span className="pdm__char-value">{c.tipo_parqueadero}</span></div>}
                {c.sala_comedor && <div className="pdm__char"><span className="pdm__char-label">Sala/Comedor</span><span className="pdm__char-value">{c.sala_comedor}</span></div>}
              </div>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Comodidades</h3>
              <div className="pdm__amenities">
                {amenities.map(a => <span key={a} className="pdm__amenity"><Check size={12} /> {a}</span>)}
              </div>
            </div>
          )}

          {/* Description */}
          {d.descripcion && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Descripcion</h3>
              <p className="pdm__description">{d.descripcion}</p>
            </div>
          )}

          {/* Fecha */}
          <div className="pdm__section">
            <p style={{ fontSize: '0.65rem', color: '#999' }}>Solicitud enviada: {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
