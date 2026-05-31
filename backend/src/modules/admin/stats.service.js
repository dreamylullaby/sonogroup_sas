import { supabase } from '../../config/supabase.js';

/**
 * KPIs del dashboard — alineado con BD v3.4
 */
export async function getDashboardKPIs() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [inmueblesRes, usuariosRes, contactosRes, favoritosRes, solicitudesRes] = await Promise.all([
    supabase.from('inmuebles').select('id_inmueble, estado_aprobacion, activo, tipo_inmueble, tipo_operacion, fecha_registro'),
    supabase.from('usuarios').select('id_usuario, activo, rol, fecha_registro'),
    supabase.from('contactos').select('id_contacto, estado, fecha_contacto'),
    supabase.from('favoritos').select('id_usuario, id_inmueble'),
    supabase.from('solicitudes_publicacion').select('id_solicitud, estado_aprobacion, fecha_solicitud')
  ]);

  const inmuebles = inmueblesRes.data || [];
  const usuarios = usuariosRes.data || [];
  const contactos = contactosRes.data || [];
  const favoritos = favoritosRes.data || [];
  const solicitudes = solicitudesRes.data || [];

  const activos = inmuebles.filter(i => i.activo);
  const kpis = {
    totalPropiedades: activos.length,
    propiedadesAprobadas: activos.filter(i => i.estado_aprobacion === 'aprobado').length,
    propiedadesPendientes: solicitudes.filter(s => s.estado_aprobacion === 'pendiente').length,
    propiedadesRechazadas: inmuebles.filter(i => i.estado_aprobacion === 'rechazado').length,
    usuariosActivos: usuarios.filter(u => u.activo).length,
    nuevosUsuariosSemana: usuarios.filter(u => new Date(u.fecha_registro) >= oneWeekAgo).length,
    contactosSinResponder: contactos.filter(c => c.estado === 'pendiente').length,
    favoritosTotales: favoritos.length,
  };

  // Changes (simple: compare current week vs previous)
  const prevWeekUsers = usuarios.filter(u => {
    const d = new Date(u.fecha_registro);
    return d < oneWeekAgo && u.activo;
  }).length;

  const changes = {
    totalPropiedades: 0,
    usuariosActivos: prevWeekUsers > 0 ? Math.round(((kpis.usuariosActivos - prevWeekUsers) / prevWeekUsers) * 100) : (kpis.usuariosActivos > 0 ? 100 : 0),
    contactosSinResponder: 0
  };

  return { kpis, changes };
}

/**
 * Datos de gráficas — alineado con BD v3.4
 */
export async function getChartsData() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [inmueblesRes, usuariosRes] = await Promise.all([
    supabase.from('inmuebles').select('id_inmueble, tipo_inmueble, fecha_registro').gte('fecha_registro', sixMonthsAgo.toISOString()),
    supabase.from('usuarios').select('id_usuario, fecha_registro').gte('fecha_registro', eightWeeksAgo.toISOString())
  ]);

  const inmuebles = inmueblesRes.data || [];
  const usuarios = usuariosRes.data || [];

  // Publications by month
  const publicacionesPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleString('es-CO', { month: 'short' }) + " '" + String(start.getFullYear()).slice(2);
    const count = inmuebles.filter(item => {
      const d = new Date(item.fecha_registro);
      return d >= start && d <= end;
    }).length;
    publicacionesPorMes.push({ mes: label, cantidad: count });
  }

  // Users by week
  const usuariosPorSemana = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const label = weekStart.toLocaleString('es-CO', { day: '2-digit', month: 'short' });
    const count = usuarios.filter(u => {
      const d = new Date(u.fecha_registro);
      return d >= weekStart && d < weekEnd;
    }).length;
    usuariosPorSemana.push({ semana: label, cantidad: count });
  }

  // Type distribution
  const tipos = {};
  inmuebles.forEach(i => { tipos[i.tipo_inmueble] = (tipos[i.tipo_inmueble] || 0) + 1; });
  const distribucionTipos = Object.entries(tipos).map(([tipo, cantidad]) => ({ tipo, cantidad }));

  return { publicacionesPorMes, usuariosPorSemana, distribucionTipos };
}
