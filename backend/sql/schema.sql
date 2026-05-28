-- ============================================================
-- DUMP DE ESTRUCTURA - Base de datos Supabase
-- Generado: 2026-05-26T21:49:34.669Z
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE estado_aprobacion AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE estado_contacto AS ENUM ('pendiente', 'respondido', 'cerrado');
CREATE TYPE estado_inmueble AS ENUM ('nuevo', 'usado', 'remodelado');
CREATE TYPE rol_usuario AS ENUM ('cliente', 'comisionista', 'admin');
CREATE TYPE tipo_inmueble AS ENUM ('lote', 'local', 'bodega', 'finca', 'casa', 'apartamento', 'apartaestudio');
CREATE TYPE tipo_operacion AS ENUM ('venta', 'arriendo');
CREATE TYPE zona_tipo AS ENUM ('rural', 'urbano');

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE apartaestudios (
    id_inmueble INTEGER NOT NULL,
    area_total DECIMAL(10,2) NOT NULL,
    tiene_bano BOOLEAN NOT NULL,
    parqueadero BOOLEAN DEFAULT false,
    balcon BOOLEAN DEFAULT false,
    amoblado BOOLEAN DEFAULT false,
    cocina VARCHAR(50),
    descripcion_acabados TEXT
);

CREATE TABLE apartamentos (
    id_inmueble INTEGER NOT NULL,
    frente DECIMAL(10,2),
    fondo DECIMAL(10,2),
    anos_construccion SMALLINT,
    cantidad_duenos SMALLINT,
    piso SMALLINT,
    torre SMALLINT,
    habitaciones SMALLINT NOT NULL,
    banos SMALLINT NOT NULL,
    sala_comedor VARCHAR(50),
    cocina VARCHAR(50),
    parqueadero VARCHAR(20),
    balcon BOOLEAN DEFAULT false,
    ascensor BOOLEAN DEFAULT false,
    vigilancia BOOLEAN DEFAULT false,
    valor_vigilancia DECIMAL(10,2),
    valor_administracion DECIMAL(10,2),
    zonas_comunes TEXT,
    descripcion_acabados TEXT
);

CREATE TABLE bodegas (
    id_inmueble INTEGER NOT NULL,
    area_construida DECIMAL(12,2),
    frente DECIMAL(10,2),
    fondo DECIMAL(10,2),
    altura_libre DECIMAL(10,2),
    tipo_porton VARCHAR(100),
    capacidad_carga TEXT,
    oficinas BOOLEAN DEFAULT false,
    banos BOOLEAN DEFAULT false,
    vestier BOOLEAN DEFAULT false,
    acceso_camiones BOOLEAN DEFAULT false,
    servicios_especiales TEXT
);

