# DonacionesSaaS

Plataforma SaaS de apoyo y donaciones que conecta creadores, profesionales, organizaciones e iglesias con sus comunidades — sin procesar pagos directamente.

Cada monto de apoyo redirige al visitante al checkout de **Hotmart** configurado por el creador.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Backend/Auth/DB | Supabase (PostgreSQL + Auth + Storage) |
| Iconos | Lucide React |
| Tipografía | Geist Sans / Geist Mono |
| Despliegue | Vercel (ready) |

---

## Instalación

```bash
git clone <repo>
cd proyecto-donaciones
npm install
cp .env.example .env.local
# Completa las variables de entorno en .env.local
npm run dev
```

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SITE_URL=https://dominio-real.example
NEXT_PUBLIC_SUPPORT_EMAIL=
NEXT_PUBLIC_DEMO_USERNAME=

# Privadas y sensibles; obligatorias en producción para rate limiting
UPSTASH_REDIS_REST_URL=https://tu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=reemplazar-con-token-real

# Webhook no implementado y no activo
HOTMART_WEBHOOK_ENABLED=false
```

Las variables con prefijo `NEXT_PUBLIC_` son públicas y pueden llegar al navegador.
`UPSTASH_REDIS_REST_TOKEN`, `HOTMART_WEBHOOK_SECRET`, `HOTMART_TOKEN` y
`SUPABASE_SERVICE_ROLE_KEY` son privadas y sensibles: nunca deben usar ese prefijo
ni almacenarse en código. Reemplaza `https://dominio-real.example` por el dominio
canónico antes de desplegar. En producción no se permite usar `localhost`.

Si `NEXT_PUBLIC_SUPPORT_EMAIL` no contiene un correo válido, la interfaz oculta los
enlaces `mailto:`. Si `NEXT_PUBLIC_DEMO_USERNAME` está vacío o no es válido, la demo
se oculta y `/demo` responde como ruta no disponible.

---

## Configuración de Supabase

### 1. Crea el proyecto en Supabase

Ejecuta el esquema base:

```sql
-- Desde supabase/schema.sql
```

### 2. Ejecuta las migraciones en orden

```sql
-- 1. supabase/migrations/001_profile_extended.sql
-- 2. supabase/migrations/002_social_links_extended.sql
-- 3. supabase/migrations/003_donation_buttons_extended.sql
-- 4. supabase/migrations/004_analytics_events.sql
-- 5. supabase/migrations/005_profile_reports.sql
-- 6. supabase/migrations/006_webhook_events.sql
-- 7. supabase/migrations/007_donation_buttons_emoji.sql
-- 8. supabase/migrations/008_oauth_handle_new_user.sql
-- 9. supabase/migrations/009_performance_indexes.sql
-- 10. supabase/migrations/010_public_profile_rls_hardening.sql
```

La migración 010 requiere reconciliación de historial antes de cualquier nuevo
`db push`. Consulta [docs/supabase-migration-reconciliation.md](docs/supabase-migration-reconciliation.md);
no la reapliques únicamente porque el archivo exista.

### 3. Ejecuta Storage (buckets)

```sql
-- supabase/storage.sql
```

### 4. Configura Authentication

- Email + Password habilitado
- Email confirmation: opcional para desarrollo
- Redirect URL: `http://localhost:3000/auth/callback`

---

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm test           # Tests con Node.js built-in runner
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (legal)/         # Términos, Privacidad
│   ├── [username]/      # Página pública del creador
│   ├── admin/           # Panel administrativo (is_admin requerido)
│   ├── api/
│   │   ├── analytics/   # POST — registrar eventos
│   │   ├── reports/     # POST — reportar perfiles
│   │   └── webhook/hotmart/ # Webhook preparado (no activo)
│   ├── auth/            # Login, register, reset password
│   └── dashboard/       # Panel del creador (protegido)
│       ├── analytics/   # Estadísticas
│       ├── buttons/     # Montos de apoyo Hotmart
│       ├── profile/     # Edición de perfil
│       ├── settings/    # Configuración de cuenta
│       └── social/      # Redes sociales
├── components/
│   ├── dashboard/       # Sidebar, header, uploaders
│   ├── shared/          # Header público, footer
│   ├── theme-*          # Dark/light mode
│   └── ui/              # Button, Card, Input, Badge
├── lib/
│   ├── supabase/        # Clientes server/client/middleware
│   ├── utils/           # Procesador de imágenes
│   └── validations/     # auth.ts, url.ts
└── types/
    └── database.types.ts
