# PENDIENTES

## Base de datos (ejecutar en Supabase)

1. Migración `borradores_inmuebles` (query ya proporcionado)
2. `ALTER TYPE tipo_sala_comedor ADD VALUE 'separados';`
3. Trigger `fn_notificar_cambio_favorito` (query ya proporcionado)

## Frontend — Mejoras menores

1. Subida de fotografías en formulario de publicar
2. Indicador de fortaleza de contraseña en AccountSettings
3. Validación con Zod + react-hook-form
4. QA responsive completo
5. Edición de propiedad para usuario (requiere ruta sin `adminOnly`)

## Admin Dashboard — Spec completa en `.kiro/specs/admin-dashboard-redesign/`

Tareas completadas: 1-6 (layout, sidebar, navbar, stats, dashboard, KPIs, gráficas)
Pendiente: tareas 7-21 (propiedades admin avanzado, CRM, reportes, seguridad, actividad, SQL extensions)

Ver archivos de referencia:
- `.kiro/specs/admin-dashboard-redesign/requirements.md` — Requisitos detallados
- `.kiro/specs/admin-dashboard-redesign/design.md` — Arquitectura y diseño técnico
- `.kiro/specs/admin-dashboard-redesign/tasks.md` — Plan de implementación con checklist
