/**
 * KPICard — tarjeta de métrica con sparkline, tendencia y cambio porcentual
 * Requirements: 2.4
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', spark: '#3b82f6' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', spark: '#10b981' },
  yellow: { bg: 'bg-amber-50', icon: 'text-amber-600', spark: '#f59e0b' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', spark: '#ef4444' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', spark: '#8b5cf6' }
}

const TREND_CONFIG = {
  up: { Icon: TrendingUp, color: 'text-emerald-600' },
  down: { Icon: TrendingDown, color: 'text-red-600' },
  neutral: { Icon: Minus, color: 'text-slate-400' }
}

export default function KPICard({ title, value, change = 0, trend = 'neutral', icon: IconComponent, color = 'blue', sparklineData = [] }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue
  const trendConfig = TREND_CONFIG[trend] || TREND_CONFIG.neutral
  const TrendIcon = trendConfig.Icon

  const chartData = sparklineData.map((v, i) => ({ idx: i, val: v }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-150">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          {IconComponent && <IconComponent className={`w-5 h-5 ${colors.icon}`} />}
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${trendConfig.color}`} />
          <span className={`text-xs font-medium ${trendConfig.color}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-2xl font-semibold text-slate-900 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-slate-500 mt-0.5">{title}</p>
      </div>

      {chartData.length > 1 && (
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.spark} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.spark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke={colors.spark}
                strokeWidth={1.5}
                fill={`url(#gradient-${color})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
