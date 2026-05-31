/**
 * StatusBadge — badge de estado con colores del design system
 * Requirements: 12.8
 */

const STATUS_CONFIG = {
  pendiente: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Pendiente'
  },
  aprobado: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Aprobado'
  },
  rechazado: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Rechazado'
  },
  activo: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Activo'
  },
  suspendido: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: 'Suspendido'
  },
  respondido: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Respondido'
  },
  cerrado: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    label: 'Cerrado'
  }
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1'
}

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status]

  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full border text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border-gray-200">
        {status || 'Desconocido'}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${SIZE_CLASSES[size] || SIZE_CLASSES.md}`}
    >
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG, SIZE_CLASSES }
