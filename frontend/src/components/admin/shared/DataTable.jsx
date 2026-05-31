/**
 * DataTable — reusable table with sort, pagination, and empty state
 * Requirements: 3.1, 5.1
 *
 * Props:
 *   columns: Array<{ key, label, sortable? }>
 *   data: Array<object>
 *   loading: boolean
 *   pagination: { page, limit, total, totalPages }
 *   onPageChange: (page) => void
 *   onSort: (columnKey, direction) => void
 *   emptyMessage: string
 */

import { useState } from 'react'
import SkeletonTable from './SkeletonTable'
import EmptyState from './EmptyState'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  pagination,
  onPageChange,
  onSort,
  emptyMessage = 'No hay datos disponibles'
}) {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (column) => {
    if (!column.sortable) return

    let direction = 'asc'
    if (sortColumn === column.key && sortDirection === 'asc') {
      direction = 'desc'
    }

    setSortColumn(column.key)
    setSortDirection(direction)
    onSort?.(column.key, direction)
  }

  if (loading) {
    return <SkeletonTable rows={5} columns={columns.length || 6} />
  }

  if (!data.length) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium text-slate-600 whitespace-nowrap ${
                  col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''
                }`}
                onClick={() => handleSort(col)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <SortIndicator
                      active={sortColumn === col.key}
                      direction={sortColumn === col.key ? sortDirection : null}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="hover:bg-slate-50 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}


function SortIndicator({ active, direction }) {
  return (
    <span className={`inline-flex flex-col text-[10px] leading-none ${active ? 'text-indigo-500' : 'text-slate-300'}`}>
      <span className={direction === 'asc' && active ? 'text-indigo-500' : 'text-slate-300'}>▲</span>
      <span className={direction === 'desc' && active ? 'text-indigo-500' : 'text-slate-300'}>▼</span>
    </span>
  )
}

function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
      <span className="text-sm text-slate-500">
        Mostrando {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          ← Anterior
        </button>
        <span className="px-3 py-1.5 text-sm text-slate-600">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
