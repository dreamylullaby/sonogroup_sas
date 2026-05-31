import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// Obtener todos los locales
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, zona_local } = req.query;

        let query = supabase
            .from('locales')
            .select(`
        *,
        inmuebles (
          *,
          usuarios!inmuebles_id_usuario_fkey (nombre:nombre_completo, email, telefono),
          ubicaciones (*),
          fotografias (*)
        )
      `)
            .range(offset, offset + limit - 1);

        if (zona_local) {
            query = query.eq('zona_local', zona_local);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ locales: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un local específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('locales')
            .select(`
        *,
        inmuebles (
          *,
          usuarios!inmuebles_id_usuario_fkey (nombre:nombre_completo, email, telefono),
          ubicaciones (*),
          fotografias (*)
        )
      `)
            .eq('id_inmueble', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Local no encontrado' });
        }

        res.json({ local: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar características de un local (requiere autenticación)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: inmueble } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id)
            .single();

        if (!inmueble) {
            return res.status(404).json({ error: 'Local no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para modificar este local' });
        }

        const { data, error } = await supabase
            .from('locales')
            .update(updates)
            .eq('id_inmueble', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Local actualizado exitosamente',
            local: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
