-- ============================================================
-- SONOGROUP S.A.S — Base de datos inmobiliaria
-- Versión : 3.4 — Producción
-- Motor    : PostgreSQL 15+ (Supabase compatible)
-- ============================================================
-- ADVERTENCIA: Este script elimina TODA la base de datos anterior.
-- Ejecutar completo en el SQL Editor de Supabase.
-- ============================================================
--
-- CAMBIOS v3.4 vs v3.3 — SOLO CORRECCIONES DE PRODUCCIÓN
-- ─────────────────────────────────────────────────────────────
-- [CRÍTICO] trg_actualizar_seguridad_usuario roto
--   seguridad_usuario tiene fecha_configuracion, no fecha_actualizacion.
--   fn_actualizar_fecha_actualizacion() referenciaba una columna
--   inexistente → ERROR en cualquier UPDATE de seguridad_usuario.
--   FIX: nueva función fn_actualizar_fecha_configuracion() específica
--   para esa tabla.
--
-- [CRÍTICO] chk_soft_delete_consistente incompleto
--   CHECK (activo = true OR fecha_eliminacion IS NOT NULL) permitía
--   activo=true con fecha_eliminacion seteada simultáneamente.
--   FIX: constraint bidireccional que garantiza exclusividad.
--
-- [CRÍTICO] v_inmueble_detalle expone email del propietario
--   La vista exponía usr.email sin respetar ocultar_informacion.
--   v_inmuebles_listado (buscador público) ya lo omitía correctamente.
--   FIX: email_propietario es NULL cuando ocultar_informacion=true,
--   usando LEFT JOIN con configuracion_usuario.
--
-- [ERROR LÓGICO] FK admin_revisor sin ON DELETE en dos tablas
--   solicitudes_publicacion y solicitudes_eliminacion_cuenta tenían
--   admin_revisor REFERENCES usuarios sin ON DELETE → comportamiento
--   RESTRICT por defecto → imposible eliminar un admin que haya
--   revisado solicitudes.
--   FIX: ON DELETE SET NULL en ambas tablas.
--
-- [INCONSISTENCIA] casas: zona_lavanderia_tipo sin constraint
--   Permitía zona_lavanderia=false con zona_lavanderia_tipo seteado.
--   FIX: CHECK (zona_lavanderia = true OR zona_lavanderia_tipo IS NULL)
--
-- [INCONSISTENCIA] apartamentos: vigilancia_valor sin constraint
--   Permitía vigilancia=false con vigilancia_valor > 0.
--   FIX: CHECK (vigilancia = true OR vigilancia_valor IS NULL)
--
-- [RUIDO] idx_keep_alive_last_ping eliminado
--   keep_alive es una tabla singleton (1 fila). Un índice sobre
--   una sola fila no aporta nada al planner.
--
-- Sin cambios en: tipos enumerados, tablas hijas (excepto constraints
-- corregidos), índices principales, funciones de sesión, triggers
-- no afectados, datos iniciales.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: LIMPIEZA COMPLETA
-- ============================================================

DROP TRIGGER IF EXISTS trg_crear_config_usuario          ON usuarios;
DROP TRIGGER IF EXISTS trg_actualizar_config_usuario     ON configuracion_usuario;
DROP TRIGGER IF EXISTS trg_actualizar_seguridad_usuario  ON seguridad_usuario;
DROP TRIGGER IF EXISTS trg_actualizar_configuracion      ON configuracion;
DROP TRIGGER IF EXISTS trg_historial_precio              ON inmuebles;
DROP TRIGGER IF EXISTS trg_fecha_lectura_notificacion    ON notificaciones;
DROP TRIGGER IF EXISTS trg_timeout_sesion                ON sesiones_usuario;

DROP FUNCTION IF EXISTS fn_actualizar_fecha_actualizacion()     CASCADE;
DROP FUNCTION IF EXISTS fn_actualizar_fecha_configuracion()     CASCADE;
DROP FUNCTION IF EXISTS fn_crear_config_usuario()               CASCADE;
DROP FUNCTION IF EXISTS fn_registrar_cambio_precio()            CASCADE;
DROP FUNCTION IF EXISTS fn_marcar_fecha_lectura()               CASCADE;
DROP FUNCTION IF EXISTS fn_cerrar_sesion_inactiva()             CASCADE;
DROP FUNCTION IF EXISTS fn_invalidar_sesion(INTEGER)            CASCADE;
DROP FUNCTION IF EXISTS fn_invalidar_sesiones_usuario(INTEGER)  CASCADE;
DROP FUNCTION IF EXISTS fn_limpiar_tokens_expirados()           CASCADE;
DROP FUNCTION IF EXISTS limpiar_tokens_expirados()              CASCADE;

DROP VIEW IF EXISTS v_inmuebles_listado  CASCADE;
DROP VIEW IF EXISTS v_inmueble_detalle   CASCADE;
DROP VIEW IF EXISTS v_stats_admin        CASCADE;

DROP TABLE IF EXISTS solicitudes_eliminacion_cuenta  CASCADE;
DROP TABLE IF EXISTS keep_alive                      CASCADE;
DROP TABLE IF EXISTS notificaciones                  CASCADE;
DROP TABLE IF EXISTS historial_precios               CASCADE;
DROP TABLE IF EXISTS solicitudes_publicacion         CASCADE;
DROP TABLE IF EXISTS favoritos                       CASCADE;
DROP TABLE IF EXISTS contactos                       CASCADE;
DROP TABLE IF EXISTS inmuebles_caracteristicas       CASCADE;
DROP TABLE IF EXISTS caracteristicas_generales       CASCADE;
DROP TABLE IF EXISTS fotografias                     CASCADE;
DROP TABLE IF EXISTS ubicaciones                     CASCADE;
DROP TABLE IF EXISTS fincas                          CASCADE;
DROP TABLE IF EXISTS bodegas                         CASCADE;
DROP TABLE IF EXISTS locales                         CASCADE;
DROP TABLE IF EXISTS lotes                           CASCADE;
DROP TABLE IF EXISTS apartaestudios                  CASCADE;
DROP TABLE IF EXISTS apartamentos                    CASCADE;
DROP TABLE IF EXISTS casas                           CASCADE;
DROP TABLE IF EXISTS password_reset_tokens           CASCADE;
DROP TABLE IF EXISTS sesiones_usuario                CASCADE;
DROP TABLE IF EXISTS seguridad_usuario               CASCADE;
DROP TABLE IF EXISTS configuracion_usuario           CASCADE;
DROP TABLE IF EXISTS configuracion                   CASCADE;
DROP TABLE IF EXISTS inmuebles                       CASCADE;
DROP TABLE IF EXISTS usuarios                        CASCADE;

DROP TYPE IF EXISTS estado_aprobacion        CASCADE;
DROP TYPE IF EXISTS estado_contacto          CASCADE;
DROP TYPE IF EXISTS estado_inmueble          CASCADE;
DROP TYPE IF EXISTS rol_usuario              CASCADE;
DROP TYPE IF EXISTS tipo_inmueble            CASCADE;
DROP TYPE IF EXISTS tipo_operacion           CASCADE;
DROP TYPE IF EXISTS zona_tipo                CASCADE;
DROP TYPE IF EXISTS tipo_notificacion        CASCADE;
DROP TYPE IF EXISTS tipo_media               CASCADE;
DROP TYPE IF EXISTS tipo_cocina              CASCADE;
DROP TYPE IF EXISTS tipo_sala_comedor        CASCADE;
DROP TYPE IF EXISTS tipo_parqueadero_casa    CASCADE;
DROP TYPE IF EXISTS tipo_parqueadero_apto    CASCADE;
DROP TYPE IF EXISTS tipo_topografia          CASCADE;
DROP TYPE IF EXISTS tipo_via_acceso          CASCADE;
DROP TYPE IF EXISTS tipo_zona_local          CASCADE;
DROP TYPE IF EXISTS tipo_zona_lavanderia     CASCADE;
DROP TYPE IF EXISTS unidad_area_finca        CASCADE;
DROP TYPE IF EXISTS estado_solicitud_cuenta  CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================
-- SECCIÓN 2: TIPOS ENUMERADOS (sin cambios vs v3.3)
-- ============================================================

CREATE TYPE estado_aprobacion AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE estado_contacto   AS ENUM ('pendiente', 'respondido', 'cerrado');
CREATE TYPE estado_inmueble   AS ENUM ('nuevo', 'usado', 'remodelado');
CREATE TYPE rol_usuario       AS ENUM ('cliente', 'comisionista', 'admin');
CREATE TYPE tipo_inmueble     AS ENUM ('lote', 'local', 'bodega', 'finca', 'casa', 'apartamento', 'apartaestudio');
CREATE TYPE tipo_operacion    AS ENUM ('venta', 'arriendo');
CREATE TYPE zona_tipo         AS ENUM ('rural', 'urbano');
CREATE TYPE tipo_notificacion AS ENUM ('aprobacion', 'rechazo', 'contacto', 'sistema', 'favorito');
CREATE TYPE tipo_media        AS ENUM ('foto', 'video', 'tour_360');
CREATE TYPE tipo_cocina       AS ENUM ('integral', 'semi_integral', 'sencilla');
CREATE TYPE tipo_sala_comedor AS ENUM ('sala', 'comedor', 'sala_comedor');

CREATE TYPE tipo_parqueadero_casa AS ENUM ('interno', 'externo', 'cubierto', 'descubierto', 'ninguno');
CREATE TYPE tipo_parqueadero_apto AS ENUM ('privado', 'comun', 'ninguno');

CREATE TYPE tipo_topografia AS ENUM ('plana', 'inclinada', 'irregular', 'semiondulada', 'ondulada');
CREATE TYPE tipo_via_acceso AS ENUM ('pavimentada', 'afirmada', 'trocha', 'sin_via');
CREATE TYPE tipo_zona_local AS ENUM ('comercial', 'residencial', 'mixta');

