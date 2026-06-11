import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken, verificarRol } from '../../middleware/auth.js';

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

// Obtener todas las solicitudes (solo admin) — soporta ?tipo=publicacion|edicion|eliminacion
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { tipo } = req.query;

        let query = supabase
            .from('solicitudes_publicacion')
            .select(`*, usuarios!solicitudes_publicacion_id_usuario_fkey (nombre:nombre_completo, email, telefono)`)
            .order('fecha_solicitud', { ascending: false });

        if (tipo) {
            query = query.eq('tipo_solicitud', tipo);
        }

        const { data, error } = await query;
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

        // Si es solicitud de edición, solo marcar como aprobada (no crear inmueble)
        if (solicitud.tipo_solicitud === 'edicion') {
            await supabase
                .from('solicitudes_publicacion')
                .update({
                    estado_aprobacion: 'aprobado',
                    admin_revisor: req.usuario.id_usuario,
                    fecha_revision: new Date().toISOString()
                })
                .eq('id_solicitud', id);

            // Notificar al usuario
            await supabase.from('notificaciones').insert([{
                id_usuario: solicitud.id_usuario,
                tipo: 'aprobacion',
                titulo: 'Edición aprobada',
                mensaje: `Tu solicitud de edición para la propiedad #${solicitud.id_inmueble} ha sido aprobada. Ya puedes editar tu propiedad.`
            }]);

            return res.json({ mensaje: 'Solicitud de edición aprobada' });
        }

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

        // 5. Notificar al usuario
        await supabase.from('notificaciones').insert([{
            id_usuario: solicitud.id_usuario,
            tipo: 'aprobacion',
            titulo: 'Propiedad aprobada',
            mensaje: `Tu solicitud de publicacion ha sido aprobada. Tu ${datos.tipo_inmueble || 'propiedad'} ya esta visible en el portafolio.`,
            id_inmueble: nuevoInmueble.id_inmueble
        }]);

        // 6. Notificar a admins
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins) {
            await supabase.from('notificaciones').insert(
                admins.map(a => ({ id_usuario: a.id_usuario, tipo: 'sistema', titulo: 'Solicitud aprobada', mensaje: `Se aprobo una solicitud de ${datos.tipo_inmueble || 'propiedad'} en ${datos.ubicacion?.municipio || 'sin ubicacion'}` }))
            );
        }

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

        // Obtener solicitud para guardar snapshot
        const { data: solicitudActual, error: errGet } = await supabase
            .from('solicitudes_publicacion')
            .select('*')
            .eq('id_solicitud', id)
            .single();

        if (errGet || !solicitudActual) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Preparar snapshot: si es edición y tiene id_inmueble, obtener datos actuales del inmueble
        let snapshot = solicitudActual.datos;
        if (solicitudActual.tipo_solicitud === 'edicion' && solicitudActual.id_inmueble) {
            const { data: inmuebleActual } = await supabase
                .from('inmuebles')
                .select('*, ubicaciones(*)')
                .eq('id_inmueble', solicitudActual.id_inmueble)
                .single();
            if (inmuebleActual) {
                snapshot = inmuebleActual;
            }
        }

        const { data, error } = await supabase
            .from('solicitudes_publicacion')
            .update({
                estado_aprobacion: 'rechazado',
                motivo_rechazo: motivo,
                admin_revisor: req.usuario.id_usuario,
                fecha_revision: new Date().toISOString(),
                fecha_rechazo: new Date().toISOString(),
                snapshot_datos_rechazo: snapshot
            })
            .eq('id_solicitud', id)
            .select()
            .single();

        if (error) throw error;

        // Notificar al usuario del rechazo
        await supabase.from('notificaciones').insert([{
            id_usuario: data.id_usuario,
            tipo: 'rechazo',
            titulo: 'Solicitud rechazada',
            mensaje: motivo ? `Tu solicitud fue rechazada. Motivo: ${motivo}` : 'Tu solicitud de publicacion fue rechazada.'
        }]);

        res.json({ mensaje: 'Solicitud rechazada', propiedad: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reenviar solicitud (usuario) — para solicitudes en estado 'no_resuelto' o 'rechazado'
router.post('/:id/reenviar', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: solicitudOriginal, error: errGet } = await supabase
            .from('solicitudes_publicacion')
            .select('*')
            .eq('id_solicitud', id)
            .single();

        if (errGet || !solicitudOriginal) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Verificar que sea del usuario
        if (solicitudOriginal.id_usuario !== req.usuario.id_usuario) {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        // Solo reenviar si está en no_resuelto o rechazado
        if (!['no_resuelto', 'rechazado'].includes(solicitudOriginal.estado_aprobacion)) {
            return res.status(400).json({ error: 'Solo puedes reenviar solicitudes no resueltas o rechazadas' });
        }

        // Si es rechazada, verificar que haya cambios
        if (solicitudOriginal.estado_aprobacion === 'rechazado' && solicitudOriginal.snapshot_datos_rechazo) {
            const { hayCambios } = compararDatos(solicitudOriginal.datos, solicitudOriginal.snapshot_datos_rechazo);
            if (!hayCambios) {
                return res.status(400).json({
                    error: 'Debes realizar cambios antes de reenviar',
                    codigo: 'SIN_CAMBIOS'
                });
            }
        }

        // Crear nueva solicitud clonando datos
        const { data: nuevaSolicitud, error: errorInsert } = await supabase
            .from('solicitudes_publicacion')
            .insert([{
                id_usuario: solicitudOriginal.id_usuario,
                id_inmueble: solicitudOriginal.id_inmueble,
                datos: solicitudOriginal.datos,
                estado_aprobacion: 'pendiente',
                tipo_solicitud: solicitudOriginal.tipo_solicitud
            }])
            .select()
            .single();

        if (errorInsert) throw errorInsert;

        // Notificar a admins
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins && admins.length > 0) {
            await supabase.from('notificaciones').insert(
                admins.map(a => ({
                    id_usuario: a.id_usuario,
                    tipo: 'sistema',
                    titulo: 'Solicitud reenviada',
                    mensaje: `Un usuario ha reenviado una solicitud para revisión.`
                }))
            );
        }

        res.status(201).json({ mensaje: 'Solicitud reenviada', solicitud: nuevaSolicitud });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear solicitud de edición (usuario dueño del inmueble)
router.post('/solicitud-edicion', verificarToken, async (req, res) => {
    try {
        const { id_inmueble, motivo } = req.body;

        if (!id_inmueble) {
            return res.status(400).json({ error: 'id_inmueble es requerido' });
        }

        if (!motivo || motivo.trim().length < 20) {
            return res.status(400).json({ error: 'La justificación debe tener al menos 20 caracteres' });
        }

        // Verificar que el usuario sea dueño del inmueble
        const { data: inmueble, error: errInm } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id_inmueble)
            .single();

        if (errInm || !inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario) {
            return res.status(403).json({ error: 'No eres el propietario de este inmueble' });
        }

        // Verificar si ya tiene una solicitud de edición activa (pendiente o aprobada)
        const { data: existente } = await supabase
            .from('solicitudes_publicacion')
            .select('id_solicitud, estado_aprobacion')
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('id_inmueble', id_inmueble)
            .eq('tipo_solicitud', 'edicion')
            .in('estado_aprobacion', ['pendiente', 'aprobado'])
            .limit(1)
            .maybeSingle();

        if (existente) {
            return res.status(400).json({
                error: existente.estado_aprobacion === 'aprobado'
                    ? 'Ya tienes permiso de edición activo para este inmueble'
                    : 'Ya tienes una solicitud de edición pendiente para este inmueble',
                solicitud: existente
            });
        }

        // Crear solicitud de edición
        const { data: solicitud, error: errorInsert } = await supabase
            .from('solicitudes_publicacion')
            .insert([{
                id_usuario: req.usuario.id_usuario,
                id_inmueble: id_inmueble,
                datos: { motivo: motivo.trim() },
                estado_aprobacion: 'pendiente',
                tipo_solicitud: 'edicion'
            }])
            .select()
            .single();

        if (errorInsert) throw errorInsert;

        // Notificar a admins
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins && admins.length > 0) {
            await supabase.from('notificaciones').insert(
                admins.map(a => ({
                    id_usuario: a.id_usuario,
                    tipo: 'sistema',
                    titulo: 'Solicitud de edición',
                    mensaje: `Un usuario solicita permiso para editar su propiedad #${id_inmueble}.`
                }))
            );
        }

        res.status(201).json({ mensaje: 'Solicitud de edición enviada', solicitud });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener solicitud de edición más reciente para un inmueble del usuario
router.get('/solicitud-edicion/:id_inmueble', verificarToken, async (req, res) => {
    try {
        const { id_inmueble } = req.params;

        const { data, error } = await supabase
            .from('solicitudes_publicacion')
            .select('*')
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('id_inmueble', id_inmueble)
            .eq('tipo_solicitud', 'edicion')
            .order('fecha_solicitud', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        res.json({ solicitud: data || null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear solicitud de revisión de edición (usuario envía cambios para revisión)
router.post('/revision-edicion', verificarToken, async (req, res) => {
    try {
        const { id_inmueble, snapshot_cambios } = req.body;

        if (!id_inmueble || !snapshot_cambios) {
            return res.status(400).json({ error: 'id_inmueble y snapshot_cambios son requeridos' });
        }

        // Verificar que el usuario sea dueño
        const { data: inmueble, error: errInm } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id_inmueble)
            .single();

        if (errInm || !inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario) {
            return res.status(403).json({ error: 'No eres el propietario de este inmueble' });
        }

        // Verificar que tenga una solicitud de edición aprobada
        const { data: edicionAprobada } = await supabase
            .from('solicitudes_publicacion')
            .select('id_solicitud')
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('id_inmueble', id_inmueble)
            .eq('tipo_solicitud', 'edicion')
            .eq('estado_aprobacion', 'aprobado')
            .limit(1)
            .maybeSingle();

        if (!edicionAprobada) {
            return res.status(403).json({ error: 'No tienes permiso de edición activo para este inmueble' });
        }

        // Obtener snapshot anterior (datos actuales del inmueble)
        const { data: inmuebleActual } = await supabase
            .from('inmuebles')
            .select('*, ubicaciones(*)')
            .eq('id_inmueble', id_inmueble)
            .single();

        // Crear solicitud de revisión de edición
        const { data: solicitud, error: errorInsert } = await supabase
            .from('solicitudes_publicacion')
            .insert([{
                id_usuario: req.usuario.id_usuario,
                id_inmueble: id_inmueble,
                datos: snapshot_cambios,
                estado_aprobacion: 'pendiente',
                tipo_solicitud: 'revision_edicion',
                snapshot_datos_rechazo: inmuebleActual // datos ANTES de los cambios
            }])
            .select()
            .single();

        if (errorInsert) throw errorInsert;

        // Marcar la solicitud de edición original como 'en_revision' usando motivo_rechazo como estado auxiliar
        await supabase
            .from('solicitudes_publicacion')
            .update({ motivo_rechazo: 'en_revision' })
            .eq('id_solicitud', edicionAprobada.id_solicitud);

        // Notificar a admins
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins && admins.length > 0) {
            const { data: usr } = await supabase.from('usuarios').select('nombre_completo').eq('id_usuario', req.usuario.id_usuario).single();
            await supabase.from('notificaciones').insert(
                admins.map(a => ({
                    id_usuario: a.id_usuario,
                    tipo: 'sistema',
                    titulo: 'Cambios enviados para revisión',
                    mensaje: `${usr?.nombre_completo || 'Un usuario'} envió cambios para revisión en propiedad #${id_inmueble}.`
                }))
            );
        }

        res.status(201).json({ mensaje: 'Cambios enviados para revisión', solicitud });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Aprobar cambios de revisión de edición (admin aplica los cambios al inmueble)
router.put('/:id/aprobar-cambios', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: solicitud, error: errGet } = await supabase
            .from('solicitudes_publicacion')
            .select('*')
            .eq('id_solicitud', id)
            .single();

        if (errGet || !solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (solicitud.tipo_solicitud !== 'revision_edicion') {
            return res.status(400).json({ error: 'Esta solicitud no es de revisión de edición' });
        }

        const cambios = solicitud.datos;
        const idInmueble = solicitud.id_inmueble;

        // Aplicar cambios al inmueble
        const datosInmueble = {};
        if (cambios.valor !== undefined) datosInmueble.valor = parseFloat(cambios.valor);
        if (cambios.valor_administracion !== undefined) datosInmueble.valor_administracion = cambios.valor_administracion ? parseFloat(cambios.valor_administracion) : null;
        if (cambios.estrato !== undefined) datosInmueble.estrato = parseInt(cambios.estrato) || null;
        if (cambios.descripcion !== undefined) datosInmueble.descripcion = cambios.descripcion;
        if (cambios.numero_matricula !== undefined) datosInmueble.numero_matricula = cambios.numero_matricula;
        if (cambios.codigo_catastral !== undefined) datosInmueble.codigo_catastral = cambios.codigo_catastral || null;
        if (cambios.tipo_operacion !== undefined) datosInmueble.tipo_operacion = cambios.tipo_operacion;
        if (cambios.tipo_inmueble !== undefined) datosInmueble.tipo_inmueble = cambios.tipo_inmueble;
        if (cambios.estado_inmueble !== undefined) datosInmueble.estado_inmueble = cambios.estado_inmueble;
        if (cambios.zona !== undefined) datosInmueble.zona = cambios.zona;
        if (cambios.acepta_permuta !== undefined) datosInmueble.acepta_permuta = cambios.acepta_permuta;

        if (Object.keys(datosInmueble).length > 0) {
            await supabase.from('inmuebles').update(datosInmueble).eq('id_inmueble', idInmueble);
        }

        // Actualizar ubicación si viene
        if (cambios.ubicacion && Object.keys(cambios.ubicacion).length > 0) {
            const { tipo_via, ...ubicacionLimpia } = cambios.ubicacion;
            await supabase.from('ubicaciones').update(ubicacionLimpia).eq('id_inmueble', idInmueble);
        }

        // Actualizar características si vienen
        if (cambios.caracteristicas && Object.keys(cambios.caracteristicas).length > 0) {
            const tipoInmueble = cambios.tipo_inmueble || (await supabase.from('inmuebles').select('tipo_inmueble').eq('id_inmueble', idInmueble).single()).data?.tipo_inmueble;
            const tablaHija = obtenerTablaPorTipo(tipoInmueble);
            if (tablaHija) {
                const mapeadas = mapearCaracteristicas(tipoInmueble, cambios.caracteristicas, cambios.servicios);
                await supabase.from(tablaHija).update(mapeadas).eq('id_inmueble', idInmueble);
            }
        }

        // Marcar solicitud de revisión como aprobada
        await supabase.from('solicitudes_publicacion').update({
            estado_aprobacion: 'aprobado',
            admin_revisor: req.usuario.id_usuario,
            fecha_revision: new Date().toISOString()
        }).eq('id_solicitud', id);

        // Marcar la solicitud de edición original como completada (limpiar flag en_revision)
        await supabase.from('solicitudes_publicacion').update({
            motivo_rechazo: null
        }).eq('id_usuario', solicitud.id_usuario)
          .eq('id_inmueble', idInmueble)
          .eq('tipo_solicitud', 'edicion')
          .eq('estado_aprobacion', 'aprobado');

        // Notificar al usuario
        await supabase.from('notificaciones').insert([{
            id_usuario: solicitud.id_usuario,
            tipo: 'aprobacion',
            titulo: 'Cambios aprobados',
            mensaje: `Tus cambios en la propiedad #${idInmueble} fueron aprobados y ya están publicados.`
        }]);

        res.json({ mensaje: 'Cambios aprobados y aplicados' });
    } catch (error) {
        console.error('❌ Error al aprobar cambios:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verificar cambios entre datos actuales y snapshot de rechazo
router.get('/:id/verificar-cambios', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: solicitud, error: errGet } = await supabase
            .from('solicitudes_publicacion')
            .select('id_usuario, datos, snapshot_datos_rechazo, id_inmueble, tipo_solicitud')
            .eq('id_solicitud', id)
            .single();

        if (errGet || !solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (solicitud.id_usuario !== req.usuario.id_usuario) {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        if (!solicitud.snapshot_datos_rechazo) {
            return res.json({ hayCambios: true, camposModificados: [] });
        }

        // Para solicitudes de edición, comparar datos actuales del inmueble con snapshot
        let datosActuales = solicitud.datos;
        if (solicitud.tipo_solicitud === 'edicion' && solicitud.id_inmueble) {
            const { data: inmueble } = await supabase
                .from('inmuebles')
                .select('*, ubicaciones(*)')
                .eq('id_inmueble', solicitud.id_inmueble)
                .single();
            if (inmueble) {
                datosActuales = inmueble;
            }
        }

        const resultado = compararDatos(datosActuales, solicitud.snapshot_datos_rechazo);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Función auxiliar para comparar datos
function compararDatos(datosActuales, snapshot) {
    const camposModificados = [];

    const keysToCompare = new Set([
        ...Object.keys(datosActuales || {}),
        ...Object.keys(snapshot || {})
    ]);

    for (const key of keysToCompare) {
        if (key === 'id_inmueble' || key === 'fecha_registro' || key === 'fecha_aprobacion') continue;
        const valActual = JSON.stringify(datosActuales?.[key] ?? null);
        const valSnapshot = JSON.stringify(snapshot?.[key] ?? null);
        if (valActual !== valSnapshot) {
            camposModificados.push(key);
        }
    }

    return {
        hayCambios: camposModificados.length > 0,
        camposModificados
    };
}

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
