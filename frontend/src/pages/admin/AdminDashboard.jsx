import { useState, useEffect } from 'react'
import { Building2, Users, Clock, XCircle, UserCheck, UserPlus, MessageSquare, Heart, TrendingUp, TrendingDown, Plus, Shield, Monitor, BarChart3 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../config/api'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/stats/dashboard').catch(() => ({ data: { data: null } })),
      api.get('/api/admin/stats/charts').catch(() => ({ data: { data: null } }))
    ]).then(([s, c]) => {
      setStats(s.data.data)
      setCharts(c.data.data)
    }).finally(() => setLoading(false))
  }, [])

  const kpis = stats?.kpis || {}
  const changes = stats?.changes || {}
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const firstName = user?.nombre?.split(' ')[0] || 'Admin'

  const cards = [
    { label: 'Total Propiedades', value: kpis.totalPropiedades || 0, change: changes.totalPropiedades || 0, icon: Building2, variant: 'petrol' },
    { label: 'Aprobadas', value: kpis.propiedadesAprobadas || 0, change: 0, icon: UserCheck, variant: 'green' },
    { label: 'Pendientes', value: kpis.propiedadesPendientes || 0, change: 0, icon: Clock, variant: 'gold' },
    { label: 'Rechazadas', value: kpis.propiedadesRechazadas || 0, change: 0, icon: XCircle, variant: 'wine' },
    { label: 'Usuarios Activos', value: kpis.usuariosActivos || 0, change: changes.usuariosActivos || 0, icon: Users, variant: 'petrol' },
    { label: 'Nuevos esta Semana', value: kpis.nuevosUsuariosSemana || 0, change: 0, icon: UserPlus, variant: 'green' },
    { label: 'Contactos Pendientes', value: kpis.contactosSinResponder || 0, change: 0, icon: MessageSquare, variant: 'gold' },
    { label: 'Favoritos', value: kpis.favoritosTotales || 0, change: 0, icon: Heart, variant: 'wine' },
  ]

  return (
    <div>
      {/* Welcome Banner — Identity & Context, no metrics */}
      <div className="admin-welcome">
        <div className="admin-welcome__left">
          <div className="admin-welcome__avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="admin-welcome__greeting">{getGreeting()}, {firstName}</div>
            <div className="admin-welcome__role">Administrador General</div>
            <div className="admin-welcome__date">{today}</div>
            <div className="admin-welcome__msg">Gestiona propiedades, usuarios y solicitudes desde un unico lugar.</div>
          </div>
        </div>
        <div className="admin-welcome__right">
          <div className="admin-welcome__session">
            <div className="admin-welcome__session-item"><Clock size={12} /> <span>Sesion iniciada: {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="admin-welcome__session-item"><Shield size={12} /> <span>Permisos: Administrador General</span></div>
            <div className="admin-welcome__session-item"><Monitor size={12} /> <span>Ultima sesion activa: Hoy</span></div>
          </div>
          <div className="admin-welcome__actions">
            <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => navigate('/publicar')}><Plus size={12} /> Nueva Propiedad</button>
            <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => navigate('/admin/reportes')}><BarChart3 size={12} /> Reportes</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="admin-kpi-card admin-kpi-card--petrol" style={{ opacity: 0.3 }}>
              <div className="admin-kpi-card__value">-</div>
              <div className="admin-kpi-card__label">Cargando...</div>
            </div>
          ))
        ) : (
          cards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className={`admin-kpi-card admin-kpi-card--${card.variant}`}>
                <div className="admin-kpi-card__icon-deco">
                  <Icon size={28} />
                </div>
                <div className="admin-kpi-card__value">{card.value}</div>
                <div className="admin-kpi-card__label">{card.label}</div>
                {card.change !== 0 && (
                  <div className="admin-kpi-card__trend">
                    {card.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {card.change > 0 ? '+' : ''}{card.change}%
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Charts */}
      {!loading && (
        <div className="admin-charts-row">
          <div className="admin-chart-card">
            <div className="admin-chart-card__title">Publicaciones por mes</div>
            {charts?.publicacionesPorMes?.length > 0 ? (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={charts.publicacionesPorMes} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,15,44,0.06)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="cantidad" fill="#CC1E2B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="admin-chart-card__empty">Sin datos en este periodo</div>
            )}
          </div>

          <div className="admin-chart-card">
            <div className="admin-chart-card__title">Crecimiento de usuarios</div>
            {charts?.usuariosPorSemana?.length > 0 ? (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <AreaChart data={charts.usuariosPorSemana}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,15,44,0.06)" vertical={false} />
                    <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7692FF" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7692FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="cantidad" stroke="#1B2CC1" strokeWidth={2.5} fill="url(#gradUsers)" dot={{ r: 4, fill: '#1B2CC1', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="admin-chart-card__empty">Sin datos en este periodo</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
