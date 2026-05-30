# Requirements Document

## Introduction

Rediseño completo del panel administrativo de SONOGROUP S.A.S., transformándolo de un CRUD básico con tabs horizontales a un sistema administrativo inmobiliario profesional tipo SaaS premium. El sistema incluye un sidebar lateral, dashboard con KPIs, gestión avanzada de propiedades, CRM de contactos, gestión de usuarios, reportes, notificaciones, seguridad y configuración. Se reutiliza la infraestructura existente (Express + Supabase + JWT) y se extiende con nuevos endpoints y módulos de frontend en React con Tailwind, Framer Motion y Lucide Icons.

## Glossary

- **Admin_Panel**: El sistema administrativo completo de SONOGROUP
- **Sidebar**: Navegación lateral colapsable del panel administrativo
- **Dashboard**: Pantalla principal con KPIs, gráficas y actividad reciente
- **KPI**: Indicador clave de rendimiento (tarjeta de métrica)
- **Propiedad**: Inmueble registrado en el sistema (tabla `inmuebles`)
- **Solicitud**: Propiedad en estado `pendiente` esperando aprobación o rechazo
- **Usuario**: Persona registrada en el sistema (tabla `usuarios`)
- **Contacto**: Mensaje enviado por un interesado a través de una propiedad (tabla `contactos`)
- **Notificacion**: Alerta del sistema dirigida a un usuario (tabla `notificaciones`)
- **Actividad**: Registro de acciones administrativas (tabla `actividad_admin`)
- **Reporte**: Conjunto de métricas y gráficas exportables
- **Configuracion**: Datos de la empresa y ajustes del sistema (tabla `configuracion`)
- **Sesion**: Registro de acceso activo de un usuario (tabla `sesiones_usuario`)
- **Stats_Service**: Servicio backend que calcula y retorna métricas del sistema
- **CRM**: Módulo de gestión de contactos/leads tipo bandeja de entrada
- **PBT_Library**: fast-check (JavaScript) para property-based testing
- **Chart_Library**: Recharts para gráficas en React

## Requirements

---

### Requirement 1: Sidebar de Navegación Profesional

**User Story:** Como administrador, quiero una navegación lateral colapsable con todas las secciones del panel, para acceder rápidamente a cualquier módulo sin perder el contexto visual.

#### Acceptance Criteria

1. THE Admin_Panel SHALL render a fixed left sidebar with navigation links to: Dashboard, Propiedades, Solicitudes, Usuarios, Contactos, Notificaciones, Reportes, Configuración, Seguridad, Actividad.
2. WHEN the sidebar collapse button is clicked, THE Sidebar SHALL toggle between expanded (240px) and collapsed (64px) states with a smooth CSS transition.
3. WHILE the sidebar is collapsed, THE Sidebar SHALL display only icons with tooltips on hover.
4. WHILE the sidebar is expanded, THE Sidebar SHALL display icons alongside text labels for each navigation item.
5. WHEN a navigation item is active, THE Sidebar SHALL highlight it with a distinct visual indicator (background color + left border accent).
6. THE Sidebar SHALL display the SONOGROUP logo and brand name at the top when expanded, and only the logo icon when collapsed.
7. THE Sidebar SHALL display the current admin user's avatar, name, and role at the bottom when expanded.
8. THE Admin_Panel SHALL render a top navbar with: search bar, notifications bell with unread count badge, and user menu dropdown.
9. WHEN the viewport width is below 768px, THE Sidebar SHALL collapse automatically and overlay the content when toggled.

---

### Requirement 2: Dashboard Principal con KPIs

**User Story:** Como administrador, quiero ver un dashboard con métricas clave, gráficas de tendencias y actividad reciente, para tener visibilidad completa del estado del negocio en tiempo real.

#### Acceptance Criteria

