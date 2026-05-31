/**
 * SkeletonCard — skeleton loader for card content
 * Requirements: 12.4
 */

export default function SkeletonCard({ lines = 3, showImage = false }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
      {showImage && (
        <div className="h-32 bg-slate-200 rounded-lg mb-4" />
      )}

      {/* Title line */}
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />

      {/* Content lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={`line-${i}`}
          className={`h-4 bg-slate-200 rounded mb-2 ${
            i === lines - 1 ? 'w-1/2' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}
