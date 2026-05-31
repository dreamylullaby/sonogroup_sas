import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// Obtener favoritos del usuario
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favoritos')
            .select(`
                *,
                inmuebles (*)
            `)
            .eq('id_usuario', req.usuario.id_usuario);

        if (error) throw error;

        // Aplanar los datos para que sea más fácil de usar
        const favoritos = data.map(fav => ({
            id_inmueble: fav.id_inmueble,
            ...fav.inmuebles
        }));

        res.json({ favoritos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agregar a favoritos
router.post('/', verificarToken, async (req, res) => {
    try {
        const { id_inmueble } = req.body;

        if (!id_inmueble) {
            return res.status(400).json({ error: 'id_inmueble es requerido' });
        }

        // Verificar si ya existe
        const { data: existente } = await supabase
            .from('favoritos')
            .select('*')
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('id_inmueble', id_inmueble)
            .single();

        if (existente) {
            return res.status(400).json({ error: 'Ya está en favoritos' });
        }

        const { data, error } = await supabase
            .from('favoritos')
            .insert([{
                id_usuario: req.usuario.id_usuario,
                id_inmueble
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensaje: 'Agregado a favoritos',
            favorito: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar de favoritos
router.delete('/:id_inmueble', verificarToken, async (req, res) => {
    try {
        const { id_inmueble } = req.params;

        const { error } = await supabase
            .from('favoritos')
            .delete()
            .eq('id_usuario', req.usuario.id_usuario)
            .eq('id_inmueble', id_inmueble);

        if (error) throw error;

        res.json({ mensaje: 'Eliminado de favoritos' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
