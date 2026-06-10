import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

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

function mapearCaracteristicas(tipo, caract, servicios = {}) {
    const c = { ...caract };
    const serviciosLista = Object.entries(servicios)
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
                zona_lavanderia: c.zona_lavanderia || false,
                zona_lavanderia_tipo: c.zona_lavanderia ? (c.zona_lavanderia_tipo || c.zona_lavado || null) : null,
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
                pendiente: c.pendiente === true ? true : (c.pendiente === false ? false : null),
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null,
                descripcion_via: c.descripcion_via || null,
                servicios_disponibles: Array.isArray(c.servicios_disponibles) && c.servicios_disponibles.length > 0
                    ? c.servicios_disponibles
                    : (serviciosLista.length > 0 ? serviciosLista : []),
                uso_pot: c.uso_suelo || c.uso_pot || null,
                tiene_documento: c.tiene_documento || false,
                tiene_casa: c.tiene_casa || false
            };
        default:
            return c;
    }
}

// Obtener todos los inmuebles con filtros opcionales
router.get('/', async (req, res) => {
    try {
        const { 
            tipo_inmueble, 
            tipo_operacion, 
            zona, 
            municipio,
            precio_min,
            precio_max,
            estado_aprobacion,
            limit = 50, 
            offset = 0 
        } = req.query;

        let query = supabase
            .from('inmuebles')
            .select(`
                *,
                usuarios!inmuebles_id_usuario_fkey (nombre:nombre_completo, email, telefono),
                ubicaciones (*),
                fotografias (*)
            `)
            .range(offset, offset + limit - 1);

        // Aplicar filtros
        if (tipo_inmueble) query = query.eq('tipo_inmueble', tipo_inmueble);
        if (tipo_operacion) query = query.eq('tipo_operacion', tipo_operacion);
        if (zona) query = query.eq('zona', zona);
        if (estado_aprobacion) query = query.eq('estado_aprobacion', estado_aprobacion);
        if (precio_min) query = query.gte('valor', precio_min);
        if (precio_max) query = query.lte('valor', precio_max);

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching inmuebles:', JSON.stringify(error));
            throw error;
        }
        
        console.log(`✅ Found ${data?.length || 0} inmuebles`);

        // Obtener características específicas de cada inmueble
        const inmueblesConCaracteristicas = await Promise.all(
            (data || []).map(async (inmueble) => {
                try {
                    const tabla = obtenerTablaPorTipo(inmueble.tipo_inmueble);
                    if (!tabla) return inmueble;
                    const { data: caracteristicas } = await supabase
                        .from(tabla)
                        .select('*')
                        .eq('id_inmueble', inmueble.id_inmueble)
                        .single();

                    return {
                        ...inmueble,
                        caracteristicas
                    };
                } catch (err) {
                    return inmueble;
                }
            })
        );

        // Filtrar por municipio si se especifica (filtro en ubicaciones)
        let resultados = inmueblesConCaracteristicas;
        if (municipio) {
            resultados = resultados.filter(inmueble => 
                inmueble.ubicaciones?.municipio?.toLowerCase().includes(municipio.toLowerCase())
            );
        }

        res.json({
            total: resultados.length,
            inmuebles: resultados
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener inmuebles de un usuario específico (requiere autenticación)
router.get('/usuario/:id_usuario', verificarToken, async (req, res) => {
    try {
        const { id_usuario } = req.params;

        // Verificar que el usuario esté consultando sus propias propiedades o sea admin
        if (parseInt(id_usuario) !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para ver estas propiedades' });
        }

        const { data, error } = await supabase
            .from('inmuebles')
            .select(`
                *,
                ubicaciones (*),
                fotografias (*)
            `)
            .eq('id_usuario', id_usuario)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        // Obtener características específicas de cada inmueble
        const inmueblesConCaracteristicas = await Promise.all(
            (data || []).map(async (inmueble) => {
                try {
                    const tabla = obtenerTablaPorTipo(inmueble.tipo_inmueble);
                    if (!tabla) return inmueble;
                    const { data: caracteristicas } = await supabase
                        .from(tabla)
                        .select('*')
                        .eq('id_inmueble', inmueble.id_inmueble)
                        .single();

                    return {
                        ...inmueble,
                        caracteristicas
                    };
                } catch (err) {
                    return inmueble;
                }
            })
        );

        res.json({
            total: inmueblesConCaracteristicas.length,
            inmuebles: inmueblesConCaracteristicas
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un inmueble por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('inmuebles')
            .select(`
        *,
        usuarios!inmuebles_id_usuario_fkey (nombre:nombre_completo, email, telefono),
        ubicaciones (*),
        fotografias (*)
      `)
            .eq('id_inmueble', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        // Obtener características específicas según el tipo
        let caracteristicas = null;
        const tabla = obtenerTablaPorTipo(data.tipo_inmueble);
        if (!tabla) {
            return res.status(400).json({ error: `Tipo de inmueble no soportado: ${data.tipo_inmueble}` });
        }
        
        console.log(`🔍 Buscando características en tabla: ${tabla} para inmueble ${id}`);

        const { data: caract, error: errorCaract } = await supabase
            .from(tabla)
            .select('*')
            .eq('id_inmueble', id)
            .single();

        if (errorCaract) {
            console.error(`⚠️ Error al obtener características de ${tabla}:`, errorCaract.message);
        } else {
            console.log(`✅ Características encontradas:`, caract);
        }

        caracteristicas = caract;

        res.json({
            ...data,
            caracteristicas
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo inmueble (requiere autenticación)
// Los usuarios normales crean propiedades pendientes, los admin publican directamente
router.post('/', verificarToken, async (req, res) => {
    try {
        const {
            valor,
            valor_administracion,
            estrato,
            descripcion,
            numero_matricula,
            codigo_catastral,
            tipo_operacion,
            tipo_inmueble,
            estado_inmueble,
            zona,
            acepta_permuta,
            ubicacion,
            servicios,
            caracteristicas
        } = req.body;

        // Si es admin, redirigir al endpoint de admin
        if (req.usuario.rol === 'admin') {
            return res.status(400).json({
                error: 'Los administradores deben usar el endpoint /api/inmuebles-admin'
            });
        }

        // Usuarios normales: crear solicitud de publicación
        console.log('📝 Usuario normal creando solicitud de publicación...');

        const datos = {
            valor: parseFloat(valor),
            valor_administracion: valor_administracion ? parseFloat(valor_administracion) : null,
            estrato: parseInt(estrato) || null,
            descripcion,
            numero_matricula,
            codigo_catastral: codigo_catastral || null,
            tipo_operacion,
            tipo_inmueble,
            estado_inmueble,
            zona,
            acepta_permuta: acepta_permuta || false,
            ubicacion,
            servicios,
            caracteristicas
        };

        const { data: solicitud, error: errorInsert } = await supabase
            .from('solicitudes_publicacion')
            .insert([{
                id_usuario: req.usuario.id_usuario,
                datos,
                estado_aprobacion: 'pendiente'
            }])
            .select()
            .single();

        if (errorInsert) {
            console.error('❌ Error al crear solicitud:', errorInsert);
            throw errorInsert;
        }

        console.log('✅ Solicitud creada:', solicitud.id_solicitud);

        // Notificar a admins de nueva solicitud
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins && admins.length > 0) {
            await supabase.from('notificaciones').insert(
                admins.map(a => ({ id_usuario: a.id_usuario, tipo: 'sistema', titulo: 'Nueva solicitud de publicacion', mensaje: `Un usuario ha enviado una nueva solicitud de ${datos.tipo_inmueble || 'propiedad'} para revision.` }))
            );
        }

        res.status(201).json({
            mensaje: 'Propiedad enviada para revisión del administrador',
            solicitud
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un inmueble completo (requiere autenticación)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            valor,
            valor_administracion,
            estrato,
            descripcion,
            numero_matricula,
            codigo_catastral,
            tipo_operacion,
            tipo_inmueble,
            estado_inmueble,
            zona,
            acepta_permuta,
            ubicacion,
            servicios,
            caracteristicas
        } = req.body;

        console.log('📝 Actualizando inmueble:', id);
        console.log('📦 Datos recibidos:', { valor, estrato, tipo_inmueble, tipo_operacion });

        // Verificar que el usuario sea el propietario o admin
        const { data: inmuebleExistente, error: errorBusqueda } = await supabase
            .from('inmuebles')
            .select('id_usuario, tipo_inmueble')
            .eq('id_inmueble', id)
            .single();

        if (errorBusqueda || !inmuebleExistente) {
            console.error('❌ Inmueble no encontrado:', errorBusqueda);
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmuebleExistente.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para modificar este inmueble' });
        }

        // Si no es admin, verificar que tenga solicitud de edición aprobada
        if (req.usuario.rol !== 'admin') {
            const { data: solicitudEdicion } = await supabase
                .from('solicitudes_publicacion')
                .select('id_solicitud')
                .eq('id_usuario', req.usuario.id_usuario)
                .eq('id_inmueble', id)
                .eq('tipo_solicitud', 'edicion')
                .eq('estado_aprobacion', 'aprobado')
                .limit(1)
                .maybeSingle();

            if (!solicitudEdicion) {
                return res.status(403).json({
                    error: 'Necesitas una solicitud de edición aprobada para modificar este inmueble',
                    codigo: 'EDICION_NO_APROBADA'
                });
            }
        }

        // 1. Actualizar tabla inmuebles (solo campos que existen en la tabla)
        const datosInmueble = {};
        if (valor !== undefined) datosInmueble.valor = parseFloat(valor);
        if (valor_administracion !== undefined) datosInmueble.valor_administracion = valor_administracion ? parseFloat(valor_administracion) : null;
        if (estrato !== undefined) datosInmueble.estrato = parseInt(estrato) || null;
        if (descripcion !== undefined) datosInmueble.descripcion = descripcion;
        if (numero_matricula !== undefined) datosInmueble.numero_matricula = numero_matricula;
        if (codigo_catastral !== undefined) datosInmueble.codigo_catastral = codigo_catastral || null;
        if (tipo_operacion !== undefined) datosInmueble.tipo_operacion = tipo_operacion;
        if (tipo_inmueble !== undefined) datosInmueble.tipo_inmueble = tipo_inmueble;
        if (estado_inmueble !== undefined) datosInmueble.estado_inmueble = estado_inmueble;
        if (zona !== undefined) datosInmueble.zona = zona;
        if (acepta_permuta !== undefined) datosInmueble.acepta_permuta = acepta_permuta;

        console.log('🔄 Actualizando tabla inmuebles con:', datosInmueble);

        const { data: inmuebleActualizado, error: errorInmueble } = await supabase
            .from('inmuebles')
            .update(datosInmueble)
            .eq('id_inmueble', id)
            .select()
            .single();

        if (errorInmueble) {
            console.error('❌ Error al actualizar inmueble:', errorInmueble);
            throw errorInmueble;
        }

        console.log('✅ Inmueble actualizado');

        // 2. Actualizar ubicación
        if (ubicacion && Object.keys(ubicacion).length > 0) {
            console.log('📍 Actualizando ubicación...');
            // Solo campos que existen en la tabla ubicaciones
            const { tipo_via, ...ubicacionLimpia } = ubicacion;
            const { error: errorUbicacion } = await supabase
                .from('ubicaciones')
                .update(ubicacionLimpia)
                .eq('id_inmueble', id);
            
            if (errorUbicacion) {
                console.error('⚠️ Error al actualizar ubicación:', errorUbicacion.message);
            } else {
                console.log('✅ Ubicación actualizada');
            }
        }

        // 3. Actualizar características específicas
        if (caracteristicas && Object.keys(caracteristicas).length > 0) {
            console.log('🏠 Actualizando características...');
            
            // Si cambió el tipo de inmueble, eliminar de la tabla anterior
            if (tipo_inmueble && inmuebleExistente.tipo_inmueble !== tipo_inmueble) {
                const tablaAnterior = obtenerTablaPorTipo(inmuebleExistente.tipo_inmueble);
                if (!tablaAnterior) {
                    return res.status(400).json({ error: `Tabla no encontrada para tipo ${inmuebleExistente.tipo_inmueble}` });
                }
                console.log(`🗑️ Eliminando de tabla anterior: ${tablaAnterior}`);
                await supabase
                    .from(tablaAnterior)
                    .delete()
                    .eq('id_inmueble', id);
            }

            const tipoFinal = tipo_inmueble || inmuebleExistente.tipo_inmueble;
            const tablaHija = obtenerTablaPorTipo(tipoFinal);
            if (!tablaHija) {
                return res.status(400).json({ error: `Tabla no encontrada para tipo ${tipoFinal}` });
            }
            console.log(`📋 Actualizando tabla: ${tablaHija}`);
            
            const caracteristicasMapeadas = mapearCaracteristicas(tipoFinal, caracteristicas, servicios);

            // Verificar si existe un registro
            const { data: existeCaract } = await supabase
                .from(tablaHija)
                .select('*')
                .eq('id_inmueble', id)
                .single();

            if (existeCaract) {
                console.log('🔄 Registro existe, actualizando...');
                const { error: errorUpdate } = await supabase
                    .from(tablaHija)
                    .update(caracteristicasMapeadas)
                    .eq('id_inmueble', id);

                if (errorUpdate) {
                    console.error(`⚠️ Error al actualizar ${tablaHija}:`, errorUpdate.message);
                } else {
                    console.log('✅ Características actualizadas');
                }
            } else {
                console.log('➕ Registro no existe, insertando...');
                const { error: errorInsert } = await supabase
                    .from(tablaHija)
                    .insert([{ id_inmueble: parseInt(id), ...caracteristicasMapeadas }]);

                if (errorInsert) {
                    console.error(`⚠️ Error al insertar en ${tablaHija}:`, errorInsert.message);
                } else {
                    console.log('✅ Características insertadas');
                }
            }
        }

        console.log('🎉 Actualización completa exitosa');

        res.json({
            mensaje: 'Inmueble actualizado exitosamente',
            inmueble: inmuebleActualizado
        });
    } catch (error) {
        console.error('❌ Error al actualizar inmueble:', error);
        res.status(500).json({ 
            error: error.message,
            detalles: error.details || 'Error al actualizar la propiedad'
        });
    }
});

// Eliminar un inmueble (requiere autenticación)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario sea el propietario o admin
        const { data: inmueble } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id)
            .single();

        if (!inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este inmueble' });
        }

        const { error } = await supabase
            .from('inmuebles')
            .delete()
            .eq('id_inmueble', id);

        if (error) throw error;

        res.json({ mensaje: 'Inmueble eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
