# Progreso pivote SaaS — estado y próximos pasos

> Notas de trabajo para retomar desde cualquier máquina. Rama: **`feat/saas`**.
> Última actualización: sesión de puesta en producción de la landing + Google login + Stripe (código).

---

## 🟢 Sesión 2 — el SaaS ya es JUGABLE de punta a punta (plan FREE)

El backend estaba hecho pero **sin cablear**. Cableado en esta sesión (todo live):
- Competencia se crea **OPEN** (no atascada en DRAFT).
- **UI de pronóstico** interactiva en `/saas/[slug]` (steppers → POST entries). Fichero `app/saas/[tenant]/TenantFixtures.tsx`.
- **Scoring cableado**: el cron `/api/saas/cron/sync` ahora hace lock + score, y **quedó programado en `vercel.json`** (cada hora). Antes no corría.
- Botón manual **"↻ Actualizar partidos y puntos"** en el panel → `POST /api/saas/[tenant]/competitions/[id]/sync`.
- **Gestión de jugadores** en el panel (`PlayersManager.tsx`) → marcar pagados (PATCH players).
- El **OWNER siempre puede pronosticar** (no se paga a sí mismo).
- **Login con Google** activo; **hub `/mis-quinielas`** post-login; login genérico QuinielaBOX.
- **Apple**: provider aislado en try/catch (no puede tumbar el login); `.p8` corregido en Vercel. Falta verificación de dominio para que funcione al pulsarlo.

**Flujo testeable como cliente (FREE):** login → `/mis-quinielas` → crear en `/saas/nueva` → panel "Actualizar partidos y puntos" → pronosticar → invitar → marcar pagados → puntos. Pro vía botón + Stripe.

**Panel del organizador (ya construido, tipo admin PADELBOX):**
- Crear/añadir competición (ESPN o manual) — `AddCompetition.tsx`.
- Editar puntos y cierre + abrir/cerrar — `CompetitionSettings.tsx` + PATCH `competitions/[id]`.
- Partidos y resultados: ver, editar/fijar marcador a mano (recalcula al instante), añadir partidos manuales — `FixturesManager.tsx` + rutas `fixtures`.
- Gestión de jugadores (marcar pagados) — `PlayersManager.tsx`.
- Sincronizar ESPN + puntuar a demanda — `SyncButton.tsx`.
- **Color del tenant** aplicado a TODO el UI (`lib/saas/theme.ts` → override de `--accent`).

**Modelo FREE vs PRO (ya diferenciado):**
- Límites en `lib/saas/plans.ts` (enforced en las APIs): FREE 15 jugadores / 1 competencia / **con anuncios** / marca QuinielaBOX; PRO $9 → 500 / 5 / **sin anuncios** / sin marca; CUSTOM ilimitado.
- FREE muestra slot de publicidad (self-promo QuinielaBOX) + "Powered by QuinielaBOX"; PRO los quita.
- **Nota:** FREE usa catálogo ESPN (se habilitó porque la entrada manual sola no bastaba). Si se quiere reservar el catálogo a PRO, hay que construir bien la entrada manual primero.

**Backlog SaaS pendiente:** bonus de campeón (+25, **necesita tabla nueva `SaasChampionPick` + migración additive** — con cuidado, ojo al drift de KnockoutNotice del PR), sponsors por tenant, subida de logo (blob), demo-tenant público, PDF/push, bracket KO.

**⚠️ App móvil (repo aparte — NO está en esta carpeta):** el usuario pide adaptar la app Expo (`solintlabs/quiniela-padelbox-app`) al modelo multi-tenant y probar en TestFlight. **No se puede hacer desde este repo:** hay que clonar el repo de la app, reescribir su cliente (hoy es solo-PADELBOX, `API_URL` hardcoded), y la subida a TestFlight exige credenciales de Apple/EAS interactivas del dueño. Es un proyecto propio, dependiente de que la API SaaS web esté estable (lo está). Pendiente de abordar en su repo con intervención del dueño.

---

## ✅ Ya está LIVE en producción (quinielabox.com)

- **Landing SaaS en la raíz `/`** (rediseño: estadio, juegos, demo, planes, features). Los usuarios **ya logueados** se redirigen solos a `/mi-quiniela`.
- **PADELBOX intacto en `/mi-quiniela`**: mismos usuarios, misma data (pronósticos, ranking, puntos), mismo login. La app móvil (`/api/*`) **sin cambios**. No se migró ni borró nada.
- **SEO**: metadata + keywords con sinónimos (quiniela, prode, penca, polla, porra), JSON-LD, `sitemap.ts`, canonical `/`, `opengraph-image`.
- **Login**: magic link (Resend) + **Google (activo)**. Apple **pendiente** (ver abajo).
- **Legal** en el footer de la landing: `/privacy`, `/terms`, `/soporte`, `/account/delete` (requisito Apple).
- **Stores**: App Store real (`id6770234104`); Google Play "Próximamente".
- **Planes** FREE / PRO ($9/mes) / CUSTOM visibles en la landing (fuente: `lib/saas/plans.ts`).
- **Redirect** `/lanza-tu-quiniela` → `/` (308) para no romper enlaces viejos.
- **Panel super-admin** existente en `/admin/saas` (leads + tenants), protegido por `requireAdmin`.
- **Flag `SAAS_ENABLED`** = OFF → toda la superficie `/saas/*` responde 404 a propósito.