CREATE TYPE tipo_zona_lavanderia AS ENUM ('interna', 'externa');
CREATE TYPE unidad_area_finca    AS ENUM ('m2', 'hectareas', 'fanegadas', 'cuadras');

CREATE TYPE estado_solicitud_cuenta AS ENUM ('pendiente', 'en_revision', 'aprobada', 'rechazada');


-- ============================================================
-- SECCIÓN 3: TABLAS
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 3.1 USUARIOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
    id_usuario              SERIAL          PRIMARY KEY,
    nombre_completo         VARCHAR(300)    NOT NULL,
    email                   VARCHAR(255)    NOT NULL,
    telefono                VARCHAR(20),
    tipo_identificacion     VARCHAR(20)     NOT NULL,
    numero_identificacion   VARCHAR(50)     NOT NULL,
    password_hash           TEXT            NOT NULL,
    rol                     rol_usuario     NOT NULL    DEFAULT 'cliente',
    es_dueno                BOOLEAN                     DEFAULT true,
    -- Confirmación de mayoría de edad. Aplica a clientes.
    -- Para admins creados por script este campo no tiene relevancia semántica;
    -- se deja false por defecto y se documenta aquí para evitar confusión.
    mayor_de_edad           BOOLEAN         NOT NULL    DEFAULT false,
    activo                  BOOLEAN                     DEFAULT true,
    email_verificado        BOOLEAN                     DEFAULT false,
    token_verificacion      TEXT,
    fecha_verificacion      TIMESTAMP,
    fecha_registro          TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
    ultimo_login            TIMESTAMP,

    CONSTRAINT uq_usuarios_email
        UNIQUE (email),
    CONSTRAINT chk_email_formato
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_password_longitud
        CHECK (length(password_hash) >= 60),
    CONSTRAINT chk_identificacion_no_vacia
        CHECK (length(trim(numero_identificacion)) > 0),
    CONSTRAINT chk_nombre_no_vacio
        CHECK (length(trim(nombre_completo)) > 0)
);

COMMENT ON TABLE  usuarios IS 'Tabla central de identidad. Rol determina permisos. El registro público solo crea rol=cliente. Admins por script o por otro admin.';
COMMENT ON COLUMN usuarios.nombre_completo     IS 'Nombre y apellido(s). Si el formulario los captura por separado, dividir en nombre + apellido y ajustar constraints.';
COMMENT ON COLUMN usuarios.password_hash       IS 'Hash bcrypt mínimo 60 chars. Jamás texto plano.';
COMMENT ON COLUMN usuarios.tipo_identificacion IS 'CC, NIT, CE (Cédula Extranjería), PA (Pasaporte).';
COMMENT ON COLUMN usuarios.es_dueno            IS 'true = propietario directo. false = comisionista que actúa en nombre de otro.';
COMMENT ON COLUMN usuarios.mayor_de_edad       IS 'Confirmación 18+. Requerida en registro de cliente. Para admins creados por script no aplica semánticamente.';
COMMENT ON COLUMN usuarios.token_verificacion  IS 'UUID enviado al email. Se anula (NULL) al verificar. Nunca exponer en API.';
COMMENT ON COLUMN usuarios.activo              IS 'false = soft-delete o suspensión. Nunca eliminar filas de usuarios.';


-- ────────────────────────────────────────────────────────────
-- 3.2 CONFIGURACIÓN DE USUARIO
-- Creada automáticamente por trigger al insertar en usuarios.
-- ────────────────────────────────────────────────────────────
CREATE TABLE configuracion_usuario (
    id_usuario              INTEGER         PRIMARY KEY
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    idioma                  VARCHAR(10)     DEFAULT 'es',
    tema                    VARCHAR(10)     DEFAULT 'claro',
    notificaciones_email    BOOLEAN         DEFAULT true,
    notificaciones_app      BOOLEAN         DEFAULT true,
    perfil_publico          BOOLEAN         DEFAULT true,
    permitir_contacto       BOOLEAN         DEFAULT true,
    ocultar_informacion     BOOLEAN         DEFAULT false,
    fecha_actualizacion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tema_valido CHECK (tema IN ('claro', 'oscuro'))
);

COMMENT ON TABLE  configuracion_usuario IS 'Preferencias por usuario. Creada por trigger trg_crear_config_usuario.';
COMMENT ON COLUMN configuracion_usuario.ocultar_informacion IS 'true = ocultar teléfono y email del propietario en vistas públicas. Respetado por v_inmueble_detalle.';
COMMENT ON COLUMN configuracion_usuario.fecha_actualizacion IS 'Actualizada por trigger trg_actualizar_config_usuario.';


-- ────────────────────────────────────────────────────────────
-- 3.3 SEGURIDAD DE USUARIO (2FA)
-- NOTA v3.4: la columna se llama fecha_configuracion,
-- no fecha_actualizacion. El trigger usa una función específica.
-- ────────────────────────────────────────────────────────────
CREATE TABLE seguridad_usuario (
    id_usuario              INTEGER         PRIMARY KEY
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    verificacion_dos_pasos  BOOLEAN         DEFAULT false,
    secreto_2fa             TEXT,
    codigos_respaldo        TEXT[],
    -- [v3.4] Nombre correcto: fecha_configuracion (no fecha_actualizacion)
    -- El trigger trg_actualizar_seguridad_usuario usa fn_actualizar_fecha_configuracion()
    fecha_configuracion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  seguridad_usuario IS 'Configuración 2FA. Creada por trigger trg_crear_config_usuario junto con configuracion_usuario.';
COMMENT ON COLUMN seguridad_usuario.secreto_2fa        IS 'Secreto TOTP base32. Solo almacenar si verificacion_dos_pasos = true.';
COMMENT ON COLUMN seguridad_usuario.codigos_respaldo   IS 'Array de códigos de un solo uso para recuperación de acceso.';
COMMENT ON COLUMN seguridad_usuario.fecha_configuracion IS 'Última modificación del 2FA. Actualizada por trigger trg_actualizar_seguridad_usuario.';


-- ────────────────────────────────────────────────────────────
-- 3.4 SESIONES DE USUARIO
-- ────────────────────────────────────────────────────────────
CREATE TABLE sesiones_usuario (
    id_sesion               SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    dispositivo             VARCHAR(100),
    navegador               VARCHAR(100),
    sistema_operativo       VARCHAR(100),
    direccion_ip            VARCHAR(45),
    pais                    VARCHAR(100),
    ciudad                  VARCHAR(100),
    token_sesion            TEXT,
    fecha_inicio            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    activa                  BOOLEAN         DEFAULT true
);

COMMENT ON TABLE  sesiones_usuario IS 'Sesiones activas. Timeout 30 min por trigger. Ver fn_invalidar_sesion / fn_invalidar_sesiones_usuario.';
COMMENT ON COLUMN sesiones_usuario.token_sesion     IS 'JWT o token opaco. NULL al cerrar sesión.';
COMMENT ON COLUMN sesiones_usuario.ultima_actividad IS 'Heartbeat: UPDATE sesiones_usuario SET ultima_actividad=NOW() WHERE id_sesion=$1 AND activa=true.';
COMMENT ON COLUMN sesiones_usuario.direccion_ip     IS 'VARCHAR(45): soporta IPv4 e IPv6.';


-- ────────────────────────────────────────────────────────────
-- 3.5 RECUPERACIÓN DE CONTRASEÑA
-- ────────────────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
    id_token                SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_hash              TEXT            NOT NULL,
    expira_en               TIMESTAMP       NOT NULL
                                            DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    usado                   BOOLEAN         DEFAULT false,
    ip_solicitud            VARCHAR(45),
    fecha_creacion          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_token_no_vacio CHECK (length(token_hash) > 0)
);

COMMENT ON TABLE  password_reset_tokens IS 'Tokens de reset. Un activo por usuario (enforced en app). Expira en 1 hora.';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'Hash SHA-256 del UUID enviado al email. Nunca guardar el original.';


-- ────────────────────────────────────────────────────────────
-- 3.6 CONFIGURACIÓN DE LA EMPRESA (singleton)
-- ────────────────────────────────────────────────────────────
CREATE TABLE configuracion (
    id_config               BOOLEAN         PRIMARY KEY DEFAULT TRUE,
    experiencia_anios       INTEGER,
    valores                 JSONB,
    servicios               JSONB,
    razones                 JSONB,
    datos_contacto          JSONB,
    redes_sociales          JSONB,
    fecha_actualizacion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_singleton            CHECK (id_config = TRUE),
    CONSTRAINT chk_experiencia_positiva CHECK (experiencia_anios IS NULL OR experiencia_anios >= 0)
);

COMMENT ON TABLE  configuracion IS 'Singleton. Una sola fila con toda la info editable de la empresa.';
COMMENT ON COLUMN configuracion.valores        IS '[{titulo, descripcion, icono}] — sección Quiénes Somos.';
COMMENT ON COLUMN configuracion.servicios      IS '[{numero, titulo, descripcion}] — sección Servicios.';
COMMENT ON COLUMN configuracion.razones        IS '[{titulo, descripcion}] — sección Por Qué Elegirnos.';
COMMENT ON COLUMN configuracion.datos_contacto IS '{email, telefono, direccion, whatsapp}.';
COMMENT ON COLUMN configuracion.redes_sociales IS '{facebook, instagram, twitter, whatsapp}.';


