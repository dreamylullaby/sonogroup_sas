import { Trash2 } from 'lucide-react'

/**
 * Modal reutilizable de confirmación de eliminación.
 * Props:
 *  - open: boolean
 *  - title: string (ej: "Eliminar solicitud")
 *  - description: string (ej: "Esta acción no se puede deshacer.")
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - loading: boolean (optional)
 */
export default function DeleteConfirmModal({ open, title, description, onConfirm, onCancel, loading = false }) {
  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '380px', border: '0.5px solid #e0d8ec' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FCE8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Trash2 size={22} color="#CC1E2B" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#241929', margin: '0 0 6px' }}>
            {title || '¿Eliminar permanentemente?'}
          </h3>
          <p style={{ fontSize: '12px', color: '#8097B7', margin: 0, lineHeight: 1.5 }}>
            {description || 'Esta acción no se puede deshacer. El registro será eliminado permanentemente.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 18px', fontSize: '11px', fontWeight: 500,
              background: 'transparent', color: '#5A4864', border: '0.5px solid #e0d8ec',
              borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px', fontSize: '11px', fontWeight: 500,
              background: '#CC1E2B', color: '#fff',
              border: 'none', borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            <Trash2 size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
