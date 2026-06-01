import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Crear mensaje de contacto (público)
router.post('/', async (req, res) => {
    try {
        const { nombre, email, telefono, asunto, mensaje } = req.body;

        if (!nombre || !email || !mensaje) {
            return res.status(400).json({
                error: 'Nombre, email y mensaje son requeridos'
            });
        }

        const { data, error } = await supabase
            .from('contactos')
            .insert([{
                nombre,
                email,
                telefono,
                asunto: asunto || 'Contacto general',
                mensaje,
                estado: 'pendiente',
                id_inmueble: null,
                id_usuario: null
            }])
            .select()
            .single();

        if (error) throw error;

        // Notificar a admins de nuevo contacto
        const { data: admins } = await supabase.from('usuarios').select('id_usuario').eq('rol', 'admin');
        if (admins && admins.length > 0) {
            await supabase.from('notificaciones').insert(
                admins.map(a => ({ id_usuario: a.id_usuario, tipo: 'contacto', titulo: 'Nuevo mensaje de contacto', mensaje: `${nombre} envio un mensaje: ${asunto || 'Contacto general'}` }))
            );
        }

        res.status(201).json({
            mensaje: 'Mensaje enviado exitosamente',
            contacto: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los mensajes (solo admin)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('contactos')
            .select('*')
            .order('fecha_contacto', { ascending: false });

        if (error) throw error;

        res.json({ contactos: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