-- ────────────────────────────────────────────────────────────
-- 3.7 INMUEBLES (tabla base)
-- [v3.4] Constraint soft-delete corregido: bidireccional.
-- ────────────────────────────────────────────────────────────
CREATE TABLE inmuebles (
    id_inmueble             SERIAL              PRIMARY KEY,
    id_usuario              INTEGER             NOT NULL
                                                REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_inmueble           tipo_inmueble       NOT NULL,
    tipo_operacion          tipo_operacion      NOT NULL,
    valor                   DECIMAL(15,2)       NOT NULL,
    valor_administracion    DECIMAL(10,2),
    estrato                 SMALLINT,
    zona                    zona_tipo           NOT NULL,
    estado_inmueble         estado_inmueble     NOT NULL,
    descripcion             TEXT,
    numero_matricula        VARCHAR(100),
    codigo_catastral        VARCHAR(30),
    acepta_permuta          BOOLEAN             DEFAULT false,
    estado_aprobacion       estado_aprobacion   DEFAULT 'pendiente',
    activo                  BOOLEAN             DEFAULT true,
    fecha_eliminacion       TIMESTAMP,
    fecha_registro          TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion        TIMESTAMP,

    CONSTRAINT uq_inmuebles_matricula
        UNIQUE (numero_matricula),
    CONSTRAINT chk_inmuebles_valor
        CHECK (valor >= 200000 AND valor <= 50000000000),
    CONSTRAINT chk_inmuebles_estrato
        CHECK (estrato IS NULL OR estrato BETWEEN 1 AND 6),
    CONSTRAINT chk_inmuebles_admon
        CHECK (valor_administracion IS NULL OR valor_administracion >= 0),
    -- [v3.4 FIX] Constraint bidireccional:
    --   activo=true  → fecha_eliminacion debe ser NULL
    --   activo=false → fecha_eliminacion debe estar seteada
    -- La versión anterior solo cubría la mitad: activo=false → fecha IS NOT NULL,
    -- pero no impedía activo=true con fecha seteada simultáneamente.
    CONSTRAINT chk_soft_delete_consistente
        CHECK (
            (activo = true  AND fecha_eliminacion IS NULL) OR
            (activo = false AND fecha_eliminacion IS NOT NULL)
        )
);

COMMENT ON TABLE  inmuebles IS 'Tabla base de todos los inmuebles. Mínimo 2 fotos para aprobar (validado en app).';
COMMENT ON COLUMN inmuebles.valor                IS 'COP. Rango: $200.000 – $50.000.000.000.';
COMMENT ON COLUMN inmuebles.estrato              IS '1-6 DANE. NULL cuando no aplica (rurales, lotes sin estrato).';
COMMENT ON COLUMN inmuebles.numero_matricula     IS 'Matrícula ORIP. NULL permitido (múltiples NULL válidos en UNIQUE de PostgreSQL).';
COMMENT ON COLUMN inmuebles.codigo_catastral     IS 'Ficha predial IGAC.';
COMMENT ON COLUMN inmuebles.acepta_permuta       IS 'El propietario acepta otro inmueble como parte de pago. Frecuente en Colombia.';
COMMENT ON COLUMN inmuebles.activo               IS 'false = soft-delete. Nunca eliminar la fila.';
COMMENT ON COLUMN inmuebles.fecha_eliminacion    IS 'Obligatoria cuando activo=false, NULL cuando activo=true. Enforced por constraint.';


-- ────────────────────────────────────────────────────────────
-- 3.8 TABLAS HIJAS POR TIPO
-- ────────────────────────────────────────────────────────────

-- CASAS
-- [v3.4] Constraint de consistencia zona_lavanderia / zona_lavanderia_tipo.
CREATE TABLE casas (
    id_inmueble             INTEGER             PRIMARY KEY
                                                REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_lote               DECIMAL(12,2),
    area_construida         DECIMAL(12,2),
    frente                  DECIMAL(10,2),
    fondo                   DECIMAL(10,2),
    pisos                   SMALLINT            NOT NULL    DEFAULT 1,
    anio_construccion       SMALLINT,
    cantidad_duenos         SMALLINT,
    habitaciones            SMALLINT            NOT NULL,
    banos                   SMALLINT            NOT NULL,
    sala_comedor            tipo_sala_comedor,
    tipo_cocina             tipo_cocina,
    cocina_equipada         BOOLEAN             DEFAULT false,
    cuarto_servicio         BOOLEAN             DEFAULT false,
    bano_servicio           BOOLEAN             DEFAULT false,
    tipo_parqueadero        tipo_parqueadero_casa,
    parqueadero_cantidad    SMALLINT            DEFAULT 0,
    patio                   BOOLEAN             DEFAULT false,
    jardin                  BOOLEAN             DEFAULT false,
    antejadin               BOOLEAN             DEFAULT false,
    terraza                 BOOLEAN             DEFAULT false,
    balcon                  BOOLEAN             DEFAULT false,
    zona_lavanderia         BOOLEAN             DEFAULT false,
    zona_lavanderia_tipo    tipo_zona_lavanderia,
    chimenea                BOOLEAN             DEFAULT false,
    deposito                BOOLEAN             DEFAULT false,
    descripcion_acabados    TEXT,

    CONSTRAINT chk_casas_habitaciones   CHECK (habitaciones >= 1),
    CONSTRAINT chk_casas_banos          CHECK (banos >= 1),
    CONSTRAINT chk_casas_pisos          CHECK (pisos > 0),
    CONSTRAINT chk_casas_frente         CHECK (frente IS NULL OR frente > 0),
    CONSTRAINT chk_casas_fondo          CHECK (fondo IS NULL OR fondo > 0),
    CONSTRAINT chk_casas_area_lote      CHECK (area_lote IS NULL OR area_lote > 0),
    CONSTRAINT chk_casas_area_const     CHECK (area_construida IS NULL OR area_construida > 0),
    CONSTRAINT chk_casas_anio           CHECK (anio_construccion IS NULL OR anio_construccion BETWEEN 1900 AND 2100),
    CONSTRAINT chk_casas_duenos         CHECK (cantidad_duenos IS NULL OR cantidad_duenos > 0),
    CONSTRAINT chk_casas_parqueadero    CHECK (parqueadero_cantidad >= 0),
    -- [v3.4 FIX] Si no hay lavandería, el tipo no puede estar seteado
    CONSTRAINT chk_casas_lavanderia_consistente
        CHECK (zona_lavanderia = true OR zona_lavanderia_tipo IS NULL)
);

COMMENT ON TABLE  casas IS 'Viviendas unifamiliares o bifamiliares.';
COMMENT ON COLUMN casas.anio_construccion       IS 'Año exacto (ej: 1998). Rango 1900-2100.';
COMMENT ON COLUMN casas.sala_comedor            IS 'sala | comedor | sala_comedor. Opciones excluyentes.';
COMMENT ON COLUMN casas.tipo_parqueadero        IS 'interno | externo | cubierto | descubierto | ninguno.';
COMMENT ON COLUMN casas.zona_lavanderia_tipo    IS 'interna | externa. Solo relevante cuando zona_lavanderia=true.';
COMMENT ON COLUMN casas.antejadin               IS 'Sin tilde por convención de nombres de columna en esta BD.';


-- APARTAMENTOS
-- [v3.4] Constraint de consistencia vigilancia / vigilancia_valor.
-- [v3.4] FK admin_revisor → ya no aplica aquí; la corrección es en solicitudes.
CREATE TABLE apartamentos (
    id_inmueble             INTEGER             PRIMARY KEY
                                                REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_construida         DECIMAL(12,2),
    frente                  DECIMAL(10,2),
    fondo                   DECIMAL(10,2),
    anio_construccion       SMALLINT,
    cantidad_duenos         SMALLINT,
    piso                    SMALLINT,
    torre                   SMALLINT,
    numero_apartamento      VARCHAR(20),
    habitaciones            SMALLINT            NOT NULL,
    banos                   SMALLINT            NOT NULL,
    sala_comedor            tipo_sala_comedor,
    tipo_cocina             tipo_cocina,
    cuarto_servicio         BOOLEAN             DEFAULT false,
    bano_servicio           BOOLEAN             DEFAULT false,
    tipo_parqueadero        tipo_parqueadero_apto,
    balcon                  BOOLEAN             DEFAULT false,
    ascensor                BOOLEAN             DEFAULT false,
    vigilancia              BOOLEAN             DEFAULT false,
    vigilancia_valor        DECIMAL(10,2),
    zonas_comunes           JSONB               DEFAULT '[]',
    descripcion_acabados    TEXT,

    CONSTRAINT chk_aptos_habitaciones CHECK (habitaciones >= 1),
    CONSTRAINT chk_aptos_banos        CHECK (banos >= 1),
    CONSTRAINT chk_aptos_piso         CHECK (piso IS NULL OR piso >= 1),
    CONSTRAINT chk_aptos_torre        CHECK (torre IS NULL OR torre >= 1),
    CONSTRAINT chk_aptos_frente       CHECK (frente IS NULL OR frente > 0),
    CONSTRAINT chk_aptos_fondo        CHECK (fondo IS NULL OR fondo > 0),
    CONSTRAINT chk_aptos_anio         CHECK (anio_construccion IS NULL OR anio_construccion BETWEEN 1900 AND 2100),
    CONSTRAINT chk_aptos_vig_valor    CHECK (vigilancia_valor IS NULL OR vigilancia_valor >= 0),
    -- [v3.4 FIX] Si no hay vigilancia, el valor no puede estar seteado
    CONSTRAINT chk_aptos_vigilancia_consistente
        CHECK (vigilancia = true OR vigilancia_valor IS NULL)
);

COMMENT ON TABLE  apartamentos IS 'Unidades en propiedad horizontal.';
COMMENT ON COLUMN apartamentos.tipo_parqueadero  IS 'privado | comun | ninguno.';
COMMENT ON COLUMN apartamentos.vigilancia_valor  IS 'Costo mensual COP. NULL cuando vigilancia=false. Enforced por constraint.';
COMMENT ON COLUMN apartamentos.zonas_comunes     IS '["piscina","gimnasio","salon_social","juegos","parque_infantil","bbq"].';


-- APARTAESTUDIOS (sin cambios)
CREATE TABLE apartaestudios (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total              DECIMAL(10,2)   NOT NULL,
    piso                    SMALLINT,
    tiene_bano              BOOLEAN         NOT NULL    DEFAULT true,
    tipo_cocina             tipo_cocina,
    amoblado                BOOLEAN         DEFAULT false,
    deposito                BOOLEAN         DEFAULT false,
    descripcion_acabados    TEXT,
    parqueadero             BOOLEAN         DEFAULT false,
    balcon                  BOOLEAN         DEFAULT false,
    ascensor                BOOLEAN         DEFAULT false,
    vigilancia              BOOLEAN         DEFAULT false,

    CONSTRAINT chk_aptaest_area CHECK (area_total > 0),
    CONSTRAINT chk_aptaest_piso CHECK (piso IS NULL OR piso >= 1)
);

