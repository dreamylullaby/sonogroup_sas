import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// Obtener notificaciones del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
    try {
        const { leida, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('notificaciones')
            .select('*')
            .eq('id_usuario', req.usuario.id_usuario)
            .order('fecha_creacion', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (leida !== undefined) {
            query = query.eq('leida', leida === 'true');
        }

        const { data, error } = await query;
        if (error) throw error;

        // Contar no leídas
        const { count } = await supabase
            .from('notificaciones')
            .select('*', { count: 'exact', head: true })
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('leida', false);

        res.json({ notificaciones: data || [], no_leidas: count || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Marcar una notificación como leída
router.put('/:id/leer', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id_notificacion', id)
            .eq('id_usuario', req.usuario.id_usuario)
            .select()
            .single();

        if (error) throw error;
        res.json({ notificacion: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Marcar todas como leídas
router.put('/leer-todas', verificarToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('leida', false);

        if (error) throw error;
        res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar una notificación
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('notificaciones')
            .delete()
            .eq('id_notificacion', id)
            .eq('id_usuario', req.usuario.id_usuario);

        if (error) throw error;
        res.json({ mensaje: 'Notificación eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
