/**
 * PublicationsBarChart — gráfica de barras de publicaciones por mes
 * Requirements: 2.5
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PublicationsBarChart({ data = [] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Publicaciones por Mes</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="cantidad" fill="#6366f1" radius={[4, 4, 0, 0]} name="Publicaciones" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