COMMENT ON TABLE  apartaestudios IS 'Unidades compactas de un solo ambiente.';
COMMENT ON COLUMN apartaestudios.tipo_cocina IS 'NULL = sin cocina. Si tiene, indicar tipo.';


-- LOTES (sin cambios)
CREATE TABLE lotes (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total              DECIMAL(12,2)   NOT NULL,
    frente                  DECIMAL(10,2),
    fondo                   DECIMAL(10,2),
    topografia              tipo_topografia,
    pendiente               BOOLEAN         DEFAULT false,
    tipo_via_acceso         tipo_via_acceso,
    descripcion_via         TEXT,
    servicios_disponibles   JSONB           DEFAULT '[]',
    uso_pot                 VARCHAR(100),
    tiene_documento         BOOLEAN         DEFAULT false,
    tiene_casa              BOOLEAN         DEFAULT false,

    CONSTRAINT chk_lotes_area   CHECK (area_total > 0),
    CONSTRAINT chk_lotes_frente CHECK (frente IS NULL OR frente > 0),
    CONSTRAINT chk_lotes_fondo  CHECK (fondo IS NULL OR fondo > 0)
);

COMMENT ON TABLE  lotes IS 'Terrenos. Sin habitaciones ni baños en el formulario.';
COMMENT ON COLUMN lotes.servicios_disponibles IS '["acueducto","energia","alcantarillado","internet"].';
COMMENT ON COLUMN lotes.uso_pot               IS 'vivienda | comercio | industria | mixto | agricola.';
COMMENT ON COLUMN lotes.tiene_documento       IS 'true = existe catastro o matrícula. El número va en inmuebles.numero_matricula.';


-- LOCALES (sin cambios)
CREATE TABLE locales (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total              DECIMAL(12,2)   NOT NULL,
    frente                  DECIMAL(10,2),
    fondo                   DECIMAL(10,2),
    altura                  DECIMAL(10,2),
    piso                    SMALLINT,
    zona_local              tipo_zona_local,
    uso_pot                 VARCHAR(100),
    mezzanine               BOOLEAN         DEFAULT false,
    banos                   BOOLEAN         DEFAULT false,
    servicios_publicos      JSONB           DEFAULT '[]',
    parqueaderos            SMALLINT        DEFAULT 0,
    vitrina                 BOOLEAN         DEFAULT false,
    sotano                  BOOLEAN         DEFAULT false,
    descripcion_acabados    TEXT,

    CONSTRAINT chk_locales_area        CHECK (area_total > 0),
    CONSTRAINT chk_locales_frente      CHECK (frente IS NULL OR frente > 0),
    CONSTRAINT chk_locales_fondo       CHECK (fondo IS NULL OR fondo > 0),
    CONSTRAINT chk_locales_altura      CHECK (altura IS NULL OR altura > 0),
    CONSTRAINT chk_locales_parqueadero CHECK (parqueaderos >= 0)
);

COMMENT ON TABLE  locales IS 'Espacios comerciales o de servicios. Área total requerida.';
COMMENT ON COLUMN locales.servicios_publicos IS '["agua","luz","gas"].';


-- BODEGAS (sin cambios)
CREATE TABLE bodegas (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_construida         DECIMAL(12,2)   NOT NULL,
    frente                  DECIMAL(10,2)   NOT NULL,
    fondo                   DECIMAL(10,2)   NOT NULL,
    area_lote               DECIMAL(12,2),
    altura_libre            DECIMAL(10,2),
    tipo_porton             VARCHAR(100),
    capacidad_carga         VARCHAR(100),
    acceso_camiones         BOOLEAN         DEFAULT false,
    rampa_cargue            BOOLEAN         DEFAULT false,
    oficinas                BOOLEAN         DEFAULT false,
    banos                   BOOLEAN         DEFAULT false,
    vestier                 BOOLEAN         DEFAULT false,
    servicios_publicos      JSONB           DEFAULT '[]',
    parqueaderos            SMALLINT        DEFAULT 0,

    CONSTRAINT chk_bodegas_area_const  CHECK (area_construida > 0),
    CONSTRAINT chk_bodegas_frente      CHECK (frente > 0),
    CONSTRAINT chk_bodegas_fondo       CHECK (fondo > 0),
    CONSTRAINT chk_bodegas_area_lote   CHECK (area_lote IS NULL OR area_lote > 0),
    CONSTRAINT chk_bodegas_altura      CHECK (altura_libre IS NULL OR altura_libre > 0),
    CONSTRAINT chk_bodegas_parqueadero CHECK (parqueaderos >= 0)
);

COMMENT ON TABLE  bodegas IS 'Uso industrial, logístico o de almacenamiento. Área, frente y fondo obligatorios.';
COMMENT ON COLUMN bodegas.servicios_publicos IS '["energia_trifasica","agua","gas","internet"].';


-- FINCAS (sin cambios)
CREATE TABLE fincas (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total              DECIMAL(15,2)   NOT NULL,
    unidad_area             unidad_area_finca DEFAULT 'm2',
    area_cultivable         DECIMAL(15,2),
    area_construcciones     DECIMAL(12,2),
    topografia              tipo_topografia,
    fuentes_agua            TEXT,
    casa_principal          BOOLEAN         DEFAULT false,
    casa_principal_detalle  JSONB,
    otras_construcciones    TEXT,
    numero_casas            SMALLINT        DEFAULT 0,
    tipo_via_acceso         tipo_via_acceso,
    descripcion_via         TEXT,
    cultivos_actuales       TEXT,
    animales                TEXT,
    servicios_disponibles   JSONB           DEFAULT '[]',
    piscina                 BOOLEAN         DEFAULT false,
    jacuzzi                 BOOLEAN         DEFAULT false,
    chimenea                BOOLEAN         DEFAULT false,
    cancha                  BOOLEAN         DEFAULT false,
    lago_estanque           BOOLEAN         DEFAULT false,
    cabana_mayordomo        BOOLEAN         DEFAULT false,
    minutos_cabecera        SMALLINT,

    CONSTRAINT chk_fincas_area_total     CHECK (area_total > 0),
    CONSTRAINT chk_fincas_cultivable     CHECK (area_cultivable IS NULL OR area_cultivable >= 0),
    CONSTRAINT chk_fincas_construcciones CHECK (area_construcciones IS NULL OR area_construcciones >= 0),
    CONSTRAINT chk_fincas_casas          CHECK (numero_casas >= 0),
    CONSTRAINT chk_fincas_minutos        CHECK (minutos_cabecera IS NULL OR minutos_cabecera >= 0)
);

COMMENT ON TABLE  fincas IS 'Predios rurales. piscina/cancha/lago = propias de la finca. Las del conjunto van en caracteristicas_generales.';
COMMENT ON COLUMN fincas.unidad_area            IS 'm2 | hectareas | fanegadas | cuadras.';
COMMENT ON COLUMN fincas.casa_principal_detalle IS 'JSONB con campos del formulario de casa cuando casa_principal=true. Ej: {"habitaciones":3,"banos":2}.';
COMMENT ON COLUMN fincas.servicios_disponibles  IS '["acueducto","acueducto_veredal","energia","alcantarillado","pozo_septico","gas","internet"].';
COMMENT ON COLUMN fincas.piscina                IS 'Piscina PROPIA. Distinto de piscina del conjunto en caracteristicas_generales.';
COMMENT ON COLUMN fincas.cancha                 IS 'Cancha PROPIA. Distinto de cancha del conjunto.';


-- ────────────────────────────────────────────────────────────
-- 3.9 UBICACIONES
-- servicios_sector = servicios del barrio/vereda,
-- ≠ servicios_publicos del inmueble (bodegas/locales).
-- ────────────────────────────────────────────────────────────
CREATE TABLE ubicaciones (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    direccion               VARCHAR(500)    NOT NULL,
    barrio_vereda           VARCHAR(255),
    municipio               VARCHAR(100)    NOT NULL,
    departamento            VARCHAR(100)    NOT NULL,
    latitud                 DECIMAL(10,8),
    longitud                DECIMAL(11,8),
    servicios_sector        JSONB           DEFAULT '[]',

    CONSTRAINT chk_municipio    CHECK (length(trim(municipio)) >= 2),
    CONSTRAINT chk_departamento CHECK (length(trim(departamento)) >= 2),
    CONSTRAINT chk_latitud      CHECK (latitud IS NULL OR latitud BETWEEN -90 AND 90),
    CONSTRAINT chk_longitud     CHECK (longitud IS NULL OR longitud BETWEEN -180 AND 180)
);

COMMENT ON TABLE  ubicaciones IS 'Dirección y coordenadas de cada inmueble.';
COMMENT ON COLUMN ubicaciones.servicios_sector IS 'Servicios del SECTOR (no del inmueble). Filtrar: WHERE servicios_sector ? ''gas''.';
COMMENT ON COLUMN ubicaciones.departamento     IS 'Uno de los 32 departamentos de Colombia.';


-- ────────────────────────────────────────────────────────────
-- 3.10 FOTOGRAFÍAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE fotografias (
    id_foto                 SERIAL          PRIMARY KEY,
    id_inmueble             INTEGER         NOT NULL
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    url_foto                TEXT            NOT NULL,
    descripcion             VARCHAR(255),
    tipo_media              tipo_media      DEFAULT 'foto',
    es_portada              BOOLEAN         DEFAULT false,
    orden                   SMALLINT        DEFAULT 1,
    fecha_subida            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_fotos_orden  CHECK (orden >= 1),
    CONSTRAINT chk_url_no_vacia CHECK (length(trim(url_foto)) > 0)
);

