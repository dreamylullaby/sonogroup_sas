-- ============================================================
-- SONOGROUP S.A.S — Base de datos inmobiliaria
-- Versión : 3.8 — Producción
-- Motor    : PostgreSQL 15+ (Supabase compatible)
-- ============================================================

-- ============================================================
-- SECCIÓN 1: LIMPIEZA COMPLETA
-- Elimina toda la estructura anterior antes de recrearla.
-- Ejecutar el script completo desde el SQL Editor de Supabase.
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
-- SECCIÓN 2: TIPOS ENUMERADOS
-- ============================================================
-- NOTA: Los siguientes enums reciben valores adicionales mediante
-- ALTER TYPE en el archivo migraciones_post_v3.4.sql, ya que ADD VALUE
-- no puede ejecutarse dentro de un script destructivo (el tipo se
-- recrea desde cero aquí):
--   tipo_sala_comedor  → ADD VALUE 'separados'
--   estado_contacto    → ADD VALUE 'recibido', 'resuelto', 'no_resuelto'
--   tipo_notificacion  → ADD VALUE 'solicitud'
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
-- Tabla central de identidad. El registro público solo crea
-- rol=cliente. Los admins se crean por script o por otro admin.
-- ────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
    id_usuario              SERIAL          PRIMARY KEY,
    nombre_completo         VARCHAR(300)    NOT NULL,
    email                   VARCHAR(255)    NOT NULL,
    telefono                VARCHAR(20),
    tipo_identificacion     VARCHAR(20)     NOT NULL,   -- CC | NIT | CE | PA
    numero_identificacion   VARCHAR(50)     NOT NULL,
    password_hash           TEXT            NOT NULL,   -- bcrypt, mínimo 60 chars, jamás texto plano
    rol                     rol_usuario     NOT NULL    DEFAULT 'cliente',
    es_dueno                BOOLEAN                     DEFAULT true,   -- false = comisionista actuando por otro
    -- Confirmación de mayoría de edad. Requerida para clientes.
    -- Para admins creados por script no aplica semánticamente; se deja false por defecto.
    mayor_de_edad           BOOLEAN         NOT NULL    DEFAULT false,
    activo                  BOOLEAN                     DEFAULT true,   -- false = soft-delete o suspensión, nunca borrar la fila
    email_verificado        BOOLEAN                     DEFAULT false,
    token_verificacion      TEXT,           -- UUID enviado al email; se pone NULL al verificar, nunca exponer en API
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

COMMENT ON TABLE  usuarios IS 'Tabla central de identidad. Rol determina permisos.';
COMMENT ON COLUMN usuarios.nombre_completo     IS 'Nombre completo. Si el formulario los captura separados, dividir en nombre + apellido y ajustar constraints.';
COMMENT ON COLUMN usuarios.tipo_identificacion IS 'CC | NIT | CE (Cédula Extranjería) | PA (Pasaporte).';
COMMENT ON COLUMN usuarios.es_dueno            IS 'true = propietario directo. false = comisionista actuando en nombre de otro.';
COMMENT ON COLUMN usuarios.activo              IS 'false = soft-delete o suspensión. Nunca eliminar filas de usuarios.';


-- ────────────────────────────────────────────────────────────
-- 3.2 CONFIGURACIÓN DE USUARIO
-- Creada automáticamente por el trigger trg_crear_config_usuario
-- al insertar un nuevo usuario.
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
    ocultar_informacion     BOOLEAN         DEFAULT false,  -- true = oculta teléfono y email en vistas públicas
    fecha_actualizacion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tema_valido CHECK (tema IN ('claro', 'oscuro'))
);

COMMENT ON TABLE  configuracion_usuario IS 'Preferencias por usuario. Creada automáticamente por trigger al registrar el usuario.';
COMMENT ON COLUMN configuracion_usuario.ocultar_informacion IS 'true = oculta teléfono y email del propietario en vistas públicas. Respetado por v_inmueble_detalle.';