1. THE Dashboard SHALL display the following KPI cards: total propiedades, propiedades aprobadas, pendientes de aprobación, rechazadas, usuarios activos, nuevos usuarios esta semana, contactos sin responder, favoritos totales, propiedades destacadas, publicaciones activas, publicaciones vencidas.
2. WHEN the dashboard loads, THE Stats_Service SHALL fetch all KPI data in a single optimized request to `GET /api/admin/stats/dashboard`.
3. WHILE KPI data is loading, THE Dashboard SHALL display skeleton loader cards in place of each KPI.
4. EACH KPI card SHALL display: metric name, current value, percentage change vs previous period, trend direction icon (up/down), and a mini sparkline chart.
5. THE Dashboard SHALL display a bar chart of property publications grouped by month for the last 6 months.
6. THE Dashboard SHALL display a line chart of user registrations grouped by week for the last 8 weeks.
7. THE Dashboard SHALL display a donut chart showing the distribution of property types (casa, apartamento, lote, etc.).
8. THE Dashboard SHALL display a feed of the 10 most recent admin activities (approvals, rejections, user changes, etc.).
9. THE Dashboard SHALL display the 5 most recently created properties with thumbnail, title, status badge, and quick-action buttons.
10. THE Dashboard SHALL display the 5 most recent pending approval requests with property name, submitter, and approve/reject buttons.
11. IF the Stats_Service returns an error, THEN THE Dashboard SHALL display an error state with a retry button for each failed section.

---

### Requirement 3: Gestión Avanzada de Propiedades

**User Story:** Como administrador, quiero una tabla avanzada de propiedades con filtros, búsqueda, ordenamiento y acciones rápidas, para gestionar el inventario inmobiliario de forma eficiente.

#### Acceptance Criteria

1. THE Admin_Panel SHALL render a properties table with columns: imagen portada, nombre/descripción, ubicación (municipio), propietario, tipo, operación, precio formateado, estado aprobación badge, fecha publicación, contador de vistas, contador de favoritos, contador de contactos, y columna de acciones.
2. THE Admin_Panel SHALL support real-time search filtering properties by: descripción, municipio, nombre del propietario.
3. THE Admin_Panel SHALL support filter dropdowns for: tipo_inmueble, tipo_operacion, estado_aprobacion, rango de precio (min/max).
4. THE Admin_Panel SHALL support column sorting (ascending/descending) for: precio, fecha, vistas, favoritos.
5. THE Admin_Panel SHALL implement server-side pagination with 20 items per page and display total count.
6. WHEN an admin clicks "Aprobar" on a property, THE Admin_Panel SHALL call `PUT /api/admin/inmuebles/:id/aprobar` and update the row status badge without full page reload.
7. WHEN an admin clicks "Rechazar" on a property, THE Admin_Panel SHALL open a modal requesting a rejection reason before calling `PUT /api/admin/inmuebles/:id/rechazar`.
8. WHEN an admin clicks "Destacar" on a property, THE Admin_Panel SHALL toggle the `destacado` flag via `PUT /api/admin/inmuebles/:id/destacar`.
9. WHEN an admin clicks "Pausar" on a property, THE Admin_Panel SHALL toggle the `activo` flag via `PUT /api/admin/inmuebles/:id/pausar`.
10. WHEN an admin clicks "Eliminar" on a property, THE Admin_Panel SHALL show a confirmation dialog before calling `DELETE /api/admin/inmuebles/:id`.
11. WHEN an admin clicks "Ver Detalle" on a property, THE Admin_Panel SHALL navigate to a property detail admin view showing: galería de fotos, mapa, estadísticas de vistas/contactos/favoritos, historial de precios, información completa, y timeline de actividad.
12. IF no properties match the current filters, THEN THE Admin_Panel SHALL display a professional empty state with illustration and message.
13. THE Admin_Panel SHALL persist active filters in the URL query parameters so they survive page refresh.

---

### Requirement 4: Módulo de Solicitudes y Moderación

