# Quiniela Mundial 2026 · PADELBOX

Quiniela privada del Mundial de Fútbol 2026 para los socios del club **PADELBOX**.

> Stack: Next.js 14 (App Router) · TypeScript · Prisma · Neon Postgres · NextAuth (Auth.js v5) · TailwindCSS · API-Football · Vercel Cron · Resend.

> **Antes de modificar el código, lee [`claude.md`](./claude.md).** Contiene las convenciones y flujos críticos.

---

## Sistema de puntos

| Caso | Pts |
|---|---|
| Marcador exacto (ej. predices 2-1, sale 2-1) | **3** |
| Ganador correcto (1X2) pero marcador distinto | **1** |
| Ganador erróneo | **0** |
| Acertar el campeón del Mundial (pick previo) | **+25** |

Ver [`lib/scoring.ts`](./lib/scoring.ts) y los tests en [`tests/scoring.test.ts`](./tests/scoring.test.ts).

---

## Arranque local

```bash
# 1. Instalar deps
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
# rellena con tus valores

# 3. Generar Prisma client + crear DB
pnpm db:migrate     # crea tablas en Neon (o Postgres local)
pnpm db:seed        # crea Rules singleton + admin desde ADMIN_EMAIL

# 4. Servidor de desarrollo
pnpm dev
# http://localhost:3000
```

### Variables de entorno mínimas

```bash
DATABASE_URL=...        # Neon pooler
DIRECT_URL=...          # Neon directo
AUTH_SECRET=...         # openssl rand -base64 32
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=...      # https://resend.com
EMAIL_FROM="Quiniela PADELBOX <quiniela@padelbox.es>"
API_FOOTBALL_KEY=...    # https://www.api-football.com
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
CRON_SECRET=...         # openssl rand -hex 32
ADMIN_EMAIL=admin@padelbox.es
```

---

## Despliegue en Vercel

1. **Provisionar Neon** desde Vercel Marketplace → te creará `DATABASE_URL` y `DIRECT_URL` automáticamente.
2. **Crear Resend project** y conseguir `RESEND_API_KEY`. Verificar dominio si vas a enviar desde `quiniela@padelbox.es`.
3. **Google OAuth (opcional):** crear credenciales en https://console.cloud.google.com/apis/credentials. Redirect URI: `${AUTH_URL}/api/auth/callback/google`.
4. **API-Football:** alta gratuita en https://www.api-football.com. Plan free = 100 req/día (suficiente con cron diario). Anota la `API_FOOTBALL_KEY` y el `API_FOOTBALL_LEAGUE_ID` del Mundial 2026 cuando se publique.
5. **Conectar repo** a Vercel. Configurar las env vars en el proyecto (scope: Production + Preview).
6. **Primer deploy:** las migraciones se aplican con `pnpm db:deploy` (puedes ejecutar manualmente desde tu local apuntando a `DATABASE_URL` de prod).
7. **Cron Jobs** se activan automáticamente al detectar `vercel.json`. Verifica en Vercel → Settings → Cron Jobs.
8. **Bootstrap del admin:** ejecutar `pnpm db:seed` con `DATABASE_URL` de prod, o crear el usuario manualmente vía SQL en Neon Console:
   ```sql
   UPDATE "User" SET role='ADMIN', "hasPaid"=true WHERE email='admin@padelbox.es';
   ```

---

## Estructura del proyecto

```
app/
  (auth)/login/        Login + verify
  (app)/               Páginas autenticadas (dashboard, partidos, ranking, perfil)
  admin/               Panel admin (usuarios, partidos, reglas)
  api/                 REST API
components/            UI primitives + componentes de dominio
lib/
  auth.ts              NextAuth v5 config
  db.ts                Prisma client singleton
  scoring.ts           ⭐ Fuente de verdad de puntos
  ranking.ts           Cálculo de ranking
  sync.ts              Lock + score + sync API-Football
  api-football.ts      Cliente HTTP
  permissions.ts       Guards
  format.ts            Intl + utilidades de tiempo
prisma/
  schema.prisma        Modelos
  seed.ts              Admin + Rules
tests/                 Vitest (sistema de puntos)
```

---

## Cron jobs (Vercel)

Definidos en [`vercel.json`](./vercel.json):

| Path | Schedule | Descripción |
|---|---|---|
| `/api/cron/sync-matches`   | `0 6 * * *`   | Diario 06:00 UTC — pull API-Football |
| `/api/cron/lock-and-score` | `*/10 * * * *` | Cada 10 min — cierra y puntúa |

Ambos exigen `Authorization: Bearer ${CRON_SECRET}`.

---

## Tests

```bash
pnpm test           # corre una vez
pnpm test:watch     # modo watch
```

Cubrimos la lógica de puntos (3/1/0) con casos exhaustivos. Tests e2e (Playwright) se añadirán en fase posterior.

---

## Roadmap

- [ ] **Sprint 0** — Setup repo, Neon, Vercel preview ✅
- [ ] **Sprint 1** — Auth + DB + admin de usuarios ✅
- [ ] **Sprint 2** — Partidos + sync API-Football
- [ ] **Sprint 3** — Pronósticos + scoring + cron
- [ ] **Sprint 4** — Ranking + dashboard pulido
- [ ] **Sprint 5** — QA + deploy producción + onboarding socios beta
- [ ] **Sprint 6+** — App móvil React Native / Expo (reutiliza API REST)

---

## Transferir el repo a la cuenta de PADELBOX

Cuando el proyecto esté listo para entregarse al club, ver [`scripts/transfer-repo.md`](./scripts/transfer-repo.md).

---

## Licencia

Privado. © 2026 PADELBOX Sports Club.