-- ────────────────────────────────────────────────────────────
-- 3.3 SEGURIDAD DE USUARIO (2FA)
-- La columna de timestamp se llama fecha_CONFIGURACION (no
-- fecha_actualizacion). El trigger usa fn_actualizar_fecha_configuracion,
-- función dedicada para esta tabla.
-- ────────────────────────────────────────────────────────────
CREATE TABLE seguridad_usuario (
    id_usuario              INTEGER         PRIMARY KEY
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    verificacion_dos_pasos  BOOLEAN         DEFAULT false,
    secreto_2fa             TEXT,           -- Secreto TOTP base32. Solo poblar si verificacion_dos_pasos=true
    codigos_respaldo        TEXT[],         -- Códigos de un solo uso para recuperación de acceso
    fecha_configuracion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  seguridad_usuario IS 'Configuración 2FA por usuario. Creada automáticamente junto con configuracion_usuario al registrar el usuario.';
COMMENT ON COLUMN seguridad_usuario.fecha_configuracion IS 'Última modificación del 2FA. Actualizada por trg_actualizar_seguridad_usuario → fn_actualizar_fecha_configuracion.';

-- ────────────────────────────────────────────────────────────
-- 3.4 SESIONES DE USUARIO
-- Timeout automático de 30 min por inactividad (trigger).
-- Heartbeat: UPDATE sesiones_usuario SET ultima_actividad=NOW()
--            WHERE id_sesion=$1 AND activa=true
-- ────────────────────────────────────────────────────────────
CREATE TABLE sesiones_usuario (
    id_sesion               SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    dispositivo             VARCHAR(100),
    navegador               VARCHAR(100),
    sistema_operativo       VARCHAR(100),
    direccion_ip            VARCHAR(45),    -- VARCHAR(45): soporta IPv4 e IPv6
    pais                    VARCHAR(100),
    ciudad                  VARCHAR(100),
    token_sesion            TEXT,           -- JWT o token opaco. Se pone NULL al cerrar sesión
    fecha_inicio            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    activa                  BOOLEAN         DEFAULT true
);

COMMENT ON TABLE sesiones_usuario IS 'Sesiones activas. Timeout 30 min por inactividad (trg_timeout_sesion). Ver fn_invalidar_sesion / fn_invalidar_sesiones_usuario.';

-- ────────────────────────────────────────────────────────────
-- 3.5 RECUPERACIÓN DE CONTRASEÑA
-- Un token activo por usuario (enforced en app). Expira en 1 hora.
-- ────────────────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
    id_token                SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_hash              TEXT            NOT NULL,   -- Hash SHA-256 del UUID enviado al email. Nunca guardar el original
    expira_en               TIMESTAMP       NOT NULL
                                            DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    usado                   BOOLEAN         DEFAULT false,
    ip_solicitud            VARCHAR(45),
    fecha_creacion          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_token_no_vacio CHECK (length(token_hash) > 0)
);

-- ────────────────────────────────────────────────────────────
-- 3.6 CONFIGURACIÓN DE LA EMPRESA (singleton)
-- Una sola fila. El constraint chk_singleton lo garantiza.
-- ────────────────────────────────────────────────────────────
CREATE TABLE configuracion (
    id_config               BOOLEAN         PRIMARY KEY DEFAULT TRUE,
    experiencia_anios       INTEGER,
    valores                 JSONB,          -- [{titulo, descripcion, icono}] — sección Quiénes Somos
    servicios               JSONB,          -- [{numero, titulo, descripcion}] — sección Servicios
    razones                 JSONB,          -- [{titulo, descripcion}] — sección Por Qué Elegirnos
    datos_contacto          JSONB,          -- {email, telefono, direccion, whatsapp}
    redes_sociales          JSONB,          -- {facebook, instagram, twitter, whatsapp}
    fecha_actualizacion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_singleton            CHECK (id_config = TRUE),
    CONSTRAINT chk_experiencia_positiva CHECK (experiencia_anios IS NULL OR experiencia_anios >= 0)
);

COMMENT ON TABLE configuracion IS 'Singleton. Una sola fila con la información editable de la empresa (datos de contacto, servicios, redes sociales, etc.).';

-- ────────────────────────────────────────────────────────────
-- 3.7 INMUEBLES (tabla base)
-- Todas las tablas hijas (casas, apartamentos, etc.) referencian
-- esta tabla por id_inmueble. El soft-delete se hace seteando
-- activo=false + fecha_eliminacion=NOW(). Nunca eliminar filas.
-- ────────────────────────────────────────────────────────────
CREATE TABLE inmuebles (
    id_inmueble             SERIAL              PRIMARY KEY,
    id_usuario              INTEGER             NOT NULL
                                                REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_inmueble           tipo_inmueble       NOT NULL,
    tipo_operacion          tipo_operacion      NOT NULL,
    valor                   DECIMAL(15,2)       NOT NULL,   -- COP. Rango: $200.000 – $50.000.000.000
    valor_administracion    DECIMAL(10,2),
    estrato                 SMALLINT,           -- 1-6 DANE. NULL cuando no aplica (ej: rurales, lotes sin estrato)
    zona                    zona_tipo           NOT NULL,
    estado_inmueble         estado_inmueble     NOT NULL,
    descripcion             TEXT,
    numero_matricula        VARCHAR(100),       -- Matrícula ORIP. NULL permitido (múltiples NULL válidos en UNIQUE de PostgreSQL)
    codigo_catastral        VARCHAR(30),        -- Ficha predial IGAC
    acepta_permuta          BOOLEAN             DEFAULT false,  -- El propietario acepta otro inmueble como parte de pago
    estado_aprobacion       estado_aprobacion   DEFAULT 'pendiente',
    activo                  BOOLEAN             DEFAULT true,
    fecha_eliminacion       TIMESTAMP,          -- Obligatoria cuando activo=false. Enforced por chk_soft_delete_consistente
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
    -- Garantiza exclusividad entre activo y fecha_eliminacion:
    --   activo=true  → fecha_eliminacion debe ser NULL
    --   activo=false → fecha_eliminacion debe estar seteada
    CONSTRAINT chk_soft_delete_consistente
        CHECK (
            (activo = true  AND fecha_eliminacion IS NULL) OR
            (activo = false AND fecha_eliminacion IS NOT NULL)
        )
);

COMMENT ON TABLE  inmuebles IS 'Tabla base de todos los inmuebles. Mínimo 2 fotos para aprobar (validado en app, no en BD).';
COMMENT ON COLUMN inmuebles.acepta_permuta IS 'El propietario acepta otro inmueble como parte de pago. Frecuente en Colombia.';
COMMENT ON COLUMN inmuebles.activo         IS 'false = soft-delete. Nunca eliminar la fila. Usar activo=false + fecha_eliminacion=NOW().';