**User Story:** Como administrador, quiero un sistema de moderación profesional para revisar propiedades pendientes, comparar cambios y aprobar o rechazar con historial, para mantener la calidad del contenido publicado.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a solicitudes table with columns: imagen, propiedad, usuario solicitante, fecha solicitud, estado badge, prioridad badge, y acciones.
2. WHEN an admin opens a solicitud detail, THE Admin_Panel SHALL display a side-by-side comparison view showing the property information with all fields.
3. THE Admin_Panel SHALL display the full property gallery in the solicitud detail view.
4. WHEN an admin approves a solicitud, THE Admin_Panel SHALL call `PUT /api/propiedades-pendientes/:id/aprobar` and move the item to approved state.
5. WHEN an admin rejects a solicitud, THE Admin_Panel SHALL require a rejection reason text (minimum 10 characters) before calling `PUT /api/propiedades-pendientes/:id/rechazar`.
6. THE Admin_Panel SHALL display a revision history for each solicitud showing previous approval/rejection actions with timestamps and admin names.
7. THE Admin_Panel SHALL support bulk actions: select multiple solicitudes and approve or reject all at once.
8. IF a solicitud has been pending for more than 48 hours, THEN THE Admin_Panel SHALL display a "urgente" priority badge on that row.

---

### Requirement 5: Gestión de Usuarios

**User Story:** Como administrador, quiero una tabla completa de usuarios con acciones de gestión, para administrar roles, estados y actividad de todos los miembros de la plataforma.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a users table with columns: avatar, nombre completo, email, teléfono, rol badge, estado badge, verificación badge, propiedades publicadas count, último acceso, fecha registro, y acciones.
2. THE Admin_Panel SHALL support search filtering users by: nombre, email, teléfono.
3. THE Admin_Panel SHALL support filter dropdowns for: rol (cliente, comisionista, admin), estado (activo, suspendido).
4. WHEN an admin clicks "Editar" on a user, THE Admin_Panel SHALL open a professional modal with all editable fields: nombre, email, teléfono, rol, estado.
5. WHEN an admin clicks "Suspender" on a user, THE Admin_Panel SHALL call `PUT /api/usuarios/:id/suspender` and update the status badge.
6. WHEN an admin clicks "Activar" on a suspended user, THE Admin_Panel SHALL call `PUT /api/usuarios/:id/activar` and update the status badge.
7. WHEN an admin clicks "Eliminar" on a user, THE Admin_Panel SHALL show a confirmation dialog before calling `DELETE /api/usuarios/:id`.
8. WHEN an admin clicks "Ver Propiedades" on a user, THE Admin_Panel SHALL navigate to the properties view pre-filtered by that user.
9. WHEN an admin clicks "Invalidar Sesiones" on a user, THE Admin_Panel SHALL call `DELETE /api/admin/usuarios/:id/sesiones` to terminate all active sessions.
10. THE Admin_Panel SHALL implement server-side pagination with 25 items per page for the users table.
11. IF a user has the role "admin", THEN THE Admin_Panel SHALL display a special admin badge and restrict deletion of that user.

---

### Requirement 6: CRM de Contactos

**User Story:** Como administrador, quiero un módulo tipo bandeja de entrada CRM para gestionar todos los contactos recibidos, para dar seguimiento a los leads y mejorar la conversión.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a contacts table with columns: cliente (nombre + email), teléfono, propiedad asociada, estado badge, prioridad, fecha, agente asignado, y acciones.
2. THE Admin_Panel SHALL support filter dropdowns for: estado_contacto (pendiente, respondido, cerrado), prioridad.
3. WHEN an admin opens a contact detail, THE Admin_Panel SHALL display a conversation-style inbox view with the original message and any internal notes.
4. WHEN an admin adds an internal note to a contact, THE Admin_Panel SHALL call `POST /api/admin/contactos/:id/notas` and display the note in the conversation thread.
5. WHEN an admin changes the contact status, THE Admin_Panel SHALL call `PUT /api/contactos/:id/estado` and update the badge.
6. WHEN an admin assigns an agent to a contact, THE Admin_Panel SHALL call `PUT /api/admin/contactos/:id/asignar` with the agent's user ID.
7. WHEN an admin archives a contact, THE Admin_Panel SHALL call `PUT /api/admin/contactos/:id/archivar` and remove it from the active view.
8. THE Admin_Panel SHALL display the total count of unread/pending contacts as a badge on the Contactos sidebar item.
9. THE Admin_Panel SHALL support real-time search filtering contacts by: nombre del cliente, email, nombre de la propiedad.

