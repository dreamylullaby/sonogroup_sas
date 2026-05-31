import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken, verificarRol } from '../../middleware/auth.js';

const router = express.Router();

// Obtener estadísticas del admin (usa la vista v_stats_admin de BD v3.4)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('v_stats_admin')
            .select('*')
            .single();

        if (error) throw error;

        res.json({ stats: data });
    } catch (error) {
        // Fallback: calcular manualmente si la vista no existe
        try {
            const [inmuebles, usuarios, contactos] = await Promise.all([
                supabase.from('inmuebles').select('tipo_operacion, estado_aprobacion, activo'),
                supabase.from('usuarios').select('activo, fecha_registro'),
                supabase.from('contactos').select('estado')
            ]);

            const activos = (inmuebles.data || []).filter(i => i.activo);
            const aprobados = activos.filter(i => i.estado_aprobacion === 'aprobado');

            res.json({
                stats: {
                    total_inmuebles: activos.length,
                    inmuebles_aprobados: aprobados.length,
                    inmuebles_pendientes: activos.filter(i => i.estado_aprobacion === 'pendiente').length,
                    en_venta: aprobados.filter(i => i.tipo_operacion === 'venta').length,
                    en_arriendo: aprobados.filter(i => i.tipo_operacion === 'arriendo').length,
                    total_usuarios: (usuarios.data || []).filter(u => u.activo).length,
                    contactos_sin_responder: (contactos.data || []).filter(c => c.estado === 'pendiente').length
                }
            });
        } catch (fallbackError) {
            res.status(500).json({ error: fallbackError.message });
        }
    }
});

export default router;
