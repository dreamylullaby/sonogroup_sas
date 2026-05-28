import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

const mapUsuario = (usuario) => ({
    ...usuario,
    nombre: usuario.nombre_completo
});

// Obtener todos los usuarios (solo admin)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre_completo, email, telefono, rol, fecha_registro');

        if (error) throw error;

        res.json({ usuarios: (data || []).map(mapUsuario) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre_completo, email, telefono, tipo_identificacion, numero_identificacion, rol, es_dueno, fecha_registro, ultimo_login')
            .eq('id_usuario', req.usuario.id_usuario)
            .single();

        if (error) throw error;

        res.json({ usuario: data ? mapUsuario(data) : null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener inmuebles del usuario autenticado
router.get('/mis-inmuebles', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inmuebles')
            .select(`
        *,
        ubicaciones (*),
        fotografias (*)
      `)
            .eq('id_usuario', req.usuario.id_usuario);

        if (error) throw error;

        res.json({ inmuebles: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar perfil del usuario
router.put('/perfil', verificarToken, async (req, res) => {
    try {
        const { nombre, telefono } = req.body;

        const { data, error } = await supabase
            .from('usuarios')
            .update({ nombre_completo: nombre, telefono })
            .eq('id_usuario', req.usuario.id_usuario)
            .select('id_usuario, nombre_completo, email, telefono, rol')
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Perfil actualizado exitosamente',
            usuario: data ? mapUsuario(data) : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar usuario (solo admin)
router.put('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, rol, password } = req.body;

        const updateData = { telefono, rol };
        if (nombre !== undefined) updateData.nombre_completo = nombre;

        // Si se proporciona una nueva contraseña, hashearla
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const { data, error } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id_usuario', id)
            .select('id_usuario, nombre_completo, email, telefono, rol, fecha_registro')
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Usuario actualizado exitosamente',
            usuario: data ? mapUsuario(data) : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar usuario (solo admin)
router.delete('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id_usuario', id);

        if (error) throw error;

        res.json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
