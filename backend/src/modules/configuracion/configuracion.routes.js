import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// ── CONFIGURACIÓN ──────────────────────────────────────────────

// Obtener configuración del usuario (crea registro si no existe)
router.get('/', verificarToken, async (req, res) => {
    const id = req.usuario.id_usuario;
    let { data, error } = await supabase
        .from('configuracion_usuario')
        .select('*')
        .eq('id_usuario', id)
        .single();

    if (error?.code === 'PGRST116') {
        // No existe, crear con defaults
        const { data: nuevo, error: errInsert } = await supabase
            .from('configuracion_usuario')
            .insert([{ id_usuario: id }])
            .select()
            .single();
        if (errInsert) return res.status(500).json({ error: errInsert.message });
        data = nuevo;
    } else if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ configuracion: data });
});

// Actualizar configuración
router.put('/', verificarToken, async (req, res) => {
    const id = req.usuario.id_usuario;
    const campos = req.body;

    const { data, error } = await supabase
        .from('configuracion_usuario')
        .upsert({ id_usuario: id, ...campos, fecha_actualizacion: new Date().toISOString() })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ configuracion: data });
});

// ── SEGURIDAD ──────────────────────────────────────────────────

// Obtener seguridad
router.get('/seguridad', verificarToken, async (req, res) => {
    const id = req.usuario.id_usuario;
    let { data, error } = await supabase
        .from('seguridad_usuario')
        .select('id_usuario, verificacion_dos_pasos, fecha_configuracion')
        .eq('id_usuario', id)
        .single();

    if (error?.code === 'PGRST116') {
        const { data: nuevo, error: errInsert } = await supabase
            .from('seguridad_usuario')
            .insert([{ id_usuario: id }])
            .select('id_usuario, verificacion_dos_pasos, fecha_configuracion')
            .single();
        if (errInsert) return res.status(500).json({ error: errInsert.message });
        data = nuevo;
    } else if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ seguridad: data });
});

// Actualizar verificación dos pasos
router.put('/seguridad/2fa', verificarToken, async (req, res) => {
    const { verificacion_dos_pasos } = req.body;
    const { data, error } = await supabase
        .from('seguridad_usuario')
        .upsert({ id_usuario: req.usuario.id_usuario, verificacion_dos_pasos })
        .select('id_usuario, verificacion_dos_pasos')
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ seguridad: data });
});

// Cambiar contraseña
router.put('/seguridad/password', verificarToken, async (req, res) => {
    const { password_actual, password_nuevo } = req.body;
    if (!password_actual || !password_nuevo)
        return res.status(400).json({ error: 'Faltan campos requeridos' });

    if (password_nuevo.length < 6)
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const { data: usuario, error: errGet } = await supabase
        .from('usuarios')
        .select('password_hash')
        .eq('id_usuario', req.usuario.id_usuario)
        .single();

    if (errGet) return res.status(500).json({ error: errGet.message });

    const valido = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!valido) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

    const nuevo_hash = await bcrypt.hash(password_nuevo, 10);
    const { error: errUpdate } = await supabase
        .from('usuarios')
        .update({ password_hash: nuevo_hash })
        .eq('id_usuario', req.usuario.id_usuario);

    if (errUpdate) return res.status(500).json({ error: errUpdate.message });
    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
});

// ── SESIONES ───────────────────────────────────────────────────

// Obtener sesiones activas
router.get('/sesiones', verificarToken, async (req, res) => {
    const { data, error } = await supabase
        .from('sesiones_usuario')
        .select('id_sesion, dispositivo, navegador, sistema_operativo, direccion_ip, pais, ciudad, fecha_inicio, ultima_actividad, activa')
        .eq('id_usuario', req.usuario.id_usuario)
        .eq('activa', true)
        .order('ultima_actividad', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ sesiones: data || [] });
});

// Cerrar una sesión
router.delete('/sesiones/:id', verificarToken, async (req, res) => {
    const { error } = await supabase
        .from('sesiones_usuario')
        .update({ activa: false })
        .eq('id_sesion', req.params.id)
        .eq('id_usuario', req.usuario.id_usuario);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ mensaje: 'Sesión cerrada' });
});

// Cerrar todas las sesiones excepto la actual
router.delete('/sesiones', verificarToken, async (req, res) => {
    const { sesion_actual } = req.body;
    let query = supabase
        .from('sesiones_usuario')
        .update({ activa: false })
        .eq('id_usuario', req.usuario.id_usuario)
        .eq('activa', true);

    if (sesion_actual) query = query.neq('id_sesion', sesion_actual);

    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ mensaje: 'Sesiones cerradas' });
});

// ── ELIMINAR CUENTA ────────────────────────────────────────────
router.delete('/cuenta', verificarToken, async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Se requiere la contraseña para confirmar' });

    const { data: usuario, error: errGet } = await supabase
        .from('usuarios')
        .select('password_hash')
        .eq('id_usuario', req.usuario.id_usuario)
        .single();

    if (errGet) return res.status(500).json({ error: errGet.message });

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id_usuario', req.usuario.id_usuario);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ mensaje: 'Cuenta eliminada' });
});

export default router;