COMMENT ON TABLE  fotografias IS 'Mínimo 2 fotos para aprobar publicación (validado en app, no en BD).';
COMMENT ON COLUMN fotografias.es_portada IS 'Una sola portada por inmueble (idx_portada_unica). Al eliminar, promover otra.';
COMMENT ON COLUMN fotografias.orden      IS 'Posición en galería, empieza en 1.';


-- ────────────────────────────────────────────────────────────
-- 3.11 CARACTERÍSTICAS GENERALES (amenidades de conjunto)
-- ────────────────────────────────────────────────────────────
CREATE TABLE caracteristicas_generales (
    id_caracteristica       SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(100)    NOT NULL,
    descripcion             TEXT,
    icono                   VARCHAR(100),
    categoria               VARCHAR(50)     DEFAULT 'general',
    activo                  BOOLEAN         DEFAULT true,
    fecha_creacion          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_caracteristicas_nombre UNIQUE (nombre)
);

COMMENT ON TABLE  caracteristicas_generales IS 'Amenidades EXTERNAS del conjunto o edificio. Las propias de fincas van en la tabla fincas.';
COMMENT ON COLUMN caracteristicas_generales.categoria IS 'seguridad | recreacion | servicios | accesibilidad | exterior | ubicacion | parqueadero.';

CREATE TABLE inmuebles_caracteristicas (
    id_inmueble             INTEGER         NOT NULL
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    id_caracteristica       INTEGER         NOT NULL
                                            REFERENCES caracteristicas_generales(id_caracteristica) ON DELETE CASCADE,
    PRIMARY KEY (id_inmueble, id_caracteristica)
);

COMMENT ON TABLE inmuebles_caracteristicas IS 'Relación M:N inmueble ↔ amenidades del conjunto.';


-- ────────────────────────────────────────────────────────────
-- 3.12 CONTACTOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE contactos (
    id_contacto             SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(255)    NOT NULL,
    email                   VARCHAR(255)    NOT NULL,
    telefono                VARCHAR(20),
    asunto                  VARCHAR(100)    NOT NULL,
    mensaje                 TEXT            NOT NULL,
    id_inmueble             INTEGER         REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL,
    id_usuario              INTEGER         REFERENCES usuarios(id_usuario)   ON DELETE SET NULL,
    estado                  estado_contacto DEFAULT 'pendiente',
    respuesta               TEXT,
    fecha_contacto          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta         TIMESTAMP,

    CONSTRAINT chk_contacto_mensaje CHECK (length(mensaje) >= 10),
    CONSTRAINT chk_contacto_email   CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE  contactos IS 'Consultas recibidas. Pueden o no estar asociadas a un inmueble.';
COMMENT ON COLUMN contactos.id_inmueble IS 'NULL cuando el contacto es general (no sobre un inmueble específico).';
COMMENT ON COLUMN contactos.id_usuario  IS 'NULL cuando viene de un visitante no registrado.';


-- ────────────────────────────────────────────────────────────
-- 3.13 FAVORITOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE favoritos (
    id_usuario              INTEGER         NOT NULL REFERENCES usuarios(id_usuario)   ON DELETE CASCADE,
    id_inmueble             INTEGER         NOT NULL REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    fecha_agregado          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_inmueble)
);


-- ────────────────────────────────────────────────────────────
-- 3.14 SOLICITUDES DE PUBLICACIÓN
-- [v3.4 FIX] admin_revisor: ON DELETE SET NULL
-- Sin esto el planner usa RESTRICT por defecto y no puede
-- eliminarse un admin que haya revisado solicitudes.
-- ────────────────────────────────────────────────────────────
CREATE TABLE solicitudes_publicacion (
    id_solicitud            SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_inmueble             INTEGER         REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL,
    datos                   JSONB           NOT NULL,
    estado_aprobacion       estado_aprobacion   DEFAULT 'pendiente',
    -- [v3.4 FIX] ON DELETE SET NULL → no bloquea eliminación del admin
    admin_revisor           INTEGER         REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    motivo_rechazo          TEXT,
    fecha_solicitud         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    fecha_revision          TIMESTAMP
);

COMMENT ON TABLE  solicitudes_publicacion IS 'Flujo de revisión admin. Snapshot del formulario en campo datos.';
COMMENT ON COLUMN solicitudes_publicacion.datos          IS 'Snapshot JSONB: {tipo_inmueble, tipo_operacion, valor, campos_especificos, ubicacion, fotos[]}.';
COMMENT ON COLUMN solicitudes_publicacion.admin_revisor  IS 'Admin que aprobó o rechazó. NULL si el admin fue eliminado (ON DELETE SET NULL).';
COMMENT ON COLUMN solicitudes_publicacion.motivo_rechazo IS 'Obligatorio en app cuando estado=rechazado.';


