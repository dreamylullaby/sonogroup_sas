// ============================================================
// Mappers de payload: Frontend → Backend
// Alineados con BD v3.4 y backend mapearCaracteristicas()
// ============================================================

/**
 * Mapea las características del formulario frontend a los nombres
 * que espera el backend (que a su vez mapea a las columnas de BD v3.4)
 * 
 * NOTA: El backend tiene su propio mapper que acepta múltiples nombres
 * de campo (ej: c.cocina || c.tipo_cocina). Aquí enviamos los nombres
 * más directos posibles.
 */
export function mapCaracteristicasToBackend(tipo, formData) {
  switch (tipo) {
    case 'casa':
      return {
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        area_lote: parseNum(formData.area_lote),
        area_construida: parseNum(formData.area_construida),
        anio_construccion: parseInt(formData.anos_construccion) || null,
        cantidad_duenos: parseInt(formData.cantidad_duenos) || null,
        pisos: parseInt(formData.pisos) || 1,
        habitaciones: parseInt(formData.habitaciones) || 1,
        banos: parseInt(formData.banos) || 1,
        sala_comedor: formData.sala_comedor || null,
        // BD v3.4 usa ENUM tipo_cocina: 'integral','semi_integral','sencilla'
        tipo_cocina: formData.cocina || formData.tipo_cocina || null,
        cocina_equipada: !!formData.cocina_equipada,
        // BD v3.4 usa ENUM tipo_parqueadero_casa: 'interno','externo','cubierto','descubierto','ninguno'
        tipo_parqueadero: formData.parqueadero || formData.tipo_parqueadero || null,
        parqueadero_cantidad: parseInt(formData.parqueadero_cantidad) || 0,
        patio: !!formData.patio,
        jardin: !!formData.jardin,
        terraza: !!formData.terraza,
        balcon: !!formData.balcon,
        zona_lavanderia: !!formData.zona_lavanderia,
        // BD v3.4 usa ENUM tipo_zona_lavanderia: 'interna','externa'
        zona_lavanderia_tipo: formData.zona_lavanderia ? (formData.zona_lavanderia_tipo || null) : null,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'apartamento':
      return {
        area_construida: parseNum(formData.area_construida),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        anio_construccion: parseInt(formData.anos_construccion) || null,
        cantidad_duenos: parseInt(formData.cantidad_duenos) || null,
        piso: parseInt(formData.piso) || null,
        torre: parseInt(formData.torre) || null,
        habitaciones: parseInt(formData.habitaciones) || 1,
        banos: parseInt(formData.banos) || 1,
        sala_comedor: formData.sala_comedor || null,
        tipo_cocina: formData.cocina || formData.tipo_cocina || null,
        // BD v3.4 usa ENUM tipo_parqueadero_apto: 'privado','comun','ninguno'
        tipo_parqueadero: formData.parqueadero || formData.tipo_parqueadero || null,
        balcon: !!formData.balcon,
        ascensor: !!formData.ascensor,
        vigilancia: !!formData.vigilancia,
        // BD v3.4: vigilancia_valor solo si vigilancia=true (constraint)
        vigilancia_valor: formData.vigilancia ? parseNum(formData.valor_vigilancia) : null,
        zonas_comunes: formData.zonas_comunes || formData.zona_social || '[]',
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'apartaestudio':
      return {
        area_total: parseNum(formData.area_total),
        tiene_bano: formData.tiene_bano !== undefined ? !!formData.tiene_bano : true,
        parqueadero: !!formData.parqueadero,
        balcon: !!formData.balcon,
        amoblado: !!formData.amoblado,
        tipo_cocina: formData.cocina || formData.tipo_cocina || null,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'local':
      return {
        area_total: parseNum(formData.area_total),
        zona_local: formData.zona_local || null,
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        altura: parseNum(formData.altura),
        mezzanine: !!formData.mezzanine || !!formData.entrepiso,
        banos: !!formData.banos,
        parqueaderos: parseInt(formData.parqueaderos) || parseInt(formData.parqueadero) || 0,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'bodega':
      return {
        area_construida: parseNum(formData.area_construida),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        altura_libre: parseNum(formData.altura_libre),
        tipo_porton: formData.tipo_puerta_carga || formData.tipo_porton || null,
        capacidad_carga: formData.capacidad_carga || null,
        oficinas: !!formData.oficinas,
        banos: !!formData.banos,
        vestier: !!formData.vestier,
        acceso_camiones: !!formData.acceso_camiones,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'finca':
      return {
        area_total: parseNum(formData.area_total),
        // BD v3.4 usa ENUM unidad_area_finca: 'm2','hectareas','fanegadas','cuadras'
        unidad_area: formData.unidad_area || 'm2',
        area_cultivable: parseNum(formData.area_cultivable),
        area_construcciones: parseNum(formData.area_construcciones),
        // BD v3.4 usa ENUM tipo_topografia
        topografia: formData.topografia || null,
        fuentes_agua: formData.fuentes_agua ? 'Sí' : null,
        casa_principal: !!formData.casa_principal,
        otras_construcciones: formData.otras_construcciones || null,
        // BD v3.4 usa ENUM tipo_via_acceso: 'pavimentada','afirmada','trocha','sin_via'
        tipo_via_acceso: formData.vias_acceso || formData.tipo_via_acceso || null,
        cultivos_actuales: formData.cultivos_actuales || null
      }

    case 'lote':
      return {
        area_total: parseNum(formData.area_total),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        topografia: formData.topografia || null,
        pendiente: !!formData.pendiente,
        tipo_via_acceso: formData.vias_acceso || formData.tipo_via_acceso || null,
        uso_pot: formData.uso_suelo || formData.uso_pot || null
      }

    default:
      return formData
  }
}

/**
 * Construye el payload completo para crear/editar inmueble
 */
export function buildInmueblePayload(formDataComun, ubicacion, servicios, caracteristicasRaw) {
  const tipo = formDataComun.tipo_inmueble
  const caracteristicas = mapCaracteristicasToBackend(tipo, caracteristicasRaw)

  return {
    valor: parseFloat(formDataComun.valor),
    estrato: parseInt(formDataComun.estrato) || null,
    descripcion: formDataComun.descripcion || null,
    numero_matricula: formDataComun.numero_matricula || null,
    tipo_operacion: formDataComun.tipo_operacion,
    tipo_inmueble: tipo,
    estado_inmueble: formDataComun.estado_inmueble,
    zona: formDataComun.zona,
    ubicacion: {
      direccion: ubicacion.direccion || '',
      barrio_vereda: ubicacion.barrio_vereda || '',
      municipio: ubicacion.municipio,
      departamento: ubicacion.departamento || 'Colombia'
    },
    servicios,
    caracteristicas
  }
}

function parseNum(val) {
  if (val === '' || val === null || val === undefined) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}
