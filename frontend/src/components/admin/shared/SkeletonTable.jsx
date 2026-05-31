/**
 * SkeletonTable — skeleton loader for table content
 * Requirements: 12.4
 */

export default function SkeletonTable({ rows = 5, columns = 6 }) {
  return (
    <div className="w-full animate-pulse">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-slate-200 rounded flex-1"
          />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex items-center gap-4 px-4 py-4 border-b border-slate-100"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={`cell-${rowIdx}-${colIdx}`}
              className={`h-4 bg-slate-200 rounded flex-1 ${
                colIdx === 0 ? 'max-w-[40px]' : ''
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
