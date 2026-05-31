import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { api } from '../../config/api'

export default function AdminConfiguracion() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/configuracion')
      .then(res => setConfig(res.data.configuracion))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/api/configuracion', config)
      alert('Configuración guardada')
    } catch { alert('Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Configuración</h1>
          <p className="text-sm text-slate-500 mt-1">Preferencias generales de la cuenta</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#0A0F2C] text-white text-sm font-medium rounded-lg hover:bg-[#1a1f3a] transition-colors disabled:opacity-50">
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {loading ? (
          <div className="text-center text-slate-400 text-sm">Cargando...</div>
        ) : !config ? (
          <div className="text-center">
            <Settings size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No se pudo cargar la configuración</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Idioma</label>
              <select value={config.idioma || 'es'} onChange={e => setConfig({...config, idioma: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E20613]/20">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tema</label>
              <select value={config.tema || 'claro'} onChange={e => setConfig({...config, tema: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E20613]/20">
                <option value="claro">Claro</option>
                <option value="oscuro">Oscuro</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
