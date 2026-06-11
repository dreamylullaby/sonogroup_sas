-- ============================================================
-- CORRECCIÓN v3.5.1
-- Rollback de cambios incorrectos en solicitudes_publicacion
-- + Cambios correctos en contactos
-- + Cambios correctos en solicitudes_publicacion
-- ============================================================
-- Ejecutar en Supabase SQL Editor
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PARTE 1: ROLLBACK — Deshacer lo que NO debía estar en solicitudes
-- ════════════════════════════════════════════════════════════

-- 1.1 Eliminar columnas que NO corresponden a solicitudes_publicacion
ALTER TABLE solicitudes_publicacion
  DROP COLUMN IF EXISTS fecha_vista,
  DROP COLUMN IF EXISTS fecha_resolucion,
  DROP COLUMN IF EXISTS id_solicitud_origen;

-- 1.2 Eliminar índice incorrecto (filtraba por estados que no corresponden)
DROP INDEX IF EXISTS idx_solicitudes_pub_estado_fecha;

-- 1.3 Eliminar valores del enum estado_aprobacion que NO corresponden
-- NOTA: PostgreSQL NO permite eliminar valores de un enum existente.
-- La solución es recrear el enum. Pero como estado_aprobacion se usa
-- en columnas de inmuebles Y solicitudes_publicacion, debemos:
--   a) Crear un nuevo tipo sin los valores incorrectos
--   b) Migrar las columnas
--   c) Eliminar el viejo tipo
--   d) Renombrar el nuevo

-- Verificar si hay filas con los valores incorrectos y limpiarlas primero
UPDATE solicitudes_publicacion 
  SET estado_aprobacion = 'pendiente' 
  WHERE estado_aprobacion IN ('recibido', 'resuelto', 'no_resuelto');

UPDATE inmuebles 
  SET estado_aprobacion = 'pendiente' 
  WHERE estado_aprobacion IN ('recibido', 'resuelto', 'no_resuelto');

-- Recrear el enum limpio
CREATE TYPE estado_aprobacion_new AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Migrar columna en solicitudes_publicacion
ALTER TABLE solicitudes_publicacion 
  ALTER COLUMN estado_aprobacion TYPE estado_aprobacion_new 
  USING estado_aprobacion::text::estado_aprobacion_new;

-- Migrar columna en inmuebles
ALTER TABLE inmuebles 
  ALTER COLUMN estado_aprobacion TYPE estado_aprobacion_new 
  USING estado_aprobacion::text::estado_aprobacion_new;

-- Eliminar el tipo viejo y renombrar el nuevo
DROP TYPE estado_aprobacion;
ALTER TYPE estado_aprobacion_new RENAME TO estado_aprobacion;

-- 1.4 Reconstruir los defaults (se pierden al cambiar tipo)
ALTER TABLE solicitudes_publicacion 
  ALTER COLUMN estado_aprobacion SET DEFAULT 'pendiente';
ALTER TABLE inmuebles 
  ALTER COLUMN estado_aprobacion SET DEFAULT 'pendiente';


-- ════════════════════════════════════════════════════════════
-- PARTE 2: CAMBIOS CORRECTOS EN CONTACTOS
-- ════════════════════════════════════════════════════════════

-- 2.1 Recrear enum estado_contacto con los 4 estados correctos
-- Original: ('pendiente', 'respondido', 'cerrado')
-- Nuevo: ('pendiente', 'recibido', 'resuelto', 'no_resuelto')
-- Nota: mantenemos 'respondido' y 'cerrado' por compatibilidad con datos existentes

ALTER TYPE estado_contacto ADD VALUE IF NOT EXISTS 'recibido';
ALTER TYPE estado_contacto ADD VALUE IF NOT EXISTS 'resuelto';
ALTER TYPE estado_contacto ADD VALUE IF NOT EXISTS 'no_resuelto';

