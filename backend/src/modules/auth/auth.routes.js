import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Registro de usuario
router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, telefono, password, rol = 'cliente',
                tipo_identificacion = 'CC', numero_identificacion = '0' } = req.body;

        // Validar campos requeridos
        if (!nombre || !email || !password) {
            return res.status(400).json({
                error: 'Nombre, email y password son requeridos'
            });
        }

        // Verificar si el email ya existe
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('email')
            .eq('email', email)
            .single();

        if (usuarioExistente) {
            return res.status(400).json({
                error: 'El email ya está registrado'
            });
        }

        // Hash del password
        const password_hash = await bcrypt.hash(password, 10);

        // Insertar usuario (columnas alineadas con BD v3.4)
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nombre_completo: nombre,
                email,
                telefono,
                password_hash,
                rol,
                tipo_identificacion,
                numero_identificacion,
                mayor_de_edad: true
            }])
            .select()
            .single();

        if (error) throw error;

        // Generar token
        const token = jwt.sign(
            { id_usuario: data.id_usuario, email: data.email, rol: data.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id_usuario: data.id_usuario,
                nombre: data.nombre_completo,
                email: data.email,
                rol: data.rol
            }
        });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ error: error.message, detalle: error.details || error.hint || null });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email y password son requeridos'
            });
        }

        // Buscar usuario
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Verificar password
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValido) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre_completo,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
