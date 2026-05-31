/**
 * PropertyTypeDonut — gráfica donut de distribución de tipos de propiedad
 * Requirements: 2.7
 */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

const LABEL_MAP = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  lote: 'Lote',
  local: 'Local',
  bodega: 'Bodega',
  finca: 'Finca',
  apartaestudio: 'Apartaestudio'
}

export default function PropertyTypeDonut({ data = [] }) {
  const chartData = data.map(item => ({
    ...item,
    name: LABEL_MAP[item.tipo] || item.tipo
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribución por Tipo</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="cantidad"
              nameKey="name"
              paddingAngle={2}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
