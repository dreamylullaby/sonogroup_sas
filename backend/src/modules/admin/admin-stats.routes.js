import express from 'express';
import { verificarToken, verificarRol } from '../../middleware/auth.js';
import { getDashboardStats, getChartsData } from './stats.controller.js';

const router = express.Router();

// GET /api/admin/stats/dashboard — KPIs del dashboard
router.get('/dashboard', verificarToken, verificarRol(['admin']), getDashboardStats);

// GET /api/admin/stats/charts — Datos de gráficas
router.get('/charts', verificarToken, verificarRol(['admin']), getChartsData);

export default router;
