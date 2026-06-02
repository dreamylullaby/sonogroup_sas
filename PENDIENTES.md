# PENDIENTES

## Backend / Base de datos

1. **Ejecutar migración de borradores**: Correr el query de `borradores_inmuebles` en Supabase.

2. **ALTER TYPE**: Ejecutar `ALTER TYPE tipo_sala_comedor ADD VALUE 'separados';` en Supabase.

3. **Notificaciones de favoritos**: Crear trigger que notifique a usuarios cuando una propiedad en sus favoritos cambie de precio o estado. Requiere:
   - Trigger `AFTER UPDATE ON inmuebles` que detecte cambios en `valor` o `activo`
   - INSERT en `notificaciones` para cada usuario con esa propiedad en `favoritos`
   - Opcionalmente enviar email a usuarios con `notificaciones_email = true`

## Frontend

1. **Fotografías**: El formulario de publicar no incluye subida de fotos.

2. **Indicador de fortaleza de contraseña**: Barra de 4 segmentos bajo "Nueva contraseña" en AccountSettings.

3. **Perfil Admin — Stats de plataforma**: Card con estadísticas globales expandida (ancho completo).