---

### Requirement 7: Sistema de Notificaciones

**User Story:** Como administrador, quiero un sistema de notificaciones completo con dropdown y página dedicada, para estar al tanto de todas las acciones importantes del sistema.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a notifications bell icon in the top navbar with a badge showing the count of unread notifications.
2. WHEN the notifications bell is clicked, THE Admin_Panel SHALL display a dropdown panel showing the 10 most recent notifications with: icon by type, title, description, relative time, and read/unread state.
3. WHEN an admin clicks a notification in the dropdown, THE Admin_Panel SHALL mark it as read via `PUT /api/notificaciones/:id/leer` and navigate to the relevant section.
4. THE Admin_Panel SHALL support notification types: aprobacion, rechazo, contacto_nuevo, favorito, sistema, seguridad.
5. WHEN an admin clicks "Marcar todas como leídas", THE Admin_Panel SHALL call `PUT /api/notificaciones/leer-todas` and clear the unread badge.
6. THE Admin_Panel SHALL have a dedicated notifications page showing all notifications with pagination, filter by type, and bulk mark-as-read.
7. WHEN a new property is submitted for approval, THE Stats_Service SHALL create a notification of type `aprobacion` for all admin users.
8. WHEN a new contact message is received, THE Stats_Service SHALL create a notification of type `contacto_nuevo` for all admin users.

---

### Requirement 8: Reportes y Analytics

**User Story:** Como administrador, quiero un módulo de reportes con gráficas avanzadas y exportación, para analizar el rendimiento del negocio y tomar decisiones basadas en datos.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display an analytics dashboard with: propiedades más vistas (top 10), zonas más buscadas (top 5 municipios), usuarios más activos (top 5), rendimiento mensual de publicaciones, distribución de favoritos por tipo de propiedad, tasa de conversión contacto → respuesta.
2. THE Admin_Panel SHALL render all analytics charts using the Chart_Library (Recharts).
3. THE Admin_Panel SHALL support date range filtering for all analytics (last 7 days, 30 days, 90 days, custom range).
4. WHEN an admin clicks "Exportar Excel", THE Admin_Panel SHALL call `GET /api/admin/reportes/export?format=xlsx` and trigger a file download.
5. WHEN an admin clicks "Exportar PDF", THE Admin_Panel SHALL call `GET /api/admin/reportes/export?format=pdf` and trigger a file download.
6. THE Admin_Panel SHALL display a summary table of monthly metrics: nuevas propiedades, nuevos usuarios, contactos recibidos, propiedades aprobadas, propiedades rechazadas.

---

### Requirement 9: Configuración del Sistema

**User Story:** Como administrador, quiero un módulo de configuración completo para gestionar los datos de la empresa, branding y ajustes del sistema, para mantener la plataforma actualizada.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a configuration page with tabs: Empresa, Branding, Contacto, SEO, Redes Sociales, Mantenimiento.
2. WHEN an admin updates company information, THE Admin_Panel SHALL call `PUT /api/configuracion` with the updated fields.
3. THE Admin_Panel SHALL display a logo upload field that calls `POST /api/configuracion/logo` when a new image is selected.
4. THE Admin_Panel SHALL display a maintenance mode toggle that calls `PUT /api/configuracion/mantenimiento` when toggled.
5. WHEN configuration is saved successfully, THE Admin_Panel SHALL display a success toast notification.
6. IF the configuration save fails, THEN THE Admin_Panel SHALL display an error toast with the specific error message.

---

### Requirement 10: Seguridad y Auditoría