-- ────────────────────────────────────────────────────────────
-- 3.15 HISTORIAL DE PRECIOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE historial_precios (
    id_historial            SERIAL          PRIMARY KEY,
    id_inmueble             INTEGER         NOT NULL REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    valor_anterior          DECIMAL(15,2)   NOT NULL,
    valor_nuevo             DECIMAL(15,2)   NOT NULL,
    motivo                  VARCHAR(100),
    fecha_cambio            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE historial_precios IS 'Cambios de precio. Llenada por trigger trg_historial_precio.';


-- ────────────────────────────────────────────────────────────
-- 3.16 NOTIFICACIONES
-- ────────────────────────────────────────────────────────────
CREATE TABLE notificaciones (
    id_notificacion         SERIAL              PRIMARY KEY,
    id_usuario              INTEGER             NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo                    tipo_notificacion   NOT NULL,
    titulo                  VARCHAR(255)        NOT NULL,
    mensaje                 TEXT,
    leida                   BOOLEAN             DEFAULT false,
    id_inmueble             INTEGER             REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL,
    fecha_creacion          TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura           TIMESTAMP
);

COMMENT ON TABLE  notificaciones IS 'Alertas internas del sistema.';
COMMENT ON COLUMN notificaciones.fecha_lectura IS 'Registrada por trigger trg_fecha_lectura_notificacion.';


-- ────────────────────────────────────────────────────────────
-- 3.17 SOLICITUDES DE ELIMINACIÓN DE CUENTA
-- [v3.4 FIX] admin_revisor: ON DELETE SET NULL (mismo problema)
-- ────────────────────────────────────────────────────────────
CREATE TABLE solicitudes_eliminacion_cuenta (
    id_solicitud            SERIAL                  PRIMARY KEY,
    id_usuario              INTEGER                 NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    motivo                  TEXT,
    estado                  estado_solicitud_cuenta DEFAULT 'pendiente',
    -- [v3.4 FIX] ON DELETE SET NULL → no bloquea eliminación del admin
    admin_revisor           INTEGER                 REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    nota_admin              TEXT,
    fecha_solicitud         TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion        TIMESTAMP
);

COMMENT ON TABLE  solicitudes_eliminacion_cuenta IS 'Baja de cuentas: cliente solicita → admin revisa → aprueba (activo=false) o rechaza.';
COMMENT ON COLUMN solicitudes_eliminacion_cuenta.admin_revisor IS 'Admin que procesó. NULL si el admin fue eliminado (ON DELETE SET NULL).';


-- ────────────────────────────────────────────────────────────
-- 3.18 KEEP ALIVE (singleton)
-- [v3.4] Sin índice: tabla de 1 fila, índice no aporta al planner.
-- ────────────────────────────────────────────────────────────
CREATE TABLE keep_alive (
    id          BOOLEAN     PRIMARY KEY DEFAULT TRUE,
    last_ping   TIMESTAMP   DEFAULT NOW(),
    CONSTRAINT chk_keep_alive_singleton CHECK (id = TRUE)
);

COMMENT ON TABLE  keep_alive IS 'Singleton. Cron externo ejecuta: UPDATE keep_alive SET last_ping=NOW() WHERE id=TRUE. Frecuencia: cada 5 días.';
COMMENT ON COLUMN keep_alive.last_ping IS 'Último ping del cron externo.';


-- ============================================================
-- SECCIÓN 4: ÍNDICES
-- ============================================================

-- Usuarios
CREATE INDEX idx_usuarios_email
    ON usuarios USING btree (lower(email));
CREATE INDEX idx_usuarios_rol
    ON usuarios USING btree (rol);
CREATE INDEX idx_usuarios_token_verificacion
    ON usuarios (token_verificacion)
    WHERE token_verificacion IS NOT NULL;

-- Sesiones
CREATE INDEX idx_sesiones_usuario
    ON sesiones_usuario USING btree (id_usuario);
CREATE INDEX idx_sesiones_activas
    ON sesiones_usuario USING btree (id_usuario, activa);
CREATE INDEX idx_sesiones_actividad
    ON sesiones_usuario USING btree (ultima_actividad);
CREATE UNIQUE INDEX idx_token_sesion_unico
    ON sesiones_usuario (token_sesion)
    WHERE token_sesion IS NOT NULL AND activa = true;
CREATE INDEX idx_token_sesion_lookup
    ON sesiones_usuario (token_sesion)
    WHERE token_sesion IS NOT NULL;
CREATE INDEX idx_sesiones_pais_ciudad
    ON sesiones_usuario (pais, ciudad)
    WHERE pais IS NOT NULL;

-- Reset contraseña
CREATE INDEX idx_reset_token
    ON password_reset_tokens (token_hash)
    WHERE NOT usado;
CREATE INDEX idx_reset_usuario
    ON password_reset_tokens (id_usuario);

-- Inmuebles
CREATE INDEX idx_inmuebles_usuario
    ON inmuebles USING btree (id_usuario);
CREATE INDEX idx_inmuebles_estado_aprobacion
    ON inmuebles USING btree (estado_aprobacion);
CREATE INDEX idx_inmuebles_filtros_precio
    ON inmuebles USING btree (tipo_operacion, valor);
CREATE INDEX idx_filtros_completos
    ON inmuebles USING btree (estado_aprobacion, tipo_inmueble, tipo_operacion, valor, estrato)
    WHERE estado_aprobacion = 'aprobado' AND activo = true;
CREATE INDEX idx_inmuebles_permuta
    ON inmuebles (acepta_permuta)
    WHERE acepta_permuta = true AND estado_aprobacion = 'aprobado' AND activo = true;

-- Fotografías
CREATE INDEX idx_fotografias_inmueble
    ON fotografias USING btree (id_inmueble);
CREATE UNIQUE INDEX idx_portada_unica
    ON fotografias (id_inmueble)
    WHERE es_portada = true;
CREATE INDEX idx_fotografias_orden
    ON fotografias (id_inmueble, orden ASC);

-- Ubicaciones
CREATE INDEX idx_ubicaciones_inmueble
    ON ubicaciones USING btree (id_inmueble);
CREATE INDEX idx_ubicacion_busqueda
    ON ubicaciones USING btree (municipio, departamento, barrio_vereda);
CREATE INDEX idx_ubicacion_municipio_trgm
    ON ubicaciones USING gin (unaccent(municipio) gin_trgm_ops);
CREATE INDEX idx_servicios_sector_gin
    ON ubicaciones USING gin (servicios_sector);

-- JSONB de servicios
CREATE INDEX idx_locales_servicios_gin
    ON locales USING gin (servicios_publicos);
CREATE INDEX idx_lotes_servicios_gin
    ON lotes USING gin (servicios_disponibles);
CREATE INDEX idx_fincas_servicios_gin
    ON fincas USING gin (servicios_disponibles);

-- Características
CREATE INDEX idx_inmuebles_caract_inmueble
    ON inmuebles_caracteristicas USING btree (id_inmueble);
CREATE INDEX idx_inmuebles_caract_caract
    ON inmuebles_caracteristicas USING btree (id_caracteristica);

-- Contactos
CREATE INDEX idx_contactos_estado_fecha
    ON contactos USING btree (estado, fecha_contacto DESC);
CREATE INDEX idx_contactos_inmueble
    ON contactos USING btree (id_inmueble);

-- Historial precios
CREATE INDEX idx_historial_inmueble
    ON historial_precios (id_inmueble, fecha_cambio DESC);

-- Notificaciones
CREATE INDEX idx_notif_usuario_leida
    ON notificaciones (id_usuario, leida, fecha_creacion DESC);

-- Favoritos
CREATE INDEX idx_favoritos_usuario
    ON favoritos USING btree (id_usuario);
CREATE INDEX idx_favoritos_inmueble
    ON favoritos USING btree (id_inmueble);

-- Config / seguridad
CREATE INDEX idx_configuracion_usuario
    ON configuracion_usuario USING btree (id_usuario);
CREATE INDEX idx_seguridad_usuario
    ON seguridad_usuario USING btree (id_usuario);

-- Solicitudes publicación
CREATE INDEX idx_solicitudes_pub_usuario
    ON solicitudes_publicacion (id_usuario);
CREATE INDEX idx_solicitudes_pub_estado
    ON solicitudes_publicacion (estado_aprobacion, fecha_solicitud DESC);

-- Solicitudes eliminación de cuenta
CREATE INDEX idx_solicitudes_cuenta_usuario
    ON solicitudes_eliminacion_cuenta (id_usuario);
CREATE INDEX idx_solicitudes_cuenta_estado
    ON solicitudes_eliminacion_cuenta (estado);
CREATE UNIQUE INDEX idx_una_solicitud_activa
    ON solicitudes_eliminacion_cuenta (id_usuario)
    WHERE estado IN ('pendiente', 'en_revision');


-- ============================================================
-- SECCIÓN 5: FUNCIONES
-- ============================================================

-- Actualiza fecha_actualizacion (para configuracion_usuario y configuracion)
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_actualizacion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_actualizar_fecha_actualizacion IS
'Actualiza fecha_actualizacion en UPDATE. Usada por trg_actualizar_config_usuario y trg_actualizar_configuracion.';


-- [v3.4 FIX] Función específica para seguridad_usuario.
-- seguridad_usuario tiene fecha_CONFIGURACION, no fecha_actualizacion.
-- fn_actualizar_fecha_actualizacion() fallaba con "column not found".
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_configuracion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.fecha_configuracion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_actualizar_fecha_configuracion IS
'[v3.4] Actualiza fecha_configuracion en seguridad_usuario. '
'DISTINTA de fn_actualizar_fecha_actualizacion: esa columna no existe en seguridad_usuario.';


-- Inicialización de cuenta al registrar usuario
CREATE OR REPLACE FUNCTION fn_crear_config_usuario()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO configuracion_usuario (id_usuario) VALUES (NEW.id_usuario);
    INSERT INTO seguridad_usuario     (id_usuario) VALUES (NEW.id_usuario);
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_crear_config_usuario IS
'Inicializa configuracion_usuario y seguridad_usuario al crear un usuario (AFTER INSERT ON usuarios).';


-- Historial de precios
CREATE OR REPLACE FUNCTION fn_registrar_cambio_precio()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.valor IS DISTINCT FROM NEW.valor THEN
        INSERT INTO historial_precios (id_inmueble, valor_anterior, valor_nuevo, motivo)
        VALUES (NEW.id_inmueble, OLD.valor, NEW.valor, 'Actualización manual');
    END IF;
    RETURN NEW;
END;
$$;


-- Fecha de lectura de notificaciones
CREATE OR REPLACE FUNCTION fn_marcar_fecha_lectura()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.leida = true AND OLD.leida = false THEN
        NEW.fecha_lectura = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;


-- Timeout de sesión (30 min de inactividad)
-- Lógica: heartbeat → no cerrar. Sin heartbeat y vencida → cerrar.
CREATE OR REPLACE FUNCTION fn_cerrar_sesion_inactiva()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.activa = false THEN
        RETURN NEW;
    END IF;
    -- Si el backend actualiza ultima_actividad (heartbeat), no cerrar
    IF NEW.ultima_actividad > OLD.ultima_actividad THEN
        RETURN NEW;
    END IF;
    -- Sin heartbeat y superados los 30 min → cerrar
    IF OLD.ultima_actividad < CURRENT_TIMESTAMP - INTERVAL '30 minutes' THEN
        NEW.activa       := false;
        NEW.token_sesion := NULL;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cerrar_sesion_inactiva IS
'Timeout 30 min. Heartbeat: UPDATE sesiones_usuario SET ultima_actividad=NOW() WHERE id_sesion=$1 AND activa=true.';


-- Invalidar sesión individual
CREATE OR REPLACE FUNCTION fn_invalidar_sesion(p_id_sesion INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE sesiones_usuario
    SET    activa = false, token_sesion = NULL
    WHERE  id_sesion = p_id_sesion AND activa = true;
END;
$$;

COMMENT ON FUNCTION fn_invalidar_sesion IS 'Cierra una sesión por ID. Usar en logout.';


-- Invalidar todas las sesiones de un usuario
CREATE OR REPLACE FUNCTION fn_invalidar_sesiones_usuario(p_id_usuario INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE sesiones_usuario
    SET    activa = false, token_sesion = NULL
    WHERE  id_usuario = p_id_usuario AND activa = true;
END;
$$;

COMMENT ON FUNCTION fn_invalidar_sesiones_usuario IS
'Cierra TODAS las sesiones del usuario. Usar al cambiar contraseña, aprobar eliminación de cuenta o suspender.';


-- Limpieza periódica (pg_cron a las 3 AM):
-- SELECT cron.schedule('0 3 * * *', 'SELECT fn_limpiar_tokens_expirados()');
CREATE OR REPLACE FUNCTION fn_limpiar_tokens_expirados()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expira_en < CURRENT_TIMESTAMP OR usado = true;

    DELETE FROM sesiones_usuario
    WHERE activa = false
      AND (ultima_actividad < CURRENT_TIMESTAMP - INTERVAL '7 days'
           OR ultima_actividad IS NULL);
END;
$$;

COMMENT ON FUNCTION fn_limpiar_tokens_expirados IS
'Mantenimiento diario. Programa: SELECT cron.schedule(''0 3 * * *'', ''SELECT fn_limpiar_tokens_expirados()'').';


-- ============================================================
-- SECCIÓN 6: TRIGGERS
-- ============================================================

-- Crear config y seguridad al registrar usuario
CREATE TRIGGER trg_crear_config_usuario
    AFTER INSERT ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_crear_config_usuario();

-- Actualizar timestamp en preferencias de usuario
CREATE TRIGGER trg_actualizar_config_usuario
    BEFORE UPDATE ON configuracion_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();

-- [v3.4 FIX] Usa fn_actualizar_fecha_CONFIGURACION, no fn_actualizar_fecha_actualizacion.
-- La columna en seguridad_usuario se llama fecha_configuracion.
-- En v3.3 esto causaba: ERROR: record "new" has no field "fecha_actualizacion"
CREATE TRIGGER trg_actualizar_seguridad_usuario
    BEFORE UPDATE ON seguridad_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_configuracion();

-- Actualizar timestamp en config de empresa
CREATE TRIGGER trg_actualizar_configuracion
    BEFORE UPDATE ON configuracion
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();

-- Registrar cambio de precio en historial
CREATE TRIGGER trg_historial_precio
    BEFORE UPDATE OF valor ON inmuebles
    FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_precio();

-- Registrar timestamp al marcar notificación leída
CREATE TRIGGER trg_fecha_lectura_notificacion
    BEFORE UPDATE OF leida ON notificaciones
    FOR EACH ROW EXECUTE FUNCTION fn_marcar_fecha_lectura();

-- Verificar timeout de inactividad en cada UPDATE de sesión
CREATE TRIGGER trg_timeout_sesion
    BEFORE UPDATE ON sesiones_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_cerrar_sesion_inactiva();


-- ============================================================
-- SECCIÓN 7: VISTAS
-- ============================================================

-- Vista pública del buscador (sin cambios funcionales)
CREATE OR REPLACE VIEW v_inmuebles_listado AS
SELECT
    i.id_inmueble,
    i.tipo_inmueble,
    i.tipo_operacion,
    i.valor,
    i.valor_administracion,
    i.estrato,
    i.zona,
    i.estado_inmueble,
    i.acepta_permuta,
    i.descripcion,
    i.fecha_registro,
    u.direccion,
    u.barrio_vereda,
    u.municipio,
    u.departamento,
    u.latitud,
    u.longitud,
    u.servicios_sector,
    usr.nombre_completo                             AS nombre_propietario,
    usr.telefono                                    AS telefono_propietario,
    fp.url_foto                                     AS foto_portada,
    COALESCE(fc.total_fotos, 0)                     AS total_fotos,
    COALESCE(fv.total_favoritos, 0)                 AS total_favoritos
FROM inmuebles i
LEFT JOIN ubicaciones u    ON u.id_inmueble   = i.id_inmueble
LEFT JOIN usuarios    usr  ON usr.id_usuario  = i.id_usuario
LEFT JOIN fotografias fp   ON fp.id_inmueble  = i.id_inmueble AND fp.es_portada = true
LEFT JOIN (
    SELECT id_inmueble, COUNT(*) AS total_fotos
    FROM fotografias GROUP BY id_inmueble
) fc ON fc.id_inmueble = i.id_inmueble
LEFT JOIN (
    SELECT id_inmueble, COUNT(*) AS total_favoritos
    FROM favoritos GROUP BY id_inmueble
) fv ON fv.id_inmueble = i.id_inmueble
WHERE i.estado_aprobacion = 'aprobado'
  AND i.activo = true;

COMMENT ON VIEW v_inmuebles_listado IS 'Solo aprobados y activos. Buscador público. No expone email del propietario.';


-- Vista de detalle por inmueble
-- [v3.4 FIX] email_propietario respeta ocultar_informacion.
-- Si el propietario activó ocultar_informacion, el email queda NULL.
-- La vista anterior lo exponía siempre.
CREATE OR REPLACE VIEW v_inmueble_detalle AS
SELECT
    i.id_inmueble,
    i.id_usuario,
    i.tipo_inmueble,
    i.tipo_operacion,
    i.valor,
    i.valor_administracion,
    i.estrato,
    i.zona,
    i.estado_inmueble,
    i.acepta_permuta,
    i.descripcion,
    i.numero_matricula,
    i.codigo_catastral,
    i.estado_aprobacion,
    i.activo,
    i.fecha_registro,
    i.fecha_aprobacion,

    -- Propietario: email condicionado por ocultar_informacion
    usr.nombre_completo                                         AS nombre_propietario,
    usr.telefono                                                AS telefono_propietario,
    -- [v3.4 FIX] NULL si ocultar_informacion=true
    CASE WHEN COALESCE(cfg.ocultar_informacion, false) = false
         THEN usr.email
         ELSE NULL
    END                                                         AS email_propietario,
    usr.es_dueno,

    -- Ubicación
    u.direccion,
    u.barrio_vereda,
    u.municipio,
    u.departamento,
    u.latitud,
    u.longitud,
    u.servicios_sector,

    -- Detalle específico del tipo (solo uno será no-null)
    CASE i.tipo_inmueble WHEN 'casa'          THEN row_to_json(c.*)::jsonb  ELSE NULL END AS detalle_casa,
    CASE i.tipo_inmueble WHEN 'apartamento'   THEN row_to_json(a.*)::jsonb  ELSE NULL END AS detalle_apartamento,
    CASE i.tipo_inmueble WHEN 'apartaestudio' THEN row_to_json(ae.*)::jsonb ELSE NULL END AS detalle_apartaestudio,
    CASE i.tipo_inmueble WHEN 'lote'          THEN row_to_json(l.*)::jsonb  ELSE NULL END AS detalle_lote,
    CASE i.tipo_inmueble WHEN 'local'         THEN row_to_json(lc.*)::jsonb ELSE NULL END AS detalle_local,
    CASE i.tipo_inmueble WHEN 'bodega'        THEN row_to_json(b.*)::jsonb  ELSE NULL END AS detalle_bodega,
    CASE i.tipo_inmueble WHEN 'finca'         THEN row_to_json(f.*)::jsonb  ELSE NULL END AS detalle_finca,

    COALESCE(fc.total_fotos, 0)                                 AS total_fotos,
    fp.url_foto                                                 AS foto_portada

FROM inmuebles i
LEFT JOIN usuarios           usr ON usr.id_usuario  = i.id_usuario
-- [v3.4] JOIN con configuracion_usuario para respetar privacidad
LEFT JOIN configuracion_usuario cfg ON cfg.id_usuario = i.id_usuario
LEFT JOIN ubicaciones          u   ON u.id_inmueble   = i.id_inmueble
LEFT JOIN casas                c   ON c.id_inmueble   = i.id_inmueble
LEFT JOIN apartamentos         a   ON a.id_inmueble   = i.id_inmueble
LEFT JOIN apartaestudios       ae  ON ae.id_inmueble  = i.id_inmueble
LEFT JOIN lotes                l   ON l.id_inmueble   = i.id_inmueble
LEFT JOIN locales              lc  ON lc.id_inmueble  = i.id_inmueble
LEFT JOIN bodegas              b   ON b.id_inmueble   = i.id_inmueble
LEFT JOIN fincas               f   ON f.id_inmueble   = i.id_inmueble
LEFT JOIN fotografias          fp  ON fp.id_inmueble  = i.id_inmueble AND fp.es_portada = true
LEFT JOIN (
    SELECT id_inmueble, COUNT(*) AS total_fotos
    FROM fotografias GROUP BY id_inmueble
) fc ON fc.id_inmueble = i.id_inmueble;

COMMENT ON VIEW v_inmueble_detalle IS
'Ficha completa por tipo. email_propietario es NULL cuando ocultar_informacion=true. '
'Campos específicos del tipo en JSONB (detalle_casa, detalle_apartamento, etc.). '
'Usar con WHERE id_inmueble=$1.';


-- Vista de estadísticas del panel admin
CREATE OR REPLACE VIEW v_stats_admin AS
SELECT
    (SELECT COUNT(*) FROM inmuebles WHERE activo = true)                                    AS total_inmuebles,
    (SELECT COUNT(*) FROM inmuebles WHERE estado_aprobacion = 'aprobado'  AND activo = true) AS inmuebles_aprobados,
    (SELECT COUNT(*) FROM inmuebles WHERE estado_aprobacion = 'pendiente' AND activo = true) AS inmuebles_pendientes,
    (SELECT COUNT(*) FROM inmuebles WHERE tipo_operacion = 'venta'    AND estado_aprobacion = 'aprobado' AND activo = true) AS en_venta,
    (SELECT COUNT(*) FROM inmuebles WHERE tipo_operacion = 'arriendo' AND estado_aprobacion = 'aprobado' AND activo = true) AS en_arriendo,
    (SELECT COUNT(*) FROM usuarios WHERE activo = true)                                     AS total_usuarios,
    -- date_trunc('week') = lunes de la semana calendario actual (ISO)
    (SELECT COUNT(*) FROM usuarios WHERE fecha_registro >= date_trunc('week', CURRENT_DATE)::date) AS nuevos_esta_semana,
    (SELECT COUNT(*) FROM contactos WHERE estado = 'pendiente')                             AS contactos_sin_responder,
    (SELECT COUNT(*) FROM solicitudes_eliminacion_cuenta WHERE estado IN ('pendiente', 'en_revision')) AS solicitudes_cuenta_pendientes,
    (SELECT COUNT(*) FROM notificaciones WHERE leida = false)                               AS notificaciones_no_leidas_sistema;

COMMENT ON VIEW v_stats_admin IS 'Métricas en tiempo real. nuevos_esta_semana usa semana calendario (lunes-domingo).';


-- ============================================================
-- SECCIÓN 8: DATOS INICIALES
-- ============================================================

INSERT INTO configuracion (
    id_config, experiencia_anios,
    valores, servicios, razones, datos_contacto, redes_sociales
) VALUES (
    TRUE, 5,
    '[
        {"titulo":"Experiencia","descripcion":"Años de trayectoria en el mercado inmobiliario de Nariño, brindando confianza y profesionalismo en cada negociación.","icono":"briefcase"},
        {"titulo":"Compromiso","descripcion":"Nos dedicamos a entender las necesidades de cada cliente para ofrecer soluciones personalizadas y efectivas.","icono":"users"},
        {"titulo":"Calidad","descripcion":"Seleccionamos cuidadosamente cada propiedad para garantizar la mejor inversión a corto y largo plazo.","icono":"star"}
    ]'::jsonb,
    '[
        {"numero":"01","titulo":"Compra de Propiedades","descripcion":"Te ayudamos a encontrar la propiedad perfecta en Nariño."},
        {"numero":"02","titulo":"Venta de Inmuebles","descripcion":"Gestionamos la venta con estrategias efectivas de marketing y negociación."},
        {"numero":"03","titulo":"Arriendo","descripcion":"Opciones de arriendo con contratos seguros y propiedades verificadas."},
        {"numero":"04","titulo":"Asesoría Inmobiliaria","descripcion":"Consultoría especializada para inversiones y proyectos en la región."}
    ]'::jsonb,
    '[
        {"titulo":"Portafolio Diverso","descripcion":"Casas, apartamentos, fincas, locales comerciales y más."},
        {"titulo":"Atención Personalizada","descripcion":"Equipo dedicado a brindarte el mejor servicio en cada etapa."},
        {"titulo":"Transparencia","descripcion":"Información clara sin costos ocultos ni sorpresas."},
        {"titulo":"Tecnología","descripcion":"Plataforma digital para facilitar tu búsqueda y gestión."}
    ]'::jsonb,
    '{"email":"info@sonogroup.com","telefono":"+57 300 000 0000","direccion":"Pasto, Nariño, Colombia","whatsapp":"+57 300 000 0000"}'::jsonb,
    '{"facebook":"","instagram":"","twitter":"","whatsapp":""}'::jsonb
)
ON CONFLICT (id_config) DO UPDATE SET
    experiencia_anios = EXCLUDED.experiencia_anios,
    valores           = EXCLUDED.valores,
    servicios         = EXCLUDED.servicios,
    razones           = EXCLUDED.razones,
    datos_contacto    = EXCLUDED.datos_contacto,
    redes_sociales    = EXCLUDED.redes_sociales;


