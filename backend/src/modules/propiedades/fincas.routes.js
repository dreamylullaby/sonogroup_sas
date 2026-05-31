import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// Obtener todas las fincas
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, topografia, tipo_via_acceso } = req.query;

        let query = supabase
            .from('fincas')
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

        if (topografia) {
            query = query.eq('topografia', topografia);
        }

        if (tipo_via_acceso) {
            query = query.eq('tipo_via_acceso', tipo_via_acceso);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ fincas: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener una finca específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('fincas')
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
            return res.status(404).json({ error: 'Finca no encontrada' });
        }

        res.json({ finca: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar características de una finca (requiere autenticación)
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
            return res.status(404).json({ error: 'Finca no encontrada' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para modificar esta finca' });
        }

        const { data, error } = await supabase
            .from('fincas')
            .update(updates)
            .eq('id_inmueble', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Finca actualizada exitosamente',
            finca: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