```

---

## Seguridad

- **RLS activo** en todas las tablas.
- **`is_admin`** solo se puede leer, nunca modificar por formulario normal.
- **URLs de Hotmart** validadas por hostname exacto (no `includes()`).
- **Rate limiting distribuido** con cierre seguro (`503`) en producción si Redis no está disponible.
- **Acciones de autenticación** protegidas sin incluir correos en las claves persistidas.
- **Storage** organizado por `{user_id}/` — RLS previene acceso cruzado.
- **No se usa `service_role`** en ningún cliente del navegador.
- **`user_metadata` no se usa** para permisos — siempre se consulta `profiles`.
- **Esquemas peligrosos** bloqueados: `javascript:`, `data:`, `file:`, `vbscript:`.

---

## Flujo de Hotmart

```
Visitante → selecciona monto → clic en "Apoyar"
  → se registra evento hotmart_redirect en analytics_events
  → validación client-side de URL (HTTPS + hostname)
  → window.location.href = hotmart_checkout_url
  → Visitante llega al checkout de Hotmart
```

> ⚠️ Un clic a Hotmart **no confirma** un pago. El endpoint de webhook responde `503`
> y no procesa eventos, incluso si se solicita habilitarlo, hasta implementar y probar
> firma HMAC, validación del payload e idempotencia.

---

## Métricas disponibles

| Métrica | Significado |
|---|---|
| `profile_view` | El visitante cargó la página del creador |
| `amount_selected` | El visitante seleccionó un monto |
| `hotmart_redirect` | El visitante hizo clic en "Apoyar" |

**No disponible sin webhook de Hotmart:**
- Pagos completados
- Ingresos confirmados
- Donaciones recibidas

---

## Planes y límites

| Plan | Botones | Redes sociales |
|---|---|---|
| free | 5 | 5 |
| pro | 20 | 15 |
| organization | 50 | 30 |

Los límites se validan **del lado del servidor** en cada Server Action.

---

## Despliegue en Vercel

```bash
# 1. Conecta tu repositorio a Vercel
# 2. Configura NEXT_PUBLIC_SITE_URL con el dominio canónico real
# 3. Configura las variables públicas opcionales de soporte y demo
# 4. Configura las credenciales privadas de Upstash
# 5. Mantén HOTMART_WEBHOOK_ENABLED=false
# 6. Ejecuta lint, typecheck, tests y build antes del deploy
```

La cuenta indicada por `NEXT_PUBLIC_DEMO_USERNAME` debe crearse manualmente mediante
el flujo normal de registro, quedar bajo control de la plataforma y contener solo
datos públicos preparados para demostración. No uses una cuenta personal ni insertes
datos simulados desde el código.

---

## Roadmap de fases

| Fase | Estado | Descripción |
|---|---|---|
| 0 | ✅ Completa | Correcciones críticas, build limpio |
| 1 | ✅ Completa | Perfil completo del creador |
| 2 | ✅ Completa | Avatar y banner |
| 3 | ✅ Completa | Redes sociales |
| 4 | ✅ Completa | Montos y URLs de Hotmart |
| 5 | ✅ Completa | Dashboard con métricas |
| 6 | ✅ Completa | Página pública |
| 7 | ✅ Completa | Métricas de analytics |
| 8 | ⚠️ Parcial | Admin — datos reales, sin acciones de moderación avanzada |
| 9 | ✅ Completa | Reportes de perfiles |
| 10 | 🔜 Pendiente | Configuración de apariencia avanzada |
| 11 | ✅ Completa | Organizaciones (account_type) |
| 12 | ✅ Scaffolded | Webhook de Hotmart preparado |
| 13 | ✅ Completa | Planes y límites centralizados |
| 14 | ✅ Completa | Páginas legales base |
| 15 | ✅ Completa | SEO, sitemap, robots, OG tags |
| 16 | ✅ Completa | Tests de validación |
| 17 | ✅ Completa | Documentación |

---

## Notas legales

Los textos en `/terms` y `/privacy` son **borradores provisionales** y deben ser revisados por un profesional del derecho antes de publicación oficial.
