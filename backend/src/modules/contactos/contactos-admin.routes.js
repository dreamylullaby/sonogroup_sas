import express from 'express';
import { supabase } from '../../config/supabase.js';
import { verificarToken, verificarRol } from '../../middleware/auth.js';

const router = express.Router();

// Lógica automática: marcar como 'no_resuelto' contactos con 7+ días sin resolver
async function marcarNoResueltos() {
    try {
        const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: vencidos, error: errBusqueda } = await supabase
            .from('contactos')
            .select('id_contacto, id_usuario, nombre, asunto')
            .in('estado', ['pendiente', 'recibido'])
            .lt('fecha_contacto', sieteDiasAtras);

        if (errBusqueda || !vencidos || vencidos.length === 0) return;

        const ids = vencidos.map(c => c.id_contacto);

        await supabase
            .from('contactos')
            .update({
                estado: 'no_resuelto',
                fecha_no_resuelto: new Date().toISOString()
            })
            .in('id_contacto', ids);

        // Notificar a usuarios registrados
        const notificaciones = vencidos
            .filter(c => c.id_usuario)
            .map(c => ({
                id_usuario: c.id_usuario,
                tipo: 'contacto',
                titulo: 'Consulta sin respuesta',
                mensaje: 'Tu consulta lleva 7 días sin respuesta. Hemos notificado al equipo.'
            }));

        if (notificaciones.length > 0) {
            await supabase.from('notificaciones').insert(notificaciones);
        }
    } catch (err) {
        console.error('Error al marcar contactos no resueltos:', err.message);
    }
}

// GET /api/admin/contactos — lista con filtro ?estado= y contadores GLOBALES
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        // Ejecutar detección de no resueltos antes de retornar
        await marcarNoResueltos();

        const { estado } = req.query;

        // Siempre obtener TODOS para calcular contadores globales
        const { data: todos, error: errAll } = await supabase
            .from('contactos')
            .select(`
                *,
                usuarios!contactos_id_usuario_fkey (nombre:nombre_completo, email, telefono),
                inmuebles (id_inmueble, tipo_inmueble, tipo_operacion, valor, descripcion)
            `)
            .order('fecha_contacto', { ascending: false });

        if (errAll) throw errAll;

        const allData = todos || [];

        // Contadores globales (siempre sobre TODOS, sin importar el filtro)
        const contadores = {
            pendiente: allData.filter(c => c.estado === 'pendiente').length,
            recibido: allData.filter(c => c.estado === 'recibido').length,
            no_resuelto: allData.filter(c => c.estado === 'no_resuelto').length,
            resuelto: allData.filter(c => c.estado === 'resuelto').length,
            total: allData.length
        };

        // Filtrar para la respuesta si se pidió un estado específico
        const contactos = estado
            ? allData.filter(c => c.estado === estado)
            : allData;

        res.json({ contactos, contadores });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/contactos/:id — detalle, marca como 'recibido' si era 'pendiente'
router.get('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: contacto, error } = await supabase
            .from('contactos')
            .select(`
                *,
                usuarios!contactos_id_usuario_fkey (nombre:nombre_completo, email, telefono),
                inmuebles (id_inmueble, tipo_inmueble, tipo_operacion, valor, descripcion)
            `)
            .eq('id_contacto', id)
            .single();

        if (error || !contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        // Marcar como recibido si era pendiente
        if (contacto.estado === 'pendiente') {
            const updateData = { estado: 'recibido' };
            // Intentar guardar fecha_vista (puede no existir la columna aún)
            try {
                updateData.fecha_vista = new Date().toISOString();
            } catch (_) {}

            const { error: errUpdate } = await supabase
                .from('contactos')
                .update(updateData)
                .eq('id_contacto', id);

            if (!errUpdate) {
                contacto.estado = 'recibido';
            }
        }

        res.json({ contacto });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/contactos/:id/resolver — marca como resuelto con respuesta
router.put('/:id/resolver', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { respuesta } = req.body;

        if (!respuesta || respuesta.trim().length < 10) {
            return res.status(400).json({ error: 'La respuesta debe tener al menos 10 caracteres' });
        }

        const { data: contacto, error: errGet } = await supabase
            .from('contactos')
            .select('id_contacto, id_usuario, estado, nombre')
            .eq('id_contacto', id)
            .single();

        if (errGet || !contacto) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }

        if (contacto.estado === 'resuelto') {
            return res.status(400).json({ error: 'Este contacto ya fue resuelto' });
        }

        const { data, error } = await supabase
            .from('contactos')
            .update({
                estado: 'resuelto',
                respuesta_admin: respuesta.trim(),
                fecha_resolucion: new Date().toISOString()
            })
            .eq('id_contacto', id)
            .select()
            .single();

        if (error) throw error;

        // Notificar al usuario si tiene cuenta
        if (contacto.id_usuario) {
            await supabase.from('notificaciones').insert([{
                id_usuario: contacto.id_usuario,
                tipo: 'contacto',
                titulo: 'Respuesta a tu consulta',
                mensaje: respuesta.trim()
            }]);
        }

        res.json({ mensaje: 'Contacto resuelto', contacto: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/contactos/:id — eliminar contacto
router.delete('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('contactos')
            .delete()
            .eq('id_contacto', id);

        if (error) throw error;

        res.json({ mensaje: 'Contacto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
