# claude.md — Convenciones operativas para Claude

> **Lee este archivo antes de hacer cualquier cosa en este repo.** Si vas a hacer un cambio que rompa alguna de estas convenciones, pídele permiso al humano antes.

---

## Qué es esto

Quiniela privada del **Mundial de Fútbol 2026** para socios y conocidos del club **PADELBOX** (Venezuela). Web first (Next.js 14 App Router), app móvil (Expo SDK 54) en repo separado `quiniela-padelbox-app/`.

- Liga única del club (sin grupos privados en MVP).
- **Sistema de puntos: 3 (marcador exacto) / 1 (ganador correcto) / 0 (fallo)** — `lib/scoring.ts` es la única fuente de verdad.
- Bonus de **+25 pts** si el usuario acierta el campeón del Mundial (pick congelado al primer pitido).
- Premios off-platform: la app NO maneja dinero. El admin marca `User.hasPaid` a mano. Sin `hasPaid`, el usuario no puede crear/editar predicciones.
- SaaS multi-tenant en fase B (scaffolding sin romper PADELBOX): modelos `Tenant` y `Lead` en schema, sin FK a tablas existentes todavía.

---

## Dominios

| Dominio | Uso |
|---|---|
| `quinielabox.com` | Dominio principal de la web (usuarios, landing, auth) |
| `quiniela.solint.cloud` | Alias activo — la app móvil lo usa hardcoded como `API_URL` |
| `quiniela-padelbox.vercel.app` | URL interna Vercel — no usar en producción |

**Regla crítica:** No añadir redirect de `/api/*` desde `solint.cloud → quinielabox.com` hasta que la app móvil se actualice en stores. El endpoint `/api/auth/code/*` y todos los demás deben seguir respondiendo en `quiniela.solint.cloud`.

`AUTH_URL` y `NEXTAUTH_URL` en Vercel (Production) apuntan a `https://quinielabox.com`.

---

## Stack

| Capa | Tech | Notas |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | RSC por defecto; `'use client'` solo cuando se necesite |
| Estilos | TailwindCSS + CSS variables (light/dark) | Sin CSS Modules. No shadcn; primitivas mínimas en `components/ui/` |
| DB | Neon Postgres (Vercel Marketplace) | `DATABASE_URL` (pooler) + `DATABASE_URL_UNPOOLED` (migraciones) |
| ORM | Prisma 5 | Migraciones en `prisma/migrations/` |
| Auth web | NextAuth v5 / Auth.js | Email magic link (Resend) — `lib/auth.ts` |
| Auth móvil | OTP numérico propio | `/api/auth/code/request` + `/api/auth/code/verify` → JWT |
| Email | Resend | Dominio verificado: `contact.solint.cloud` — from: `quiniela@contact.solint.cloud` |
| Datos | ESPN API (via `lib/sync.ts`) | `externalId` es el ESPN event.id |
| Cron | Vercel Cron Jobs | Definidos en `vercel.json` |
| Push | Expo Push API | `lib/push.ts` — tokens en modelo `PushDevice` |
| Tests | Vitest | Solo unit tests; e2e Playwright en fase posterior |

---

## Autenticación — dos flujos

### Web (NextAuth magic link)
1. Usuario introduce email en `/login`.
2. NextAuth envía email con link firmado via Resend.
3. Click → NextAuth valida → sesión en cookie (30 días, DB-backed).
4. Template: `lib/emails/magic-link.ts` — branding PADELBOX × DELISH + footer Solintlabs.

### App móvil (OTP numérico)
1. App llama `POST /api/auth/code/request` con `{ email }`.
2. Backend genera código 6 dígitos (TTL 10 min), manda email con Resend.
3. App llama `POST /api/auth/code/verify` con `{ email, code, name?, phone? }`.
4. Backend devuelve JWT `{ token, user }` — la app lo guarda en SecureStore.
5. Todas las requests llevan `Authorization: Bearer <JWT>`.
6. Template: `lib/emails/login-code.ts` — mismo branding.

---

## Comandos esenciales

```bash
pnpm dev                 # arranca dev server (puerto 3000)
pnpm typecheck           # verifica TypeScript
pnpm lint                # ESLint
pnpm test                # corre vitest unit tests
pnpm db:generate         # regenera Prisma Client
pnpm db:migrate          # crea/aplica migraciones en local
pnpm db:deploy           # aplica migraciones en prod (CI/Vercel)
pnpm db:seed             # crea admin + Rules singleton + sponsors + métodos de pago
pnpm db:studio           # abre Prisma Studio
```

---

## Convenciones de código