INSERT INTO caracteristicas_generales (nombre, categoria, icono) VALUES
    ('Vigilancia 24h',          'seguridad',        'shield'),
    ('Portería',                'seguridad',        'door-closed'),
    ('Cámaras de seguridad',    'seguridad',        'camera'),
    ('Alarma',                  'seguridad',        'bell'),
    ('Circuito cerrado',        'seguridad',        'device-cctv'),
    ('Cerramiento',             'seguridad',        'lock'),
    ('Piscina',                 'recreacion',       'droplets'),
    ('Gimnasio',                'recreacion',       'barbell'),
    ('Cancha múltiple',         'recreacion',       'ball-football'),
    ('Cancha de tenis',         'recreacion',       'ball-tennis'),
    ('Zona BBQ',                'recreacion',       'flame'),
    ('Salón comunal',           'recreacion',       'users'),
    ('Parque infantil',         'recreacion',       'mood-happy'),
    ('Senderos peatonales',     'recreacion',       'walk'),
    ('Lago o estanque',         'recreacion',       'waves'),
    ('Zona de camping',         'recreacion',       'tent'),
    ('Ascensor',                'servicios',        'elevator'),
    ('Zona de lavandería',      'servicios',        'wash'),
    ('Depósito comunal',        'servicios',        'archive'),
    ('Cuarto de basuras',       'servicios',        'trash'),
    ('Citófono',                'servicios',        'phone'),
    ('Planta eléctrica',        'servicios',        'bolt'),
    ('Wifi en zonas comunes',   'servicios',        'wifi'),
    ('Zona de coworking',       'servicios',        'briefcase'),
    ('Acceso discapacitados',   'accesibilidad',    'accessible'),
    ('Rampas',                  'accesibilidad',    'stairs'),
    ('Vista a montaña',         'exterior',         'mountain'),
    ('Vista al río',            'exterior',         'ripple'),
    ('Zona verde',              'exterior',         'trees'),
    ('Cerca a colegios',        'ubicacion',        'school'),
    ('Cerca a centros salud',   'ubicacion',        'heart-plus'),
    ('Cerca a supermercados',   'ubicacion',        'shopping-cart'),
    ('Cerca a transporte',      'ubicacion',        'bus'),
    ('Cerca a parques',         'ubicacion',        'trees'),
    ('Parqueadero visitantes',  'parqueadero',      'car')
