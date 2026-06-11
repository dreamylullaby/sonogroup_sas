import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken } from '../../middleware/auth.js';

const router = express.Router();

// Crear contacto/solicitud
router.post('/', verificarToken, async (req, res) => {
    try {
        const { id_inmueble, mensaje, asunto } = req.body;

        if (!mensaje) {
            return res.status(400).json({
                error: 'mensaje es requerido'
            });
        }

        const { data: usuario } = await supabase
            .from('usuarios')
            .select('nombre_completo, email, telefono')
            .eq('id_usuario', req.usuario.id_usuario)
            .single();

        const { data, error } = await supabase
            .from('contactos')
            .insert([{
                nombre: usuario?.nombre_completo || 'Usuario',
                email: usuario?.email || '',
                telefono: usuario?.telefono || null,
                id_usuario: req.usuario.id_usuario,
                id_inmueble: id_inmueble || null,
                asunto: asunto || 'Consulta inmueble',
                mensaje,
                estado: 'pendiente'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensaje: 'Solicitud enviada exitosamente',
            contacto: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener contactos del usuario
router.get('/mis-solicitudes', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('contactos')
            .select(`
                *,
                inmuebles (*)
            `)
            .eq('id_usuario', req.usuario.id_usuario)
            .order('fecha_contacto', { ascending: false });

        if (error) throw error;

        res.json({ contactos: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los contactos (solo admin)
router.get('/', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'No tienes permisos para ver todos los contactos'
            });
        }

        const { data, error } = await supabase
            .from('contactos')
            .select(`
                *,
                usuarios!contactos_id_usuario_fkey (nombre:nombre_completo, email, telefono),
                inmuebles (id_inmueble, tipo_inmueble, tipo_operacion, valor, descripcion)
            `)
            .order('fecha_contacto', { ascending: false });

        if (error) throw error;

        res.json({ contactos: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reenviar un contacto no resuelto (crea nuevo referenciando el original)
router.post('/reenviar/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: original, error: errGet } = await supabase
            .from('contactos')
            .select('*')
            .eq('id_contacto', id)
            .single();

        if (errGet || !original) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        if (original.id_usuario !== req.usuario.id_usuario) {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        if (original.estado !== 'no_resuelto') {
            return res.status(400).json({ error: 'Solo puedes reenviar contactos marcados como no resueltos' });
        }

        const { data, error } = await supabase
            .from('contactos')
            .insert([{
                nombre: original.nombre,
                email: original.email,
                telefono: original.telefono,
                id_usuario: original.id_usuario,
                id_inmueble: original.id_inmueble,
                asunto: original.asunto,
                mensaje: req.body.mensaje || original.mensaje,
                estado: 'pendiente'
            }])
            .select()
            .single();

        if (error) throw error;

        // Notificar a admins
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins && admins.length > 0) {
            await supabase.from('notificaciones').insert(
                admins.map(a => ({
                    id_usuario: a.id_usuario,
                    tipo: 'contacto',
                    titulo: 'Consulta reenviada',
                    mensaje: `${original.nombre} reenvió su consulta: ${original.asunto}`
                }))
            );
        }

        res.status(201).json({ mensaje: 'Consulta reenviada', contacto: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar estado de contacto (solo admin)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'No tienes permisos para actualizar contactos'
            });
        }

        const { id } = req.params;
        const { estado } = req.body;

        const { data, error } = await supabase
            .from('contactos')
            .update({ estado })
            .eq('id_contacto', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Estado actualizado',
            contacto: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar contacto propio (usuario) o cualquiera (admin)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar propiedad del contacto
        const { data: contacto } = await supabase
            .from('contactos')
            .select('id_usuario')
            .eq('id_contacto', id)
            .single();

        if (!contacto) return res.status(404).json({ error: 'Mensaje no encontrado' });

        if (contacto.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este mensaje' });
        }

        const { error } = await supabase
            .from('contactos')
            .delete()
            .eq('id_contacto', id);

        if (error) throw error;

        res.json({ mensaje: 'Mensaje eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