**User Story:** Como administrador, quiero un módulo de seguridad con sesiones activas, logs de acceso y auditoría, para monitorear y proteger el sistema.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a security page showing all active sessions with: usuario, dispositivo/user-agent, IP, fecha inicio, última actividad.
2. WHEN an admin clicks "Cerrar Sesión" on a specific session, THE Admin_Panel SHALL call `DELETE /api/admin/sesiones/:id` to terminate that session.
3. WHEN an admin clicks "Cerrar Todas las Sesiones", THE Admin_Panel SHALL call `DELETE /api/admin/sesiones/todas` to terminate all sessions except the current one.
4. THE Admin_Panel SHALL display an access log table with: usuario, acción, IP, fecha, resultado (éxito/fallo).
5. THE Admin_Panel SHALL display an audit trail of all administrative actions: quién hizo qué, cuándo, y sobre qué recurso.
6. THE Admin_Panel SHALL highlight suspicious activity (multiple failed logins, unusual access patterns) with a warning badge.
7. WHEN a new admin action is performed, THE Stats_Service SHALL record it in the `actividad_admin` table with: admin_id, accion, recurso_tipo, recurso_id, detalles, ip, timestamp.

---

### Requirement 11: Feed de Actividad Reciente

**User Story:** Como administrador, quiero un feed global de actividad reciente, para ver en tiempo real todas las acciones importantes que ocurren en la plataforma.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display an activity feed page showing the 50 most recent system events.
2. EACH activity item SHALL display: icon by event type, description, actor (user who performed the action), target resource, and relative timestamp.
3. THE Admin_Panel SHALL support filter by activity type: usuarios, propiedades, aprobaciones, contactos, sistema.
4. THE Admin_Panel SHALL support pagination loading 25 more items when the user scrolls to the bottom (infinite scroll).
5. WHEN the activity feed page loads, THE Admin_Panel SHALL call `GET /api/admin/actividad?page=1&limit=25`.

---

### Requirement 12: Diseño Premium y Experiencia de Usuario

**User Story:** Como administrador, quiero una interfaz visualmente premium con animaciones suaves, estados de carga y diseño responsivo, para una experiencia administrativa de nivel profesional.

#### Acceptance Criteria

1. THE Admin_Panel SHALL use Tailwind CSS for all styling with a dark sidebar and light content area color scheme.
2. THE Admin_Panel SHALL use Framer Motion for page transition animations and micro-interactions on interactive elements.
3. THE Admin_Panel SHALL use Lucide React for all icons consistently throughout the interface.
4. WHILE any data is loading, THE Admin_Panel SHALL display skeleton loader components matching the shape of the expected content.
5. WHEN a list or table has no data, THE Admin_Panel SHALL display a professional empty state with an illustration and descriptive message.
6. ALL interactive elements (buttons, rows, cards) SHALL have hover and active states with smooth transitions (150ms ease).
7. THE Admin_Panel SHALL be fully responsive: sidebar collapses on mobile, tables scroll horizontally, cards stack vertically.
8. ALL status values SHALL be displayed as styled badges with appropriate colors: pendiente (yellow), aprobado (green), rechazado (red), activo (blue), suspendido (gray).
9. THE Admin_Panel SHALL display toast notifications for all user actions (success, error, warning) using the existing Toast component.
10. THE Admin_Panel SHALL use a consistent card component with subtle shadow, rounded corners, and hover elevation effect for all content sections.

---

### Requirement 13: Backend - Nuevos Endpoints Administrativos

**User Story:** Como desarrollador, quiero endpoints backend organizados y seguros para todas las funcionalidades del panel administrativo, para garantizar una arquitectura limpia y escalable.

#### Acceptance Criteria

