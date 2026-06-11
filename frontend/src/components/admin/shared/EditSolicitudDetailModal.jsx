import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, MapPin, Home, Calendar, Check } from 'lucide-react'
import { api } from '../../../config/api'

/**
 * Modal de detalle para solicitudes de EDICIÓN.
 * Muestra: justificación del usuario, datos del solicitante, info de la propiedad.
 */
export default function EditSolicitudDetailModal({ solicitud, onClose, headerActions }) {
  const [property, setProperty] = useState(null)
  const [loadingProp, setLoadingProp] = useState(false)

  const usuario = solicitud?.usuarios || {}
  const motivo = solicitud?.datos?.motivo || ''
  const idInmueble = solicitud?.id_inmueble

  useEffect(() => {
    if (idInmueble) {
      setLoadingProp(true)
      api.get(`/api/inmuebles/${idInmueble}`)
        .then(res => setProperty(res.data))
        .catch(() => setProperty(null))
        .finally(() => setLoadingProp(false))
    }
  }, [idInmueble])

  if (!solicitud) return null

  const formatPrice = (val) => '$ ' + Number(val || 0).toLocaleString('es-CO')
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="pdm-overlay" onClick={onClose}>
      <div className="pdm" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="pdm__header">
          <div className="pdm__header-left">
            <h2 className="pdm__title">Solicitud de Edición #{solicitud.id_solicitud}</h2>
            <div className="pdm__badges">
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600, color: '#7C3AED', background: '#EDE9FE', textTransform: 'uppercase' }}>Edición</span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600, color: '#D97706', background: '#FEF3C7', textTransform: 'uppercase' }}>{solicitud.estado_aprobacion}</span>
            </div>
          </div>
          <div className="pdm__header-actions">
            {headerActions}
            <button className="pdm__close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="pdm__body" style={{ padding: '1.25rem 1.5rem' }}>

          {/* SECCIÓN 1: Justificación del usuario (lo más importante) */}
          <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#F3EEFF', borderRadius: '10px', borderLeft: '4px solid #7C3AED' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7C3AED', marginBottom: '6px' }}>
              Justificación del usuario
            </div>
            <p style={{ fontSize: '13px', color: '#241929', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {motivo || 'Sin justificación proporcionada'}
            </p>
          </div>

          {/* SECCIÓN 2: Solicitante */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5A4864', marginBottom: '8px' }}>
              Solicitante
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#F9F7FB', borderRadius: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E0D8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="#5A4864" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#241929' }}>{usuario.nombre || 'Usuario'}</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {usuario.email && <span style={{ fontSize: '11px', color: '#5A4864', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Mail size={10} /> {usuario.email}</span>}
                  {usuario.telefono && <span style={{ fontSize: '11px', color: '#5A4864', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Phone size={10} /> {usuario.telefono}</span>}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#8097B7', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={10} /> Solicitado el {formatDate(solicitud.fecha_solicitud)}
            </div>
          </div>

          {/* SECCIÓN 3: Propiedad asociada */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5A4864', marginBottom: '8px' }}>
              Propiedad #{idInmueble}
            </div>
            {loadingProp ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8097B7', fontSize: '12px' }}>Cargando propiedad...</div>
            ) : property ? (
              <PropertyFullInfo property={property} formatPrice={formatPrice} />
            ) : (
              <div style={{ padding: '14px', background: '#F9F7FB', borderRadius: '10px', fontSize: '12px', color: '#8097B7', textAlign: 'center' }}>
                No se pudo cargar la información de la propiedad
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-component: muestra toda la información de la propiedad
function PropertyFullInfo({ property, formatPrice }) {
  const c = property.caracteristicas || {}
  const u = property.ubicaciones || {}

  const chipStyle = { fontSize: '11px', color: '#4A3F55', background: '#fff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e0d8ec' }
  const labelStyle = { fontSize: '10px', color: '#8097B7', fontWeight: 500 }
  const valueStyle = { fontSize: '12px', color: '#241929', fontWeight: 500 }
  const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f4f0f8' }

  // Amenidades booleanas
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
  if (c.jacuzzi) amenities.push('Jacuzzi')
  if (c.cancha) amenities.push('Cancha')
  if (c.lago_estanque) amenities.push('Lago/Estanque')
  if (c.cabana_mayordomo) amenities.push('Cabaña mayordomo')
  if (c.casa_principal) amenities.push('Casa principal')
  if (c.mezzanine) amenities.push('Mezanine')
  if (c.vitrina) amenities.push('Vitrina')
  if (c.sotano) amenities.push('Sótano')
  if (c.oficinas) amenities.push('Oficinas')
  if (c.vestier) amenities.push('Vestier')
  if (c.rampa_cargue) amenities.push('Rampa de cargue')
  if (c.acceso_camiones) amenities.push('Acceso camiones')
  if (c.antejadin) amenities.push('Antejardin')
  if (c.parqueadero) amenities.push('Parqueadero')

  return (
    <div style={{ background: '#F9F7FB', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header: Precio y tipo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#241929' }}>{formatPrice(property.valor)}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, background: '#DBEAFE', color: '#2563EB', textTransform: 'capitalize' }}>{property.tipo_inmueble}</span>
          <span style={{ padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, background: '#D1FAE5', color: '#059669', textTransform: 'capitalize' }}>{property.tipo_operacion}</span>
        </div>
      </div>

      {/* Administración */}
      {property.valor_administracion > 0 && (
        <div style={{ fontSize: '11px', color: '#5A4864' }}>Administración: {formatPrice(property.valor_administracion)}/mes</div>
      )}

      {/* Ubicación completa */}
      <div>
        <div style={{ ...labelStyle, marginBottom: '4px' }}>UBICACIÓN</div>
        <div style={{ fontSize: '12px', color: '#5A4864', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
          <MapPin size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
          <span>
            {u.direccion && `${u.direccion}, `}
            {u.barrio_vereda && `${u.barrio_vereda}, `}
            {u.municipio || ''}
            {u.departamento && u.departamento !== 'Colombia' ? `, ${u.departamento}` : ''}
          </span>
        </div>
      </div>

      {/* Información general */}
      <div>
        <div style={{ ...labelStyle, marginBottom: '6px' }}>INFORMACIÓN GENERAL</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {property.estrato && <div style={rowStyle}><span style={labelStyle}>Estrato</span><span style={valueStyle}>{property.estrato}</span></div>}
          {property.zona && <div style={rowStyle}><span style={labelStyle}>Zona</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{property.zona}</span></div>}
          {property.estado_inmueble && <div style={rowStyle}><span style={labelStyle}>Estado</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{property.estado_inmueble}</span></div>}
          {property.acepta_permuta && <div style={rowStyle}><span style={labelStyle}>Permuta</span><span style={valueStyle}>Acepta</span></div>}
          {property.numero_matricula && <div style={rowStyle}><span style={labelStyle}>Matrícula</span><span style={valueStyle}>{property.numero_matricula}</span></div>}
          {property.codigo_catastral && <div style={rowStyle}><span style={labelStyle}>Código catastral</span><span style={valueStyle}>{property.codigo_catastral}</span></div>}
        </div>
      </div>

      {/* Características numéricas/texto */}
      {Object.keys(c).length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '6px' }}>CARACTERÍSTICAS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {c.area_total && <div style={rowStyle}><span style={labelStyle}>Área total</span><span style={valueStyle}>{c.area_total} m²</span></div>}
            {c.area_construida && <div style={rowStyle}><span style={labelStyle}>Área construida</span><span style={valueStyle}>{c.area_construida} m²</span></div>}
            {c.area_lote && <div style={rowStyle}><span style={labelStyle}>Área lote</span><span style={valueStyle}>{c.area_lote} m²</span></div>}
            {c.area_construcciones && <div style={rowStyle}><span style={labelStyle}>Área construcciones</span><span style={valueStyle}>{c.area_construcciones} m²</span></div>}
            {c.area_cultivable && <div style={rowStyle}><span style={labelStyle}>Área cultivable</span><span style={valueStyle}>{c.area_cultivable} m²</span></div>}
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
            {c.sala_comedor && <div style={rowStyle}><span style={labelStyle}>Sala/Comedor</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.sala_comedor.replace(/_/g, ' ')}</span></div>}
            {c.tipo_cocina && <div style={rowStyle}><span style={labelStyle}>Cocina</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.tipo_cocina.replace(/_/g, ' ')}</span></div>}
            {c.tipo_parqueadero && <div style={rowStyle}><span style={labelStyle}>Parqueadero</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.tipo_parqueadero.replace(/_/g, ' ')}</span></div>}
            {c.parqueadero_cantidad > 0 && <div style={rowStyle}><span style={labelStyle}>Cant. parqueaderos</span><span style={valueStyle}>{c.parqueadero_cantidad}</span></div>}
            {c.parqueaderos > 0 && <div style={rowStyle}><span style={labelStyle}>Parqueaderos</span><span style={valueStyle}>{c.parqueaderos}</span></div>}
            {c.vigilancia_valor && <div style={rowStyle}><span style={labelStyle}>Vigilancia</span><span style={valueStyle}>{formatPrice(c.vigilancia_valor)}/mes</span></div>}
            {c.zona_lavanderia_tipo && <div style={rowStyle}><span style={labelStyle}>Lavandería</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.zona_lavanderia_tipo}</span></div>}
            {c.topografia && <div style={rowStyle}><span style={labelStyle}>Topografía</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.topografia}</span></div>}
            {c.tipo_via_acceso && <div style={rowStyle}><span style={labelStyle}>Vía acceso</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.tipo_via_acceso.replace(/_/g, ' ')}</span></div>}
            {c.uso_pot && <div style={rowStyle}><span style={labelStyle}>Uso del suelo</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.uso_pot}</span></div>}
            {c.zona_local && <div style={rowStyle}><span style={labelStyle}>Zona local</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.zona_local}</span></div>}
            {c.tipo_porton && <div style={rowStyle}><span style={labelStyle}>Tipo portón</span><span style={{ ...valueStyle, textTransform: 'capitalize' }}>{c.tipo_porton}</span></div>}
            {c.capacidad_carga && <div style={rowStyle}><span style={labelStyle}>Capacidad carga</span><span style={valueStyle}>{c.capacidad_carga}</span></div>}
            {c.unidad_area && c.unidad_area !== 'm2' && <div style={rowStyle}><span style={labelStyle}>Unidad área</span><span style={valueStyle}>{c.unidad_area}</span></div>}
            {c.numero_casas > 0 && <div style={rowStyle}><span style={labelStyle}>Número casas</span><span style={valueStyle}>{c.numero_casas}</span></div>}
            {c.minutos_cabecera && <div style={rowStyle}><span style={labelStyle}>Min. a cabecera</span><span style={valueStyle}>{c.minutos_cabecera} min</span></div>}
          </div>
        </div>
      )}

      {/* Amenidades */}
      {amenities.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '6px' }}>COMODIDADES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {amenities.map(a => (
              <span key={a} style={{ ...chipStyle, background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>✓ {a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Descripción */}
      {property.descripcion && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>DESCRIPCIÓN</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{property.descripcion}</p>
        </div>
      )}

      {/* Acabados */}
      {c.descripcion_acabados && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>ACABADOS</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0, lineHeight: 1.5 }}>{c.descripcion_acabados}</p>
        </div>
      )}

      {/* Vía / acceso */}
      {c.descripcion_via && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>VÍA DE ACCESO</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0, lineHeight: 1.5 }}>{c.descripcion_via}</p>
        </div>
      )}

      {/* Fuentes de agua (finca) */}
      {c.fuentes_agua && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>FUENTES DE AGUA</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0 }}>{c.fuentes_agua}</p>
        </div>
      )}

      {/* Cultivos / animales (finca) */}
      {c.cultivos_actuales && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>CULTIVOS</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0 }}>{c.cultivos_actuales}</p>
        </div>
      )}
      {c.animales && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>ANIMALES</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0 }}>{c.animales}</p>
        </div>
      )}

      {/* Otras construcciones (finca) */}
      {c.otras_construcciones && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>OTRAS CONSTRUCCIONES</div>
          <p style={{ fontSize: '12px', color: '#4A3F55', margin: 0 }}>{c.otras_construcciones}</p>
        </div>
      )}

      {/* Servicios disponibles */}
      {c.servicios_disponibles && Array.isArray(c.servicios_disponibles) && c.servicios_disponibles.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>SERVICIOS DISPONIBLES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {c.servicios_disponibles.map(s => (
              <span key={s} style={{ ...chipStyle, textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Servicios públicos (locales/bodegas) */}
      {c.servicios_publicos && Array.isArray(c.servicios_publicos) && c.servicios_publicos.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '4px' }}>SERVICIOS PÚBLICOS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {c.servicios_publicos.map(s => (
              <span key={s} style={{ ...chipStyle, textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Zonas comunes (apartamento) */}
      {c.zonas_comunes && (() => {
        try {
          const zonas = typeof c.zonas_comunes === 'string' ? JSON.parse(c.zonas_comunes) : c.zonas_comunes
          if (Array.isArray(zonas) && zonas.length > 0) {
            return (
              <div>
                <div style={{ ...labelStyle, marginBottom: '4px' }}>ZONAS COMUNES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {zonas.map(z => <span key={z} style={{ ...chipStyle, textTransform: 'capitalize' }}>{z.replace(/_/g, ' ')}</span>)}
                </div>
              </div>
            )
          }
        } catch { /* ignore */ }
        return null
      })()}
    </div>
  )
}