-- 2.2 Agregar columnas nuevas a contactos
ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS fecha_vista TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP,
  ADD COLUMN IF NOT EXISTS respuesta_admin TEXT,
  ADD COLUMN IF NOT EXISTS fecha_no_resuelto TIMESTAMP;

-- 2.3 Índice en estado para filtros rápidos
CREATE INDEX IF NOT EXISTS idx_contactos_estado
  ON contactos (estado);

-- 2.4 Comentarios
COMMENT ON COLUMN contactos.fecha_vista IS 'Timestamp cuando el admin abrió/vio el contacto por primera vez.';
COMMENT ON COLUMN contactos.fecha_resolucion IS 'Timestamp cuando se marcó como resuelto.';
COMMENT ON COLUMN contactos.respuesta_admin IS 'Texto de la respuesta del admin al resolver el contacto.';
COMMENT ON COLUMN contactos.fecha_no_resuelto IS 'Timestamp cuando se marcó automáticamente como no_resuelto (7 días sin respuesta).';


-- ════════════════════════════════════════════════════════════
-- PARTE 3: CAMBIOS CORRECTOS EN SOLICITUDES_PUBLICACION
-- ════════════════════════════════════════════════════════════

-- 3.1 Agregar tipo_solicitud (si ya existe por la migración anterior, se mantiene)
-- Valores: 'publicacion' (default), 'edicion'
ALTER TABLE solicitudes_publicacion
  ADD COLUMN IF NOT EXISTS tipo_solicitud VARCHAR(20) DEFAULT 'publicacion';

-- 3.2 motivo_rechazo YA EXISTE en la tabla original (v3.4) — no hacer nada

-- 3.3 Agregar snapshot_datos_rechazo (para reenvío con cambios)
ALTER TABLE solicitudes_publicacion
  ADD COLUMN IF NOT EXISTS snapshot_datos_rechazo JSONB;

-- 3.4 Agregar fecha_rechazo
ALTER TABLE solicitudes_publicacion
  ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP;

-- 3.5 Índice para solicitudes de edición por inmueble
-- (se mantiene del paso anterior, es correcto)
CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_tipo_inmueble
  ON solicitudes_publicacion (id_inmueble, tipo_solicitud, estado_aprobacion)
  WHERE tipo_solicitud = 'edicion';

-- 3.6 Comentarios
COMMENT ON COLUMN solicitudes_publicacion.tipo_solicitud IS 'publicacion | edicion. Discrimina el flujo de la solicitud.';
COMMENT ON COLUMN solicitudes_publicacion.snapshot_datos_rechazo IS 'JSONB con los datos del inmueble al momento del rechazo. Para verificar cambios antes de reenvío.';
COMMENT ON COLUMN solicitudes_publicacion.fecha_rechazo IS 'Timestamp cuando el admin rechazó la solicitud.';


-- ════════════════════════════════════════════════════════════
-- RESUMEN
-- ════════════════════════════════════════════════════════════
-- ROLLBACK:
--   - Eliminadas columnas incorrectas de solicitudes_publicacion: fecha_vista, fecha_resolucion, id_solicitud_origen
--   - Eliminado índice idx_solicitudes_pub_estado_fecha
--   - Removidos valores 'recibido','resuelto','no_resuelto' del enum estado_aprobacion
--
-- CONTACTOS (correcto):
--   - Agregados 'recibido','resuelto','no_resuelto' al enum estado_contacto
--   - Nuevas columnas: fecha_vista, fecha_resolucion, respuesta_admin, fecha_no_resuelto
--   - Índice idx_contactos_estado
--
-- SOLICITUDES (correcto):
--   - tipo_solicitud VARCHAR(20) DEFAULT 'publicacion'
--   - snapshot_datos_rechazo JSONB
--   - fecha_rechazo TIMESTAMP
--   - Índice idx_solicitudes_pub_tipo_inmueble (edición)
-- ============================================================
