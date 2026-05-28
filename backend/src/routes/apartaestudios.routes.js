import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los apartaestudios
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, amoblado } = req.query;

        let query = supabase
            .from('apartaestudios')
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

        if (amoblado !== undefined) {
            query = query.eq('amoblado', amoblado === 'true');
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ apartaestudios: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un apartaestudio específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('apartaestudios')
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
            return res.status(404).json({ error: 'Apartaestudio no encontrado' });
        }

        res.json({ apartaestudio: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar características de un apartaestudio (requiere autenticación)
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
            return res.status(404).json({ error: 'Apartaestudio no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para modificar este apartaestudio' });
        }

        const { data, error } = await supabase
            .from('apartaestudios')
            .update(updates)
            .eq('id_inmueble', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Apartaestudio actualizado exitosamente',
            apartaestudio: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
