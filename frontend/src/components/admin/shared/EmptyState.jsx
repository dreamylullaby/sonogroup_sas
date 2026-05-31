/**
 * EmptyState — estado vacío con ilustración SVG y mensaje
 * Requirements: 12.5
 */

export default function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <Icon className="h-10 w-10 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {title || 'Sin resultados'}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm">
          {description}
        </p>
      )}
    </div>
  )
}
