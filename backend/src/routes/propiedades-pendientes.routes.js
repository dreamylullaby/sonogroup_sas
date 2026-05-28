import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

function obtenerTablaPorTipo(tipo) {
    const tablas = {
        casa: 'casas',
        apartamento: 'apartamentos',
        apartaestudio: 'apartaestudios',
        local: 'locales',
        bodega: 'bodegas',
        finca: 'fincas',
        lote: 'lotes'
    };
    return tablas[tipo] || null;
}

// Mapea campos del formulario a columnas reales de cada tabla hija
// Alineado con BD v3.4
function mapearCaracteristicas(tipo, caract, servicios = {}) {
    const c = { ...caract };
    const serviciosLista = Object.entries(servicios || {})
        .filter(([, v]) => v)
        .map(([k]) => k);

    switch (tipo) {
        case 'casa':
            return {
                area_lote: c.area_lote || null,
                area_construida: c.area_construida || null,
                frente: c.area_frente || c.frente || null,
                fondo: c.area_fondo || c.fondo || null,
                pisos: c.pisos || 1,
                anio_construccion: c.anio_construccion || c.anos_construccion || null,
                cantidad_duenos: c.cantidad_duenos || null,
                habitaciones: c.habitaciones || 1,
                banos: c.banos || 1,
                sala_comedor: c.sala_comedor || null,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                cocina_equipada: c.cocina_equipada || false,
                cuarto_servicio: c.cuarto_servicio || false,
                bano_servicio: c.bano_servicio || false,
                tipo_parqueadero: c.parqueadero || c.tipo_parqueadero || null,
                parqueadero_cantidad: c.parqueadero_cantidad || 0,
                patio: c.patio || false,
                jardin: c.jardin || false,
                antejadin: c.antejadin || false,
                terraza: c.terraza || false,
                balcon: c.balcon || false,
                zona_lavanderia: c.zona_lavanderia || c.zona_lavado || false,
                zona_lavanderia_tipo: (c.zona_lavanderia || c.zona_lavado) ? (c.zona_lavanderia_tipo || null) : null,
                chimenea: c.chimenea || false,
                deposito: c.deposito || false,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'apartamento':
            return {
                area_construida: c.area_construida || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                anio_construccion: c.anio_construccion || c.anos_construccion || null,
                cantidad_duenos: c.cantidad_duenos || null,
                piso: c.piso || null,
                torre: c.torre || null,
                numero_apartamento: c.numero_apartamento || null,
                habitaciones: c.habitaciones || 1,
                banos: c.banos || 1,
                sala_comedor: c.sala_comedor || null,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                cuarto_servicio: c.cuarto_servicio || false,
                bano_servicio: c.bano_servicio || false,
                tipo_parqueadero: c.parqueadero || c.tipo_parqueadero || null,
                balcon: c.balcon || false,
                ascensor: c.ascensor || false,
                vigilancia: c.vigilancia || false,
                vigilancia_valor: c.vigilancia ? (c.vigilancia_valor || c.valor_vigilancia || null) : null,
                zonas_comunes: c.zona_social || c.zonas_comunes || '[]',
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'apartaestudio':
            return {
                area_total: c.area_total || null,
                piso: c.piso || null,
                tiene_bano: c.tiene_bano !== undefined ? c.tiene_bano : (c.bano !== undefined ? c.bano : true),
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                amoblado: c.amoblado || false,
                deposito: c.deposito || false,
                parqueadero: c.parqueadero || false,
                balcon: c.balcon || false,
                ascensor: c.ascensor || false,
                vigilancia: c.vigilancia || false,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'local':
            return {
                area_total: c.area_total || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                altura: c.altura || null,
                piso: c.piso || null,
                zona_local: c.zona_local || null,
                uso_pot: c.uso_pot || c.uso_suelo || null,
                mezzanine: c.entrepiso || c.mezzanine || false,
                banos: c.banos !== undefined ? c.banos : false,
                servicios_publicos: serviciosLista.length > 0 ? serviciosLista : [],
                parqueaderos: c.parqueaderos || c.parqueadero || 0,
                vitrina: c.vitrina || false,
                sotano: c.sotano || false,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'bodega':
            return {
                area_construida: c.area_construida || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                area_lote: c.area_lote || null,
                altura_libre: c.altura_libre || null,
                tipo_porton: c.tipo_puerta_carga || c.tipo_porton || null,
                capacidad_carga: c.capacidad_carga || null,
                acceso_camiones: c.acceso_camiones || false,
                rampa_cargue: c.rampa_cargue || false,
                oficinas: c.oficinas || false,
                banos: c.banos !== undefined ? c.banos : false,
                vestier: c.vestier || false,
                servicios_publicos: serviciosLista.length > 0 ? serviciosLista : [],
                parqueaderos: c.parqueaderos || 0
            };
        case 'finca':
            return {
                area_total: c.area_total || null,
                unidad_area: c.unidad_area || 'm2',
                area_cultivable: c.area_cultivable || null,
                area_construcciones: c.area_construcciones || null,
                topografia: c.topografia || null,
                fuentes_agua: c.fuentes_agua || null,
                casa_principal: c.casa_principal || false,
                casa_principal_detalle: c.casa_principal_detalle || null,
                otras_construcciones: c.otras_construcciones || null,
                numero_casas: c.numero_casas || 0,
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null,
                descripcion_via: c.descripcion_via || null,
                cultivos_actuales: c.cultivos_actuales || null,
                animales: c.animales || null,
                servicios_disponibles: serviciosLista.length > 0 ? serviciosLista : [],
                piscina: c.piscina || false,
                jacuzzi: c.jacuzzi || false,
                chimenea: c.chimenea || false,
                cancha: c.cancha || false,
                lago_estanque: c.lago_estanque || false,
                cabana_mayordomo: c.cabana_mayordomo || false,
                minutos_cabecera: c.minutos_cabecera || null
            };
        case 'lote':
            return {
                area_total: c.area_total || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                topografia: c.topografia || null,
                pendiente: c.pendiente || false,
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null,
                descripcion_via: c.descripcion_via || null,
                servicios_disponibles: serviciosLista.length > 0 ? serviciosLista : [],
                uso_pot: c.uso_suelo || c.uso_pot || null,
                tiene_documento: c.tiene_documento || false,
                tiene_casa: c.tiene_casa || false
            };
        default:
            return c;
    }
}

// Obtener solicitudes del usuario actual
router.get('/mis-propiedades', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('solicitudes_publicacion')
            .select('*')
            .eq('id_usuario', req.usuario.id_usuario)
            .order('fecha_solicitud', { ascending: false });

        if (error) throw error;

        res.json({ propiedades: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las solicitudes pendientes (solo admin)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('solicitudes_publicacion')
            .select(`*, usuarios!solicitudes_publicacion_id_usuario_fkey (nombre:nombre_completo, email, telefono)`)
            .order('fecha_solicitud', { ascending: false });

        if (error) throw error;

        res.json({ propiedades: data || [] });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Aprobar solicitud (solo admin)
router.put('/:id/aprobar', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: solicitud, error: errorGet } = await supabase
            .from('solicitudes_publicacion')
            .select('*')
            .eq('id_solicitud', id)
            .single();

        if (errorGet) throw errorGet;

        const datos = solicitud.datos || {};

        // 1. Crear inmueble
        const { data: nuevoInmueble, error: errorInmueble } = await supabase
            .from('inmuebles')
            .insert([{
                id_usuario: solicitud.id_usuario,
                valor: parseFloat(datos.valor),
                valor_administracion: datos.valor_administracion ? parseFloat(datos.valor_administracion) : null,
                estrato: parseInt(datos.estrato) || null,
                descripcion: datos.descripcion || '',
                numero_matricula: datos.numero_matricula || `MAT-${Date.now()}`,
                codigo_catastral: datos.codigo_catastral || null,
                tipo_operacion: datos.tipo_operacion || 'venta',
                tipo_inmueble: datos.tipo_inmueble,
                estado_inmueble: datos.estado_inmueble || 'usado',
                zona: datos.zona || 'urbano',
                acepta_permuta: datos.acepta_permuta || false,
                estado_aprobacion: 'aprobado',
                fecha_aprobacion: new Date().toISOString()
            }])
            .select()
            .single();

        if (errorInmueble) throw errorInmueble;

        // 2. Crear ubicación
        if (datos.ubicacion) {
            const { tipo_via, ...ubicacionLimpia } = datos.ubicacion;
            await supabase
                .from('ubicaciones')
                .insert([{ id_inmueble: nuevoInmueble.id_inmueble, ...ubicacionLimpia }]);
        }

        // 3. Crear características específicas
        if (datos.caracteristicas && datos.tipo_inmueble) {
            const tabla = obtenerTablaPorTipo(datos.tipo_inmueble);
            if (!tabla) {
                throw new Error(`Tipo de inmueble no soportado: ${datos.tipo_inmueble}`);
            }
            const mapeadas = mapearCaracteristicas(datos.tipo_inmueble, datos.caracteristicas, datos.servicios);
            await supabase
                .from(tabla)
                .insert([{ id_inmueble: nuevoInmueble.id_inmueble, ...mapeadas }]);
        }

        // 4. Marcar solicitud como aprobada
        await supabase
            .from('solicitudes_publicacion')
            .update({
                estado_aprobacion: 'aprobado',
                admin_revisor: req.usuario.id_usuario,
                fecha_revision: new Date().toISOString()
            })
            .eq('id_solicitud', id);

        res.json({ mensaje: 'Propiedad aprobada y publicada', propiedad: nuevoInmueble });
    } catch (error) {
        console.error('❌ Error al aprobar solicitud:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rechazar solicitud (solo admin)
router.put('/:id/rechazar', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        const { data, error } = await supabase
            .from('solicitudes_publicacion')
            .update({
                estado_aprobacion: 'rechazado',
                motivo_rechazo: motivo,
                admin_revisor: req.usuario.id_usuario,
                fecha_revision: new Date().toISOString()
            })
            .eq('id_solicitud', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ mensaje: 'Solicitud rechazada', propiedad: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar solicitud
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: solicitud } = await supabase
            .from('solicitudes_publicacion')
            .select('id_usuario')
            .eq('id_solicitud', id)
            .single();

        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

        if (solicitud.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        const { error } = await supabase
            .from('solicitudes_publicacion')
            .delete()
            .eq('id_solicitud', id);

        if (error) throw error;

        res.json({ mensaje: 'Solicitud eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
