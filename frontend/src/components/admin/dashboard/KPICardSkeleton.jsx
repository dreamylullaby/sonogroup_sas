/**
 * KPICardSkeleton — skeleton loader matching KPICard shape
 * Requirements: 2.3
 */
export default function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-slate-200 rounded-lg" />
        <div className="w-12 h-4 bg-slate-200 rounded" />
      </div>
      <div className="mb-2">
        <div className="h-7 w-20 bg-slate-200 rounded mb-1.5" />
        <div className="h-4 w-28 bg-slate-200 rounded" />
      </div>
      <div className="h-10 mt-2 bg-slate-100 rounded" />
    </div>
  )
}
