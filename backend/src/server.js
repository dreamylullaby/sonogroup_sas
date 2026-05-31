import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verificarConexion } from './config/supabase.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// ─── Módulos ───────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes.js';
import passwordResetRoutes from './modules/password/password-reset.routes.js';
import inmueblesRoutes from './modules/inmuebles/inmuebles.routes.js';
import inmueblesAdminRoutes from './modules/inmuebles/inmuebles-admin.routes.js';
import propiedadesPendientesRoutes from './modules/inmuebles/propiedades-pendientes.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import casasRoutes from './modules/propiedades/casas.routes.js';
import apartamentosRoutes from './modules/propiedades/apartamentos.routes.js';
import apartaestudiosRoutes from './modules/propiedades/apartaestudios.routes.js';
import localesRoutes from './modules/propiedades/locales.routes.js';
import bodegasRoutes from './modules/propiedades/bodegas.routes.js';
import fincasRoutes from './modules/propiedades/fincas.routes.js';
import lotesRoutes from './modules/propiedades/lotes.routes.js';
import contactosRoutes from './modules/contactos/contactos.routes.js';
import contactoGeneralRoutes from './modules/contactos/contacto-general.routes.js';
import favoritosRoutes from './modules/favoritos/favoritos.routes.js';
import fotografiasRoutes from './modules/fotografias/fotografias.routes.js';
import caracteristicasRoutes from './modules/caracteristicas/caracteristicas.routes.js';
import historialPreciosRoutes from './modules/historial/historial-precios.routes.js';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes.js';
import solicitudesCuentaRoutes from './modules/solicitudes/solicitudes-cuenta.routes.js';
import configuracionRoutes from './modules/configuracion/configuracion.routes.js';
import statsRoutes from './modules/admin/stats.routes.js';
import adminStatsRoutes from './modules/admin/admin-stats.routes.js';

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
        descripcion:
            'Backend completo para gestión de propiedades inmobiliarias con Supabase',
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
        }
    });
});

// ─── Rutas de la API ───────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/inmuebles', inmueblesRoutes);
app.use('/api/inmuebles-admin', inmueblesAdminRoutes);
app.use('/api/propiedades-pendientes', propiedadesPendientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/fotografias', fotografiasRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/contactos', contactosRoutes);
app.use('/api/contactos-general', contactoGeneralRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/historial-precios', historialPreciosRoutes);
app.use('/api/caracteristicas', caracteristicasRoutes);
app.use('/api/solicitudes-cuenta', solicitudesCuentaRoutes);
app.use('/api/stats', statsRoutes);

// Rutas de tablas especializadas (propiedades por tipo)
app.use('/api/casas', casasRoutes);
app.use('/api/apartamentos', apartamentosRoutes);
app.use('/api/locales', localesRoutes);
app.use('/api/bodegas', bodegasRoutes);
app.use('/api/fincas', fincasRoutes);
app.use('/api/apartaestudios', apartaestudiosRoutes);
app.use('/api/lotes', lotesRoutes);

// Rutas admin consolidadas
app.use('/api/admin/stats', adminStatsRoutes);

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const iniciarServidor = async () => {
    try {
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
