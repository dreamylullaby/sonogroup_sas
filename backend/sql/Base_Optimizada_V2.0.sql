SET search_path TO public;
-- ============================================================================

-- 1. LIMPIEZA COMPLETA (solo desarrollo)
DROP TABLE IF EXISTS inmuebles_caracteristicas CASCADE;
DROP TABLE IF EXISTS caracteristicas_generales CASCADE;
DROP TABLE IF EXISTS solicitudes_publicacion CASCADE;
DROP TABLE IF EXISTS contactos CASCADE;
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS apartaestudios CASCADE;
DROP TABLE IF EXISTS apartamentos CASCADE;
DROP TABLE IF EXISTS casas CASCADE;
DROP TABLE IF EXISTS fincas CASCADE;
DROP TABLE IF EXISTS bodegas CASCADE;
DROP TABLE IF EXISTS locales CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS fotografias CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS inmuebles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;

-- 2. ELIMINAR ENUMs
DROP TYPE IF EXISTS tipo_operacion CASCADE;
DROP TYPE IF EXISTS tipo_inmueble CASCADE;
DROP TYPE IF EXISTS estado_inmueble CASCADE;
DROP TYPE IF EXISTS zona_tipo CASCADE;
DROP TYPE IF EXISTS rol_usuario CASCADE;
DROP TYPE IF EXISTS estado_aprobacion CASCADE;
DROP TYPE IF EXISTS estado_contacto CASCADE;

-- ============================================================================
-- 3. ENUMs ESENCIALES (7 optimizados)
-- ============================================================================
CREATE TYPE tipo_operacion AS ENUM ('venta', 'arriendo');
CREATE TYPE tipo_inmueble AS ENUM ('lote', 'local', 'bodega', 'finca', 'casa', 'apartamento', 'apartaestudio');
CREATE TYPE estado_inmueble AS ENUM ('nuevo', 'usado', 'remodelado');
CREATE TYPE zona_tipo AS ENUM ('rural', 'urbano');
CREATE TYPE rol_usuario AS ENUM ('cliente', 'comisionista', 'admin');
CREATE TYPE estado_aprobacion AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE estado_contacto AS ENUM ('pendiente', 'respondido', 'cerrado');

-- ============================================================================
-- 4. TABLA USUARIOS
-- ============================================================================
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    tipo_identificacion VARCHAR(20) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL CHECK (LENGTH(password_hash) >= 60),
    rol rol_usuario NOT NULL DEFAULT 'cliente',
    es_dueno BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- 5. TABLA INMUEBLES
-- ============================================================================
CREATE TABLE inmuebles (
    id_inmueble SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_inmueble tipo_inmueble NOT NULL,
    tipo_operacion tipo_operacion NOT NULL,
    valor DECIMAL(15,2) NOT NULL CHECK (valor > 0),
    estrato SMALLINT CHECK (estrato BETWEEN 1 AND 6 OR estrato IS NULL),
    zona zona_tipo NOT NULL,
    estado_inmueble estado_inmueble NOT NULL,
    descripcion TEXT,
    numero_matricula VARCHAR(100) UNIQUE,
    estado_aprobacion estado_aprobacion DEFAULT 'pendiente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP
);

-- ============================================================================
-- 6. TABLA UBICACIONES
-- ============================================================================
CREATE TABLE ubicaciones (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    direccion VARCHAR(500) NOT NULL,
    barrio_vereda VARCHAR(255),
    municipio VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8)
);