CREATE TABLE caracteristicas_generales (
    id_caracteristica SERIAL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(100),
    categoria VARCHAR(50) DEFAULT 'general'::character varying,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE casas (
    id_inmueble INTEGER NOT NULL,
    frente DECIMAL(10,2),
    fondo DECIMAL(10,2),
    anos_construccion SMALLINT,
    cantidad_duenos SMALLINT,
    pisos SMALLINT,
    habitaciones SMALLINT NOT NULL,
    banos SMALLINT NOT NULL,
    sala_comedor VARCHAR(50),
    cocina VARCHAR(50),
    parqueadero VARCHAR(50),
    patio BOOLEAN DEFAULT false,
    jardin BOOLEAN DEFAULT false,
    terraza BOOLEAN DEFAULT false,
    balcon BOOLEAN DEFAULT false,
    zona_lavanderia VARCHAR(20),
    descripcion_acabados TEXT
);

CREATE TABLE configuracion (
    id_config SERIAL,
    experiencia_anios INTEGER,
    valores JSONB,
    servicios JSONB,
    razones JSONB,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuracion_usuario (
    id_usuario INTEGER NOT NULL,
    idioma VARCHAR(10) DEFAULT 'es'::character varying,
    tema VARCHAR(10) DEFAULT 'claro'::character varying,
    notificaciones_email BOOLEAN DEFAULT true,
    notificaciones_app BOOLEAN DEFAULT true,
    perfil_publico BOOLEAN DEFAULT true,
    permitir_contacto BOOLEAN DEFAULT true,
    ocultar_informacion BOOLEAN DEFAULT false,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contactos (
    id_contacto SERIAL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    asunto VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    id_inmueble INTEGER,
    id_usuario INTEGER,
    estado estado_contacto DEFAULT 'pendiente'::estado_contacto,
    fecha_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favoritos (
    id_usuario INTEGER NOT NULL,
    id_inmueble INTEGER NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fincas (
    id_inmueble INTEGER NOT NULL,
    area_total DECIMAL(15,2) NOT NULL,
    unidad_area VARCHAR(20) DEFAULT 'm2'::character varying,
    area_cultivable DECIMAL(15,2),
    area_construcciones DECIMAL(12,2),
    fuentes_agua TEXT,
    casa_principal BOOLEAN DEFAULT false,
    otras_construcciones TEXT,
    vias_acceso VARCHAR(50),
    cultivos_actuales TEXT,
    topografia VARCHAR(50),
    servicios_disponibles TEXT
);

CREATE TABLE fotografias (
    id_foto SERIAL,
    id_inmueble INTEGER NOT NULL,
    url_foto TEXT NOT NULL,
    descripcion VARCHAR(255),
    es_portada BOOLEAN DEFAULT false,
    orden SMALLINT DEFAULT 0,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inmuebles (
    id_inmueble SERIAL,
    id_usuario INTEGER NOT NULL,
    tipo_inmueble tipo_inmueble NOT NULL,
    tipo_operacion tipo_operacion NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    estrato SMALLINT,
    zona zona_tipo NOT NULL,
    estado_inmueble estado_inmueble NOT NULL,
    descripcion TEXT,
    numero_matricula VARCHAR(100),
    estado_aprobacion estado_aprobacion DEFAULT 'pendiente'::estado_aprobacion,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP
);

CREATE TABLE inmuebles_caracteristicas (
    id_inmueble INTEGER NOT NULL,
    id_caracteristica INTEGER NOT NULL
);

CREATE TABLE keep_alive (
    id SERIAL,
    dummy_text TEXT,
    last_ping TIMESTAMP DEFAULT now()
);

CREATE TABLE locales (
    id_inmueble INTEGER NOT NULL,
    zona_local VARCHAR(20),
    uso_pot VARCHAR(50),
    frente DECIMAL(10,2),
    fondo DECIMAL(10,2),
    altura DECIMAL(10,2),
    mezzanine BOOLEAN DEFAULT false,
    banos BOOLEAN DEFAULT false,
    servicios_publicos TEXT,
    parqueaderos TEXT,
    descripcion_acabados TEXT
);

CREATE TABLE lotes (
    id_inmueble INTEGER NOT NULL,
    area_total DECIMAL(12,2) NOT NULL,
    frente DECIMAL(10,2),
    fondo DECIMAL(10,2),
    pendiente BOOLEAN DEFAULT false,
    topografia VARCHAR(50),
    vias_acceso VARCHAR(100),
    servicios_zona TEXT,
    uso_pot VARCHAR(50),
    tiene_casa BOOLEAN DEFAULT false
);

CREATE TABLE seguridad_usuario (
    id_usuario INTEGER NOT NULL,
    verificacion_dos_pasos BOOLEAN DEFAULT false,
    secreto_2fa TEXT,
    codigos_respaldo ARRAY,
    fecha_configuracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesiones_usuario (
    id_sesion SERIAL,
    id_usuario INTEGER NOT NULL,
    dispositivo VARCHAR(100),
    navegador VARCHAR(100),
    sistema_operativo VARCHAR(100),
    direccion_ip VARCHAR(45),
    pais VARCHAR(100),
    ciudad VARCHAR(100),
    token_sesion TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP,
    activa BOOLEAN DEFAULT true
);

CREATE TABLE solicitudes_publicacion (
    id_solicitud SERIAL,
    id_usuario INTEGER NOT NULL,
    datos JSONB NOT NULL,
    estado_aprobacion estado_aprobacion DEFAULT 'pendiente'::estado_aprobacion,
    admin_revisor INTEGER,
    motivo_rechazo TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP
);

CREATE TABLE ubicaciones (
    id_inmueble INTEGER NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    barrio_vereda VARCHAR(255),
    municipio VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8)
);

CREATE TABLE usuarios (
    id_usuario SERIAL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_identificacion VARCHAR(20) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'cliente'::rol_usuario,
    es_dueno BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP
);

-- ============================================================
-- PRIMARY KEYS
-- ============================================================

ALTER TABLE apartaestudios ADD PRIMARY KEY (id_inmueble);
ALTER TABLE apartamentos ADD PRIMARY KEY (id_inmueble);
ALTER TABLE bodegas ADD PRIMARY KEY (id_inmueble);
ALTER TABLE caracteristicas_generales ADD PRIMARY KEY (id_caracteristica);
ALTER TABLE casas ADD PRIMARY KEY (id_inmueble);
ALTER TABLE configuracion ADD PRIMARY KEY (id_config);
ALTER TABLE configuracion_usuario ADD PRIMARY KEY (id_usuario);
ALTER TABLE contactos ADD PRIMARY KEY (id_contacto);
ALTER TABLE favoritos ADD PRIMARY KEY (id_usuario, id_inmueble);
ALTER TABLE fincas ADD PRIMARY KEY (id_inmueble);
ALTER TABLE fotografias ADD PRIMARY KEY (id_foto);
ALTER TABLE inmuebles ADD PRIMARY KEY (id_inmueble);
ALTER TABLE inmuebles_caracteristicas ADD PRIMARY KEY (id_inmueble, id_caracteristica);
ALTER TABLE keep_alive ADD PRIMARY KEY (id);
ALTER TABLE locales ADD PRIMARY KEY (id_inmueble);
ALTER TABLE lotes ADD PRIMARY KEY (id_inmueble);
ALTER TABLE seguridad_usuario ADD PRIMARY KEY (id_usuario);
ALTER TABLE sesiones_usuario ADD PRIMARY KEY (id_sesion);
ALTER TABLE solicitudes_publicacion ADD PRIMARY KEY (id_solicitud);
ALTER TABLE ubicaciones ADD PRIMARY KEY (id_inmueble);
ALTER TABLE usuarios ADD PRIMARY KEY (id_usuario);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE apartaestudios ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE apartamentos ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE bodegas ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE casas ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE contactos ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE contactos ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL;
ALTER TABLE favoritos ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE favoritos ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE fincas ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE fotografias ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE inmuebles ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE inmuebles_caracteristicas ADD FOREIGN KEY (id_caracteristica) REFERENCES caracteristicas_generales(id_caracteristica) ON DELETE CASCADE;
ALTER TABLE inmuebles_caracteristicas ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE locales ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE lotes ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;
ALTER TABLE solicitudes_publicacion ADD FOREIGN KEY (admin_revisor) REFERENCES usuarios(id_usuario);
ALTER TABLE solicitudes_publicacion ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE ubicaciones ADD FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE;

-- ============================================================
-- CHECK CONSTRAINTS
-- ============================================================

ALTER TABLE apartaestudios ADD CONSTRAINT apartaestudios_area_total_check CHECK ((area_total > (0)::numeric));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_valor_administracion_check CHECK ((valor_administracion >= (0)::numeric));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_valor_vigilancia_check CHECK ((valor_vigilancia >= (0)::numeric));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_banos_check CHECK ((banos >= 1));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_habitaciones_check CHECK ((habitaciones >= 1));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_torre_check CHECK ((torre >= 1));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_piso_check CHECK ((piso >= 1));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_cantidad_duenos_check CHECK ((cantidad_duenos > 0));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_anos_construccion_check CHECK ((anos_construccion > 0));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_frente_check CHECK ((frente > (0)::numeric));
ALTER TABLE apartamentos ADD CONSTRAINT apartamentos_fondo_check CHECK ((fondo > (0)::numeric));
ALTER TABLE bodegas ADD CONSTRAINT bodegas_fondo_check CHECK ((fondo > (0)::numeric));
ALTER TABLE bodegas ADD CONSTRAINT bodegas_area_construida_check CHECK ((area_construida > (0)::numeric));
ALTER TABLE bodegas ADD CONSTRAINT bodegas_frente_check CHECK ((frente > (0)::numeric));
ALTER TABLE bodegas ADD CONSTRAINT bodegas_altura_libre_check CHECK ((altura_libre > (0)::numeric));
ALTER TABLE casas ADD CONSTRAINT casas_anos_construccion_check CHECK ((anos_construccion > 0));
ALTER TABLE casas ADD CONSTRAINT casas_banos_check CHECK ((banos >= 1));
ALTER TABLE casas ADD CONSTRAINT casas_habitaciones_check CHECK ((habitaciones >= 1));
ALTER TABLE casas ADD CONSTRAINT casas_pisos_check CHECK ((pisos > 0));
ALTER TABLE casas ADD CONSTRAINT casas_frente_check CHECK ((frente > (0)::numeric));
ALTER TABLE casas ADD CONSTRAINT casas_fondo_check CHECK ((fondo > (0)::numeric));
ALTER TABLE casas ADD CONSTRAINT casas_cantidad_duenos_check CHECK ((cantidad_duenos > 0));
ALTER TABLE configuracion ADD CONSTRAINT configuracion_experiencia_anios_check CHECK ((experiencia_anios >= 0));
ALTER TABLE configuracion_usuario ADD CONSTRAINT configuracion_usuario_tema_check CHECK (((tema)::text = ANY ((ARRAY['claro'::character varying, 'oscuro'::character varying])::text[])));
ALTER TABLE contactos ADD CONSTRAINT contactos_mensaje_check CHECK ((length(mensaje) >= 10));
ALTER TABLE fincas ADD CONSTRAINT fincas_area_total_check CHECK ((area_total > (0)::numeric));
ALTER TABLE fincas ADD CONSTRAINT fincas_area_construcciones_check CHECK ((area_construcciones >= (0)::numeric));
ALTER TABLE fincas ADD CONSTRAINT fincas_area_cultivable_check CHECK ((area_cultivable >= (0)::numeric));
ALTER TABLE fotografias ADD CONSTRAINT fotografias_orden_check CHECK ((orden >= 0));
ALTER TABLE inmuebles ADD CONSTRAINT inmuebles_valor_check CHECK ((valor > (0)::numeric));
ALTER TABLE inmuebles ADD CONSTRAINT inmuebles_estrato_check CHECK ((((estrato >= 1) AND (estrato <= 6)) OR (estrato IS NULL)));
ALTER TABLE locales ADD CONSTRAINT locales_altura_check CHECK ((altura > (0)::numeric));
ALTER TABLE locales ADD CONSTRAINT locales_fondo_check CHECK ((fondo > (0)::numeric));
ALTER TABLE locales ADD CONSTRAINT locales_frente_check CHECK ((frente > (0)::numeric));
ALTER TABLE lotes ADD CONSTRAINT lotes_fondo_check CHECK ((fondo > (0)::numeric));
ALTER TABLE lotes ADD CONSTRAINT lotes_area_total_check CHECK ((area_total > (0)::numeric));
ALTER TABLE lotes ADD CONSTRAINT lotes_frente_check CHECK ((frente > (0)::numeric));
ALTER TABLE usuarios ADD CONSTRAINT chk_email_format CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text));
ALTER TABLE usuarios ADD CONSTRAINT usuarios_password_hash_check CHECK ((length(password_hash) >= 60));

-- ============================================================
-- INDICES
-- ============================================================

CREATE UNIQUE INDEX caracteristicas_generales_nombre_key ON public.caracteristicas_generales USING btree (nombre);
CREATE INDEX idx_configuracion_usuario ON public.configuracion_usuario USING btree (id_usuario);
CREATE INDEX idx_contactos_estado_fecha ON public.contactos USING btree (estado, fecha_contacto DESC);
CREATE INDEX idx_fotografias_inmueble ON public.fotografias USING btree (id_inmueble);
CREATE UNIQUE INDEX idx_portada_unica ON public.fotografias USING btree (id_inmueble) WHERE (es_portada = true);
CREATE INDEX idx_filtros_completos ON public.inmuebles USING btree (estado_aprobacion, tipo_inmueble, tipo_operacion, valor, estrato) WHERE (estado_aprobacion = 'aprobado'::estado_aprobacion);
CREATE INDEX idx_inmuebles_estado_aprobacion ON public.inmuebles USING btree (estado_aprobacion);
CREATE INDEX idx_inmuebles_filtros_precio ON public.inmuebles USING btree (tipo_operacion, valor);
CREATE INDEX idx_inmuebles_usuario ON public.inmuebles USING btree (id_usuario);
CREATE UNIQUE INDEX inmuebles_numero_matricula_key ON public.inmuebles USING btree (numero_matricula);
CREATE INDEX idx_inmuebles_caract_caract ON public.inmuebles_caracteristicas USING btree (id_caracteristica);
CREATE INDEX idx_inmuebles_caract_inmueble ON public.inmuebles_caracteristicas USING btree (id_inmueble);
CREATE INDEX idx_seguridad_usuario ON public.seguridad_usuario USING btree (id_usuario);
CREATE INDEX idx_sesiones_activas ON public.sesiones_usuario USING btree (id_usuario, activa);
CREATE INDEX idx_sesiones_actividad ON public.sesiones_usuario USING btree (ultima_actividad);
CREATE INDEX idx_sesiones_usuario ON public.sesiones_usuario USING btree (id_usuario);
CREATE INDEX idx_token_sesion ON public.sesiones_usuario USING btree (token_sesion);
CREATE INDEX idx_ubicacion_busqueda ON public.ubicaciones USING btree (municipio, departamento, barrio_vereda);
CREATE INDEX idx_ubicaciones_inmueble ON public.ubicaciones USING btree (id_inmueble);
CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (lower((email)::text));
CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol);
CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);

-- ============================================================
-- FUNCIONES
-- ============================================================

CREATE OR REPLACE FUNCTION public.actualizar_fecha_configuracion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crear_configuracion_usuario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN

    INSERT INTO configuracion_usuario(id_usuario)
    VALUES (NEW.id_usuario);

    INSERT INTO seguridad_usuario(id_usuario)
    VALUES (NEW.id_usuario);

    RETURN NEW;

END;
$function$
;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_actualizar_configuracion
    BEFORE UPDATE ON configuracion_usuario
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_configuracion();