-- ────────────────────────────────────────────────────────────
-- 3.8 TABLAS HIJAS POR TIPO
-- Cada tabla comparte id_inmueble con la tabla base (PK + FK).
-- Solo existe una fila hija por inmueble; el tipo se lee de
-- inmuebles.tipo_inmueble.
-- ────────────────────────────────────────────────────────────

-- CASAS
CREATE TABLE casas (
    id_inmueble             INTEGER             PRIMARY KEY
                                                REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_lote               DECIMAL(12,2),
    area_construida         DECIMAL(12,2),
    frente                  DECIMAL(10,2),
    fondo                   DECIMAL(10,2),
    pisos                   SMALLINT            NOT NULL    DEFAULT 1,
    anio_construccion       SMALLINT,           -- Año exacto (ej: 1998). Rango 1900-2100
    cantidad_duenos         SMALLINT,
    habitaciones            SMALLINT            NOT NULL,
    banos                   SMALLINT            NOT NULL,
    sala_comedor            tipo_sala_comedor,  -- sala | comedor | sala_comedor (opciones excluyentes)
    tipo_cocina             tipo_cocina,
    cocina_equipada         BOOLEAN             DEFAULT false,
    cuarto_servicio         BOOLEAN             DEFAULT false,
    bano_servicio           BOOLEAN             DEFAULT false,
    tipo_parqueadero        tipo_parqueadero_casa,  -- interno | externo | cubierto | descubierto | ninguno
    parqueadero_cantidad    SMALLINT            DEFAULT 0,
    patio                   BOOLEAN             DEFAULT false,
    jardin                  BOOLEAN             DEFAULT false,
    antejadin               BOOLEAN             DEFAULT false,  -- sin tilde por convención de nombres de columna
    terraza                 BOOLEAN             DEFAULT false,
    balcon                  BOOLEAN             DEFAULT false,
    zona_lavanderia         BOOLEAN             DEFAULT false,
    zona_lavanderia_tipo    tipo_zona_lavanderia,   -- interna | externa. Solo relevante cuando zona_lavanderia=true
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
    -- Si zona_lavanderia=false, el tipo no puede estar seteado
    CONSTRAINT chk_casas_lavanderia_consistente
        CHECK (zona_lavanderia = true OR zona_lavanderia_tipo IS NULL)
);

COMMENT ON TABLE casas IS 'Viviendas unifamiliares o bifamiliares.';


-- APARTAMENTOS
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
    tipo_parqueadero        tipo_parqueadero_apto,  -- privado | comun | ninguno
    balcon                  BOOLEAN             DEFAULT false,
    ascensor                BOOLEAN             DEFAULT false,
    vigilancia              BOOLEAN             DEFAULT false,
    vigilancia_valor        DECIMAL(10,2),      -- Costo mensual COP. NULL cuando vigilancia=false (enforced por constraint)
    zonas_comunes           JSONB               DEFAULT '[]',   -- ["piscina","gimnasio","salon_social","juegos","parque_infantil","bbq"]
    descripcion_acabados    TEXT,

    CONSTRAINT chk_aptos_habitaciones CHECK (habitaciones >= 1),
    CONSTRAINT chk_aptos_banos        CHECK (banos >= 1),
    CONSTRAINT chk_aptos_piso         CHECK (piso IS NULL OR piso >= 1),
    CONSTRAINT chk_aptos_torre        CHECK (torre IS NULL OR torre >= 1),
    CONSTRAINT chk_aptos_frente       CHECK (frente IS NULL OR frente > 0),
    CONSTRAINT chk_aptos_fondo        CHECK (fondo IS NULL OR fondo > 0),
    CONSTRAINT chk_aptos_anio         CHECK (anio_construccion IS NULL OR anio_construccion BETWEEN 1900 AND 2100),
    CONSTRAINT chk_aptos_vig_valor    CHECK (vigilancia_valor IS NULL OR vigilancia_valor >= 0),
    -- Si vigilancia=false, el valor no puede estar seteado
    CONSTRAINT chk_aptos_vigilancia_consistente
        CHECK (vigilancia = true OR vigilancia_valor IS NULL)
);

COMMENT ON TABLE apartamentos IS 'Unidades en propiedad horizontal.';


-- APARTAESTUDIOS
CREATE TABLE apartaestudios (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total              DECIMAL(10,2)   NOT NULL,
    piso                    SMALLINT,
    tiene_bano              BOOLEAN         NOT NULL    DEFAULT true,
    tipo_cocina             tipo_cocina,    -- NULL = sin cocina
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

COMMENT ON TABLE apartaestudios IS 'Unidades compactas de un solo ambiente.';


-- LOTES
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
    servicios_disponibles   JSONB           DEFAULT '[]',   -- ["acueducto","energia","alcantarillado","internet"]
    uso_pot                 VARCHAR(100),   -- vivienda | comercio | industria | mixto | agricola
    tiene_documento         BOOLEAN         DEFAULT false,  -- true = existe catastro o matrícula (número en inmuebles.numero_matricula)
    tiene_casa              BOOLEAN         DEFAULT false,

    CONSTRAINT chk_lotes_area   CHECK (area_total > 0),
    CONSTRAINT chk_lotes_frente CHECK (frente IS NULL OR frente > 0),
    CONSTRAINT chk_lotes_fondo  CHECK (fondo IS NULL OR fondo > 0)
);