1. **Server Components por defecto.** Marca `'use client'` solo cuando uses hooks o handlers de browser.
2. **Mutaciones:** Server Actions cuando hay un formulario en una página servidor; rutas API REST cuando se llaman desde cliente con `fetch` o desde la app móvil.
3. **Validación de entrada en API:** siempre `zod`. Nunca confíes en el body del request.
4. **Autorización** — toda ruta `/api/**` y toda página protegida pasa por `lib/permissions.ts`:
   - `requireUser()` / `requireUserApi()` — sesión válida.
   - `requirePaidApi()` — sesión válida + `hasPaid: true`. Aplica a `POST /api/predictions`.
   - `requireAdmin()` / `requireAdminApi()` — `role: ADMIN`.
   - `verifyCronSecret(req)` — header `Authorization: Bearer ${CRON_SECRET}` en rutas `/api/cron/*`.
5. **Lógica de puntos:** vive **solo** en `lib/scoring.ts`. Si cambias el sistema de puntos, actualiza `tests/scoring.test.ts`. `lib/sync.ts` la consume; no dupliques la fórmula.
6. **Tiempo:** Postgres guarda UTC. UI formatea con `Intl.DateTimeFormat('es-ES')` desde `lib/format.ts`. Cron y locks comparan en UTC.
7. **Idioma:** UI en **español de España**. Strings hardcoded está bien por ahora.
8. **Naming:** rutas/folders `kebab-case`, componentes `PascalCase`, utilidades `camelCase`.
9. **Imports:** alias `@/` apunta a la raíz del proyecto. Úsalo siempre (`@/lib/db`, no `../../lib/db`).
10. **Sin `any`** salvo justificación clara y comentada.
11. **Display names:** usa `publicDisplayName(user)` de `lib/display.ts` para mostrar nombres en ranking/predicciones. Enmascara email si no hay nombre.

---

## Convenciones de Prisma

- Antes de tocar `prisma/schema.prisma`, crea migración con `pnpm db:migrate --name describe_el_cambio`.
- **No edites** archivos en `prisma/migrations/*` ya creados.
- Para hotfixes en producción: `prisma migrate deploy` desde CI/Vercel, nunca `db push`.
- El singleton `Rules` siempre tiene `id=1`. El seed lo crea idempotentemente.
- Borrar usuarios cascadea a `accounts`, `sessions`, `predictions`, `pushDevices`. Ten cuidado.

---

## Modelos del schema (resumen)

| Modelo | Propósito |
|---|---|
| `User` | Socio. Campos extra: `phone`, `hasPaid`, `paidAt/Note/Method/Amount`, `championPick/LockedAt` |
| `Match` | Partido. `externalId` = ESPN event.id. Campos: `stage`, `group`, `kickoff`, `lockedAt`, `scoredAt`, `reminderSentAt` |
| `Prediction` | Pronostico user×match. `points` null hasta cron de scoring |
| `Rules` | Singleton `id=1`. Contiene: cuota, puntos, `lockOffsetMin`, `tournamentStartAt`, `syncPaused`, `weeklyPrizesText`, `championPrizesText`, `championWinner` |
| `Sponsor` | Patrocinadores (DELISH, etc). Admins lo gestionan desde `/admin/sponsors` |
| `PaymentMethod` | Métodos de pago configurables desde `/admin/pagos`. `fields: Json = [{label, value, mono?}]` |
| `PushDevice` | Tokens Expo push por device. Se limpia cuando Expo devuelve DeviceNotRegistered |
| `RateLimit` | Rate limiting DB-backed via `lib/ratelimit.ts`. TTL limpiado por cron diario |
| `Tenant` | SaaS scaffold (sin FK a tablas existentes aún). Status: LEAD/TRIAL/ACTIVE/PAYMENT_FAILED/SUSPENDED/CANCELLED |
| `Lead` | Captura de interesados en "quiero mi quiniela". Fuente: landing, dashboard CTA |

---

## UX & Diseño

- **Branding:** `public/logos/completo-blanco.png` (dark) y `completo-negro.png` (light). El componente `<Logo />` alterna vía `next-themes`.
- **Partners:** `public/partners/delish.png` y `public/partners/solint.png` — usados en emails y footer.
- **Paleta:** CSS vars en `app/globals.css`. Acento `#B6FF3C` (verde lima). No añadas colores sin actualizar el archivo.
- **Tipografía:** `Archivo Black` (display, titulares) + `Inter` (UI, tablas) — cargadas en `app/layout.tsx`.
- **Tabular nums** obligatorio en marcadores, puntos y rankings.

---

## Convenciones de seguridad

- **Nunca commitees `.env` ni `.env.local`.** Solo `.env.example` (sin secretos reales).
- `AUTH_SECRET` y `CRON_SECRET` se generan con `openssl rand -base64 32` y `openssl rand -hex 32`.
- Los crons exigen `Authorization: Bearer ${CRON_SECRET}` y devuelven 403 si no coincide.
- Validación con `zod` en todos los bodies. Marcadores limitados a `0..20`.
- Rate limiting via `lib/ratelimit.ts` (DB-backed, sliding window) — activo en endpoints de auth.
- La ESPN/API key no debe filtrarse al cliente — solo server-side.

---

## Flujos críticos

### 1. Registro y pago
1. Usuario entra → magic link (web) o código OTP (móvil) → cuenta creada (`hasPaid: false`).
2. Puede navegar y ver. Si intenta `POST /api/predictions` → 403.
3. Admin entra a `/admin/usuarios` → marca pagado + método/monto.