### Cómo se despliega hoy (ojo)
La producción se subió con `vercel deploy --prod` desde el working tree de `feat/saas`.
Si alguien hace push a `main`, Vercel podría redesplegar `main` y **pisar** esto. Para
que sea durable hay que decidir la estrategia de merge/branch (ver pendientes).

---

## ⏳ Lo que falta / lo que necesito de ti

### 1. Login con Apple (pendiente)
Ya tienes cuenta de Apple Developer (la app iOS está publicada), que es el requisito caro.
Pasos:
1. **Apple Developer → Certificates, IDs & Profiles → Identifiers → +** → **Services IDs**
   - Description: `QuinielaBOX Web` · Identifier: p.ej. `cloud.solint.quinielabox.web`
2. Marca **"Sign In with Apple"** en ese Services ID → **Configure**:
   - Primary App ID: el de la app iOS (`id6770234104`).
   - **Domains**: `quinielabox.com`
   - **Return URLs**: `https://quinielabox.com/api/auth/callback/apple`
     (añade también `https://www.quinielabox.com/api/auth/callback/apple`)
3. **Keys → +** → crea una Key con "Sign In with Apple" habilitado → asóciala al App ID →
   **descarga el `.p8`** (¡solo se descarga UNA vez!). Anota el **Key ID** y tu **Team ID**.
4. Dame estos datos para cablearlo: **Services ID**, **Team ID**, **Key ID**, y el contenido
   del **`.p8`** (esto es secreto → va en Vercel/env, **no en el chat**).
   - El "client secret" de Apple es un **JWT firmado con el .p8 que CADUCA (máx 6 meses)**;
     añadiré el provider de Apple a `lib/auth.ts` + un helper para regenerar ese JWT.
   - Env vars finales: `AUTH_APPLE_ID` (Services ID) + `AUTH_APPLE_SECRET` (el JWT).

### 2. Stripe (código listo, DORMIDO — faltan claves)
Ya está construido: `lib/saas/stripe.ts`, `POST /api/saas/[tenant]/billing/checkout`,
`POST /api/saas/billing/webhook`, y el botón "Subir a Pro" en el panel del organizador.
Solo hay que activarlo:
1. En Stripe (cuenta QuinielaBOX): crear **Product "QuinielaBOX Pro" → precio recurrente $9/mes**
   → pasar el **`price_…`** (no es secreto) → se añade como `STRIPE_PRICE_PRO` en Vercel.
2. `STRIPE_SECRET_KEY` (`sk_live_…`) → **ya añadida en Vercel** (confirmar). En Vercel, no en chat.
3. **Webhook**: crear endpoint en Stripe → `https://www.quinielabox.com/api/saas/billing/webhook`
   con los eventos: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`.
   → copiar el `whsec_…` → añadir como `STRIPE_WEBHOOK_SECRET` en Vercel.
4. **Redeploy** producción (Vercel no aplica env nuevas a deployments ya construidos).
5. Probar: encender `SAAS_ENABLED=true`, crear una quiniela de prueba (tenant, ser OWNER),
   "Subir a Pro" → pagar con **cupón 100%** → el webhook sube el `Tenant` a `PRO/ACTIVE`.

### 3. Seguridad — rotar secretos que pasaron por el chat
- **Google Client Secret**: se pegó en el chat → regenerar en Google Cloud (Credentials →
  el cliente → "Reset secret") y actualizar `GOOGLE_CLIENT_SECRET` en Vercel.

### 4. Decisión: ¿PADELBOX como tenant SaaS?
Hoy PADELBOX corre en su **sistema propio** (tablas `User`/`Match`/`Prediction`), separado
del modelo multi-tenant (`Tenant`/`SaasCompetition`/`SaasEntry`). Migrar la data viva de
PADELBOX al modelo SaaS es un proyecto **grande y arriesgado** (143 usuarios + app publicada).
**Recomendación:** PADELBOX se queda en su sistema probado y funciona como el **caso de
ejemplo** en la landing (ya muestra capturas reales + "Hecho en el club PADELBOX"). Los
clientes nuevos usan el modelo SaaS (`/saas/[tenant]`). Decisión pendiente del dueño.

### 5. `SAAS_ENABLED=true`
Cuando quieras abrir el alta de quinielas de otros clubes, poner `SAAS_ENABLED=true` en
Vercel (Production) + redeploy. Enciende `/saas/*`.

---

## Cómo retomar desde otra máquina
```bash
git clone <repo> && cd quiniela-padelbox
git checkout feat/saas && git pull
npm install
# credenciales reales viven en Vercel; para dev local usar .env.local (gitignored)
```
Este doc + `docs/SAAS.md` tienen el contexto. El CLI de Vercel está logueado como `solintlabs`.