-- ============================================================================
-- 7. TABLA FOTOGRAFÍAS
-- ============================================================================
CREATE TABLE fotografias (
    id_foto SERIAL PRIMARY KEY,
    id_inmueble INTEGER NOT NULL REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    descripcion VARCHAR(255),
    es_portada BOOLEAN DEFAULT FALSE,
    orden SMALLINT DEFAULT 0 CHECK (orden >= 0),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. TABLAS ESPECÍFICAS POR TIPO (CHECK constraints anti-cero/negativos)
-- ============================================================================
CREATE TABLE lotes (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total DECIMAL(12,2) NOT NULL CHECK (area_total > 0),
    frente DECIMAL(10,2) CHECK (frente > 0),
    fondo DECIMAL(10,2) CHECK (fondo > 0),
    pendiente BOOLEAN DEFAULT FALSE,
    topografia VARCHAR(50),
    vias_acceso VARCHAR(100),
    servicios_zona TEXT,
    uso_pot VARCHAR(50),
    tiene_casa BOOLEAN DEFAULT FALSE
);

CREATE TABLE locales (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    zona_local VARCHAR(20),
    uso_pot VARCHAR(50),
    frente DECIMAL(10,2) CHECK (frente > 0),
    fondo DECIMAL(10,2) CHECK (fondo > 0),
    altura DECIMAL(10,2) CHECK (altura > 0),
    mezzanine BOOLEAN DEFAULT FALSE,
    banos BOOLEAN DEFAULT FALSE,
    servicios_publicos TEXT,
    parqueaderos TEXT,
    descripcion_acabados TEXT
);

CREATE TABLE bodegas (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_construida DECIMAL(12,2) CHECK (area_construida > 0),
    frente DECIMAL(10,2) CHECK (frente > 0),
    fondo DECIMAL(10,2) CHECK (fondo > 0),
    altura_libre DECIMAL(10,2) CHECK (altura_libre > 0),
    tipo_porton VARCHAR(100),
    capacidad_carga TEXT,
    oficinas BOOLEAN DEFAULT FALSE,
    banos BOOLEAN DEFAULT FALSE,
    vestier BOOLEAN DEFAULT FALSE,
    acceso_camiones BOOLEAN DEFAULT FALSE,
    servicios_especiales TEXT
);

CREATE TABLE fincas (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total DECIMAL(15,2) NOT NULL CHECK (area_total > 0),
    unidad_area VARCHAR(20) DEFAULT 'm2',
    area_cultivable DECIMAL(15,2) CHECK (area_cultivable >= 0),
    area_construcciones DECIMAL(12,2) CHECK (area_construcciones >= 0),
    fuentes_agua TEXT,
    casa_principal BOOLEAN DEFAULT FALSE,
    otras_construcciones TEXT,
    vias_acceso VARCHAR(50),
    cultivos_actuales TEXT,
    topografia VARCHAR(50),
    servicios_disponibles TEXT
);

CREATE TABLE casas (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    frente DECIMAL(10,2) CHECK (frente > 0),
    fondo DECIMAL(10,2) CHECK (fondo > 0),
    anos_construccion SMALLINT CHECK (anos_construccion > 0),
    cantidad_duenos SMALLINT CHECK (cantidad_duenos > 0),
    pisos SMALLINT CHECK (pisos > 0),
    habitaciones SMALLINT NOT NULL CHECK (habitaciones >= 1),
    banos SMALLINT NOT NULL CHECK (banos >= 1),
    sala_comedor VARCHAR(50),
    cocina VARCHAR(50),
    parqueadero VARCHAR(50),
    patio BOOLEAN DEFAULT FALSE,
    jardin BOOLEAN DEFAULT FALSE,
    terraza BOOLEAN DEFAULT FALSE,
    balcon BOOLEAN DEFAULT FALSE,
    zona_lavanderia VARCHAR(20),
    descripcion_acabados TEXT
);

CREATE TABLE apartamentos (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    frente DECIMAL(10,2) CHECK (frente > 0),
    fondo DECIMAL(10,2) CHECK (fondo > 0),
    anos_construccion SMALLINT CHECK (anos_construccion > 0),
    cantidad_duenos SMALLINT CHECK (cantidad_duenos > 0),
    piso SMALLINT CHECK (piso >= 1),
    torre SMALLINT CHECK (torre >= 1),
    habitaciones SMALLINT NOT NULL CHECK (habitaciones >= 1),
    banos SMALLINT NOT NULL CHECK (banos >= 1),
    sala_comedor VARCHAR(50),
    cocina VARCHAR(50),
    parqueadero VARCHAR(20),
    balcon BOOLEAN DEFAULT FALSE,
    ascensor BOOLEAN DEFAULT FALSE,
    vigilancia BOOLEAN DEFAULT FALSE,
    valor_vigilancia DECIMAL(10,2) CHECK (valor_vigilancia >= 0),
    valor_administracion DECIMAL(10,2) CHECK (valor_administracion >= 0),
    zonas_comunes TEXT,
    descripcion_acabados TEXT
);

CREATE TABLE apartaestudios (
    id_inmueble INTEGER PRIMARY KEY REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    area_total DECIMAL(10,2) NOT NULL CHECK (area_total > 0),
    tiene_bano BOOLEAN NOT NULL,
    parqueadero BOOLEAN DEFAULT FALSE,
    balcon BOOLEAN DEFAULT FALSE,
    amoblado BOOLEAN DEFAULT FALSE,
    cocina VARCHAR(50),
    descripcion_acabados TEXT
);

-- ============================================================================
-- 9. SISTEMA CARACTERÍSTICAS GENERALES (M:N)
-- ============================================================================
CREATE TABLE caracteristicas_generales (
    id_caracteristica SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(100),
    categoria VARCHAR(50) DEFAULT 'general',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inmuebles_caracteristicas (
    id_inmueble INTEGER NOT NULL REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    id_caracteristica INTEGER NOT NULL REFERENCES caracteristicas_generales(id_caracteristica) ON DELETE CASCADE,
    PRIMARY KEY (id_inmueble, id_caracteristica)
);

-- ============================================================================
-- 10. TABLAS FUNCIONALES
-- ============================================================================
CREATE TABLE favoritos (
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_inmueble INTEGER NOT NULL REFERENCES inmuebles(id_inmueble) ON DELETE CASCADE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_inmueble)
);

CREATE TABLE contactos (
    id_contacto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    asunto VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL CHECK (LENGTH(mensaje) >= 10),
    id_inmueble INTEGER REFERENCES inmuebles(id_inmueble) ON DELETE SET NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    estado estado_contacto DEFAULT 'pendiente',
    fecha_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solicitudes_publicacion (
    id_solicitud SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    datos JSONB NOT NULL,
    estado_aprobacion estado_aprobacion DEFAULT 'pendiente',
    admin_revisor INTEGER REFERENCES usuarios(id_usuario),
    motivo_rechazo TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP
);

CREATE TABLE configuracion (
    id_config SERIAL PRIMARY KEY,
    experiencia_anios INTEGER CHECK (experiencia_anios >= 0),
    valores JSONB,
    servicios JSONB,
    razones JSONB,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. ÍNDICES COMPLETOS - OPTIMIZADOS PARA FILTROS Y ADMIN
-- ============================================================================
CREATE INDEX idx_usuarios_email ON usuarios(LOWER(email));
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_ubicacion_busqueda ON ubicaciones(municipio, departamento, barrio_vereda);
CREATE INDEX idx_ubicaciones_inmueble ON ubicaciones(id_inmueble);
CREATE UNIQUE INDEX idx_portada_unica ON fotografias(id_inmueble) WHERE es_portada = true;
CREATE INDEX idx_fotografias_inmueble ON fotografias(id_inmueble);
CREATE INDEX idx_inmuebles_caract_inmueble ON inmuebles_caracteristicas(id_inmueble);
CREATE INDEX idx_inmuebles_caract_caract ON inmuebles_caracteristicas(id_caracteristica);
CREATE INDEX idx_contactos_estado_fecha ON contactos(estado, fecha_contacto DESC);
CREATE INDEX idx_inmuebles_usuario ON inmuebles(id_usuario);
CREATE INDEX idx_inmuebles_estado_aprobacion ON inmuebles(estado_aprobacion);
CREATE INDEX idx_inmuebles_filtros_precio ON inmuebles(tipo_operacion, valor);
CREATE INDEX idx_filtros_completos ON inmuebles(
    estado_aprobacion, 
    tipo_inmueble, 
    tipo_operacion, 
    valor, 
    estrato
) WHERE estado_aprobacion = 'aprobado';

-- ============================================================================
-- 12. DATOS INICIALES
-- ============================================================================
INSERT INTO caracteristicas_generales (nombre, descripcion, icono, categoria) VALUES
('Piscina', 'Piscina privada o común', 'fa-swimming-pool', 'recreacion'),
('Gimnasio', 'Sala de ejercicios/gimnasio', 'fa-dumbbell', 'recreacion'),
('Zona BBQ', 'Área para parrilladas', 'fa-fire', 'recreacion'),
('Jardín', 'Jardín o áreas verdes', 'fa-seedling', 'confort'),
('Terraza', 'Terraza o roof top', 'fa-layer-group', 'confort'),
('Ascensor', 'Ascensor en el edificio', 'fa-building', 'general'),
('Vigilancia 24h', 'Vigilancia permanente', 'fa-shield-alt', 'seguridad'),
('Parqueadero visitantes', 'Parqueo para visitas', 'fa-parking', 'general'),
('Zona infantil', 'Área de juegos infantiles', 'fa-child', 'recreacion'),
('Cancha deportiva', 'Cancha de tenis/fútbol', 'fa-futbol', 'recreacion'),
('Área verde', 'Zonas verdes comunes', 'fa-tree', 'confort'),
('Amoblado', 'Propiedad completamente amoblada', 'fa-couch', 'confort'),
('Aire acondicionado', 'Sistema de aire en habitaciones', 'fa-fan', 'confort'),
('Portería', 'Portería o conserjería', 'fa-concierge-bell', 'seguridad'),
('Zona social', 'Salón social o eventos', 'fa-users', 'recreacion');

INSERT INTO configuracion (experiencia_anios, valores, servicios) VALUES (
    15,
    '["Excelencia", "Transparencia", "Compromiso"]'::jsonb,
    '["Venta", "Arriendo", "Administración", "Tasación"]'::jsonb
);

-- ============================================================================
-- 13. DESHABILITAR RLS (BACKEND JWT)
-- ============================================================================
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE inmuebles DISABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE fotografias DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE locales DISABLE ROW LEVEL SECURITY;
ALTER TABLE bodegas DISABLE ROW LEVEL SECURITY;
ALTER TABLE fincas DISABLE ROW LEVEL SECURITY;
ALTER TABLE casas DISABLE ROW LEVEL SECURITY;
ALTER TABLE apartamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE apartaestudios DISABLE ROW LEVEL SECURITY;
ALTER TABLE caracteristicas_generales DISABLE ROW LEVEL SECURITY;
ALTER TABLE inmuebles_caracteristicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE contactos DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_publicacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'Tablas: ' || COUNT(*) as total_tablas FROM pg_tables WHERE schemaname = 'public';
SELECT 'Índices: ' || COUNT(*) as total_indices FROM pg_indexes WHERE schemaname = 'public';
SELECT 'Enums: ' || COUNT(*) as total_enums FROM pg_type WHERE typname LIKE 'tipo_%' OR typname LIKE 'estado_%' OR typname LIKE 'rol_%';

-- ============================================================================