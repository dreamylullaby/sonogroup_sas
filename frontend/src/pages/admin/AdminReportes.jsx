import { useState, useEffect } from 'react'
import { Building2, Users, FileText, MessageSquare, TrendingUp, TrendingDown, MapPin } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api } from '../../config/api'

const PIE_COLORS = ['#3D518C', '#1B2CC1', '#7692FF', '#CC1E2B', '#8C1132', '#6B3FA0', '#1B6B3A']

export default function AdminReportes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/inmuebles?estado_aprobacion=aprobado').catch(() => ({ data: { inmuebles: [] } })),
      api.get('/api/usuarios').catch(() => ({ data: { usuarios: [] } })),
      api.get('/api/propiedades-pendientes').catch(() => ({ data: { propiedades: [] } })),
      api.get('/api/contactos').catch(() => ({ data: { contactos: [] } })),
      api.get('/api/admin/stats/charts').catch(() => ({ data: { data: null } })),
    ]).then(([inmRes, usrRes, solRes, conRes, chartsRes]) => {
      const inmuebles = inmRes.data.inmuebles || []
      const usuarios = usrRes.data.usuarios || []
      const solicitudes = solRes.data.propiedades || []
      const contactos = conRes.data.contactos || []
      const charts = chartsRes.data.data || {}

      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

      const isThisMonth = (dateStr) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      }
      const isLastMonth = (dateStr) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
      }

      // Monthly summary
      const propThisMonth = inmuebles.filter(i => isThisMonth(i.fecha_registro)).length
      const propLastMonth = inmuebles.filter(i => isLastMonth(i.fecha_registro)).length
      const usrThisMonth = usuarios.filter(u => isThisMonth(u.fecha_registro)).length
      const usrLastMonth = usuarios.filter(u => isLastMonth(u.fecha_registro)).length
      const solThisMonth = solicitudes.filter(s => isThisMonth(s.fecha_solicitud)).length
      const conThisMonth = contactos.filter(c => isThisMonth(c.fecha_contacto)).length

      // Type distribution
      const typeCount = {}
      inmuebles.forEach(i => { typeCount[i.tipo_inmueble] = (typeCount[i.tipo_inmueble] || 0) + 1 })
      const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }))

      // Operation distribution
      const ventaCount = inmuebles.filter(i => i.tipo_operacion === 'venta').length
      const arriendoCount = inmuebles.filter(i => i.tipo_operacion === 'arriendo').length
      const operationData = [
        { name: 'Venta', cantidad: ventaCount },
        { name: 'Arriendo', cantidad: arriendoCount },
      ]

      // Top municipios
      const muniCount = {}
      inmuebles.forEach(i => {
        const muni = i.ubicaciones?.municipio || 'Sin ubicacion'
        muniCount[muni] = (muniCount[muni] || 0) + 1
      })
      const topMunicipios = Object.entries(muniCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([municipio, cantidad]) => ({ municipio, cantidad }))

      // Approval rate
      const totalSol = solicitudes.length
      const aprobadas = solicitudes.filter(s => s.estado_aprobacion === 'aprobado').length
      const rechazadas = solicitudes.filter(s => s.estado_aprobacion === 'rechazado').length
      const tasaAprobacion = totalSol > 0 ? Math.round((aprobadas / totalSol) * 100) : 0

      setData({
        summary: { propThisMonth, propLastMonth, usrThisMonth, usrLastMonth, solThisMonth, conThisMonth },
        typeData,
        operationData,
        topMunicipios,
        tasaAprobacion,
        aprobadas,
        rechazadas,
        totalSol,
        charts,
      })
    }).finally(() => setLoading(false))
  }, [])

  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  if (loading) {
    return (
      <div>
        <div className="admin-page__header">
          <h1 className="admin-page__title">Reportes</h1>
          <p className="admin-page__subtitle">Cargando estadisticas...</p>
        </div>
      </div>
    )
  }

  const { summary, typeData, operationData, topMunicipios, tasaAprobacion, aprobadas, rechazadas, totalSol, charts } = data

  const summaryCards = [
    { label: 'Propiedades este mes', value: summary.propThisMonth, change: calcChange(summary.propThisMonth, summary.propLastMonth), icon: Building2, color: '#3D518C' },
    { label: 'Solicitudes este mes', value: summary.solThisMonth, change: 0, icon: FileText, color: '#6B3FA0' },
    { label: 'Nuevos usuarios', value: summary.usrThisMonth, change: calcChange(summary.usrThisMonth, summary.usrLastMonth), icon: Users, color: '#1B6B3A' },
    { label: 'Contactos recibidos', value: summary.conThisMonth, change: 0, icon: MessageSquare, color: '#CC1E2B' },
  ]

  return (
    <div>
      <div className="admin-page__header">
        <h1 className="admin-page__title">Reportes</h1>
        <p className="admin-page__subtitle">Estadisticas y analisis del sistema</p>
      </div>

      {/* Summary cards */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="admin-kpi-card admin-kpi-card--petrol" style={{ background: '#EEF0FC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Icon size={18} style={{ color: card.color, opacity: 0.7 }} />
                {card.change !== 0 && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: card.change > 0 ? '#1B6B3A' : '#CC1E2B', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    {card.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {card.change > 0 ? '+' : ''}{card.change}%
                  </span>
                )}
              </div>
              <div className="admin-kpi-card__value" style={{ color: card.color, fontSize: '1.8rem' }}>{card.value}</div>
              <div className="admin-kpi-card__label" style={{ color: '#555' }}>{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Charts row 1: Type distribution + Operations */}
      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <div className="admin-chart-card__title">Propiedades por tipo</div>
          {typeData.length > 0 ? (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '0.6rem' }}>
                    {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="admin-chart-card__empty">Sin datos de propiedades</div>
          )}
        </div>

        <div className="admin-chart-card">
          <div className="admin-chart-card__title">Venta vs Arriendo</div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={operationData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,15,44,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                  <Cell fill="#3D518C" />
                  <Cell fill="#7692FF" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2: Growth + Approval rate */}
      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <div className="admin-chart-card__title">Crecimiento mensual</div>
          {charts?.publicacionesPorMes?.length > 0 ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={charts.publicacionesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,15,44,0.06)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <defs>
                    <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B2CC1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1B2CC1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="cantidad" stroke="#1B2CC1" strokeWidth={2.5} fill="url(#gradGrowth)" dot={{ r: 3, fill: '#1B2CC1' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="admin-chart-card__empty">Sin datos de crecimiento</div>
          )}
        </div>

        <div className="admin-chart-card">
          <div className="admin-chart-card__title">Tasa de aprobacion</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#1B6B3A', fontFamily: "'Playfair Display', serif" }}>{tasaAprobacion}%</div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '0.3rem' }}>de solicitudes aprobadas</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#1B6B3A' }}></div>
                <span style={{ fontSize: '0.68rem', color: '#555' }}>Aprobadas: {aprobadas}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#CC1E2B' }}></div>
                <span style={{ fontSize: '0.68rem', color: '#555' }}>Rechazadas: {rechazadas}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6B3FA0' }}></div>
                <span style={{ fontSize: '0.68rem', color: '#555' }}>Pendientes: {totalSol - aprobadas - rechazadas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top municipios */}
      <div className="admin-card">
        <div className="admin-card__header">
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A0F2C', fontFamily: "'Playfair Display', serif" }}>Top municipios</span>
        </div>
        {topMunicipios.length > 0 ? (
          <div className="admin-card__body">
            {topMunicipios.map((m, i) => (
              <div key={i} className="admin-list-item">
                <div className="admin-list-item__content">
                  <div className="admin-list-item__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={12} style={{ color: '#3D518C' }} />
                    {m.municipio}
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A0F2C' }}>{m.cantidad}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-card__empty"><p>Sin datos de ubicaciones</p></div>
        )}
      </div>
    </div>
  )
}
