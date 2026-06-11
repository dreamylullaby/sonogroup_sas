import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Modal reutilizable de rechazo con justificación.
 * Props:
 *  - open: boolean
 *  - title: string (ej: "Rechazar solicitud")
 *  - description: string (ej: "Casa · Juan Pérez")
 *  - onConfirm: (motivo: string) => void
 *  - onCancel: () => void
 *  - minLength: number (default 20)
 */
export default function RejectModal({ open, title, description, onConfirm, onCancel, minLength = 20 }) {
  const [motivo, setMotivo] = useState('')

  if (!open) return null

  const isValid = motivo.trim().length >= minLength

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(motivo.trim())
    setMotivo('')
  }

  const handleCancel = () => {
    setMotivo('')
    onCancel()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', border: '0.5px solid #e0d8ec' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FCE8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <AlertTriangle size={22} color="#CC1E2B" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#241929', margin: '0 0 6px' }}>{title || 'Rechazar solicitud'}</h3>
          {description && (
            <p style={{ fontSize: '12px', color: '#8097B7', margin: 0 }}>{description}</p>
          )}
        </div>

        {/* Textarea */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5A4864', marginBottom: '6px' }}>
            Motivo del rechazo <span style={{ color: '#CC1E2B' }}>*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explica al usuario por qué se rechaza su solicitud..."
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', fontSize: '13px', color: '#241929',
              border: '0.5px solid #e0d8ec', borderRadius: '8px', background: '#F4F0F8',
              resize: 'vertical', outline: 'none', fontFamily: 'inherit'
            }}
            autoFocus
          />
          {motivo.trim().length > 0 && motivo.trim().length < minLength && (
            <p style={{ fontSize: '11px', color: '#8C1132', marginTop: '4px' }}>Mínimo {minLength} caracteres</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px', fontSize: '11px', fontWeight: 500,
              background: 'transparent', color: '#5A4864', border: '0.5px solid #e0d8ec',
              borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            style={{
              padding: '8px 18px', fontSize: '11px', fontWeight: 500,
              background: isValid ? '#CC1E2B' : '#e0d8ec',
              color: isValid ? '#fff' : '#8097B7',
              border: 'none', borderRadius: '8px',
              cursor: isValid ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            <X size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Confirmar rechazo
          </button>
        </div>
      </div>
    </div>
  )
}
