-- ============================================================
-- MIGRACIÓN v3.5: Funcionalidades 1, 2, 3
-- Estados ampliados, solicitud de edición, reenvío con cambios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Ampliar enum estado_aprobacion
ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'recibido';
ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'resuelto';
ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'no_resuelto';

-- 2. Ampliar tipo_notificacion
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'solicitud';

-- 3. Nuevas columnas en solicitudes_publicacion
ALTER TABLE solicitudes_publicacion
  ADD COLUMN IF NOT EXISTS fecha_vista TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP,
  ADD COLUMN IF NOT EXISTS id_solicitud_origen INTEGER REFERENCES solicitudes_publicacion(id_solicitud) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_solicitud VARCHAR(20) DEFAULT 'publicacion',
  ADD COLUMN IF NOT EXISTS snapshot_datos_rechazo JSONB,
  ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP;

-- 4. Índice para buscar solicitudes de edición por inmueble y usuario
CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_tipo_inmueble
  ON solicitudes_publicacion (id_inmueble, tipo_solicitud, estado_aprobacion)
  WHERE tipo_solicitud = 'edicion';

-- 5. Índice para el cron de no_resuelto (solicitudes viejas sin resolver)
CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_estado_fecha
  ON solicitudes_publicacion (estado_aprobacion, fecha_solicitud)
  WHERE estado_aprobacion IN ('pendiente', 'recibido');
