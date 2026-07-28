# Política técnica de retención y eliminación de datos

Estado: línea base técnica pendiente de aprobación legal.  
Versión: 2026-07-28.

## Retención implementada

| Categoría | Plazo técnico | Acción |
|---|---:|---|
| Eventos analíticos | 13 meses | Eliminación de la fila |
| Reportes resueltos o descartados | 24 meses desde su revisión | Eliminación de la fila |
| Payload y error de webhooks procesados o ignorados | 90 días | Vaciado de `payload` y `error_message` |
| Metadatos de webhooks | 13 meses | Eliminación de la fila |
| Perfil, redes, objetivos e imágenes | Mientras exista la cuenta | Eliminación al tramitar una solicitud verificada |
| Aceptaciones legales | Mientras exista el usuario de Auth | Eliminación en cascada con el usuario |

Los reportes pendientes o todavía en investigación no se purgan
automáticamente. La desactivación del perfil no inicia un plazo de eliminación:
oculta el perfil público, pero conserva la cuenta y sus datos.

## Ejecución

La migración `015_data_retention.sql` crea
`public.purge_expired_operational_data()`. Solo `service_role` puede ejecutarla.
Debe programarse una vez al día mediante Supabase Cron o un job de backend:

```sql
SELECT * FROM public.purge_expired_operational_data();
```

La función informa cuántas filas eliminó o depuró. El job que la invoque debe
conservar ese resultado en los logs operativos sin copiar payloads personales.

## Eliminación definitiva

Una solicitud verificada requiere:

1. Confirmar la identidad y el UUID del titular.
2. Eliminar las carpetas del usuario en `avatars`, `banners` y
   `support-goals`.
3. Eliminar cualquier `webhook_event` asociado antes de perder sus referencias.
4. Eliminar el usuario mediante Supabase Auth Admin.
5. Verificar que las cascadas retiraron perfil, redes, objetivos, niveles,
   analítica, reportes y aceptaciones legales.

El procedimiento operativo detallado está en
`supabase/admin_delete_user.sql`. La aplicación no promete eliminación
automática: el canal de soporte debe tramitarla manualmente hasta que exista un
flujo administrativo automatizado.

## Revisión

Los plazos deben revisarse cuando se active el webhook de Hotmart, cambien las
obligaciones legales aplicables o se incorporen nuevos proveedores o categorías
de datos.
