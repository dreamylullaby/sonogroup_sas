# Esquema de Base de Datos — SONOGROUP S.A.S.
## Versión: 3.8 (Junio 2026)
## Motor: PostgreSQL 15+ (Supabase)

---

## Tablas (26)

| # | Tabla | Descripción |
|---|-------|-------------|
| 1 | `usuarios` | Identidad central. Rol determina permisos. |
| 2 | `configuracion_usuario` | Preferencias por usuario (idioma, tema, notificaciones). |
| 3 | `seguridad_usuario` | Configuración 2FA. |
| 4 | `sesiones_usuario` | Sesiones activas con timeout 30 min. |
| 5 | `password_reset_tokens` | Tokens de recuperación de contraseña (1 hora). |
| 6 | `configuracion` | Singleton. Datos editables de la empresa. |
| 7 | `inmuebles` | Tabla base de todos los inmuebles. |
| 8 | `casas` | Tabla hija: viviendas unifamiliares. |
| 9 | `apartamentos` | Tabla hija: unidades en propiedad horizontal. |
| 10 | `apartaestudios` | Tabla hija: unidades compactas. |
| 11 | `lotes` | Tabla hija: terrenos. |
| 12 | `locales` | Tabla hija: espacios comerciales. |
| 13 | `bodegas` | Tabla hija: uso industrial/logístico. |
| 14 | `fincas` | Tabla hija: predios rurales. |
| 15 | `ubicaciones` | Dirección y coordenadas de cada inmueble. |
| 16 | `fotografias` | Imágenes de propiedades (mín 2 para aprobar). |
| 17 | `caracteristicas_generales` | Amenidades externas del conjunto/edificio. |
| 18 | `inmuebles_caracteristicas` | Relación M:N inmueble ↔ amenidades. |
| 19 | `contactos` | Consultas/mensajes de interesados. |
| 20 | `favoritos` | Propiedades guardadas por usuarios. |
| 21 | `solicitudes_publicacion` | Flujo de revisión admin para publicaciones y ediciones. |
| 22 | `historial_precios` | Cambios de precio (llenada por trigger). |
| 23 | `notificaciones` | Alertas internas del sistema. |
| 24 | `solicitudes_eliminacion_cuenta` | Baja de cuentas con revisión admin. |
| 25 | `keep_alive` | Singleton para cron externo (ping cada 5 días). |
| 26 | `borradores_inmuebles` | **[v3.8]** Formularios incompletos guardados. |

---

## Tipos Enumerados (18)

| Tipo | Valores |
|------|---------|
| `estado_aprobacion` | pendiente, aprobado, rechazado |
| `estado_contacto` | pendiente, respondido, cerrado, **recibido**, **resuelto**, **no_resuelto** |
| `estado_inmueble` | nuevo, usado, remodelado |
| `rol_usuario` | cliente, comisionista, admin |
| `tipo_inmueble` | lote, local, bodega, finca, casa, apartamento, apartaestudio |
| `tipo_operacion` | venta, arriendo |
| `zona_tipo` | rural, urbano |
| `tipo_notificacion` | aprobacion, rechazo, contacto, sistema, favorito, **solicitud** |
| `tipo_media` | foto, video, tour_360 |
| `tipo_cocina` | integral, semi_integral, sencilla |
| `tipo_sala_comedor` | sala, comedor, sala_comedor, **separados** |
| `tipo_parqueadero_casa` | interno, externo, cubierto, descubierto, ninguno |
| `tipo_parqueadero_apto` | privado, comun, ninguno |
| `tipo_topografia` | plana, inclinada, irregular, semiondulada, ondulada |
| `tipo_via_acceso` | pavimentada, afirmada, trocha, sin_via |
| `tipo_zona_local` | comercial, residencial, mixta |
| `tipo_zona_lavanderia` | interna, externa |
| `unidad_area_finca` | m2, hectareas, fanegadas, cuadras |
| `estado_solicitud_cuenta` | pendiente, en_revision, aprobada, rechazada |

> Valores en **negrita** fueron agregados en v3.8.

---

## Funciones (10)

| Función | Uso |
|---------|-----|
| `fn_actualizar_fecha_actualizacion()` | Trigger genérico para actualizar timestamps. |
| `fn_actualizar_fecha_configuracion()` | Trigger específico para seguridad_usuario. |
| `fn_crear_config_usuario()` | Inicializa config + seguridad al crear usuario. |
| `fn_registrar_cambio_precio()` | Registra en historial_precios al cambiar valor. |
| `fn_marcar_fecha_lectura()` | Registra timestamp al marcar notificación leída. |
| `fn_cerrar_sesion_inactiva()` | Timeout 30 min en sesiones. |
| `fn_invalidar_sesion(INTEGER)` | Cierra una sesión por ID. |
| `fn_invalidar_sesiones_usuario(INTEGER)` | Cierra todas las sesiones de un usuario. |
| `fn_limpiar_tokens_expirados()` | Mantenimiento diario (cron 3 AM). |
| `fn_notificar_cambio_favorito()` | **[v3.8]** Notifica usuarios cuando cambia precio/estado en favoritos. |

