import { supabase } from '../../config/supabase.js';

/**
 * Calcula los KPIs del dashboard administrativo.
 * Consulta inmuebles, usuarios, contactos y favoritos en paralelo.
 * Retorna estructura { kpis, changes }.
 */
export async function getDashboardKPIs() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel
  const [
    inmueblesRes,
    usuariosRes,
    contactosRes,
    favoritosRes
  ] = await Promise.all([
    supabase.from('inmuebles').select('id_inmueble, estado_aprobacion, activo, tipo_inmueble, tipo_operacion, destacado, created_at'),
    supabase.from('usuarios').select('id_usuario, activo, rol, fecha_registro'),
    supabase.from('contactos').select('id_contacto, estado_contacto, created_at'),
    supabase.from('favoritos').select('id_favorito, created_at')
  ]);

  const inmuebles = inmueblesRes.data || [];
  const usuarios = usuariosRes.data || [];
  const contactos = contactosRes.data || [];
  const favoritos = favoritosRes.data || [];

  // Current KPIs
  const totalPropiedades = inmuebles.filter(i => i.activo).length;
  const propiedadesAprobadas = inmuebles.filter(i => i.activo && i.estado_aprobacion === 'aprobado').length;
  const propiedadesPendientes = inmuebles.filter(i => i.activo && i.estado_aprobacion === 'pendiente').length;
  const propiedadesRechazadas = inmuebles.filter(i => i.estado_aprobacion === 'rechazado').length;
  const usuariosActivos = usuarios.filter(u => u.activo).length;
  const nuevosUsuariosSemana = usuarios.filter(u => {
    const reg = new Date(u.fecha_registro);
    return reg >= oneWeekAgo;
  }).length;
  const contactosSinResponder = contactos.filter(c => c.estado_contacto === 'pendiente').length;
  const favoritosTotales = favoritos.length;
  const propiedadesDestacadas = inmuebles.filter(i => i.destacado).length;
  const publicacionesActivas = inmuebles.filter(i => i.activo && i.estado_aprobacion === 'aprobado').length;
  const publicacionesVencidas = inmuebles.filter(i => !i.activo).length;

  // Previous period KPIs for percentage change calculation
  const propiedadesPrevMonth = inmuebles.filter(i => {
    const created = new Date(i.created_at);
    return created <= oneMonthAgo && i.activo;
  }).length;

  const usuariosActivosPrevWeek = usuarios.filter(u => {
    const reg = new Date(u.fecha_registro);
    return reg <= oneWeekAgo && u.activo;
  }).length;

  const contactosPendientesPrevWeek = contactos.filter(c => {
    const created = new Date(c.created_at);
    return created <= oneWeekAgo && c.estado_contacto === 'pendiente';
  }).length;

  // Calculate percentage changes
  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const kpis = {
    totalPropiedades,
    propiedadesAprobadas,
    propiedadesPendientes,
    propiedadesRechazadas,
    usuariosActivos,
    nuevosUsuariosSemana,
    contactosSinResponder,
    favoritosTotales,
    propiedadesDestacadas,
    publicacionesActivas,
    publicacionesVencidas
  };

  const changes = {
    totalPropiedades: calcChange(totalPropiedades, propiedadesPrevMonth),
    usuariosActivos: calcChange(usuariosActivos, usuariosActivosPrevWeek),
    contactosSinResponder: calcChange(contactosSinResponder, contactosPendientesPrevWeek)
  };

  return { kpis, changes };
}


/**
 * Obtiene datos de series de tiempo para las gráficas del dashboard.
 * - Publicaciones por mes (últimos 6 meses)
 * - Registros de usuarios por semana (últimas 8 semanas)
 * - Distribución de tipos de propiedad
 */
export async function getChartsData() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [inmueblesRes, usuariosRes] = await Promise.all([
    supabase
      .from('inmuebles')
      .select('id_inmueble, tipo_inmueble, created_at')
      .gte('created_at', sixMonthsAgo.toISOString()),
    supabase
      .from('usuarios')
      .select('id_usuario, fecha_registro')
      .gte('fecha_registro', eightWeeksAgo.toISOString())
  ]);

  const inmuebles = inmueblesRes.data || [];
  const usuarios = usuariosRes.data || [];

  // Publications by month (last 6 months)
  const publicacionesPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthName = monthDate.toLocaleString('es-CO', { month: 'short', year: '2-digit' });
    const count = inmuebles.filter(item => {
      const created = new Date(item.created_at);
      return created >= monthDate && created <= monthEnd;
    }).length;
    publicacionesPorMes.push({ mes: monthName, cantidad: count });
  }

  // User registrations by week (last 8 weeks)
  const usuariosPorSemana = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekLabel = weekStart.toLocaleString('es-CO', { day: '2-digit', month: 'short' });
    const count = usuarios.filter(u => {
      const reg = new Date(u.fecha_registro);
      return reg >= weekStart && reg < weekEnd;
    }).length;
    usuariosPorSemana.push({ semana: weekLabel, cantidad: count });
  }

  // Property type distribution
  const tiposCount = {};
  inmuebles.forEach(item => {
    const tipo = item.tipo_inmueble || 'otro';
    tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
  });
  const distribucionTipos = Object.entries(tiposCount).map(([tipo, cantidad]) => ({
    tipo,
    cantidad
  }));

  return {
    publicacionesPorMes,
    usuariosPorSemana,
    distribucionTipos
  };
}