ON CONFLICT (nombre) DO NOTHING;


INSERT INTO keep_alive (id, last_ping) VALUES (TRUE, NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- RESUMEN v3.4
-- ============================================================
-- Tablas    : 25  (sin cambios)
-- Índices   : 41  (-1 vs v3.3: eliminado idx_keep_alive_last_ping)
-- Tipos     : 18  (sin cambios)
-- Funciones : 9   (+1 vs v3.3: fn_actualizar_fecha_configuracion)
-- Triggers  : 7   (sin cambios en cantidad; trg_actualizar_seguridad
--                  ahora apunta a la función correcta)
-- Vistas    : 3   (sin cambios en cantidad; v_inmueble_detalle corregida)
--
-- CORRECCIONES APLICADAS
-- ─────────────────────────────────────────────────────────────
-- [CRÍTICO] trg_actualizar_seguridad_usuario
--   Antes: usaba fn_actualizar_fecha_actualizacion()
--          → ERROR: record "new" has no field "fecha_actualizacion"
--   Ahora: usa fn_actualizar_fecha_configuracion()
--          → actualiza correctamente fecha_configuracion
--
-- [CRÍTICO] chk_soft_delete_consistente
--   Antes: CHECK (activo=true OR fecha_eliminacion IS NOT NULL)
--          → permitía activo=true con fecha_eliminacion seteada
--   Ahora: CHECK bidireccional con exclusividad completa
--
-- [PRIVACIDAD] v_inmueble_detalle email_propietario
--   Antes: siempre exponía usr.email
--   Ahora: NULL cuando configuracion_usuario.ocultar_informacion=true
--
-- [FK RESTRICT] admin_revisor en dos tablas
--   Antes: sin ON DELETE → RESTRICT implícito
--          → imposible eliminar admin que haya revisado solicitudes
--   Ahora: ON DELETE SET NULL en solicitudes_publicacion
--          y solicitudes_eliminacion_cuenta
--
-- [INCONSISTENCIA] casas
--   + chk_casas_lavanderia_consistente:
--     zona_lavanderia=false → zona_lavanderia_tipo debe ser NULL
--
-- [INCONSISTENCIA] apartamentos
--   + chk_aptos_vigilancia_consistente:
--     vigilancia=false → vigilancia_valor debe ser NULL
--
-- [RUIDO] idx_keep_alive_last_ping eliminado
--   Tabla singleton (1 fila) → índice inútil para el planner
-- ============================================================


-- ============================================================
-- EXTENSIONES POST v3.4 — Migraciones aplicadas en producción
-- Fecha: Junio 2026
-- ============================================================
--
-- Estas migraciones se ejecutaron sobre la BD v3.4 ya en uso.
-- No forman parte del script destructivo original (que hace DROP).
-- Se documentan aquí para tener un registro completo del esquema.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- EXT 1: BORRADORES DE INMUEBLES
-- Permite guardar formularios incompletos en servidor.
-- Límite por rol enforced en backend: cliente=1, admin=5.
-- ────────────────────────────────────────────────────────────

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
COMMENT ON COLUMN borradores_inmuebles.titulo IS 'Identificador visual para admins con múltiples borradores.';

CREATE INDEX idx_borradores_usuario
    ON borradores_inmuebles (id_usuario, fecha_actualizacion DESC);

CREATE TRIGGER trg_actualizar_borrador
    BEFORE UPDATE ON borradores_inmuebles
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();


-- ────────────────────────────────────────────────────────────
-- EXT 2: ENUM tipo_sala_comedor — valor 'separados'
-- Sala y comedor como espacios independientes.
-- ────────────────────────────────────────────────────────────

-- ALTER TYPE tipo_sala_comedor ADD VALUE 'separados';
-- (Ya ejecutado. Documentado aquí para referencia.)


-- ────────────────────────────────────────────────────────────
-- EXT 3: TRIGGER NOTIFICACIÓN FAVORITOS
-- Notifica a usuarios cuando cambia precio o se desactiva
-- una propiedad que tienen en favoritos.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notificar_cambio_favorito()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
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

COMMENT ON FUNCTION fn_notificar_cambio_favorito IS
'Notifica a usuarios con favoritos cuando cambia precio o se desactiva un inmueble.';

CREATE TRIGGER trg_notificar_cambio_favorito
    AFTER UPDATE OF valor, activo ON inmuebles
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_cambio_favorito();


-- ────────────────────────────────────────────────────────────
-- EXT 4: ESTADOS AMPLIADOS PARA SOLICITUDES
-- Nuevos estados: recibido, resuelto, no_resuelto
-- Nuevas columnas para tracking y reenvío de solicitudes.
-- ────────────────────────────────────────────────────────────

-- Enum ampliado (ejecutar en paso separado por restricción PostgreSQL):
-- ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'recibido';
-- ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'resuelto';
-- ALTER TYPE estado_aprobacion ADD VALUE IF NOT EXISTS 'no_resuelto';
-- ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'solicitud';

-- Columnas nuevas en solicitudes_publicacion:
ALTER TABLE solicitudes_publicacion
ADD COLUMN IF NOT EXISTS fecha_vista TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP,
ADD COLUMN IF NOT EXISTS id_solicitud_origen INTEGER
    REFERENCES solicitudes_publicacion(id_solicitud) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_solicitud VARCHAR(20) DEFAULT 'publicacion',
ADD COLUMN IF NOT EXISTS snapshot_datos_rechazo JSONB,
ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP;

COMMENT ON COLUMN solicitudes_publicacion.fecha_vista IS 'Timestamp de cuando el admin vio la solicitud (estado → recibido).';
COMMENT ON COLUMN solicitudes_publicacion.fecha_resolucion IS 'Timestamp de resolución final (resuelto/no_resuelto).';
COMMENT ON COLUMN solicitudes_publicacion.id_solicitud_origen IS 'FK a la solicitud original cuando es un reenvío.';
COMMENT ON COLUMN solicitudes_publicacion.tipo_solicitud IS 'publicacion | edicion. Discriminador de tipo de solicitud.';
COMMENT ON COLUMN solicitudes_publicacion.snapshot_datos_rechazo IS 'Snapshot de datos al momento del rechazo, para comparar cambios en reenvío.';
COMMENT ON COLUMN solicitudes_publicacion.fecha_rechazo IS 'Timestamp del rechazo.';

-- Índice para buscar solicitudes de edición por inmueble
CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_tipo_inmueble
    ON solicitudes_publicacion (id_inmueble, tipo_solicitud, estado_aprobacion)
    WHERE tipo_solicitud = 'edicion';

-- Índice para cron de solicitudes sin resolver
CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_estado_fecha
    ON solicitudes_publicacion (estado_aprobacion, fecha_solicitud)
    WHERE estado_aprobacion IN ('pendiente', 'recibido');


-- ============================================================
-- RESUMEN COMPLETO DEL ESQUEMA (v3.4 + extensiones)
-- ============================================================
-- Tablas    : 26  (+1: borradores_inmuebles)
-- Índices   : 44  (+3: borradores_usuario, solicitudes_tipo_inmueble,
--                      solicitudes_estado_fecha)
-- Tipos     : 19  (+0 nuevos tipos, pero valores añadidos a:
--                  tipo_sala_comedor, estado_aprobacion, tipo_notificacion)
-- Funciones : 10  (+1: fn_notificar_cambio_favorito)
-- Triggers  : 9   (+2: trg_actualizar_borrador, trg_notificar_cambio_favorito)
-- Vistas    : 3   (sin cambios)
-- ============================================================
