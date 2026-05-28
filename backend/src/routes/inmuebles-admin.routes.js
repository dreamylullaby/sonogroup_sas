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

// Mapea los campos del formulario frontend a las columnas reales de cada tabla hija
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
                tipo_parqueadero: c.parqueadero || c.tipo_parqueadero || null,
                parqueadero_cantidad: c.parqueadero_cantidad || 0,
                patio: c.patio || false,
                jardin: c.jardin || false,
                terraza: c.terraza || false,
                balcon: c.balcon || false,
                zona_lavanderia: c.zona_lavanderia || false,
                zona_lavanderia_tipo: c.zona_lavanderia_tipo || c.zona_lavado || null,
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
                habitaciones: c.habitaciones || 1,
                banos: c.banos || 1,
                sala_comedor: c.sala_comedor || null,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
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
                tiene_bano: c.tiene_bano !== undefined ? c.tiene_bano : (c.bano !== undefined ? c.bano : true),
                parqueadero: c.parqueadero || false,
                balcon: c.balcon || false,
                amoblado: c.amoblado || false,
                tipo_cocina: c.cocina || c.tipo_cocina || null,
                descripcion_acabados: c.descripcion_acabados || null
            };
        case 'local':
            return {
                area_total: c.area_total || null,
                zona_local: c.zona_local || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                altura: c.altura || null,
                mezzanine: c.entrepiso || c.mezzanine || false,
                banos: c.banos !== undefined ? c.banos : false,
                servicios_publicos: serviciosLista.length > 0 ? serviciosLista : [],
                parqueaderos: c.parqueaderos || c.parqueadero || 0,
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
                servicios_publicos: serviciosLista.length > 0 ? serviciosLista : []
            };
        case 'finca':
            return {
                area_total: c.area_total || null,
                unidad_area: c.unidad_area || 'm2',
                area_cultivable: c.area_cultivable || null,
                area_construcciones: c.area_construcciones || null,
                topografia: c.topografia || null,
                fuentes_agua: c.fuentes_agua ? 'Sí' : null,
                casa_principal: c.casa_principal || false,
                otras_construcciones: c.otras_construcciones || null,
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null,
                cultivos_actuales: c.cultivos_actuales || null,
                servicios_disponibles: serviciosLista.length > 0 ? serviciosLista : []
            };
        case 'lote':
            return {
                area_total: c.area_total || null,
                frente: c.frente || null,
                fondo: c.fondo || null,
                topografia: c.topografia || null,
                pendiente: c.pendiente || false,
                tipo_via_acceso: c.vias_acceso || c.tipo_via_acceso || null,
                servicios_disponibles: serviciosLista.length > 0 ? serviciosLista : [],
                uso_pot: c.uso_suelo || c.uso_pot || null
            };
        default:
            return c;
    }
}

// Crear inmueble directamente (solo admin) - Formulario Dinámico
router.post('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        console.log('📥 Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const {
            valor,
            estrato,
            descripcion,
            numero_matricula,
            tipo_operacion,
            tipo_inmueble,
            estado_inmueble,
            estado_conservacion,
            zona,
            ubicacion,
            servicios,
            caracteristicas
        } = req.body;

        // Validaciones
        if (!valor || !tipo_inmueble || !tipo_operacion) {
            console.log('❌ Validación fallida: campos básicos faltantes');
            return res.status(400).json({
                error: 'Valor, tipo de inmueble y tipo de operación son requeridos'
            });
        }

        if (!ubicacion || !ubicacion.municipio) {
            console.log('❌ Validación fallida: ubicación faltante');
            return res.status(400).json({
                error: 'La ubicación con municipio es requerida'
            });
        }
        
        console.log('✅ Validaciones pasadas');

        // Generar número de matrícula si no viene
        const matricula = numero_matricula || `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const datosInmueble = {
            id_usuario: req.usuario.id_usuario,
            valor: parseFloat(valor),
            estrato: parseInt(estrato) || 3,
            descripcion: descripcion || '',
            numero_matricula: matricula,
            tipo_operacion,
            tipo_inmueble,
            estado_inmueble: estado_inmueble || 'usado',
            zona: zona || 'urbano',
            estado_aprobacion: 'aprobado'
        };
        
        console.log('📝 Insertando en tabla inmuebles:', datosInmueble);

        // 1. Insertar en tabla inmuebles (padre)
        const { data: inmueble, error: errorInmueble } = await supabase
            .from('inmuebles')
            .insert([datosInmueble])
            .select()
            .single();

        if (errorInmueble) {
            console.error('❌ Error al insertar inmueble:', errorInmueble);
            throw errorInmueble;
        }
        
        console.log('✅ Inmueble insertado:', inmueble.id_inmueble);

        // 2. Insertar ubicación
        if (ubicacion) {
            console.log('📍 Insertando ubicación...');
            const { error: errorUbicacion } = await supabase
                .from('ubicaciones')
                .insert([{
                    id_inmueble: inmueble.id_inmueble,
                    direccion: ubicacion.direccion || '',
                    barrio_vereda: ubicacion.barrio_vereda || '',
                    municipio: ubicacion.municipio,
                    departamento: ubicacion.departamento || 'Colombia'
                }]);
            
            if (errorUbicacion) {
                console.error('⚠️  Error al insertar ubicación:', errorUbicacion.message);
            } else {
                console.log('✅ Ubicación insertada');
            }
        }

        // 3. Insertar características específicas en tabla hija
        if (caracteristicas && Object.keys(caracteristicas).length > 0) {
            const tablaHija = obtenerTablaPorTipo(tipo_inmueble);
            if (!tablaHija) {
                return res.status(400).json({ error: `Tipo de inmueble no soportado: ${tipo_inmueble}` });
            }
            console.log(`🏠 Insertando características en tabla ${tablaHija}...`);
            
            const caracteristicasMapeadas = mapearCaracteristicas(tipo_inmueble, caracteristicas, servicios);
            
            try {
                const { error: errorCaract } = await supabase
                    .from(tablaHija)
                    .insert([{
                        id_inmueble: inmueble.id_inmueble,
                        ...caracteristicasMapeadas
                    }]);
                
                if (errorCaract) {
                    console.error(`⚠️  Error al insertar en ${tablaHija}:`, errorCaract.message);
                } else {
                    console.log(`✅ Características insertadas en ${tablaHija}`);
                }
            } catch (err) {
                console.error(`❌ Excepción al insertar en ${tablaHija}:`, err.message);
            }
        }

        console.log('🎉 Propiedad publicada exitosamente');
        
        res.status(201).json({
            mensaje: 'Propiedad publicada exitosamente',
            inmueble: inmueble
        });
    } catch (error) {
        console.error('❌ Error al crear inmueble:', error);
        console.error('❌ Detalles del error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        
        res.status(500).json({ 
            error: error.message || 'Error desconocido',
            detalles: error.details || 'Error al publicar la propiedad',
            codigo: error.code
        });
    }
});

export default router;
