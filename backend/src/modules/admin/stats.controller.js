import { getDashboardKPIs, getChartsData as getChartsService } from './stats.service.js';

/**
 * GET /api/admin/stats/dashboard
 * Retorna todos los KPIs del dashboard en una sola respuesta.
 */
export async function getDashboardStats(req, res) {
  try {
    const data = await getDashboardKPIs();
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del dashboard'
    });
  }
}

/**
 * GET /api/admin/stats/charts
 * Retorna datos de series de tiempo para las gráficas.
 */
export async function getChartsData(req, res) {
  try {
    const data = await getChartsService();
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en getChartsData:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener datos de gráficas'
    });
  }
}