COMMENT ON TABLE lotes IS 'Terrenos. Sin habitaciones ni baños en el formulario.';


-- LOCALES
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
    servicios_publicos      JSONB           DEFAULT '[]',   -- ["agua","luz","gas"]
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

COMMENT ON TABLE locales IS 'Espacios comerciales o de servicios. Área total requerida.';


-- BODEGAS
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
    servicios_publicos      JSONB           DEFAULT '[]',   -- ["energia_trifasica","agua","gas","internet"]
    parqueaderos            SMALLINT        DEFAULT 0,

    CONSTRAINT chk_bodegas_area_const  CHECK (area_construida > 0),
    CONSTRAINT chk_bodegas_frente      CHECK (frente > 0),
    CONSTRAINT chk_bodegas_fondo       CHECK (fondo > 0),
    CONSTRAINT chk_bodegas_area_lote   CHECK (area_lote IS NULL OR area_lote > 0),
    CONSTRAINT chk_bodegas_altura      CHECK (altura_libre IS NULL OR altura_libre > 0),
    CONSTRAINT chk_bodegas_parqueadero CHECK (parqueaderos >= 0)
);

COMMENT ON TABLE bodegas IS 'Uso industrial, logístico o de almacenamiento. Área, frente y fondo obligatorios.';


-- FINCAS
-- IMPORTANTE: piscina, cancha, lago_estanque = amenidades PROPIAS de la finca.
-- Las del conjunto/vecindario van en caracteristicas_generales.
CREATE TABLE fincas (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total              DECIMAL(15,2)   NOT NULL,
    unidad_area             unidad_area_finca DEFAULT 'm2',     -- m2 | hectareas | fanegadas | cuadras
    area_cultivable         DECIMAL(15,2),
    area_construcciones     DECIMAL(12,2),
    topografia              tipo_topografia,
    fuentes_agua            TEXT,
    casa_principal          BOOLEAN         DEFAULT false,
    casa_principal_detalle  JSONB,          -- Campos del formulario de casa cuando casa_principal=true. Ej: {"habitaciones":3,"banos":2}
    otras_construcciones    TEXT,
    numero_casas            SMALLINT        DEFAULT 0,
    tipo_via_acceso         tipo_via_acceso,
    descripcion_via         TEXT,
    cultivos_actuales       TEXT,
    animales                TEXT,
    servicios_disponibles   JSONB           DEFAULT '[]',   -- ["acueducto","acueducto_veredal","energia","alcantarillado","pozo_septico","gas","internet"]
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

COMMENT ON TABLE fincas IS 'Predios rurales. piscina/cancha/lago = propias de la finca. Las del conjunto van en caracteristicas_generales.';


-- ────────────────────────────────────────────────────────────
-- 3.9 UBICACIONES
-- servicios_sector = servicios del barrio/vereda.
-- No confundir con servicios_publicos del inmueble (bodegas/locales).
-- Filtro por servicio: WHERE servicios_sector ? 'gas'
-- ────────────────────────────────────────────────────────────
CREATE TABLE ubicaciones (
    id_inmueble             INTEGER         PRIMARY KEY
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    direccion               VARCHAR(500)    NOT NULL,
    barrio_vereda           VARCHAR(255),
    municipio               VARCHAR(100)    NOT NULL,
    departamento            VARCHAR(100)    NOT NULL,   -- Uno de los 32 departamentos de Colombia
    latitud                 DECIMAL(10,8),
    longitud                DECIMAL(11,8),
    servicios_sector        JSONB           DEFAULT '[]',

    CONSTRAINT chk_municipio    CHECK (length(trim(municipio)) >= 2),
    CONSTRAINT chk_departamento CHECK (length(trim(departamento)) >= 2),
    CONSTRAINT chk_latitud      CHECK (latitud IS NULL OR latitud BETWEEN -90 AND 90),
    CONSTRAINT chk_longitud     CHECK (longitud IS NULL OR longitud BETWEEN -180 AND 180)
);

COMMENT ON TABLE ubicaciones IS 'Dirección y coordenadas de cada inmueble.';
COMMENT ON COLUMN ubicaciones.servicios_sector IS 'Servicios del sector (barrio/vereda), no del inmueble. Filtrar: WHERE servicios_sector ? ''gas''.';


-- ────────────────────────────────────────────────────────────
-- 3.10 FOTOGRAFÍAS
-- Una sola portada por inmueble garantizada por idx_portada_unica.
-- Al eliminar la portada, promover otra foto desde la app.
-- Mínimo 2 fotos para aprobar publicación (validado en app, no en BD).
-- ────────────────────────────────────────────────────────────
CREATE TABLE fotografias (
    id_foto                 SERIAL          PRIMARY KEY,
    id_inmueble             INTEGER         NOT NULL
                                            REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    url_foto                TEXT            NOT NULL,
    descripcion             VARCHAR(255),
    tipo_media              tipo_media      DEFAULT 'foto',
    es_portada              BOOLEAN         DEFAULT false,
    orden                   SMALLINT        DEFAULT 1,      -- Posición en galería, empieza en 1
    fecha_subida            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_fotos_orden  CHECK (orden >= 1),
    CONSTRAINT chk_url_no_vacia CHECK (length(trim(url_foto)) > 0)
);


-- ────────────────────────────────────────────────────────────
-- 3.11 CARACTERÍSTICAS GENERALES (amenidades de conjunto)
-- Relación M:N con inmuebles via inmuebles_caracteristicas.
-- ────────────────────────────────────────────────────────────
CREATE TABLE caracteristicas_generales (
    id_caracteristica       SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(100)    NOT NULL,
    descripcion             TEXT,
    icono                   VARCHAR(100),
    categoria               VARCHAR(50)     DEFAULT 'general',  -- seguridad | recreacion | servicios | accesibilidad | exterior | ubicacion | parqueadero
    activo                  BOOLEAN         DEFAULT true,
    fecha_creacion          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_caracteristicas_nombre UNIQUE (nombre)
);

COMMENT ON TABLE caracteristicas_generales IS 'Amenidades externas del conjunto o edificio. Las propias de fincas van en la tabla fincas.';

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
-- Pueden o no estar asociados a un inmueble específico.
-- El ciclo de vida completo se maneja en app; las columnas
-- fecha_vista, fecha_resolucion, respuesta_admin y fecha_no_resuelto
-- se añadieron via ALTER TABLE (ver sección 9.5).
-- ────────────────────────────────────────────────────────────
CREATE TABLE contactos (
    id_contacto             SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(255)    NOT NULL,
    email                   VARCHAR(255)    NOT NULL,
    telefono                VARCHAR(20),
    asunto                  VARCHAR(100)    NOT NULL,
    mensaje                 TEXT            NOT NULL,
    id_inmueble             INTEGER         REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL,   -- NULL = consulta general
    id_usuario              INTEGER         REFERENCES usuarios(id_usuario)   ON DELETE SET NULL,   -- NULL = visitante no registrado
    estado                  estado_contacto DEFAULT 'pendiente',
    respuesta               TEXT,
    fecha_contacto          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta         TIMESTAMP,

    CONSTRAINT chk_contacto_mensaje CHECK (length(mensaje) >= 10),
    CONSTRAINT chk_contacto_email   CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE contactos IS 'Consultas recibidas. Pueden o no estar asociadas a un inmueble.';


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
-- admin_revisor usa ON DELETE SET NULL para no bloquear la
-- eliminación de un admin que ya haya revisado solicitudes.
-- El campo tipo_solicitud y las columnas de rechazo se añadieron
-- via ALTER TABLE (ver sección 9.6).
-- ────────────────────────────────────────────────────────────
CREATE TABLE solicitudes_publicacion (
    id_solicitud            SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_inmueble             INTEGER         REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL,
    datos                   JSONB           NOT NULL,   -- Snapshot: {tipo_inmueble, tipo_operacion, valor, campos_especificos, ubicacion, fotos[]}
    estado_aprobacion       estado_aprobacion   DEFAULT 'pendiente',
    admin_revisor           INTEGER         REFERENCES usuarios(id_usuario) ON DELETE SET NULL,  -- NULL si el admin fue eliminado
    motivo_rechazo          TEXT,           -- Obligatorio en app cuando estado=rechazado
    fecha_solicitud         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    fecha_revision          TIMESTAMP
);

COMMENT ON TABLE solicitudes_publicacion IS 'Flujo de revisión admin. Snapshot del formulario en campo datos.';


-- ────────────────────────────────────────────────────────────
-- 3.15 HISTORIAL DE PRECIOS
-- Llenada automáticamente por trg_historial_precio.
-- ────────────────────────────────────────────────────────────
CREATE TABLE historial_precios (
    id_historial            SERIAL          PRIMARY KEY,
    id_inmueble             INTEGER         NOT NULL REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    valor_anterior          DECIMAL(15,2)   NOT NULL,
    valor_nuevo             DECIMAL(15,2)   NOT NULL,
    motivo                  VARCHAR(100),
    fecha_cambio            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


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
    fecha_lectura           TIMESTAMP           -- Registrada automáticamente por trg_fecha_lectura_notificacion
);

COMMENT ON TABLE notificaciones IS 'Alertas internas del sistema.';


-- ────────────────────────────────────────────────────────────
-- 3.17 SOLICITUDES DE ELIMINACIÓN DE CUENTA
-- Flujo: cliente solicita → admin revisa → aprueba (activo=false)
-- o rechaza. admin_revisor usa ON DELETE SET NULL (igual que
-- solicitudes_publicacion).
-- ────────────────────────────────────────────────────────────
CREATE TABLE solicitudes_eliminacion_cuenta (
    id_solicitud            SERIAL                  PRIMARY KEY,
    id_usuario              INTEGER                 NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    motivo                  TEXT,
    estado                  estado_solicitud_cuenta DEFAULT 'pendiente',
    admin_revisor           INTEGER                 REFERENCES usuarios(id_usuario) ON DELETE SET NULL,  -- NULL si el admin fue eliminado
    nota_admin              TEXT,
    fecha_solicitud         TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion        TIMESTAMP
);

COMMENT ON TABLE solicitudes_eliminacion_cuenta IS 'Baja de cuentas: cliente solicita → admin revisa → aprueba (activo=false) o rechaza.';


-- ────────────────────────────────────────────────────────────
-- 3.18 KEEP ALIVE (singleton)
-- Cron externo hace ping cada 5 días para mantener activa la
-- instancia de Supabase:
--   UPDATE keep_alive SET last_ping=NOW() WHERE id=TRUE
-- Sin índice: tabla de 1 fila, índice no aporta al planner.
-- ────────────────────────────────────────────────────────────
CREATE TABLE keep_alive (
    id          BOOLEAN     PRIMARY KEY DEFAULT TRUE,
    last_ping   TIMESTAMP   DEFAULT NOW(),
    CONSTRAINT chk_keep_alive_singleton CHECK (id = TRUE)
);


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

-- Reset de contraseña
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
CREATE UNIQUE INDEX idx_portada_unica          -- Garantiza una sola portada por inmueble
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

-- JSONB de servicios (bodegas, lotes, fincas)
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

-- Historial de precios
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

-- Configuración y seguridad de usuario
CREATE INDEX idx_configuracion_usuario
    ON configuracion_usuario USING btree (id_usuario);
CREATE INDEX idx_seguridad_usuario
    ON seguridad_usuario USING btree (id_usuario);

-- Solicitudes de publicación
CREATE INDEX idx_solicitudes_pub_usuario
    ON solicitudes_publicacion (id_usuario);
CREATE INDEX idx_solicitudes_pub_estado
    ON solicitudes_publicacion (estado_aprobacion, fecha_solicitud DESC);

-- Solicitudes de eliminación de cuenta
CREATE INDEX idx_solicitudes_cuenta_usuario
    ON solicitudes_eliminacion_cuenta (id_usuario);
CREATE INDEX idx_solicitudes_cuenta_estado
    ON solicitudes_eliminacion_cuenta (estado);
CREATE UNIQUE INDEX idx_una_solicitud_activa   -- Un solo ticket activo por usuario
    ON solicitudes_eliminacion_cuenta (id_usuario)
    WHERE estado IN ('pendiente', 'en_revision');


-- ============================================================
-- SECCIÓN 5: FUNCIONES
-- ============================================================

-- Actualiza fecha_actualizacion en UPDATE.
-- Usada por: trg_actualizar_config_usuario, trg_actualizar_configuracion,
--            trg_actualizar_borrador.
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_actualizacion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


-- Actualiza fecha_configuracion en seguridad_usuario.
-- DISTINTA de fn_actualizar_fecha_actualizacion: la columna en
-- seguridad_usuario se llama fecha_configuracion, no fecha_actualizacion.
-- Usada por: trg_actualizar_seguridad_usuario.
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_configuracion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.fecha_configuracion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


-- Inicializa configuracion_usuario y seguridad_usuario al crear un usuario.
-- Disparado por: trg_crear_config_usuario (AFTER INSERT ON usuarios).
CREATE OR REPLACE FUNCTION fn_crear_config_usuario()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO configuracion_usuario (id_usuario) VALUES (NEW.id_usuario);
    INSERT INTO seguridad_usuario     (id_usuario) VALUES (NEW.id_usuario);
    RETURN NEW;
END;
$$;


-- Registra en historial_precios cuando cambia inmuebles.valor.
-- Disparado por: trg_historial_precio (BEFORE UPDATE OF valor ON inmuebles).
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


-- Registra fecha_lectura cuando una notificación pasa de no leída a leída.
-- Disparado por: trg_fecha_lectura_notificacion (BEFORE UPDATE OF leida ON notificaciones).
CREATE OR REPLACE FUNCTION fn_marcar_fecha_lectura()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.leida = true AND OLD.leida = false THEN
        NEW.fecha_lectura = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;


-- Cierra automáticamente sesiones inactivas tras 30 minutos.
-- Lógica:
--   - Si la sesión ya estaba inactiva (activa=false), no hace nada.
--   - Si el backend actualizó ultima_actividad (heartbeat), no cierra.
--   - Sin heartbeat y 30 min vencidos → activa=false, token_sesion=NULL.
-- Heartbeat desde app: UPDATE sesiones_usuario SET ultima_actividad=NOW()
--                      WHERE id_sesion=$1 AND activa=true
-- Disparado por: trg_timeout_sesion (BEFORE UPDATE ON sesiones_usuario).
CREATE OR REPLACE FUNCTION fn_cerrar_sesion_inactiva()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.activa = false THEN
        RETURN NEW;
    END IF;
    IF NEW.ultima_actividad > OLD.ultima_actividad THEN
        RETURN NEW;
    END IF;
    IF OLD.ultima_actividad < CURRENT_TIMESTAMP - INTERVAL '30 minutes' THEN
        NEW.activa       := false;
        NEW.token_sesion := NULL;
    END IF;
    RETURN NEW;
END;
$$;


-- Cierra una sesión individual por ID. Usar en logout.
CREATE OR REPLACE FUNCTION fn_invalidar_sesion(p_id_sesion INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE sesiones_usuario
    SET    activa = false, token_sesion = NULL
    WHERE  id_sesion = p_id_sesion AND activa = true;
END;
$$;


-- Cierra todas las sesiones activas de un usuario.
-- Usar al: cambiar contraseña, aprobar eliminación de cuenta, suspender usuario.
CREATE OR REPLACE FUNCTION fn_invalidar_sesiones_usuario(p_id_usuario INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE sesiones_usuario
    SET    activa = false, token_sesion = NULL
    WHERE  id_usuario = p_id_usuario AND activa = true;
END;
$$;


-- Mantenimiento diario: elimina tokens expirados y sesiones inactivas antiguas.
-- Programar con pg_cron:
--   SELECT cron.schedule('0 3 * * *', 'SELECT fn_limpiar_tokens_expirados()');
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


-- ============================================================
-- SECCIÓN 6: TRIGGERS
-- ============================================================

-- Crea configuracion_usuario y seguridad_usuario al registrar un nuevo usuario
CREATE TRIGGER trg_crear_config_usuario
    AFTER INSERT ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_crear_config_usuario();

-- Actualiza fecha_actualizacion al modificar preferencias de usuario
CREATE TRIGGER trg_actualizar_config_usuario
    BEFORE UPDATE ON configuracion_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();

-- Actualiza fecha_configuracion al modificar la configuración 2FA
-- IMPORTANTE: usa fn_actualizar_fecha_CONFIGURACION (no fn_actualizar_fecha_actualizacion)
-- porque la columna en seguridad_usuario se llama fecha_configuracion.
CREATE TRIGGER trg_actualizar_seguridad_usuario
    BEFORE UPDATE ON seguridad_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_configuracion();

-- Actualiza fecha_actualizacion al modificar la config de la empresa
CREATE TRIGGER trg_actualizar_configuracion
    BEFORE UPDATE ON configuracion
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();

-- Registra en historial_precios cada vez que cambia el valor de un inmueble
CREATE TRIGGER trg_historial_precio
    BEFORE UPDATE OF valor ON inmuebles
    FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_precio();

-- Registra fecha_lectura al marcar una notificación como leída
CREATE TRIGGER trg_fecha_lectura_notificacion
    BEFORE UPDATE OF leida ON notificaciones
    FOR EACH ROW EXECUTE FUNCTION fn_marcar_fecha_lectura();

-- Cierra sesiones con más de 30 min de inactividad en cada UPDATE
CREATE TRIGGER trg_timeout_sesion
    BEFORE UPDATE ON sesiones_usuario
    FOR EACH ROW EXECUTE FUNCTION fn_cerrar_sesion_inactiva();


-- ============================================================
-- SECCIÓN 7: VISTAS
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 7.1 LISTADO PÚBLICO DEL BUSCADOR
-- Solo muestra inmuebles aprobados y activos.
-- No expone el email del propietario.
-- ────────────────────────────────────────────────────────────
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


-- ────────────────────────────────────────────────────────────
-- 7.2 FICHA COMPLETA DE UN INMUEBLE
-- Incluye los campos específicos de cada tipo en JSONB
-- (detalle_casa, detalle_apartamento, etc.). Solo uno será
-- no-NULL según tipo_inmueble.
-- email_propietario es NULL cuando ocultar_informacion=true.
-- Uso típico: WHERE id_inmueble = $1
-- ────────────────────────────────────────────────────────────
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

    usr.nombre_completo                                         AS nombre_propietario,
    usr.telefono                                                AS telefono_propietario,
    -- NULL si el propietario activó ocultar_informacion en su configuración
    CASE WHEN COALESCE(cfg.ocultar_informacion, false) = false
         THEN usr.email
         ELSE NULL
    END                                                         AS email_propietario,
    usr.es_dueno,

    u.direccion,
    u.barrio_vereda,
    u.municipio,
    u.departamento,
    u.latitud,
    u.longitud,
    u.servicios_sector,

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


-- ────────────────────────────────────────────────────────────
-- 7.3 ESTADÍSTICAS DEL PANEL ADMIN
-- Métricas en tiempo real. nuevos_esta_semana usa semana
-- calendario ISO (lunes-domingo) vía date_trunc('week').
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_stats_admin AS
SELECT
    (SELECT COUNT(*) FROM inmuebles WHERE activo = true)                                    AS total_inmuebles,
    (SELECT COUNT(*) FROM inmuebles WHERE estado_aprobacion = 'aprobado'  AND activo = true) AS inmuebles_aprobados,
    (SELECT COUNT(*) FROM inmuebles WHERE estado_aprobacion = 'pendiente' AND activo = true) AS inmuebles_pendientes,
    (SELECT COUNT(*) FROM inmuebles WHERE tipo_operacion = 'venta'    AND estado_aprobacion = 'aprobado' AND activo = true) AS en_venta,
    (SELECT COUNT(*) FROM inmuebles WHERE tipo_operacion = 'arriendo' AND estado_aprobacion = 'aprobado' AND activo = true) AS en_arriendo,
    (SELECT COUNT(*) FROM usuarios WHERE activo = true)                                     AS total_usuarios,
    (SELECT COUNT(*) FROM usuarios WHERE fecha_registro >= date_trunc('week', CURRENT_DATE)::date) AS nuevos_esta_semana,
    (SELECT COUNT(*) FROM contactos WHERE estado = 'pendiente')                             AS contactos_sin_responder,
    (SELECT COUNT(*) FROM solicitudes_eliminacion_cuenta WHERE estado IN ('pendiente', 'en_revision')) AS solicitudes_cuenta_pendientes,
    (SELECT COUNT(*) FROM notificaciones WHERE leida = false)                               AS notificaciones_no_leidas_sistema;


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
-- SECCIÓN 9: EXTENSIONES v3.8
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 9.1 BORRADORES DE INMUEBLES
-- Formularios incompletos guardados por usuario.
-- Límite enforced en app: cliente=1 borrador, admin=5 borradores.
-- ────────────────────────────────────────────────────────────
CREATE TABLE borradores_inmuebles (
    id_borrador             SERIAL          PRIMARY KEY,
    id_usuario              INTEGER         NOT NULL
                                            REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    titulo                  VARCHAR(100),   -- Identificador visual para admins con múltiples borradores
    datos                   JSONB           NOT NULL,   -- Snapshot: {formData, ubicacion, servicios, caract}
    paso_actual             SMALLINT        DEFAULT 1,  -- Último paso alcanzado (1-4)
    fecha_creacion          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_borrador_paso CHECK (paso_actual BETWEEN 1 AND 4)
);

COMMENT ON TABLE borradores_inmuebles IS 'Borradores de publicación. Límite por rol enforced en app: cliente=1, admin=5.';

CREATE INDEX idx_borradores_usuario
    ON borradores_inmuebles (id_usuario, fecha_actualizacion DESC);

CREATE TRIGGER trg_actualizar_borrador
    BEFORE UPDATE ON borradores_inmuebles
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();


-- ────────────────────────────────────────────────────────────
-- 9.2-9.4 VALORES ADICIONALES EN ENUMS
-- No se pueden incluir aquí porque los tipos se recrean desde
-- cero en la sección 2. Ejecutar como migraciones separadas
-- desde el archivo migraciones_post_v3.4.sql:
--
--   ALTER TYPE tipo_sala_comedor  ADD VALUE 'separados';
--   ALTER TYPE estado_contacto    ADD VALUE IF NOT EXISTS 'recibido';
--   ALTER TYPE estado_contacto    ADD VALUE IF NOT EXISTS 'resuelto';
--   ALTER TYPE estado_contacto    ADD VALUE IF NOT EXISTS 'no_resuelto';
--   ALTER TYPE tipo_notificacion  ADD VALUE IF NOT EXISTS 'solicitud';
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- 9.5 COLUMNAS ADICIONALES EN CONTACTOS
-- Ciclo de vida ampliado para mensajes. Ejecutar via ALTER TABLE:
--
--   ALTER TABLE contactos
--     ADD COLUMN fecha_vista        TIMESTAMP,  -- cuando el admin vio el contacto
--     ADD COLUMN fecha_resolucion   TIMESTAMP,  -- cuando se marcó como resuelto
--     ADD COLUMN respuesta_admin    TEXT,        -- respuesta del admin al resolver
--     ADD COLUMN fecha_no_resuelto  TIMESTAMP;  -- cuando se marcó como no_resuelto (7 días)
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contactos_estado ON contactos (estado);


-- ────────────────────────────────────────────────────────────
-- 9.6 COLUMNAS ADICIONALES EN SOLICITUDES_PUBLICACION
-- Para solicitudes de edición y verificación de cambios en reenvío.
-- Ejecutar via ALTER TABLE:
--
--   ALTER TABLE solicitudes_publicacion
--     ADD COLUMN tipo_solicitud            VARCHAR(20) DEFAULT 'publicacion',  -- publicacion | edicion
--     ADD COLUMN snapshot_datos_rechazo    JSONB,       -- datos al momento del rechazo, para comparar en reenvío
--     ADD COLUMN fecha_rechazo             TIMESTAMP;
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_solicitudes_pub_tipo_inmueble
    ON solicitudes_publicacion (id_inmueble, tipo_solicitud, estado_aprobacion)
    WHERE tipo_solicitud = 'edicion';


-- ────────────────────────────────────────────────────────────
-- 9.7 NOTIFICACIONES DE CAMBIOS EN FAVORITOS
-- Notifica a los usuarios cuando un inmueble guardado como
-- favorito cambia de precio o es desactivado.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notificar_cambio_favorito()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.valor IS DISTINCT FROM NEW.valor THEN
        INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje, id_inmueble)
        SELECT f.id_usuario, 'favorito',
               'Cambio de precio en propiedad guardada',
               'Una propiedad en tus favoritos cambió de precio.',
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

CREATE TRIGGER trg_notificar_cambio_favorito
    AFTER UPDATE OF valor, activo ON inmuebles
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_cambio_favorito();


-- ============================================================
-- RESUMEN v3.8
-- ============================================================
-- Tablas     : 26  (25 base + borradores_inmuebles)
-- Índices    : 44
-- Tipos      : 18  (con valores adicionales via ALTER en
--                   migraciones_post_v3.4.sql)
-- Funciones  : 10  (9 base + fn_notificar_cambio_favorito)
-- Triggers   : 9   (7 base + trg_actualizar_borrador,
--                   trg_notificar_cambio_favorito)
-- Vistas     : 3
--
-- HISTORIAL DE VERSIONES
-- ─────────────────────────────────────────────────────────────
-- v3.4   Base estable. Correcciones de producción:
--          · trg_actualizar_seguridad_usuario apunta a función correcta
--          · chk_soft_delete_consistente bidireccional
--          · email_propietario respeta ocultar_informacion
--          · admin_revisor con ON DELETE SET NULL
--          · constraints de consistencia en casas y apartamentos
-- v3.5   Migración incorrecta (estados en tabla equivocada)
-- v3.5.1 Rollback de v3.5
-- v3.8   Estado actual:
--          · Tabla borradores_inmuebles
--          · Valores adicionales en enums (via ALTER separado)
--          · Columnas de ciclo de vida en contactos
--          · Columnas de edición/rechazo en solicitudes_publicacion
--          · fn_notificar_cambio_favorito + trigger
-- ============================================================