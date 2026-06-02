# Plan de Acción Frontend — PENDIENTES

## Fase 2: Validación formal y manejo de errores

- Incorporar Zod + react-hook-form para estandarizar validaciones por flujo.
- Definir schemas por dominio en `src/validation/*` y aplicarlos en Login/Register/PublishProperty/Contact/UserModal.
- Estandarizar traducción de errores backend (400/401/403/404/500) en un parser central.

## Fase 3: Rediseño UI/UX amplio (formularios)

- Crear sistema visual unificado de formularios reutilizable en `src/components/ui/*`.
- Mejorar accesibilidad: foco en primer error, aria-invalid, aria-describedby, mensajes aria-live, contraste y tamaños táctiles.
- Unificar estilo visual entre Register.css, Login.css, Contact.css con el nuevo sistema.

## Fase 4: Compatibilidad funcional por flujos críticos

- Confirmar flujos de favoritos y contacto con mensajes/estados consistentes.
- Asegurar que listados/filtros usan enums válidos y no permiten combinaciones inválidas.

## Fase 5: QA funcional y visual

- Ejecutar smoke tests frontend+backend con checklist de rutas y payloads críticos.
- Probar casos de error intencionales (enum inválido, campos faltantes, auth expirada).
- Ajustar detalles CSS responsivos y consistencia visual final.

## Riesgos

- Cambios extensos rompan comportamiento existente → migración por flujo y pruebas por etapas.
- Divergencia entre enums UI y BD → catálogo único derivado de v3.4.
- Rediseño visual impacte usabilidad en móvil → QA responsive temprano.