---

## Triggers (9)

| Trigger | Tabla | Función |
|---------|-------|---------|
| `trg_crear_config_usuario` | usuarios | fn_crear_config_usuario |
| `trg_actualizar_config_usuario` | configuracion_usuario | fn_actualizar_fecha_actualizacion |
| `trg_actualizar_seguridad_usuario` | seguridad_usuario | fn_actualizar_fecha_configuracion |
| `trg_actualizar_configuracion` | configuracion | fn_actualizar_fecha_actualizacion |
| `trg_historial_precio` | inmuebles | fn_registrar_cambio_precio |
| `trg_fecha_lectura_notificacion` | notificaciones | fn_marcar_fecha_lectura |
| `trg_timeout_sesion` | sesiones_usuario | fn_cerrar_sesion_inactiva |
| `trg_actualizar_borrador` | borradores_inmuebles | **[v3.8]** fn_actualizar_fecha_actualizacion |
| `trg_notificar_cambio_favorito` | inmuebles | **[v3.8]** fn_notificar_cambio_favorito |

---

## Vistas (3)

| Vista | Descripción |
|-------|-------------|
| `v_inmuebles_listado` | Buscador público. Solo aprobados + activos. Sin email propietario. |
| `v_inmueble_detalle` | Ficha completa. Email condicional por ocultar_informacion. |
| `v_stats_admin` | Métricas en tiempo real para panel admin. |

---

## Columnas agregadas en v3.8

### `contactos` (tabla existente):
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `fecha_vista` | TIMESTAMP | Cuando el admin vio el contacto. |
| `fecha_resolucion` | TIMESTAMP | Cuando se marcó como resuelto. |
| `respuesta_admin` | TEXT | Respuesta del admin. |
| `fecha_no_resuelto` | TIMESTAMP | Auto-marcado a los 7 días sin respuesta. |

### `solicitudes_publicacion` (tabla existente):
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `tipo_solicitud` | VARCHAR(20) DEFAULT 'publicacion' | publicacion o edicion. |
| `snapshot_datos_rechazo` | JSONB | Datos al momento del rechazo. |
| `fecha_rechazo` | TIMESTAMP | Timestamp del rechazo. |

---

## Índices principales (44)

- Usuarios: email, rol, token_verificacion
- Sesiones: usuario, activas, actividad, token, país/ciudad
- Password reset: token_hash, usuario
- Inmuebles: usuario, estado_aprobacion, filtros_precio, filtros_completos, permuta
- Fotografías: inmueble, portada_unica, orden
- Ubicaciones: inmueble, búsqueda (municipio+departamento), trigram, servicios_sector GIN
- JSONB GIN: locales, lotes, fincas (servicios)
- Características: inmueble, característica
- Contactos: estado_fecha, inmueble, **estado** [v3.8]
- Historial: inmueble+fecha
- Notificaciones: usuario+leida+fecha
- Favoritos: usuario, inmueble
- Solicitudes pub: usuario, estado, **tipo_inmueble** [v3.8]
- Solicitudes cuenta: usuario, estado, una_solicitud_activa
- **Borradores: usuario+fecha** [v3.8]

---

## Archivos SQL del proyecto

| Archivo | Propósito |
|---------|-----------|
| `Base_Optimizada_V3.8.sql` | Esquema completo actual (destructivo). |
| `Base_Optimizada_V3.4.sql` | Esquema anterior (referencia histórica). |
| `Base_Optimizada_V2.0.sql` | Versión legacy (no usar). |
| `migraciones_post_v3.4.sql` | Historial de ALTER/CREATE ejecutados post-v3.4. |
| `rollback_v3.5.1.sql` | Documentación del rollback de enum incorrecto. |

---

## Historial de versiones

| Versión | Fecha | Cambios principales |
|---------|-------|---------------------|
| v2.0 | — | Esquema inicial |
| v3.3 | — | Estructura completa con todas las tablas hijas |
| v3.4 | — | Correcciones producción (triggers, constraints, privacidad) |
| v3.5 | Jun 2026 | Migración incorrecta (estados en tabla equivocada) |
| v3.5.1 | Jun 2026 | Rollback de v3.5 |
| v3.8 | Jun 2026 | Borradores, favoritos trigger, contactos ampliados, solicitudes edición |
