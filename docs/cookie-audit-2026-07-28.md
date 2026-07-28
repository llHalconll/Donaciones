# Auditoría técnica de cookies y almacenamiento

Fecha de observación: 2026-07-28.  
Entorno configurado: `http://localhost:3000`.

No existe una URL pública de producción en el repositorio. Por eso esta
auditoría cubre el entorno local, los endpoints externos configurados y el
código; debe repetirse sobre el dominio final con un inicio de sesión completo.

## Cookies observadas o creadas

| Nombre | Emisor | Observación |
|---|---|---|
| `dsaas_pending_legal_consent` | Aplicación | Cookie temporal creada solo al iniciar el registro con Google. `HttpOnly`, `SameSite=Lax`, ruta `/auth/callback`, duración 10 minutos y `Secure` en producción. Se elimina al volver del OAuth. |
| `__cf_bm` | Infraestructura de Supabase/Cloudflare | Observada al consultar Supabase Auth e iniciar Google OAuth. `HttpOnly`, `SameSite=None`, `Secure`, dominio `supabase.co`; la respuesta observada indicó 30 minutos. |
| `__Host-GAPS` | Google Accounts | Observada al abrir Google Accounts sin sesión. `Secure`, `HttpOnly`, ruta `/`; la respuesta observada indicó aproximadamente dos años. Su presencia exacta depende del flujo y estado del navegador. |
| Cookies de sesión Supabase | Aplicación/Supabase SSR | El código las administra dinámicamente después de autenticar. Sus nombres y atributos definitivos requieren completar un login en el dominio final. |

No se observó `Set-Cookie` en:

- `/auth/login` sin autenticar.
- `/auth/register` sin autenticar.
- La descarga GET de `https://static.hotmart.com/checkout/widget.min.js`.

La ausencia de `Set-Cookie` en la descarga del script no demuestra que el
checkout o sus recursos posteriores no utilicen cookies.

## OAuth comprobado

El endpoint Supabase configurado redirigió a Google solicitando los scopes:

- `email`
- `profile`

La configuración de la aplicación añade además `access_type=offline` y
`prompt=consent`. Debe confirmarse en el flujo final si Google o Supabase
conservan tokens de proveedor y con qué duración.

## Web Storage

| Almacén | Clave | Finalidad | Duración |
|---|---|---|---|
| LocalStorage | `theme` | Preferencia visual | Hasta borrado manual |
| SessionStorage | `dsaas_session` | Correlación anónima de eventos dentro de la pestaña | Sesión de pestaña |
| SessionStorage | `dsaas_profile_view:{profileId}:{pathname}` | Evitar duplicar una vista en la misma pestaña | Sesión de pestaña |

## Sistema de consentimiento implementado

- La ruta estática `/cookies` publica la Política de Cookies vigente.
- El banner permite aceptar todas, rechazar las no esenciales o configurar
  preferencias y analítica por separado.
- La clave `dsaas_cookie_consent` conserva en LocalStorage la versión, las
  categorías, el método y las horas suministradas por el servidor durante
  un máximo de 12 meses.
- El tema y la analítica propia no crean sus claves antes del consentimiento.
- El widget integrado de Hotmart no se descarga antes de aceptar analítica.
  Si se rechaza, el checkout directo sigue disponible en una pestaña nueva.
- Los usuarios autenticados generan evidencia privada en
  `cookie_consent_records`; los visitantes anónimos no generan identificador,
  fila de base de datos ni registro de IP completa.

## Pendientes antes del lanzamiento internacional

1. Configurar el dominio canónico real.
2. Repetir la inspección en navegación privada y autenticada.
3. Completar registro por correo y Google.
4. Abrir un checkout Hotmart real y revisar cookies, iframes y solicitudes.
5. Registrar nombre, dominio, finalidad, duración y atributos de cada cookie.
6. Validar con asesoría jurídica la clasificación del widget de Hotmart y los
   textos de la Política según los países de lanzamiento.
