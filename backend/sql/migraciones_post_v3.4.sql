-- ============================================================
-- MIGRACIONES POST v3.4 — Sonogroup S.A.S.
-- Ejecutadas sobre Base_Optimizada_V3.4.sql
-- Fecha: Junio 2026
-- ============================================================
-- ============================================================
-- MIGRACIÓN 1: Tabla borradores_inmuebles
-- Almacena formularios incompletos.
-- Límite por rol (enforced en backend):
--   cliente/comisionista: 1 borrador
--   admin: hasta 5 borradores
-- ============================================================

CREATE TABLE borradores_inmuebles (
    id_borrador             SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    titulo                  VARCHAR(100),
    datos                   JSONB           NOT NULL,
    paso_actual             SMALLINT        DEFAULT 1,
    fecha_creacion          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_borrador_paso CHECK (paso_actual BETWEEN 1 AND 4)
);

COMMENT ON TABLE  borradores_inmuebles IS 'Borradores de publicación. Límite por rol enforced en app: cliente=1, admin=5.';
COMMENT ON COLUMN borradores_inmuebles.datos IS 'Snapshot JSONB: {formData, ubicacion, servicios, caract}.';
COMMENT ON COLUMN borradores_inmuebles.paso_actual IS 'Último paso alcanzado (1-4).';
COMMENT ON COLUMN borradores_inmuebles.titulo IS 'Identificador visual para admins con múltiples borradores. Auto-generado si NULL.';

-- Índice para consultas por usuario
CREATE INDEX idx_borradores_usuario
    ON borradores_inmuebles (id_usuario, fecha_actualizacion DESC);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE TRIGGER trg_actualizar_borrador
    BEFORE UPDATE ON borradores_inmuebles
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();

-- ============================================================
-- MIGRACIÓN 2: Nuevo valor en tipo_sala_comedor
-- Opción "Separados" = sala y comedor como espacios independientes
-- ============================================================

ALTER TYPE tipo_sala_comedor ADD VALUE 'separados';

-- ============================================================
-- MIGRACIÓN 3: Trigger de notificación para favoritos
-- Notifica a usuarios cuando una propiedad en sus favoritos
-- cambia de precio o se desactiva.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notificar_cambio_favorito()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Si cambió el precio
    IF OLD.valor IS DISTINCT FROM NEW.valor THEN
        INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje, id_inmueble)
        SELECT f.id_usuario, 'favorito',
               'Cambio de precio en propiedad guardada',
               'Una propiedad en tus favoritos cambió de precio: $' ||
               trim(to_char(OLD.valor, '999,999,999,999')) || ' → $' ||
               trim(to_char(NEW.valor, '999,999,999,999')),
               NEW.id_inmueble
        FROM favoritos f
        WHERE f.id_inmueble = NEW.id_inmueble;
    END IF;

    -- Si se desactivó (vendida/arrendada)
    IF OLD.activo = true AND NEW.activo = false THEN
        INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje, id_inmueble)
        SELECT f.id_usuario, 'favorito',
               'Propiedad ya no disponible',
               'Una propiedad en tus favoritos ha sido retirada del portafolio.',
               NEW.id_inmueble
        FROM favoritos f
        WHERE f.id_inmueble = NEW.id_inmueble;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_cambio_favorito
    AFTER UPDATE OF valor, activo ON inmuebles
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_cambio_favorito();

-- ============================================================
-- MIGRACIÓN 4: Estados ampliados para solicitudes
-- Funcionalidades: estados de seguimiento, edición, reenvío
-- NOTA: Ejecutar en DOS pasos separados por la restricción de
--       PostgreSQL con valores de enum nuevos.
-- ============================================================

-- ─── PASO 1 (ejecutar primero, luego commit) ───
-- ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'recibido';
-- ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'resuelto';
-- ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'no_resuelto';
-- ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'solicitud';

-- ─── PASO 2 (ejecutar después del paso 1) ───
-- ALTER TABLE solicitudes_publicacion
-- ADD COLUMN IF NOT EXISTS fecha_vista TIMESTAMP,
-- ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP,
-- ADD COLUMN IF NOT EXISTS id_solicitud_origen INTEGER REFERENCES solicitudes_publicacion(id_solicitud) ON DELETE SET NULL,
-- ADD COLUMN IF NOT EXISTS tipo_solicitud VARCHAR(20) DEFAULT 'publicacion',
-- ADD COLUMN IF NOT EXISTS snapshot_datos_rechazo JSONB,
-- ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP;
--
-- CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_tipo_inmueble
--     ON solicitudes_publicacion (id_inmueble, tipo_solicitud, estado_aprobacion)
--     WHERE tipo_solicitud = 'edicion';
--
-- CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_estado_fecha
--     ON solicitudes_publicacion (estado_aprobacion, fecha_solicitud)
--     WHERE estado_aprobacion IN ('pendiente', 'recibido');

-- ============================================================
-- RESUMEN POST v3.4
-- ============================================================
-- Tabla nueva      : borradores_inmuebles
-- Enum modificado  : tipo_sala_comedor (+separados)
-- Enum modificado  : estado_aprobacion (+recibido, +resuelto, +no_resuelto)
-- Enum modificado  : tipo_notificacion (+solicitud)
-- Función nueva    : fn_notificar_cambio_favorito()
-- Trigger nuevo    : trg_notificar_cambio_favorito (ON inmuebles)
-- Trigger nuevo    : trg_actualizar_borrador (ON borradores_inmuebles)
-- Columnas nuevas  : solicitudes_publicacion (fecha_vista, fecha_resolucion,
--                    id_solicitud_origen, tipo_solicitud, snapshot_datos_rechazo,
--                    fecha_rechazo)
-- Índices nuevos   : idx_borradores_usuario, idx_solicitudes_pub_tipo_inmueble,
--                    idx_solicitudes_pub_estado_fecha
-- ============================================================