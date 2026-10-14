# SaaS multi-tenant — estado y cómo continuar

Rama `feat/saas`. **Sin merge ni deploy.** PADELBOX sigue intacto en producción.

---

## Arrancarlo en otra máquina

```bash
git checkout feat/saas
npm install
echo 'SAAS_ENABLED="true"' >> .env.local   # sin esto, /saas y /api/saas dan 404
npm run dev
```

Luego entra a `http://localhost:3000/saas/nueva`, haz login con tu email y monta
una quiniela de prueba.

`.env.local` **no está en git** (y así debe seguir). Necesitas copiar de la otra
máquina, o volver a sacar de Vercel: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
`AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`,
`CRON_SECRET`.

> El repo usa **npm** (`package-lock.json`), aunque `claude.md` diga pnpm.

---

## Reglas que no se rompen

1. **Nada de lo viejo cambia.** El diff contra `main` son 5.146 líneas añadidas y
   **cero borradas**. Solo dos ficheros preexistentes aparecen tocados, y ambos
   únicamente con líneas nuevas: `.env.example` y `prisma/schema.prisma`.
2. **Toda tabla nueva empieza por `Saas`.** Ninguna tiene FK a `User`, `Match`,
   `Prediction`, `Rules`... El único puente es `SaasMembership.userId`, un
   `User.id` guardado como String suelto **sin relation de Prisma**.
3. **El dinero nunca pasa por la app.** El único cobro es la suscripción del
   organizador, en la web, con Stripe. La app iOS no vende nada ni enlaza a
   comprar: eso es lo que la mantiene fuera de la clasificación de concursos con
   premio de Apple.
4. **`lib/sync.ts`, `lib/scoring.ts`, `lib/ranking.ts`, `lib/permissions.ts` y los
   crons de PADELBOX no se tocan.** `calcPoints` se reusa importándola.

---

## ⚠️ Al crear una migración nueva

`prisma migrate diff` cuela **siempre** esta línea:

```sql
ALTER TABLE "KnockoutNotice" ALTER COLUMN "updatedAt" DROP DEFAULT;
```

Es *drift* preexistente: la migración `20260623_add_knockout_notice` se escribió a
mano con `DEFAULT CURRENT_TIMESTAMP` y el modelo declara `@updatedAt` sin default.
No tiene nada que ver con el SaaS y **toca una tabla viva** del sistema de avisos
push. **Hay que borrarla a mano de la migración.**

Y nunca `prisma migrate dev` contra la base de producción: puede ofrecer un reset.
Solo SQL revisado a mano + `prisma migrate deploy`.

---

## Qué hay construido

| Zona | Ficheros |
|---|---|
| Flag maestro | `lib/saas/flags.ts`, `app/saas/layout.tsx` |
| Tenant y permisos | `lib/saas/{tenant,permissions,roles,slug,scope}.ts` |
| Datos deportivos | `lib/saas/providers/espn.ts`, `lib/saas/sync.ts`, `lib/saas/csv.ts` |
| Puntuación | `lib/saas/scoring.ts`, `lib/saas/ranking.ts` |
| Alta y planes | `lib/saas/tenants.ts`, `lib/saas/plans.ts` |
| Suscripción e idiomas | `lib/saas/billing.ts`, `lib/saas/i18n.ts` |
| Páginas | `app/saas/nueva`, `app/saas/[tenant]{,/panel,/unirse}` |
| API | `app/api/saas/**` (9 endpoints, zod en todos los bodies) |
| Tests | `tests/saas-*.test.ts` — 178 en verde |

### Endpoints

```
POST   /api/saas/tenants                 alta del comercio
GET    /api/saas/leagues?q=              buscador del catálogo (221 ligas)
GET    /api/saas/[tenant]/competitions
POST   /api/saas/[tenant]/competitions   + import inicial opcional
GET    /api/saas/[tenant]/entries
POST   /api/saas/[tenant]/entries        pronóstico
GET    /api/saas/[tenant]/ranking
POST   /api/saas/[tenant]/join
GET    /api/saas/[tenant]/players
PATCH  /api/saas/[tenant]/players        marcar pago / cambiar rol
GET    /api/saas/cron/sync               cron propio (usa el CRON_SECRET existente)
```

---

## Estado de la base de datos

Las tablas del SaaS **ya existen en la Neon de producción** (migraciones
`20260719_add_saas_core` y `20260719_saas_scoring_rules`), vacías e inertes:
ninguna ruta las lee con el flag apagado y ningún cron las toca.

`main` no conoce esas migraciones. `prisma migrate deploy` desde `main` las ignora
sin error, así que un redespliegue de producción no rompe nada.

Última verificación de PADELBOX: 143 usuarios (63 pagados), 131 partidos,
6.192 pronósticos (6.163 puntuados), `Rules id=1` en 3/1/15.

---

## Pendiente de decidir (no de programar)

- **Modelo de negocio.** `lib/saas/plans.ts` tiene precios y límites de ejemplo en
  un solo fichero editable. La máquina de estados de suscripción
  (`lib/saas/billing.ts`) está hecha y testeada; falta `npm i stripe`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y llamar a `applyStripeEvent`
  desde el webhook.
- **La landing.** Dos mockups en `docs/landing-mockups/` (ábrelos en el navegador):
  `landing-oscura.html` y `landing-clara.html`. Falta elegir uno y llevarlo a
  `app/lanza-tu-quiniela`.
- **Review de la app en stores.** Sin tocar todavía.

## Decisiones tomadas que conviene no deshacer sin pensarlo

- **Sin `middleware.ts`.** El tenant sale de la ruta (`/saas/[tenant]/...`), no del
  subdominio. Un middleware correría en **todas** las peticiones del proyecto,
  incluidas las `/api/*` que consume la app publicada en las stores.
- **A quien no es miembro se le responde 404, no 403.** Un 403 confirmaría que el
  comercio existe y permitiría enumerar clientes probando slugs.
- **Un impago no suspende.** Pasa a `PAYMENT_FAILED` y la quiniela sigue
  sirviéndose. Cortar el torneo a mitad a cincuenta jugadores por una tarjeta
  caducada castiga a quien no tiene la culpa.
- **El marcador exacto es excluyente**: no acumula los puntos parciales, o clavar
  el resultado podría pagar menos que fallarlo con estilo.
- **Diccionario de idiomas propio en vez de next-intl**, que exigiría envolver el
  layout raíz y tocar el enrutado de todo el proyecto. Las claves ya están
  extraídas, así que migrar después es directo.
