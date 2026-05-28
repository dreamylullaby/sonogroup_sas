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
function mapearCaracteristicas(tipo, caract, servicios = {}) {
    const c = { ...caract };
    const serviciosLista = Object.entries(servicios)
        .filter(([, v]) => v)
        .map(([k]) => k);

    switch (tipo) {
        case 'casa':
            return {
                frente: c.area_frente || c.frente || null,
                fondo: c.area_fondo || c.fondo || null,
                anio_construccion: c.anio_construccion || null,
                pisos: c.pisos || null,
                habitaciones: c.habitaciones || null,
                banos: c.banos || null,
                sala_comedor: c.sala_comedor || null,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                tipo_parqueadero: c.parqueadero || c.tipo_parqueadero || null,
                patio: c.patio || false,
                jardin: c.jardin || false,
                terraza: c.terraza || false,
                balcon: c.balcon || false,
                zona_lavanderia: c.zona_lavado || c.zona_lavanderia || null,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'apartamento':
            return {
                frente: c.frente || null,
                fondo: c.fondo || null,
                anio_construccion: c.anio_construccion || null,
                piso: c.piso || null,
                torre: c.torre || null,
                habitaciones: c.habitaciones || null,
                banos: c.banos || null,
                sala_comedor: c.sala_comedor || null,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                tipo_parqueadero: c.parqueadero || c.tipo_parqueadero || null,
                balcon: c.balcon || false,
                ascensor: c.ascensor || false,
                vigilancia: c.vigilancia || false,
                vigilancia_valor: c.vigilancia_valor || null,
                zonas_comunes: c.zona_social || c.zonas_comunes || null,
                descripcion_acabados: c.descripcion_acabados || c.descripcion || null
            };
        case 'apartaestudio':
            return {
                area_total: c.area_total || null,
                tiene_bano: c.bano !== undefined ? c.bano : true,
                parqueadero: c.parqueadero || false,
                balcon: c.balcon || false,
                amoblado: c.amoblado || false,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'local':
            return {
                zona_local: c.zona_local || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                altura: c.altura || null,
                mezzanine: c.entrepiso || c.mezzanine || false,
                banos: c.banos !== undefined ? c.banos : false,
                servicios_publicos: serviciosLista,
                parqueaderos: c.parqueadero || null,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'bodega':
            return {
                area_construida: c.area_construida || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                altura_libre: c.altura_libre || null,
                tipo_porton: c.tipo_puerta_carga || c.tipo_porton || null,
                capacidad_carga: c.capacidad_carga || null,
                oficinas: c.oficinas || false,
                banos: c.banos !== undefined ? c.banos : false,
                vestier: c.vestier || false,
                acceso_camiones: c.acceso_camiones || false,
                servicios_publicos: serviciosLista
            };
        case 'finca':
            return {
                area_total: c.area_total || null,
                unidad_area: c.unidad_area || 'm2',
                area_cultivable: c.area_cultivable || null,
                area_construcciones: c.area_construcciones || null,
                fuentes_agua: c.fuentes_agua ? 'Sí' : null,
                casa_principal: c.casa_principal || false,
                otras_construcciones: c.otras_construcciones || null,
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null,
                cultivos_actuales: c.cultivos_actuales || null,
                topografia: c.topografia || null,
                servicios_disponibles: serviciosLista
            };
        case 'lote':
            return {
                area_total: c.area_total || null,
                topografia: c.topografia || null,
                servicios_disponibles: serviciosLista,
                uso_pot: c.uso_suelo || c.uso_pot || null,
                pendiente: c.pendiente || false,
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null
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
                estrato: parseInt(datos.estrato) || null,
                descripcion: datos.descripcion || '',
                numero_matricula: datos.numero_matricula || `MAT-${Date.now()}`,
                tipo_operacion: datos.tipo_operacion || 'venta',
                tipo_inmueble: datos.tipo_inmueble,
                estado_inmueble: datos.estado_inmueble || 'usado',
                zona: datos.zona || 'urbano',
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
