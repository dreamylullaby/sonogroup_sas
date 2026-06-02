import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

/**
 * GET /api/inmuebles/buscar
 * Endpoint avanzado de búsqueda con filtros completos
 */
router.get('/', async (req, res) => {
  try {
    const {
      // Filtros principales
      tipo_operacion,
      tipo_inmueble,
      departamento,
      municipio,
      barrio,
      precio_min,
      precio_max,
      // Área
      area_min,
      area_max,
      // Distribución
      habitaciones,
      banos,
      parqueaderos,
      // Condiciones
      estrato,
      estado_inmueble,
      anio_min,
      anio_max,
      // Características booleanas
      balcon,
      ascensor,
      vigilancia,
      piscina,
      gimnasio,
      terraza,
      patio,
      deposito,
      zona_bbq,
      zona_infantil,
      conjunto_cerrado,
      mascotas,
      // Publicación
      destacadas,
      dias_publicacion,
      // Ordenamiento
      orden,
      // Paginación
      limit = 50,
      offset = 0
    } = req.query;

    // 1. Query base sobre inmuebles
    let query = supabase
      .from('inmuebles')
      .select(`
        *,
        usuarios!inmuebles_id_usuario_fkey (nombre:nombre_completo, email, telefono),
        ubicaciones (*),
        fotografias (*),
        inmuebles_caracteristicas (id_caracteristica)
      `)
      .eq('activo', true)
      .eq('estado_aprobacion', 'aprobado');

    // Filtros directos sobre inmuebles
    if (tipo_inmueble) query = query.eq('tipo_inmueble', tipo_inmueble);
    if (tipo_operacion) query = query.eq('tipo_operacion', tipo_operacion);
    if (precio_min) query = query.gte('valor', parseFloat(precio_min));
    if (precio_max) query = query.lte('valor', parseFloat(precio_max));
    if (estrato) query = query.eq('estrato', parseInt(estrato));
    if (estado_inmueble) query = query.eq('estado_inmueble', estado_inmueble);

    // Filtro por fecha de publicación
    if (dias_publicacion) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - parseInt(dias_publicacion));
      query = query.gte('fecha_registro', fecha.toISOString());
    }

    // Ordenamiento
    switch (orden) {
      case 'precio_asc':
        query = query.order('valor', { ascending: true });
        break;
      case 'precio_desc':
        query = query.order('valor', { ascending: false });
        break;
      case 'recientes':
      default:
        query = query.order('fecha_registro', { ascending: false });
        break;
    }

    // Paginación
    const limitNum = Math.min(parseInt(limit), 100);
    const offsetNum = parseInt(offset) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error en búsqueda:', JSON.stringify(error));
      throw error;
    }

    // 2. Obtener características específicas de cada inmueble
    const tablas = {
      casa: 'casas', apartamento: 'apartamentos', apartaestudio: 'apartaestudios',
      local: 'locales', bodega: 'bodegas', finca: 'fincas', lote: 'lotes'
    };

    let resultados = await Promise.all(
      (data || []).map(async (inmueble) => {
        try {
          const tabla = tablas[inmueble.tipo_inmueble];
          if (!tabla) return inmueble;
          const { data: caracteristicas } = await supabase
            .from(tabla)
            .select('*')
            .eq('id_inmueble', inmueble.id_inmueble)
            .single();
          return { ...inmueble, caracteristicas };
        } catch {
          return inmueble;
        }
      })
    );

    // 3. Filtros post-query (ubicación, características, distribución)

    // Ubicación
    if (departamento) {
      resultados = resultados.filter(i =>
        i.ubicaciones?.departamento?.toLowerCase() === departamento.toLowerCase()
      );
    }
    if (municipio) {
      resultados = resultados.filter(i =>
        i.ubicaciones?.municipio?.toLowerCase().includes(municipio.toLowerCase())
      );
    }
    if (barrio) {
      resultados = resultados.filter(i =>
        i.ubicaciones?.barrio_vereda?.toLowerCase().includes(barrio.toLowerCase())
      );
    }

    // Distribución
    if (habitaciones) {
      const min = parseInt(habitaciones);
      resultados = resultados.filter(i => {
        const hab = i.caracteristicas?.habitaciones;
        return hab && hab >= min;
      });
    }
    if (banos) {
      const min = parseInt(banos);
      resultados = resultados.filter(i => {
        const b = i.caracteristicas?.banos;
        return b && b >= min;
      });
    }
    if (parqueaderos) {
      const min = parseInt(parqueaderos);
      resultados = resultados.filter(i => {
        const p = i.caracteristicas?.parqueadero_cantidad ||
                  i.caracteristicas?.parqueaderos || 0;
        return p >= min;
      });
    }

    // Área
    if (area_min || area_max) {
      resultados = resultados.filter(i => {
        const area = i.caracteristicas?.area_construida ||
                     i.caracteristicas?.area_total ||
                     i.caracteristicas?.area_lote || 0;
        if (area_min && area < parseFloat(area_min)) return false;
        if (area_max && area > parseFloat(area_max)) return false;
        return true;
      });
    }

    // Año de construcción
    if (anio_min || anio_max) {
      resultados = resultados.filter(i => {
        const anio = i.caracteristicas?.anio_construccion;
        if (!anio) return false;
        if (anio_min && anio < parseInt(anio_min)) return false;
        if (anio_max && anio > parseInt(anio_max)) return false;
        return true;
      });
    }

    // Características booleanas
    const boolFilters = { balcon, ascensor, vigilancia, terraza, patio, deposito };
    for (const [key, val] of Object.entries(boolFilters)) {
      if (val === 'true') {
        resultados = resultados.filter(i => i.caracteristicas?.[key] === true);
      }
    }

    // Piscina, gimnasio, zona_bbq, zona_infantil, conjunto_cerrado, mascotas
    // These come from caracteristicas_generales via inmuebles_caracteristicas
    // For now filter by name matching in the join
    if (piscina === 'true') {
      resultados = resultados.filter(i =>
        i.caracteristicas?.piscina === true ||
        hasCaracteristica(i, 'piscina')
      );
    }
    if (gimnasio === 'true') {
      resultados = resultados.filter(i => hasCaracteristica(i, 'gimnasio'));
    }
    if (zona_bbq === 'true') {
      resultados = resultados.filter(i => hasCaracteristica(i, 'bbq') || hasCaracteristica(i, 'zona_bbq'));
    }
    if (zona_infantil === 'true') {
      resultados = resultados.filter(i => hasCaracteristica(i, 'infantil') || hasCaracteristica(i, 'parque_infantil'));
    }
    if (conjunto_cerrado === 'true') {
      resultados = resultados.filter(i => hasCaracteristica(i, 'conjunto_cerrado') || hasCaracteristica(i, 'conjunto'));
    }
    if (mascotas === 'true') {
      resultados = resultados.filter(i => hasCaracteristica(i, 'mascotas'));
    }

    // Ordenamiento por área (post-filter)
    if (orden === 'area_mayor') {
      resultados.sort((a, b) => getArea(b) - getArea(a));
    } else if (orden === 'area_menor') {
      resultados.sort((a, b) => getArea(a) - getArea(b));
    }

    res.json({
      total: resultados.length,
      inmuebles: resultados
    });
  } catch (error) {
    console.error('❌ Error en búsqueda avanzada:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inmuebles/buscar/ubicaciones
 * Obtener departamentos, municipios y barrios disponibles
 */
router.get('/ubicaciones', async (req, res) => {
  try {
    const { departamento, municipio } = req.query;

    let query = supabase.from('ubicaciones').select('departamento, municipio, barrio_vereda');

    if (departamento) {
      query = query.ilike('departamento', departamento);
    }
    if (municipio) {
      query = query.ilike('municipio', municipio);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Extraer valores únicos
    const departamentos = [...new Set((data || []).map(u => u.departamento).filter(Boolean))].sort();
    const municipios = [...new Set((data || []).map(u => u.municipio).filter(Boolean))].sort();
    const barrios = [...new Set((data || []).map(u => u.barrio_vereda).filter(Boolean))].sort();

    res.json({ departamentos, municipios, barrios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helpers
function hasCaracteristica(inmueble, nombre) {
  const zonas = inmueble.caracteristicas?.zonas_comunes;
  if (Array.isArray(zonas)) {
    return zonas.some(z => z.toLowerCase().includes(nombre));
  }
  if (typeof zonas === 'string') {
    try {
      const parsed = JSON.parse(zonas);
      if (Array.isArray(parsed)) return parsed.some(z => z.toLowerCase().includes(nombre));
    } catch { /* ignore */ }
  }
  return false;
}

function getArea(inmueble) {
  return inmueble.caracteristicas?.area_construida ||
         inmueble.caracteristicas?.area_total ||
         inmueble.caracteristicas?.area_lote || 0;
}

export default router;
