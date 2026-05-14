# claude.md — Convenciones operativas para Claude

> **Lee este archivo antes de hacer cualquier cosa en este repo.** Si vas a hacer un cambio que rompa alguna de estas convenciones, pídele permiso al humano antes.

---

## Qué es esto

Quiniela privada del **Mundial de Fútbol 2026** para los socios del club PADELBOX (Madrid). Web first (Next.js 14), app móvil (RN/Expo) en fase 2.

- Liga única del club (sin grupos privados en MVP).
- **Sistema de puntos: 3 (marcador exacto) / 1 (ganador correcto) / 0 (fallo)** — `lib/scoring.ts` es la única fuente de verdad.
- Bonus de **+25 pts** si el usuario acierta el campeón del Mundial (pick congelado al primer pitido).
- Premios off-platform: la app NO maneja dinero. El admin marca `User.hasPaid` a mano. Sin `hasPaid`, el usuario no puede crear/editar predicciones.

---

## Stack

| Capa | Tech | Notas |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | RSC por defecto; `'use client'` solo cuando se necesite |
| Estilos | TailwindCSS + CSS variables (light/dark) | Sin CSS Modules. Componentes ad-hoc — no shadcn instalado, primitivas mínimas en `components/ui/` |
| DB | Neon Postgres (Vercel Marketplace) | `DATABASE_URL` (pooler) + `DIRECT_URL` (migraciones) |
| ORM | Prisma 5 | Migraciones en `prisma/migrations/` |
| Auth | NextAuth v5 / Auth.js | Email magic link (Resend) + Google OAuth opcional |
| Email | Resend | Magic link + futuras notificaciones |
| Datos | API-Football (api-sports.io) | Liga del Mundial 2026 |
| Cron | Vercel Cron Jobs | Definidos en `vercel.json` |
| Tests | Vitest | Solo unit tests por ahora; e2e (Playwright) en fase posterior |

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
pnpm db:seed             # crea admin + Rules singleton
pnpm db:studio           # abre Prisma Studio
```

---

## Convenciones de código

1. **Server Components por defecto.** Marca `'use client'` solo cuando uses hooks (`useState`, `useEffect`, etc.) o handlers de browser.
2. **Mutaciones:** Server Actions cuando hay un formulario en una página servidor; rutas API REST cuando se llaman desde cliente con `fetch` o desde la futura app móvil.
3. **Validación de entrada en API:** siempre `zod`. Nunca confíes en el body del request.
4. **Autorización:** toda ruta `/api/**` y toda página protegida pasa por `lib/permissions.ts`:
   - `requireUser()` / `requireUserApi()` — sesión válida.
   - `requirePaidApi()` — sesión válida + `hasPaid: true`. Aplica a `POST /api/predictions`.
   - `requireAdmin()` / `requireAdminApi()` — `role: ADMIN`.
   - `verifyCronSecret(req)` — header `Authorization: Bearer ${CRON_SECRET}` en rutas `/api/cron/*`.
5. **Lógica de puntos:** vive **solo** en `lib/scoring.ts`. Si cambias el sistema de puntos, actualiza `tests/scoring.test.ts` con casos nuevos. `lib/sync.ts` la consume; no dupliques la fórmula.
6. **Tiempo:** Postgres guarda UTC. UI formatea con `Intl.DateTimeFormat('es-ES')` desde `lib/format.ts`. Cron y locks comparan en UTC.
7. **Idioma:** UI en **español de España**. Strings hardcoded está bien por ahora — i18n no es prioritario.
8. **Naming:**
   - Rutas/folders: `kebab-case` (`/admin/usuarios`, `/api/admin/sync-matches`).
   - Componentes React: `PascalCase` (`<MatchCard />`, `<PredictionForm />`).
   - Utilidades: `camelCase` (`calcPoints`, `formatDateTime`).
9. **Imports:** alias `@/` apunta a la raíz del proyecto. Úsalo siempre en imports cross-folder (`@/lib/db`, no `../../lib/db`).
10. **Sin `any`** salvo justificación clara y comentada.
11. **Comentarios:** solo cuando el "por qué" no es obvio. No documentes lo que el código dice solo.

---

## Convenciones de Prisma

- Antes de tocar `prisma/schema.prisma`, crea una migración nombrada con `pnpm db:migrate --name describe_el_cambio`.
- **No edites** archivos en `prisma/migrations/*` ya creados.
- Para hotfixes en producción: `prisma migrate deploy` desde CI/Vercel, nunca `db push`.
- El singleton `Rules` siempre tiene `id=1`. El seed lo crea idempotentemente.
- Borrar usuarios cascadea a `accounts`, `sessions`, `predictions`. Comprueba que estás seguro antes de borrar.

---

## UX & Diseño

- **Branding:** logo PADELBOX en `public/logos/completo-blanco.png` (para dark) y `completo-negro.png` (para light). El componente `<Logo />` alterna automáticamente vía `next-themes`. **No uses otros assets de marca sin confirmar con el club.**
- **Paleta:** definida con CSS vars en `app/globals.css`. Acento `#B6FF3C` (verde lima del logo). No metas más colores sin actualizar el archivo.
- **Tipografía:** `Archivo Black` (display, marcadores, titulares) + `Inter` (UI, tablas) — ya cargadas vía `next/font` en `app/layout.tsx`.
- **Tabular nums** obligatorio en marcadores, puntos y rankings: clase `.tabular-nums` o `font-feature-settings: 'tnum'`.
- **Card de partido:** variante A compacta horizontal (`components/MatchCard.tsx`).
- **Dashboard:** variante C podio social (`components/PodioHero.tsx` + `app/(app)/page.tsx`).
- **Formulario de pronóstico:** steppers ± + input numérico real (`type="number" inputMode="numeric"`). El usuario puede escribir, usar flechas o tocar los botones — soporta los 3 inputs.

---

## Convenciones de seguridad

- **Nunca commitees `.env` ni `.env.local`.** Solo `.env.example` (sin secretos reales).
- `AUTH_SECRET` y `CRON_SECRET` se generan con `openssl rand -base64 32` y `openssl rand -hex 32` respectivamente.
- Si rotas un secreto, hazlo en Vercel **antes** de hacer push.
- Los crons exigen `Authorization: Bearer ${CRON_SECRET}` y devuelven 403 si no coincide.
- Validación de inputs de usuario con `zod` en todas las rutas API. Marcadores limitados a `0..20`.
- API-Football key no debe filtrarse al cliente — solo se usa server-side desde `lib/api-football.ts` y `lib/sync.ts`.

---

## Flujos críticos (NO los toques sin entenderlos)

### 1. Registro y pago
1. Usuario entra → magic link / Google → cuenta creada (`hasPaid: false`).
2. Puede navegar, ver partidos y ranking. Si intenta `POST /api/predictions` → 403.
3. Admin entra a `/admin/usuarios` → marca al usuario como pagado.
4. (Futuro) Email automático "Tu cuenta está activa".

### 2. Cierre y scoring (cron `lock-and-score` cada 10 min)
- Si `kickoff - lockOffsetMin <= now` y `lockedAt = null` → setea `lockedAt = now`. No más predicciones.
- Si `tournamentStartAt <= now` y users con `championPick` no tienen `championLockedAt` → setea `championLockedAt`.
- Si `status = FINISHED` y `scoredAt = null` → calcula `prediction.points` vía `calcPoints`, setea `scoredAt`.

### 3. Sync API-Football (cron `sync-matches` diario a las 06:00 UTC)
- Pull de fixtures de la liga del Mundial. Upsert por `apiFootballId`. Actualiza marcadores y status. Idempotente.

---

## Cosas que **NO** quiero ver

- ❌ Mocks de la DB en tests de scoring — `calcPoints` es pura, no hace falta.
- ❌ Recalcular puntos en cliente. Solo confía en `prediction.points` que viene del cron/recompute.
- ❌ Llamar a API-Football desde el cliente.
- ❌ Hacer `prisma.$queryRaw` salvo necesidad real — usa el query builder de Prisma.
- ❌ Backwards-compat shims, feature flags, "// removed" comments, código muerto comentado. Borra lo que no se usa.
- ❌ `console.log` en código de producción — usa los logs de error de la propia ruta API.
- ❌ Mezclar dos cambios distintos en un mismo PR.

---

## Cosas que **SÍ** quiero ver

- ✅ Tests unit cuando toques `lib/scoring.ts` o reglas de negocio.
- ✅ Una migración nombrada cuando toques `schema.prisma`.
- ✅ Mensajes de error en español cara al usuario; logs en inglés.
- ✅ Validación con `zod` en todo body de request.
- ✅ `force-dynamic` en páginas que dependen de sesión o datos cambiantes (ya está puesto en las páginas relevantes).
- ✅ Cuando dudes entre dos opciones, mantener la más simple. El MVP se construye eliminando, no añadiendo.

---

## Mapa rápido del repo

```
app/
  (auth)/login/        → magic link + Google
  (app)/               → área autenticada (dashboard, partidos, ranking, perfil)
  admin/               → área ADMIN (usuarios, partidos, reglas)
  api/                 → rutas REST
    predictions/       → POST guarda predicción (requiere hasPaid)
    cron/              → cron jobs Vercel (lock-and-score, sync-matches)
components/            → MatchCard, PredictionForm, PodioHero, Countdown, Nav, ui/
lib/
  auth.ts              → NextAuth config
  db.ts                → Prisma singleton
  scoring.ts           → calcPoints — fuente de verdad de puntos
  ranking.ts           → computeRanking() — agregación in-process
  sync.ts              → syncMatchesFromApi, lockAndScore, recomputeAll
  api-football.ts      → cliente API-Football + mappers
  permissions.ts       → guards de auth (Server + API + cron)
  format.ts            → Intl + tiempo + banderas
prisma/
  schema.prisma        → modelos
  seed.ts              → admin + Rules singleton
tests/
  scoring.test.ts      → casos del sistema 3/1/0
vercel.json            → definición de cron jobs
```

---

## Onboarding al repo (Sergio, primera vez)

1. `pnpm install`
2. Copia `.env.example` → `.env.local` y rellena con valores reales (Neon, Resend, Google opcional, API-Football, secretos).
3. `pnpm db:migrate` (crea la base de datos local en Neon o un Postgres local).
4. `pnpm db:seed` (crea el admin + reglas).
5. `pnpm dev` y entra a http://localhost:3000.
6. Login con tu email (recibirás magic link en el email configurado en Resend).

Si algo se rompe: ver `README.md` o pregunta antes de modificar la config global.
