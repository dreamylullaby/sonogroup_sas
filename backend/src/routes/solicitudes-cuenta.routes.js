import express from 'express';
import { supabase } from '../config/supabase.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Crear solicitud de eliminación de cuenta (usuario autenticado)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { motivo } = req.body;

        // Verificar si ya tiene una solicitud activa
        const { data: existente } = await supabase
            .from('solicitudes_eliminacion_cuenta')
            .select('id_solicitud, estado')
            .eq('id_usuario', req.usuario.id_usuario)
            .in('estado', ['pendiente', 'en_revision'])
            .single();

        if (existente) {
            return res.status(400).json({
                error: 'Ya tienes una solicitud de eliminación activa',
                solicitud: existente
            });
        }

        const { data, error } = await supabase
            .from('solicitudes_eliminacion_cuenta')
            .insert([{
                id_usuario: req.usuario.id_usuario,
                motivo: motivo || null
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensaje: 'Solicitud de eliminación enviada. Un administrador la revisará.',
            solicitud: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener estado de mi solicitud
router.get('/mi-solicitud', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('solicitudes_eliminacion_cuenta')
            .select('*')
            .eq('id_usuario', req.usuario.id_usuario)
            .order('fecha_solicitud', { ascending: false })
            .limit(1)
            .single();

        if (error?.code === 'PGRST116') {
            return res.json({ solicitud: null });
        }
        if (error) throw error;

        res.json({ solicitud: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las solicitudes (solo admin)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { estado } = req.query;

        let query = supabase
            .from('solicitudes_eliminacion_cuenta')
            .select(`
                *,
                usuarios!solicitudes_eliminacion_cuenta_id_usuario_fkey (
                    id_usuario, nombre_completo, email, telefono, rol, fecha_registro
                )
            `)
            .order('fecha_solicitud', { ascending: false });

        if (estado) {
            query = query.eq('estado', estado);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ solicitudes: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Aprobar solicitud de eliminación (solo admin)
router.put('/:id/aprobar', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nota_admin } = req.body;

        // Obtener la solicitud
        const { data: solicitud, error: errGet } = await supabase
            .from('solicitudes_eliminacion_cuenta')
            .select('id_usuario, estado')
            .eq('id_solicitud', id)
            .single();

        if (errGet || !solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'en_revision') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
        }

        // Marcar solicitud como aprobada
        const { error: errUpdate } = await supabase
            .from('solicitudes_eliminacion_cuenta')
            .update({
                estado: 'aprobada',
                admin_revisor: req.usuario.id_usuario,
                nota_admin: nota_admin || null,
                fecha_resolucion: new Date().toISOString()
            })
            .eq('id_solicitud', id);

        if (errUpdate) throw errUpdate;

        // Desactivar la cuenta del usuario
        await supabase
            .from('usuarios')
            .update({ activo: false })
            .eq('id_usuario', solicitud.id_usuario);

        // Invalidar todas las sesiones
        await supabase
            .from('sesiones_usuario')
            .update({ activa: false, token_sesion: null })
            .eq('id_usuario', solicitud.id_usuario)
            .eq('activa', true);

        res.json({ mensaje: 'Solicitud aprobada. Cuenta desactivada.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rechazar solicitud de eliminación (solo admin)
router.put('/:id/rechazar', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nota_admin } = req.body;

        const { data, error } = await supabase
            .from('solicitudes_eliminacion_cuenta')
            .update({
                estado: 'rechazada',
                admin_revisor: req.usuario.id_usuario,
                nota_admin: nota_admin || null,
                fecha_resolucion: new Date().toISOString()
            })
            .eq('id_solicitud', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ mensaje: 'Solicitud rechazada', solicitud: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
