import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

const MAX_BORRADORES = { cliente: 1, comisionista: 1, admin: 5 };

// GET /api/borradores — Listar borradores del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
    try {
        const { id_usuario } = req.usuario;

        const { data, error } = await supabase
            .from('borradores_inmuebles')
            .select('*')
            .eq('id_usuario', id_usuario)
            .order('fecha_actualizacion', { ascending: false });

        if (error) throw error;

        res.json({ total: data.length, borradores: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/borradores/:id — Obtener un borrador específico
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_usuario } = req.usuario;

        const { data, error } = await supabase
            .from('borradores_inmuebles')
            .select('*')
            .eq('id_borrador', id)
            .eq('id_usuario', id_usuario)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Borrador no encontrado' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/borradores — Crear o actualizar borrador (UPSERT para clientes)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { id_usuario, rol } = req.usuario;
        const { datos, paso_actual, titulo } = req.body;

        if (!datos) {
            return res.status(400).json({ error: 'El campo "datos" es requerido' });
        }

        // Para clientes/comisionistas: UPSERT (sobreescribir el único borrador)
        if (rol !== 'admin') {
            const { data: existentes } = await supabase
                .from('borradores_inmuebles')
                .select('id_borrador')
                .eq('id_usuario', id_usuario);

            if (existentes && existentes.length > 0) {
                const { data, error } = await supabase
                    .from('borradores_inmuebles')
                    .update({ datos, paso_actual: paso_actual || 1, titulo: titulo || null })
                    .eq('id_borrador', existentes[0].id_borrador)
                    .select()
                    .single();

                if (error) throw error;
                return res.json({ mensaje: 'Borrador actualizado', borrador: data });
            }

            const { data, error } = await supabase
                .from('borradores_inmuebles')
                .insert([{ id_usuario, datos, paso_actual: paso_actual || 1, titulo: titulo || null }])
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json({ mensaje: 'Borrador creado', borrador: data });
        }

        // Para admin: verificar límite y duplicados
        const { data: existentes, error: errorCount } = await supabase
            .from('borradores_inmuebles')
            .select('id_borrador, datos')
            .eq('id_usuario', id_usuario);

        if (errorCount) throw errorCount;

        // Detectar si ya existe un borrador con datos idénticos
        const datosStr = JSON.stringify(datos);
        const duplicado = existentes.find(b => JSON.stringify(b.datos) === datosStr);
        if (duplicado) {
            return res.status(409).json({
                error: 'Ya tienes un borrador con estos mismos datos',
                codigo: 'BORRADOR_DUPLICADO',
                id_borrador: duplicado.id_borrador
            });
        }

        if (existentes.length >= MAX_BORRADORES.admin) {
            return res.status(409).json({
                error: `Has alcanzado el límite de ${MAX_BORRADORES.admin} borradores. Elimina uno para guardar otro.`,
                codigo: 'LIMITE_ALCANZADO',
                max: MAX_BORRADORES.admin
            });
        }

        const { data, error } = await supabase
            .from('borradores_inmuebles')
            .insert([{ id_usuario, datos, paso_actual: paso_actual || 1, titulo: titulo || null }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ mensaje: 'Borrador creado', borrador: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/borradores/:id — Actualizar un borrador específico
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_usuario } = req.usuario;
        const { datos, paso_actual, titulo } = req.body;

        // Verificar propiedad
        const { data: existente } = await supabase
            .from('borradores_inmuebles')
            .select('id_borrador')
            .eq('id_borrador', id)
            .eq('id_usuario', id_usuario)
            .single();

        if (!existente) {
            return res.status(404).json({ error: 'Borrador no encontrado' });
        }

        const updateData = {};
        if (datos !== undefined) updateData.datos = datos;
        if (paso_actual !== undefined) updateData.paso_actual = paso_actual;
        if (titulo !== undefined) updateData.titulo = titulo;

        const { data, error } = await supabase
            .from('borradores_inmuebles')
            .update(updateData)
            .eq('id_borrador', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ mensaje: 'Borrador actualizado', borrador: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/borradores/:id — Eliminar un borrador
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_usuario } = req.usuario;

        const { error } = await supabase
            .from('borradores_inmuebles')
            .delete()
            .eq('id_borrador', id)
            .eq('id_usuario', id_usuario);

        if (error) throw error;
        res.json({ mensaje: 'Borrador eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