1. THE Stats_Service SHALL expose `GET /api/admin/stats/dashboard` returning all KPI metrics in a single response.
2. THE Stats_Service SHALL expose `GET /api/admin/stats/charts` returning time-series data for all dashboard charts.
3. THE Admin_Panel backend SHALL expose `GET /api/admin/inmuebles` with support for query parameters: page, limit, search, tipo, operacion, estado_aprobacion, precio_min, precio_max, sort_by, sort_order.
4. THE Admin_Panel backend SHALL expose `PUT /api/admin/inmuebles/:id/aprobar`, `PUT /api/admin/inmuebles/:id/rechazar`, `PUT /api/admin/inmuebles/:id/destacar`, `PUT /api/admin/inmuebles/:id/pausar`.
5. THE Admin_Panel backend SHALL expose `GET /api/admin/usuarios` with support for query parameters: page, limit, search, rol, estado.
6. THE Admin_Panel backend SHALL expose `PUT /api/usuarios/:id/suspender`, `PUT /api/usuarios/:id/activar`, `DELETE /api/admin/usuarios/:id/sesiones`.
7. THE Admin_Panel backend SHALL expose `GET /api/admin/contactos` with support for query parameters: page, limit, search, estado, prioridad.
8. THE Admin_Panel backend SHALL expose `POST /api/admin/contactos/:id/notas`, `PUT /api/admin/contactos/:id/asignar`, `PUT /api/admin/contactos/:id/archivar`.
9. THE Admin_Panel backend SHALL expose `GET /api/admin/actividad` with support for query parameters: page, limit, tipo.
10. THE Admin_Panel backend SHALL expose `GET /api/admin/reportes/export` with query parameter `format` (xlsx, pdf).
11. ALL admin endpoints SHALL be protected by `verificarToken` and `verificarRol(['admin'])` middleware.
12. ALL admin endpoints SHALL return consistent JSON responses with structure: `{ success: boolean, data: any, message?: string, pagination?: object }`.
13. IF any admin endpoint receives invalid query parameters, THEN THE backend SHALL return a 400 error with a descriptive validation message.

---

### Requirement 14: Base de Datos - Extensiones Necesarias

**User Story:** Como desarrollador, quiero las tablas, columnas, índices y triggers necesarios para soportar todas las funcionalidades del nuevo panel administrativo, para garantizar integridad y rendimiento.

#### Acceptance Criteria

1. THE database SHALL have a table `actividad_admin` with columns: id, admin_id (FK usuarios), accion, recurso_tipo, recurso_id, detalles (JSONB), ip_address, created_at.
2. THE database SHALL have a column `destacado` (BOOLEAN DEFAULT FALSE) in the `inmuebles` table.
3. THE database SHALL have a column `vistas` (INTEGER DEFAULT 0) in the `inmuebles` table.
4. THE database SHALL have a column `estado_usuario` (ENUM: activo, suspendido) in the `usuarios` table.
5. THE database SHALL have a column `ultimo_acceso` (TIMESTAMPTZ) in the `usuarios` table.
6. THE database SHALL have a table `notas_contacto` with columns: id, contacto_id (FK contactos), admin_id (FK usuarios), nota (TEXT), created_at.
7. THE database SHALL have a column `agente_asignado_id` (FK usuarios) in the `contactos` table.
8. THE database SHALL have a column `prioridad` (ENUM: baja, media, alta) in the `contactos` table.
9. THE database SHALL have a column `archivado` (BOOLEAN DEFAULT FALSE) in the `contactos` table.
10. THE database SHALL have optimized indexes on: `inmuebles(estado_aprobacion)`, `inmuebles(tipo_inmueble)`, `inmuebles(created_at DESC)`, `usuarios(rol)`, `usuarios(estado_usuario)`, `contactos(estado_contacto)`, `actividad_admin(created_at DESC)`.
11. THE database SHALL have a trigger `trg_update_ultimo_acceso` that updates `usuarios.ultimo_acceso` on each successful login.
12. THE database SHALL have a view `v_inmuebles_admin` that joins `inmuebles`, `ubicaciones`, `fotografias` (portada), and `usuarios` (propietario) for efficient admin queries.
13. THE database SHALL have a view `v_dashboard_stats` that pre-computes all KPI counts for the dashboard.
