import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

/**
 * POST /api/auth/forgot-password
 * Genera un token de reset y lo almacena hasheado en password_reset_tokens.
 * En producción aquí se enviaría un email con el link.
 * Por ahora retorna el token en la respuesta (solo para desarrollo).
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'El email es requerido' });
        }

        // Verificar que el usuario existe
        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id_usuario, email, activo')
            .eq('email', email)
            .single();

        if (errorUsuario || !usuario) {
            // No revelar si el email existe o no (seguridad)
            return res.json({
                mensaje: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.'
            });
        }

        if (!usuario.activo) {
            return res.json({
                mensaje: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.'
            });
        }

        // Invalidar tokens anteriores no usados del mismo usuario
        await supabase
            .from('password_reset_tokens')
            .update({ usado: true })
            .eq('id_usuario', usuario.id_usuario)
            .eq('usado', false);

        // Generar token UUID
        const tokenPlano = crypto.randomUUID();
        // Almacenar hash SHA-256 del token (nunca guardar el original en BD)
        const tokenHash = crypto.createHash('sha256').update(tokenPlano).digest('hex');

        // Obtener IP del solicitante
        const ipSolicitud = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

        // Insertar en password_reset_tokens (expira en 1 hora por default de la BD)
        const { error: errorInsert } = await supabase
            .from('password_reset_tokens')
            .insert([{
                id_usuario: usuario.id_usuario,
                token_hash: tokenHash,
                ip_solicitud: ipSolicitud
            }]);

        if (errorInsert) {
            console.error('❌ Error al crear token de reset:', errorInsert);
            throw errorInsert;
        }

        // En producción: enviar email con link tipo:
        // https://tudominio.com/restablecer-password?token=<tokenPlano>
        // Por ahora, en desarrollo, retornamos el token
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer-password?token=${tokenPlano}`;

        console.log(`🔑 Token de reset generado para ${email}: ${resetUrl}`);

        res.json({
            mensaje: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.',
            // Solo en desarrollo - remover en producción:
            ...(process.env.NODE_ENV !== 'production' && { dev_reset_url: resetUrl })
        });
    } catch (error) {
        console.error('❌ Error en forgot-password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/auth/reset-password
 * Valida el token y cambia la contraseña.
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Hashear el token recibido para comparar con la BD
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Buscar token válido (no usado y no expirado)
        const { data: tokenData, error: errorToken } = await supabase
            .from('password_reset_tokens')
            .select('id_token, id_usuario, expira_en, usado')
            .eq('token_hash', tokenHash)
            .eq('usado', false)
            .single();

        if (errorToken || !tokenData) {
            return res.status(400).json({ error: 'Token inválido o ya utilizado' });
        }

        // Verificar expiración
        if (new Date(tokenData.expira_en) < new Date()) {
            return res.status(400).json({ error: 'El token ha expirado. Solicita uno nuevo.' });
        }

        // Hashear nueva contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Actualizar contraseña del usuario
        const { error: errorUpdate } = await supabase
            .from('usuarios')
            .update({ password_hash: passwordHash })
            .eq('id_usuario', tokenData.id_usuario);

        if (errorUpdate) {
            console.error('❌ Error al actualizar contraseña:', errorUpdate);
            throw errorUpdate;
        }

        // Marcar token como usado
        await supabase
            .from('password_reset_tokens')
            .update({ usado: true })
            .eq('id_token', tokenData.id_token);

        // Invalidar todas las sesiones del usuario (seguridad)
        await supabase
            .from('sesiones_usuario')
            .update({ activa: false, token_sesion: null })
            .eq('id_usuario', tokenData.id_usuario)
            .eq('activa', true);

        res.json({ mensaje: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('❌ Error en reset-password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/auth/verify-reset-token?token=xxx
 * Verifica si un token es válido (para mostrar el formulario o un error)
 */
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ valid: false, error: 'Token requerido' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const { data: tokenData, error } = await supabase
            .from('password_reset_tokens')
            .select('expira_en, usado')
            .eq('token_hash', tokenHash)
            .eq('usado', false)
            .single();

        if (error || !tokenData) {
            return res.json({ valid: false, error: 'Token inválido o ya utilizado' });
        }

        if (new Date(tokenData.expira_en) < new Date()) {
            return res.json({ valid: false, error: 'El token ha expirado' });
        }

        res.json({ valid: true });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'Error interno del servidor' });
    }
});

export default router;
