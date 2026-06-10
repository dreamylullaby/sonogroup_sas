-- ============================================================
-- ROLLBACK v3.5.1 — Corrección de migraciones incorrectas
-- Ejecutado: Junio 2026
-- ============================================================
--
-- CONTEXTO:
-- La migración "Estados ampliados para solicitudes" agregó
-- incorrectamente valores y columnas a solicitudes_publicacion
-- que debían estar en la tabla contactos.
--
-- ERRORES CORREGIDOS:
-- 1. Se agregaron 'recibido','resuelto','no_resuelto' al enum
--    estado_aprobacion — INCORRECTO, estos estados corresponden
--    al ciclo de vida de contactos, no de aprobaciones.
-- 2. Se agregaron columnas fecha_vista, fecha_resolucion,
--    id_solicitud_origen a solicitudes_publicacion — INCORRECTO,
--    fecha_vista y fecha_resolucion pertenecen a contactos.
--    id_solicitud_origen fue descartado del diseño.
--
-- PROCEDIMIENTO EJECUTADO:
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- PASO 1: Limpiar datos con valores inválidos del enum
-- ════════════════════════════════════════════════════════════

UPDATE solicitudes_publicacion 
SET estado_aprobacion = 'pendiente' 
WHERE estado_aprobacion IN ('recibido', 'resuelto', 'no_resuelto');

UPDATE inmuebles 
SET estado_aprobacion = 'pendiente' 
WHERE estado_aprobacion IN ('recibido', 'resuelto', 'no_resuelto');

-- ════════════════════════════════════════════════════════════
-- PASO 2: Eliminar columnas incorrectas de solicitudes_publicacion
-- ════════════════════════════════════════════════════════════

ALTER TABLE solicitudes_publicacion
DROP COLUMN IF EXISTS fecha_vista,
DROP COLUMN IF EXISTS fecha_resolucion,
DROP COLUMN IF EXISTS id_solicitud_origen;

DROP INDEX IF EXISTS idx_solicitudes_pub_estado_fecha;

-- ════════════════════════════════════════════════════════════
-- PASO 3: Recrear enum estado_aprobacion sin valores incorrectos
-- PostgreSQL no permite DROP VALUE de un enum, hay que recrearlo.
-- ════════════════════════════════════════════════════════════

-- 3.1 Crear tipo nuevo limpio
CREATE TYPE estado_aprobacion_new AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- 3.2 Eliminar defaults (requerido antes de cambiar tipo)
ALTER TABLE solicitudes_publicacion ALTER COLUMN estado_aprobacion DROP DEFAULT;
ALTER TABLE inmuebles ALTER COLUMN estado_aprobacion DROP DEFAULT;

-- 3.3 Eliminar vistas dependientes
DROP VIEW IF EXISTS v_inmuebles_listado CASCADE;
DROP VIEW IF EXISTS v_inmueble_detalle CASCADE;
DROP VIEW IF EXISTS v_stats_admin CASCADE;

-- 3.4 Migrar columnas al nuevo tipo
ALTER TABLE solicitudes_publicacion 
  ALTER COLUMN estado_aprobacion TYPE estado_aprobacion_new 
  USING estado_aprobacion::text::estado_aprobacion_new;

ALTER TABLE inmuebles 
  ALTER COLUMN estado_aprobacion TYPE estado_aprobacion_new 
  USING estado_aprobacion::text::estado_aprobacion_new;

-- 3.5 Eliminar tipo viejo y renombrar
DROP TYPE estado_aprobacion;
ALTER TYPE estado_aprobacion_new RENAME TO estado_aprobacion;

-- 3.6 Restaurar defaults
ALTER TABLE solicitudes_publicacion ALTER COLUMN estado_aprobacion SET DEFAULT 'pendiente';
ALTER TABLE inmuebles ALTER COLUMN estado_aprobacion SET DEFAULT 'pendiente';

-- 3.7 Recrear las 3 vistas (ver Base_Optimizada_V3.8.sql SECCIÓN 7)

-- ════════════════════════════════════════════════════════════
-- PASO 4: Aplicar cambios CORRECTOS
-- ════════════════════════════════════════════════════════════

-- 4.1 Estados de contacto ampliados (AQUÍ sí corresponden)
ALTER TYPE estado_contacto ADD VALUE IF NOT EXISTS 'recibido';
ALTER TYPE estado_contacto ADD VALUE IF NOT EXISTS 'resuelto';
ALTER TYPE estado_contacto ADD VALUE IF NOT EXISTS 'no_resuelto';

-- 4.2 Columnas nuevas en contactos
ALTER TABLE contactos
ADD COLUMN IF NOT EXISTS fecha_vista TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP,
ADD COLUMN IF NOT EXISTS respuesta_admin TEXT,
ADD COLUMN IF NOT EXISTS fecha_no_resuelto TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_contactos_estado ON contactos (estado);

-- 4.3 Columnas para solicitudes de edición y reenvío
ALTER TABLE solicitudes_publicacion
ADD COLUMN IF NOT EXISTS tipo_solicitud VARCHAR(20) DEFAULT 'publicacion',
ADD COLUMN IF NOT EXISTS snapshot_datos_rechazo JSONB,
ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_tipo_inmueble
    ON solicitudes_publicacion (id_inmueble, tipo_solicitud, estado_aprobacion)
    WHERE tipo_solicitud = 'edicion';

-- ============================================================
-- RESULTADO FINAL:
-- - enum estado_aprobacion: pendiente, aprobado, rechazado (limpio)
-- - enum estado_contacto: pendiente, respondido, cerrado, recibido, resuelto, no_resuelto
-- - contactos: +fecha_vista, +fecha_resolucion, +respuesta_admin, +fecha_no_resuelto
-- - solicitudes_publicacion: +tipo_solicitud, +snapshot_datos_rechazo, +fecha_rechazo
-- - Vistas recreadas: v_inmuebles_listado, v_inmueble_detalle, v_stats_admin
-- ============================================================
