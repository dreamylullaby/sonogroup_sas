// ============================================================
// Mappers de payload: Frontend → Backend
// Alineados con BD v3.4 y backend mapearCaracteristicas()
// ============================================================

/**
 * Mapea las características del formulario frontend a los nombres
 * que espera el backend (que a su vez mapea a las columnas de BD v3.4)
 */
export function mapCaracteristicasToBackend(tipo, formData) {
  switch (tipo) {
    case 'casa':
      return {
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        area_lote: parseNum(formData.area_lote),
        area_construida: parseNum(formData.area_construida),
        anio_construccion: parseInt(formData.ano_construccion) || parseInt(formData.anos_construccion) || null,
        cantidad_duenos: parseInt(formData.cantidad_duenos) || null,
        pisos: parseInt(formData.pisos) || 1,
        habitaciones: parseInt(formData.habitaciones) || 1,
        banos: parseInt(formData.banos) || 1,
        sala_comedor: formData.sala_comedor || null,
        tipo_cocina: formData.cocina || formData.tipo_cocina || null,
        cocina_equipada: !!formData.cocina_equipada,
        cuarto_servicio: !!formData.cuarto_servicio,
        bano_servicio: !!formData.bano_servicio,
        tipo_parqueadero: formData.parqueadero || formData.tipo_parqueadero || null,
        parqueadero_cantidad: parseInt(formData.parqueaderos) || parseInt(formData.parqueadero_cantidad) || 0,
        patio: !!formData.patio,
        jardin: !!formData.jardin,
        antejadin: !!formData.antejardin || !!formData.antejadin,
        terraza: !!formData.terraza,
        balcon: !!formData.balcon,
        zona_lavanderia: !!formData.zona_lavanderia,
        // BD v3.4 constraint: zona_lavanderia=false → zona_lavanderia_tipo must be NULL
        zona_lavanderia_tipo: formData.zona_lavanderia ? (formData.zona_lavanderia_tipo || null) : null,
        chimenea: !!formData.chimenea,
        deposito: !!formData.deposito,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'apartamento': {
      // Chips que se agregan al array zonas_comunes en BD
      const zonaComunesChips = ['gimnasio', 'piscina', 'terraza', 'zona_lavanderia', 'deposito', 'cocina_equipada']
      const zonas_comunes = zonaComunesChips.filter(chip => !!formData[chip])

      return {
        area_construida: parseNum(formData.area_construida),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        anio_construccion: parseInt(formData.ano_construccion) || parseInt(formData.anos_construccion) || null,
        cantidad_duenos: parseInt(formData.cantidad_duenos) || null,
        piso: parseInt(formData.piso) || null,
        torre: parseInt(formData.torre) || null,
        numero_apartamento: formData.numero_apartamento || null,
        habitaciones: parseInt(formData.habitaciones) || 1,
        banos: parseInt(formData.banos) || 1,
        sala_comedor: formData.sala_comedor || null,
        tipo_cocina: formData.cocina || formData.tipo_cocina || null,
        cuarto_servicio: !!formData.cuarto_servicio,
        bano_servicio: !!formData.bano_servicio,
        tipo_parqueadero: formData.parqueadero || formData.tipo_parqueadero || null,
        balcon: !!formData.balcon,
        ascensor: !!formData.ascensor,
        vigilancia: !!formData.vigilancia,
        // BD v3.4 constraint: vigilancia=false → vigilancia_valor must be NULL
        vigilancia_valor: formData.vigilancia ? parseNum(formData.valor_vigilancia || formData.vigilancia_valor) : null,
        zonas_comunes,
        descripcion_acabados: formData.descripcion_acabados || null
      }
    }

    case 'apartaestudio':
      return {
        area_total: parseNum(formData.area_total),
        piso: parseInt(formData.piso) || null,
        tiene_bano: formData.tiene_bano !== undefined ? !!formData.tiene_bano : true,
        tipo_cocina: formData.cocina || formData.tipo_cocina || null,
        amoblado: !!formData.amoblado,
        deposito: !!formData.deposito,
        parqueadero: !!formData.parqueadero,
        balcon: !!formData.balcon,
        ascensor: !!formData.ascensor,
        vigilancia: !!formData.vigilancia,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'local':
      return {
        area_total: parseNum(formData.area_total),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        altura: parseNum(formData.altura),
        piso: parseInt(formData.piso) || null,
        zona_local: formData.zona_local || null,
        uso_pot: formData.uso_pot || formData.uso_suelo || null,
        mezzanine: !!formData.mezanine || !!formData.mezzanine || !!formData.entrepiso,
        banos: !!formData.bano_privado || !!formData.banos,
        parqueaderos: formData.parqueadero ? 1 : (parseInt(formData.parqueaderos) || 0),
        vitrina: !!formData.vitrina,
        sotano: !!formData.sotano,
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'bodega':
      return {
        area_construida: parseNum(formData.area_construida),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        area_lote: parseNum(formData.area_lote),
        altura_libre: parseNum(formData.altura) || parseNum(formData.altura_libre),
        tipo_porton: formData.tipo_puerta_carga || formData.tipo_porton || null,
        capacidad_carga: formData.capacidad_carga || null,
        acceso_camiones: !!formData.acceso_camiones,
        rampa_cargue: !!formData.muelle_carga || !!formData.rampa_cargue,
        oficinas: !!formData.oficina || !!formData.oficinas,
        banos: !!formData.bano || !!formData.banos,
        vestier: !!formData.vestier,
        parqueaderos: formData.parqueadero ? 1 : (parseInt(formData.parqueaderos) || 0),
        descripcion_acabados: formData.descripcion_acabados || null
      }

    case 'finca':
      return {
        area_total: parseNum(formData.area_total),
        unidad_area: formData.unidad_area || 'm2',
        area_cultivable: parseNum(formData.area_cultivable),
        area_construcciones: parseNum(formData.area_construida) || parseNum(formData.area_construcciones),
        topografia: formData.topografia || null,
        fuentes_agua: formData.rio ? 'rio' : (formData.fuentes_agua || null),
        casa_principal: !!formData.casa_principal,
        casa_principal_detalle: formData.casa_principal_detalle || null,
        otras_construcciones: formData.otras_construcciones || null,
        numero_casas: parseInt(formData.numero_casas) || 0,
        tipo_via_acceso: formData.vias_acceso || formData.tipo_via_acceso || null,
        descripcion_via: formData.descripcion_via || null,
        cultivos_actuales: formData.cultivos ? (formData.cultivos_actuales || 'Sí') : (formData.cultivos_actuales || null),
        animales: formData.ganado ? (formData.animales || 'Sí') : (formData.animales || null),
        piscina: !!formData.piscina,
        jacuzzi: !!formData.jacuzzi,
        chimenea: !!formData.chimenea,
        cancha: !!formData.cancha,
        lago_estanque: !!formData.lago || !!formData.lago_estanque,
        cabana_mayordomo: !!formData.casa_trabajadores || !!formData.cabana_mayordomo,
        minutos_cabecera: parseInt(formData.minutos_cabecera) || null
      }

    case 'lote':
      return {
        area_total: parseNum(formData.area_total),
        frente: parseNum(formData.frente),
        fondo: parseNum(formData.fondo),
        topografia: formData.esquinero ? 'esquinero' : (formData.topografia || null),
        pendiente: formData.inclinado ? true : (formData.plano ? false : null),
        tipo_via_acceso: formData.vias_acceso || formData.tipo_via_acceso || null,
        descripcion_via: formData.descripcion_via || null,
        servicios_disponibles: formData.servicios_publicos ? ['acueducto', 'energia', 'alcantarillado'] : (formData.servicios_disponibles || []),
        uso_pot: formData.uso_suelo || formData.uso_pot || null,
        tiene_documento: !!formData.escrituras || !!formData.tiene_documento,
        tiene_casa: !!formData.tiene_casa
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
    valor_administracion: (formDataComun.valor_administracion !== '' && formDataComun.valor_administracion != null)
      ? parseFloat(formDataComun.valor_administracion)
      : null,
    estrato: (formDataComun.estrato && formDataComun.estrato !== 'no_aplica')
      ? parseInt(formDataComun.estrato)
      : null,
    descripcion: formDataComun.descripcion || null,
    numero_matricula: formDataComun.numero_matricula || null,
    codigo_catastral: formDataComun.codigo_catastral || null,
    tipo_operacion: formDataComun.tipo_operacion,
    tipo_inmueble: tipo,
    estado_inmueble: formDataComun.estado_inmueble,
    zona: formDataComun.zona,
    acepta_permuta: !!formDataComun.acepta_permuta,
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