### 2. Cierre y scoring (cron `lock-and-score` cada 10 min)
- Si `kickoff - lockOffsetMin <= now` y `lockedAt = null` → setea `lockedAt`.
- Si `tournamentStartAt <= now` y user sin `championLockedAt` → lo setea.
- Si `status = FINISHED` y `scoredAt = null` → calcula puntos vía `calcPoints`, setea `scoredAt`.

### 3. Sync ESPN (cron `sync-matches` diario 06:00 UTC)
- Pull fixtures. Upsert por `externalId`. Actualiza marcadores y status. Idempotente.
- Si `syncPaused = true` en Rules → el cron no toca la DB (modo manual del admin).

### 4. Push notifications
- Cron `daily` envía recordatorio 1h antes del partido (usa `reminderSentAt` para evitar dobles).
- `lib/push.ts` llama Expo Push API. Limpia tokens inválidos automáticamente.

---

## Rutas relevantes

```
app/
  (auth)/login/              → magic link web
  (auth)/login/verify/       → "Revisa tu email" — branding PADELBOX × DELISH
  (app)/                     → área autenticada (dashboard, partidos, ranking, perfil)
  admin/
    usuarios/                → gestión de socios + hasPaid
    partidos/                → edición manual de partidos
    reglas/                  → cuota, puntos, fechas, premios
    pagos/                   → PaymentMethod CRUD + premios del campeonato
    sponsors/                → gestión de patrocinadores
    saas/                    → panel super-admin: Leads + Tenants
  api/
    auth/code/               → OTP numérico para app móvil
    predictions/             → POST requiere hasPaid
    cron/                    → lock-and-score, sync-matches, daily
    leads/                   → POST captura leads (con rate limiting)
    payment-methods/         → GET público (móvil lo usa para inscripción)
    me/push-device/          → registro/baja de tokens push
  (public)/
    lanza-tu-quiniela/       → landing SaaS con CTA + formulario lead
    onboarding/              → wizard crear nueva quiniela
  account/
    delete/                  → página pública eliminación de cuenta (Google Play requirement)
components/
  MatchCard.tsx              → card de partido compacto horizontal
  PredictionForm.tsx         → steppers ± + input numérico
  PodioHero.tsx              → podio social del dashboard
lib/
  auth.ts                    → NextAuth config (magic link + Google opcional)
  db.ts                      → Prisma singleton
  jwt.ts                     → sign/verify JWT para app móvil
  scoring.ts                 → calcPoints — fuente de verdad
  ranking.ts                 → computeRanking() in-process
  sync.ts                    → syncMatchesFromApi, lockAndScore, recomputeAll
  push.ts                    → Expo Push API
  ratelimit.ts               → sliding window DB-backed
  display.ts                 → publicDisplayName (enmascara email si no hay nombre)
  permissions.ts             → guards requireUser/requireAdmin/requirePaid/verifyCron
  format.ts                  → Intl + tiempo + banderas
  emails/
    magic-link.ts            → template magic link web (PADELBOX × DELISH)
    login-code.ts            → template OTP móvil (mismo branding)
prisma/schema.prisma         → modelos
prisma/seed.ts               → admin + Rules + sponsors + PaymentMethods
tests/scoring.test.ts        → casos sistema 3/1/0
vercel.json                  → cron jobs
```

---

## Cosas que NO quiero ver

- ❌ Mocks de la DB en tests de scoring — `calcPoints` es pura.
- ❌ Recalcular puntos en cliente.
- ❌ Llamar a ESPN API desde el cliente.
- ❌ `prisma.$queryRaw` salvo necesidad real.
- ❌ Backwards-compat shims, feature flags, comentarios "// removed", código muerto.
- ❌ `console.log` en producción.
- ❌ Mezclar dos cambios distintos en un mismo commit.
- ❌ Redirect de `/api/*` desde `solint.cloud` hasta que la app móvil se actualice en stores.

## Cosas que SÍ quiero ver

- ✅ Tests unit cuando toques `lib/scoring.ts`.
- ✅ Migración nombrada cuando toques `schema.prisma`.
- ✅ Mensajes de error en español al usuario; logs en inglés.
- ✅ `zod` en todo body de request.
- ✅ `force-dynamic` en páginas con sesión o datos cambiantes.
- ✅ La opción más simple. El MVP se construye eliminando, no añadiendo.

---

## App móvil (repo separado)

Ver `quiniela-padelbox-app/CLAUDE.md` para convenciones del proyecto Expo.
Puntos clave de integración:
- `API_URL` hardcoded: `https://quiniela.solint.cloud` (no cambiar hasta aprobación stores).
- Auth: JWT en SecureStore, header `Authorization: Bearer <token>`.
- Endpoints que consume: todos los `/api/*` excepto `/api/auth/...` de NextAuth.
- Push: token Expo registrado en `POST /api/me/push-device` al arrancar.
