/**
 * ConfirmDialog — modal de confirmación reutilizable
 * Requirements: 3.10, 5.7
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const VARIANT_CONFIG = {
  danger: {
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: 'text-red-600'
  },
  warning: {
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
    icon: 'text-amber-500'
  }
}

export default function ConfirmDialog({ open, title, description, onConfirm, onCancel, variant = 'danger' }) {
  const cancelRef = useRef(null)
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger

  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) onCancel?.()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
          >
            <h2 id="confirm-title" className="text-lg font-semibold text-slate-900 mb-2">
              {title}
            </h2>
            {description && (
              <p id="confirm-desc" className="text-sm text-slate-500 mb-6">
                {description}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                ref={cancelRef}
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${config.button}`}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
