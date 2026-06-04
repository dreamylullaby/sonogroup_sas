import { X, Edit, MapPin, Maximize, BedDouble, Bath, Car, Star, Building2, User, Phone, Mail, Calendar, CheckCircle, Hash } from 'lucide-react'

/**
 * PropertyFullDetailModal - Reusable modal for displaying complete property info.
 * 
 * Props:
 *  - property: The property object (from inmuebles table join or solicitud.datos)
 *  - usuario: The user who published/requested { nombre, email, telefono }
 *  - onClose: function to close the modal
 *  - onEdit: (optional) function to edit the property
 *  - headerActions: (optional) ReactNode for custom header actions (e.g. Aprobar/Rechazar)
 *  - title: (optional) custom title, defaults to "Propiedad #ID"
 */
export default function PropertyFullDetailModal({ property, usuario, onClose, onEdit, headerActions, title }) {
  if (!property) return null

  const p = property
  const c = p.caracteristicas || {}
  const u = p.ubicaciones || p.ubicacion || {}
  const user = usuario || p.usuarios || {}

  const formatPrice = (val) => '$ ' + Number(val || 0).toLocaleString('es-CO')

  // Build amenities list based on type
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
  if (c.cuarto_servicio) amenities.push('Cuarto de servicio')
  if (c.bano_servicio) amenities.push('Baño de servicio')
  if (c.amoblado) amenities.push('Amoblado')
  if (c.parqueadero || c.tipo_parqueadero) amenities.push('Parqueadero')
  if (c.jacuzzi) amenities.push('Jacuzzi')
  if (c.cancha) amenities.push('Cancha')
  if (c.mezzanine || c.mezanine) amenities.push('Mezanine')
  if (c.vitrina) amenities.push('Vitrina')
  if (c.sotano) amenities.push('Sótano')
  if (c.oficinas || c.oficina) amenities.push('Oficina')
  if (c.vestier) amenities.push('Vestier')
  if (c.rampa_cargue || c.muelle_carga) amenities.push('Muelle de carga')
  if (c.acceso_camiones) amenities.push('Acceso camiones')
  if (c.casa_principal) amenities.push('Casa principal')
  if (c.lago_estanque) amenities.push('Lago/Estanque')
  if (c.cabana_mayordomo) amenities.push('Cabaña mayordomo')

  // zonas_comunes for apartamento
  if (c.zonas_comunes) {
    try {
      const zonas = typeof c.zonas_comunes === 'string' ? JSON.parse(c.zonas_comunes) : c.zonas_comunes
      if (Array.isArray(zonas)) {
        const labels = { gimnasio: 'Gimnasio', piscina: 'Piscina', terraza: 'Terraza', zona_lavanderia: 'Zona lavandería', deposito: 'Depósito', cocina_equipada: 'Cocina equipada' }
        zonas.forEach(z => { if (!amenities.includes(labels[z] || z)) amenities.push(labels[z] || z) })
      }
    } catch { /* ignore */ }
  }

  // Lote specific chips
  if (c.pendiente === true) amenities.push('Inclinado')
  if (c.pendiente === false) amenities.push('Plano')
  if (c.tiene_documento) amenities.push('Escrituras')
  if (c.servicios_disponibles) {
    try {
      const servs = typeof c.servicios_disponibles === 'string' ? JSON.parse(c.servicios_disponibles) : c.servicios_disponibles
      if (Array.isArray(servs) && servs.length > 0) amenities.push('Servicios públicos')
    } catch { /* ignore */ }
  }

  const tipo = p.tipo_inmueble || ''
  const modalTitle = title || `Propiedad #${p.id_inmueble || ''}`

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div className="pdm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pdm__header">
          <div className="pdm__header-left">
            <h2 className="pdm__title">{modalTitle}</h2>
            <div className="pdm__badges">
              {tipo && <span className="admin-badge admin-badge--venta">{tipo}</span>}
              {p.tipo_operacion && <span className={`admin-badge admin-badge--${p.tipo_operacion === 'arriendo' ? 'arriendo' : 'venta'}`}>{p.tipo_operacion}</span>}
              {p.estado_aprobacion && <span className={`admin-badge admin-badge--${p.estado_aprobacion}`}>{p.estado_aprobacion}</span>}
            </div>
          </div>
          <div className="pdm__header-actions">
            {headerActions}
            {onEdit && (
              <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => onEdit(p)}>
                <Edit size={12} /> Editar
              </button>
            )}
            <button className="pdm__close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="pdm__body">
          {/* Hero */}
          <div className="pdm__hero">
            <div className="pdm__price">{formatPrice(p.valor)}</div>
            {p.valor_administracion > 0 && (
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.3rem' }}>
                Administración: {formatPrice(p.valor_administracion)}/mes
              </div>
            )}
            <div className="pdm__location">
              <MapPin size={14} /> {u.barrio_vereda || ''}{u.barrio_vereda ? ', ' : ''}{u.municipio || 'Sin ubicación'}
            </div>
            <div className="pdm__quick-stats">
              {(c.area_construida || c.area_total) && (
                <div className="pdm__stat"><Maximize size={14} /> <span>{c.area_construida || c.area_total} m²</span></div>
              )}
              {c.habitaciones && <div className="pdm__stat"><BedDouble size={14} /> <span>{c.habitaciones} hab.</span></div>}
              {c.banos != null && c.banos !== false && <div className="pdm__stat"><Bath size={14} /> <span>{c.banos} baños</span></div>}
              {(c.parqueadero_cantidad || c.parqueaderos || c.parqueadero) && (
                <div className="pdm__stat"><Car size={14} /> <span>{c.parqueadero_cantidad || c.parqueaderos || 1} parq.</span></div>
              )}
              {p.estrato && <div className="pdm__stat"><Star size={14} /> <span>Estrato {p.estrato}</span></div>}
            </div>
          </div>


          {/* Usuario */}
          {(user.nombre || user.email || user.telefono) && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Publicado por</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: '#F4F0F8', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E0D8EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#5A4864" />
                </div>
                <div style={{ flex: 1 }}>
                  {user.nombre && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#241929' }}>{user.nombre}</div>}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    {user.email && <span style={{ fontSize: '0.68rem', color: '#5A4864', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={11} /> {user.email}</span>}
                    {user.telefono && <span style={{ fontSize: '0.68rem', color: '#5A4864', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={11} /> {user.telefono}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ubicación */}
          <div className="pdm__section">
            <h3 className="pdm__section-title">Ubicación</h3>
            <div className="pdm__info-grid">
              {u.departamento && <div className="pdm__info-card"><span className="pdm__info-label">Departamento</span><span className="pdm__info-value">{u.departamento}</span></div>}
              {u.municipio && <div className="pdm__info-card"><span className="pdm__info-label">Municipio</span><span className="pdm__info-value">{u.municipio}</span></div>}
              {u.barrio_vereda && <div className="pdm__info-card"><span className="pdm__info-label">Barrio / Vereda</span><span className="pdm__info-value">{u.barrio_vereda}</span></div>}
              {u.direccion && <div className="pdm__info-card"><span className="pdm__info-label">Dirección</span><span className="pdm__info-value">{u.direccion}</span></div>}
            </div>
          </div>

          {/* Información general */}
          <div className="pdm__section">
            <h3 className="pdm__section-title">Información general</h3>
            <div className="pdm__info-grid">
              {p.numero_matricula && <div className="pdm__info-card"><span className="pdm__info-label">Matrícula ORIP</span><span className="pdm__info-value">{p.numero_matricula}</span></div>}
              {p.codigo_catastral && <div className="pdm__info-card"><span className="pdm__info-label">Código catastral</span><span className="pdm__info-value">{p.codigo_catastral}</span></div>}
              {p.zona && <div className="pdm__info-card"><span className="pdm__info-label">Zona</span><span className="pdm__info-value" style={{ textTransform: 'capitalize' }}>{p.zona}</span></div>}
              {p.estado_inmueble && <div className="pdm__info-card"><span className="pdm__info-label">Estado</span><span className="pdm__info-value" style={{ textTransform: 'capitalize' }}>{p.estado_inmueble}</span></div>}
              {p.estrato && <div className="pdm__info-card"><span className="pdm__info-label">Estrato</span><span className="pdm__info-value">{p.estrato}</span></div>}
              {p.acepta_permuta && <div className="pdm__info-card"><span className="pdm__info-label">Permuta</span><span className="pdm__info-value">Acepta</span></div>}
              {p.fecha_registro && <div className="pdm__info-card"><span className="pdm__info-label">Publicación</span><span className="pdm__info-value">{new Date(p.fecha_registro).toLocaleDateString('es-CO')}</span></div>}
            </div>
          </div>

          {/* Dimensiones y características numéricas */}
          {Object.keys(c).length > 0 && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Características del inmueble</h3>
              <div className="pdm__chars-grid">
                {c.area_total && <div className="pdm__char"><span className="pdm__char-label">Área total</span><span className="pdm__char-value">{c.area_total} m²</span></div>}
                {c.area_construida && <div className="pdm__char"><span className="pdm__char-label">Área construida</span><span className="pdm__char-value">{c.area_construida} m²</span></div>}
                {c.area_lote && <div className="pdm__char"><span className="pdm__char-label">Área lote</span><span className="pdm__char-value">{c.area_lote} m²</span></div>}
                {c.area_construcciones && <div className="pdm__char"><span className="pdm__char-label">Área construcciones</span><span className="pdm__char-value">{c.area_construcciones} m²</span></div>}
                {c.frente && <div className="pdm__char"><span className="pdm__char-label">Frente</span><span className="pdm__char-value">{c.frente} m</span></div>}
                {c.fondo && <div className="pdm__char"><span className="pdm__char-label">Fondo</span><span className="pdm__char-value">{c.fondo} m</span></div>}
                {c.altura && <div className="pdm__char"><span className="pdm__char-label">Altura</span><span className="pdm__char-value">{c.altura} m</span></div>}
                {c.altura_libre && <div className="pdm__char"><span className="pdm__char-label">Altura libre</span><span className="pdm__char-value">{c.altura_libre} m</span></div>}
                {c.pisos && <div className="pdm__char"><span className="pdm__char-label">Pisos</span><span className="pdm__char-value">{c.pisos}</span></div>}
                {c.piso && <div className="pdm__char"><span className="pdm__char-label">Piso</span><span className="pdm__char-value">{c.piso}</span></div>}
                {c.torre && <div className="pdm__char"><span className="pdm__char-label">Torre</span><span className="pdm__char-value">{c.torre}</span></div>}
                {c.numero_apartamento && <div className="pdm__char"><span className="pdm__char-label">Apartamento</span><span className="pdm__char-value">{c.numero_apartamento}</span></div>}
                {c.habitaciones && <div className="pdm__char"><span className="pdm__char-label">Habitaciones</span><span className="pdm__char-value">{c.habitaciones}</span></div>}
                {c.banos != null && c.banos !== false && typeof c.banos === 'number' && <div className="pdm__char"><span className="pdm__char-label">Baños</span><span className="pdm__char-value">{c.banos}</span></div>}
                {c.anio_construccion && <div className="pdm__char"><span className="pdm__char-label">Año construcción</span><span className="pdm__char-value">{c.anio_construccion}</span></div>}
                {c.cantidad_duenos && <div className="pdm__char"><span className="pdm__char-label">Dueños</span><span className="pdm__char-value">{c.cantidad_duenos}</span></div>}
                {c.sala_comedor && <div className="pdm__char"><span className="pdm__char-label">Sala / Comedor</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.sala_comedor.replace('_', ' ')}</span></div>}
                {c.tipo_cocina && <div className="pdm__char"><span className="pdm__char-label">Cocina</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.tipo_cocina.replace('_', ' ')}</span></div>}
                {c.tipo_parqueadero && <div className="pdm__char"><span className="pdm__char-label">Parqueadero</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.tipo_parqueadero}</span></div>}
                {c.parqueadero_cantidad > 0 && <div className="pdm__char"><span className="pdm__char-label">Parqueaderos</span><span className="pdm__char-value">{c.parqueadero_cantidad}</span></div>}
                {c.vigilancia_valor && <div className="pdm__char"><span className="pdm__char-label">Vigilancia</span><span className="pdm__char-value">{formatPrice(c.vigilancia_valor)}/mes</span></div>}
                {c.topografia && <div className="pdm__char"><span className="pdm__char-label">Topografía</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.topografia}</span></div>}
                {c.tipo_via_acceso && <div className="pdm__char"><span className="pdm__char-label">Vía de acceso</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.tipo_via_acceso.replace('_', ' ')}</span></div>}
                {c.uso_pot && <div className="pdm__char"><span className="pdm__char-label">Uso del suelo</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.uso_pot}</span></div>}
                {c.zona_local && <div className="pdm__char"><span className="pdm__char-label">Zona local</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.zona_local}</span></div>}
                {c.tipo_porton && <div className="pdm__char"><span className="pdm__char-label">Tipo portón</span><span className="pdm__char-value" style={{ textTransform: 'capitalize' }}>{c.tipo_porton}</span></div>}
                {c.capacidad_carga && <div className="pdm__char"><span className="pdm__char-label">Capacidad carga</span><span className="pdm__char-value">{c.capacidad_carga}</span></div>}
                {c.minutos_cabecera && <div className="pdm__char"><span className="pdm__char-label">Min. a cabecera</span><span className="pdm__char-value">{c.minutos_cabecera} min</span></div>}
              </div>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Comodidades y extras</h3>
              <div className="pdm__amenities">
                {amenities.map(a => <span key={a} className="pdm__amenity"><CheckCircle size={12} /> {a}</span>)}
              </div>
            </div>
          )}

          {/* Description */}
          {p.descripcion && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Descripción/Título</h3>
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

          {/* Via description for lote/finca */}
          {c.descripcion_via && (
            <div className="pdm__section">
              <h3 className="pdm__section-title">Descripción de la vía</h3>
              <p className="pdm__description">{c.descripcion_via}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
