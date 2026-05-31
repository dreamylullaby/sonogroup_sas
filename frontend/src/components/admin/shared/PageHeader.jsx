/**
 * PageHeader — encabezado de página con título, descripción y slot de acciones
 * Requirements: 12.1
 */

export default function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A0F2C]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
