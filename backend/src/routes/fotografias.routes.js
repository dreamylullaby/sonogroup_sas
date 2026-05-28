import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener fotografías de un inmueble
router.get('/inmueble/:id_inmueble', async (req, res) => {
    try {
        const { id_inmueble } = req.params;

        const { data, error } = await supabase
            .from('fotografias')
            .select('*')
            .eq('id_inmueble', id_inmueble)
            .order('orden', { ascending: true });

        if (error) throw error;

        res.json({ fotografias: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agregar fotografía a un inmueble (requiere autenticación)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { id_inmueble, url_foto, descripcion, orden = 0 } = req.body;

        // Verificar que el usuario sea el propietario del inmueble
        const { data: inmueble } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id_inmueble)
            .single();

        if (!inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para agregar fotografías a este inmueble' });
        }

        const { data, error } = await supabase
            .from('fotografias')
            .insert([{ id_inmueble, url_foto, descripcion, orden }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensaje: 'Fotografía agregada exitosamente',
            fotografia: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar fotografía
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { url_foto, descripcion, orden } = req.body;

        const { data, error } = await supabase
            .from('fotografias')
            .update({ url_foto, descripcion, orden })
            .eq('id_foto', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Fotografía actualizada exitosamente',
            fotografia: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar fotografía
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('fotografias')
            .delete()
            .eq('id_foto', id);

        if (error) throw error;

        res.json({ mensaje: 'Fotografía eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
