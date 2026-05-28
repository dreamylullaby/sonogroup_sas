import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las características generales (público)
router.get('/', async (req, res) => {
    try {
        const { categoria } = req.query;

        let query = supabase
            .from('caracteristicas_generales')
            .select('*')
            .eq('activo', true)
            .order('categoria', { ascending: true });

        if (categoria) {
            query = query.eq('categoria', categoria);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ caracteristicas: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener características de un inmueble específico
router.get('/inmueble/:id_inmueble', async (req, res) => {
    try {
        const { id_inmueble } = req.params;

        const { data, error } = await supabase
            .from('inmuebles_caracteristicas')
            .select(`
                id_caracteristica,
                caracteristicas_generales (*)
            `)
            .eq('id_inmueble', id_inmueble);

        if (error) throw error;

        const caracteristicas = (data || []).map(item => item.caracteristicas_generales);
        res.json({ caracteristicas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Asignar características a un inmueble (requiere autenticación)
router.post('/inmueble/:id_inmueble', verificarToken, async (req, res) => {
    try {
        const { id_inmueble } = req.params;
        const { caracteristicas_ids } = req.body; // Array de IDs

        if (!Array.isArray(caracteristicas_ids)) {
            return res.status(400).json({ error: 'caracteristicas_ids debe ser un array' });
        }

        // Verificar propiedad
        const { data: inmueble } = await supabase
            .from('inmuebles')
            .select('id_usuario')
            .eq('id_inmueble', id_inmueble)
            .single();

        if (!inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        // Eliminar asignaciones anteriores
        await supabase
            .from('inmuebles_caracteristicas')
            .delete()
            .eq('id_inmueble', id_inmueble);

        // Insertar nuevas
        if (caracteristicas_ids.length > 0) {
            const inserts = caracteristicas_ids.map(id_caracteristica => ({
                id_inmueble: parseInt(id_inmueble),
                id_caracteristica
            }));

            const { error } = await supabase
                .from('inmuebles_caracteristicas')
                .insert(inserts);

            if (error) throw error;
        }

        res.json({ mensaje: 'Características actualizadas', total: caracteristicas_ids.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nueva característica (solo admin)
router.post('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { nombre, descripcion, icono, categoria } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const { data, error } = await supabase
            .from('caracteristicas_generales')
            .insert([{ nombre, descripcion, icono, categoria: categoria || 'general' }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ caracteristica: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar característica (solo admin)
router.put('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, icono, categoria, activo } = req.body;

        const { data, error } = await supabase
            .from('caracteristicas_generales')
            .update({ nombre, descripcion, icono, categoria, activo })
            .eq('id_caracteristica', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ caracteristica: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
