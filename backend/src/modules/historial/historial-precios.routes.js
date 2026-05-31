import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// Obtener historial de precios de un inmueble
router.get('/:id_inmueble', verificarToken, async (req, res) => {
    try {
        const { id_inmueble } = req.params;

        // Verificar que el usuario sea propietario o admin
        const { data: inmueble } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id_inmueble)
            .single();

        if (!inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para ver el historial de este inmueble' });
        }

        const { data, error } = await supabase
            .from('historial_precios')
            .select('*')
            .eq('id_inmueble', id_inmueble)
            .order('fecha_cambio', { ascending: false });

        if (error) throw error;

        res.json({ historial: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
