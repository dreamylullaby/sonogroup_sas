import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verificarConexion } from './config/supabase.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import passwordResetRoutes from './routes/password-reset.routes.js';
import inmueblesRoutes from './routes/inmuebles.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import fotografiasRoutes from './routes/fotografias.routes.js';
import favoritosRoutes from './routes/favoritos.routes.js';
import contactosRoutes from './routes/contactos.routes.js';
import contactoGeneralRoutes from './routes/contacto-general.routes.js';
import propiedadesPendientesRoutes from './routes/propiedades-pendientes.routes.js';
import inmueblesAdminRoutes from './routes/inmuebles-admin.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import historialPreciosRoutes from './routes/historial-precios.routes.js';
import caracteristicasRoutes from './routes/caracteristicas.routes.js';
import solicitudesCuentaRoutes from './routes/solicitudes-cuenta.routes.js';
import statsRoutes from './routes/stats.routes.js';
import casasRoutes from './routes/casas.routes.js';
import apartamentosRoutes from './routes/apartamentos.routes.js';
import localesRoutes from './routes/locales.routes.js';
import bodegasRoutes from './routes/bodegas.routes.js';
import fincasRoutes from './routes/fincas.routes.js';
import apartaestudiosRoutes from './routes/apartaestudios.routes.js';
import lotesRoutes from './routes/lotes.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        mensaje: '🏠 API de Gestión de Inmuebles',
        version: '1.0.0',
        descripcion: 'Backend completo para gestión de propiedades inmobiliarias con Supabase',
        endpoints: {
            autenticacion: '/api/auth',
            inmuebles: '/api/inmuebles',
            inmuebles_admin: '/api/inmuebles-admin',
            usuarios: '/api/usuarios',
            fotografias: '/api/fotografias',
            favoritos: '/api/favoritos',
            contactos: '/api/contactos',
            configuracion: '/api/configuracion',
            notificaciones: '/api/notificaciones',
            caracteristicas: '/api/caracteristicas',
            historial_precios: '/api/historial-precios',
            solicitudes_cuenta: '/api/solicitudes-cuenta',
            stats: '/api/stats',
            propiedades_pendientes: '/api/propiedades-pendientes',
            casas: '/api/casas',
            apartamentos: '/api/apartamentos',
            locales: '/api/locales',
            bodegas: '/api/bodegas',
            fincas: '/api/fincas',
            apartaestudios: '/api/apartaestudios',
            lotes: '/api/lotes'
        },
        tablas_disponibles: [
            'usuarios',
            'configuracion_usuario',
            'seguridad_usuario',
            'sesiones_usuario',
            'password_reset_tokens',
            'configuracion',
            'inmuebles',
            'ubicaciones',
            'fotografias',
            'caracteristicas_generales',
            'inmuebles_caracteristicas',
            'casas',
            'apartamentos',
            'apartaestudios',
            'locales',
            'bodegas',
            'fincas',
            'lotes',
            'contactos',
            'favoritos',
            'solicitudes_publicacion',
            'historial_precios',
            'notificaciones',
            'solicitudes_eliminacion_cuenta',
            'keep_alive'
        ]
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/inmuebles', inmueblesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/fotografias', fotografiasRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/contactos', contactosRoutes);
app.use('/api/contactos-general', contactoGeneralRoutes);
app.use('/api/propiedades-pendientes', propiedadesPendientesRoutes);
app.use('/api/inmuebles-admin', inmueblesAdminRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/historial-precios', historialPreciosRoutes);
app.use('/api/caracteristicas', caracteristicasRoutes);
app.use('/api/solicitudes-cuenta', solicitudesCuentaRoutes);
app.use('/api/stats', statsRoutes);

// Rutas de tablas especializadas
app.use('/api/casas', casasRoutes);
app.use('/api/apartamentos', apartamentosRoutes);
app.use('/api/locales', localesRoutes);
app.use('/api/bodegas', bodegasRoutes);
app.use('/api/fincas', fincasRoutes);
app.use('/api/apartaestudios', apartaestudiosRoutes);
app.use('/api/lotes', lotesRoutes);

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const iniciarServidor = async () => {
    try {
        // Verificar conexión a Supabase
        await verificarConexion();

        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📚 Documentación disponible en http://localhost:${PORT}\n`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

iniciarServidor();
