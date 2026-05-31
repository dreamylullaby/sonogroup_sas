import { Shield } from 'lucide-react'

export default function AdminSeguridad() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Seguridad</h1>
        <p className="text-sm text-slate-500 mt-1">Configuración de seguridad y accesos</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Verificación en dos pasos</p>
            <p className="text-xs text-slate-400">Añade una capa extra de seguridad</p>
          </div>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">Desactivado</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Sesiones activas</p>
            <p className="text-xs text-slate-400">Gestiona los dispositivos conectados</p>
          </div>
          <button className="text-xs text-[#E20613] font-medium hover:underline">Ver sesiones</button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Cambiar contraseña</p>
            <p className="text-xs text-slate-400">Actualiza tu contraseña de acceso</p>
          </div>
          <button className="text-xs text-[#0A0F2C] font-medium hover:underline">Cambiar</button>
        </div>
      </div>
    </div>
  )
}
