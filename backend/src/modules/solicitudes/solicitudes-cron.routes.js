import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-key';

// Middleware para verificar token del cron
function verificarCronSecret(req, res, next) {
    const token = req.headers['x-cron-secret'] || req.query.secret;
    if (token !== CRON_SECRET) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

// POST /api/solicitudes-cron/verificar-no-resueltas
// Busca solicitudes con 7+ días en 'pendiente' o 'recibido' y las marca 'no_resuelto'
router.post('/verificar-no-resueltas', verificarCronSecret, async (req, res) => {
    try {
        const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Buscar solicitudes vencidas
        const { data: vencidas, error: errorBusqueda } = await supabase
            .from('solicitudes_publicacion')
            .select('id_solicitud, id_usuario, tipo_solicitud, datos')
            .in('estado_aprobacion', ['pendiente', 'recibido'])
            .lt('fecha_solicitud', sieteDiasAtras);

        if (errorBusqueda) throw errorBusqueda;

        if (!vencidas || vencidas.length === 0) {
            return res.json({ mensaje: 'No hay solicitudes vencidas', actualizadas: 0 });
        }

        // Marcar como no_resuelto
        const ids = vencidas.map(s => s.id_solicitud);

        const { error: errorUpdate } = await supabase
            .from('solicitudes_publicacion')
            .update({
                estado_aprobacion: 'no_resuelto',
                fecha_resolucion: new Date().toISOString()
            })
            .in('id_solicitud', ids);

        if (errorUpdate) throw errorUpdate;

        // Notificar a cada usuario
        const notificaciones = vencidas.map(s => ({
            id_usuario: s.id_usuario,
            tipo: 'sistema',
            titulo: 'Solicitud sin respuesta',
            mensaje: 'Tu solicitud lleva 7 días sin respuesta. Puedes reenviarla desde tu panel.'
        }));

        if (notificaciones.length > 0) {
            await supabase.from('notificaciones').insert(notificaciones);
        }

        res.json({
            mensaje: `${ids.length} solicitudes marcadas como no_resuelto`,
            actualizadas: ids.length,
            ids
        });
    } catch (error) {
        console.error('❌ Error en cron de solicitudes:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
