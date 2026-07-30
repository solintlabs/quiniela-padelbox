# Progreso pivote SaaS — estado y próximos pasos

> Notas de trabajo para retomar desde cualquier máquina. Rama: **`feat/saas`**.
> Última actualización: 2026-07-29 noche (sesión 5 completa, ver abajo).

---

## 📍 RETOMAR AQUÍ (2026-07-30, oficina)

**Estado app** (repo `quiniela-padelbox-app`, `main`, TODO pusheado):
- **v1.3.2 (build 37) en camino a TestFlight** con: hub multi-quiniela como
  inicio, crear quiniela nativa, planes ($9/mes ancla + $29/temporada), Subir
  a Pro por link con kill switch, Mi perfil, guardado visible, login
  QuinielaBOX + **Sign in with Apple + Google** (client ID iOS
  `4316983371-…oal3`), créditos solo Solintlabs. Historial: `git log` de hoy.
- Probar en TestFlight: login con Apple y con Google, crear quiniela,
  pronosticar (✓ Guardado), Mi perfil, Subir a Pro.

**Estado web** (rama `feat/saas`, TODO en producción y pusheado):
- AdSense `ca-pub-8865902294098638`: sitio VERIFICADO, CMP 3 botones, ads.txt,
  metaetiqueta, slot FREE `5961753164` cableado. **Falta solo el email de
  aprobación de Google** → los anuncios se encienden solos. AdMob (app) queda
  para después de la aprobación de Apple.
- Stripe VERIFICADO completo: claves + `STRIPE_PRICE_PRO` (mensual) +
  `STRIPE_PRICE_PRO_SEASON` ($29 único, webhook suma meses a `proUntil`) +
  webhook + cupones. Checkout `?plan=season`.
- Logo al crear la quiniela (wizard web): se sube, se reduce en el navegador
  y viaja como data URL a `Tenant.logoUrl`. En la APP el picker necesita
  expo-image-picker (build nuevo) → pendiente.
- Guías: arreglado el botón invisible del final (regla `.gu__body a` pisaba
  al CTA) y títulos duplicados "· QuinielaBOX".
- SEO: guía objetivo `/guias/aplicacion-para-quinielas` (FAQPage), título de
  portada con la keyword. **Pedir indexación en GSC** (acción del dueño).

**Pendientes priorizados:**
1. Probar 1.3.2 + mandar a revisión de Apple (release notes + submit).
2. Email de AdSense → nada que hacer, se activa solo. Después: AdMob en app.
3. Props/pichichi (diseño SaasQuestion/Answer), multiidioma, video guías,
   logo picker en la app, Android/Play Console.

---

## 🟢 Sesión 5 (2026-07-29, Windows) — base web para la paridad de la app

Diseño aprobado en `docs/superpowers/specs/2026-07-29-paridad-app-movil-design.md`.
**Live en producción y verificado:**

- **`/saas/[tenant]/inscripcion`** — página pública (sin login, noindex): cuota +
  métodos de pago del organizador. Es adonde enlazará la app para que el bote se
  pague FUERA de ella (regla Apple). Slug inexistente → 404 uniforme.
- **`GET /api/saas/config`** — planes para la pantalla de precios de la app +
  interruptor remoto del botón "Subir a Pro" (`MOBILE_UPGRADE_ENABLED=false` en
  Vercel + redeploy lo apaga sin build nuevo) + plantillas de URL.
- Verificado: `/api/saas/*` ya acepta el JWT móvil y `GET/POST /api/saas/tenants`
  existen → la app puede listar y CREAR quinielas nativas.

**Decisiones del dueño (2026-07-29):** Pro en la app = link externo al checkout
web (sin IAP, con kill switch); ads solo en quinielas FREE (fase 1 auto-promo,
fase 2 AdMob); inscripción/bote fuera de la app vía la página pública; la app
abre en el hub "Mis quinielas" con marca QuinielaBOX; crear quiniela nativo.

**Bloqueo del Mac RESUELTO por reconstrucción:** el código v1.1-1.2 era
irrecuperable (EAS no permite descargar el tarball); la capa multi-tenant se
reescribió desde cero sobre GitHub como **v1.3.0** (build 33, subida a
TestFlight el 29/07). El working tree del Mac queda obsoleto: gana GitHub.

**Segunda tanda del 29/07 (live en prod + OTA a la 1.3.0):**
- App: hub como inicio, crear quiniela nativa, planes (temporada $29 como
  titular + badge Recomendado), "Subir a Pro" con kill switch, inscripción
  solo-link, ad slot FREE, **"✓ Guardado / ● Sin guardar" por partido**
  (como PADELBOX), **pestaña "Mi perfil"** (stats, pronósticos, renombre),
  banner upsell Pro al organizador FREE.
- Web: **`SaasCompetition.showTrendPreClose`** (migración additiva, toggle en
  CompetitionSettings) — el organizador decide si los % 1X2 se ven antes del
  cierre (marcadores individuales nunca); el cierre anticipado (lockOffsetMin)
  YA existía en "Editar puntos y cierre". Landing: $29/temporada como precio
  principal del Pro. Guías: "← Inicio" + CTA demo. `/play me` expone
  membershipId/displayName. **Anti-abuso**: máx 5 quinielas por dueño + rate
  limit en alta (3/10min) y pronósticos (60/min).
- Pendientes anotados: sistema de "props" (pichichi, 1º/2º puesto — necesita
  diseño: tabla SaasQuestion/SaasAnswer), video en guías (falta el video),
  multiidioma (lib/saas/i18n.ts existe pero NINGUNA página lo consume aún),
  AdMob en app (cuenta pendiente), AdSense web (cuenta pendiente).

---

## 🟢 Sesión 4 — camino al lanzamiento (paridad PRO, retención, demo)

**Todo live en producción:**
- **Recordatorios por tenant** (`lib/saas/reminders.ts`, en el cron SaaS): avisa por **push + email con la marca del cliente** a quien le falta pronosticar un partido que cierra en <3 h. Idempotente vía `SaasFixture.reminderSentAt` (migración). *Era el mayor agujero: sin avisos la quiniela muere y el club no renueva.*
- **Capa social** (el gancho de PADELBOX): `/saas/[t]/partidos/[fixtureId]` (tendencia 1X2 + todos los pronósticos, revelados SOLO al cerrar) y `/saas/[t]/jugador/[membershipId]` (perfil con stats y pronósticos de partidos cerrados). El ranking enlaza a los perfiles. Sin migración.
- **Métodos de cobro por tenant** (`PaymentMethod.tenantId`, sin migración): el organizador define cómo le pagan el bote con plantillas **genéricas y globales** (transferencia/IBAN, pago con móvil, PayPal, cripto, efectivo — NO específicas de Venezuela); el jugador los ve con botón de copiar. Expuestos también en `/play` para la app.
- **Demo público en `/demo`**: quiniela jugable sin cuenta (pestañas, steppers, podio, ranking, reglas), indexable y enlazada desde el hero + sitemap. *Nadie paga sin ver.*
- **Icono corregido**: el balón se leía como asterisco/rueda; ahora esfera blanca con pentágono y costuras, legible a 64px. Sincronizado con el favicon web.

**Decisiones del dueño:** el plan gratuito se queda en **15 jugadores** (se probó 25 y se revirtió).

**Recomendación de monetización dada (pendiente de decidir):** los ads son calderilla (RPM $1–3 → ~$5–15/mes con 500 usuarios); el negocio es Pro. Sugerido pasar de $9/mes a **"por torneo" $19–29** o **anual $79**, porque el mensual choca con la estacionalidad. `AdSlot` (AdSense) ya cableado: falta que el dueño cree la cuenta y ponga `NEXT_PUBLIC_ADSENSE_CLIENT` + `NEXT_PUBLIC_ADSENSE_SLOT_TENANT`. **Ojo:** AdSense exige contenido público con tráfico y casi todo el sitio está tras login/`noindex` → hará falta contenido SEO real.

**Gaps de paridad conscientes (NO hechos, por orden de valor):** perfil editable por el jugador (hoy solo el organizador cambia su nombre), recalcular puntos y pausar sync desde el panel, flechas de movimiento en el ranking, bote calculado, premios semanales/gift cards, y bracket/cuadro PDF (grande y específico del Mundial).

**App:** v1.1.x en TestFlight — icono nuevo, selector "Mis quinielas", pantalla de quiniela con pestañas (Inicio/Partidos/Ranking/Reglas), podio, escudos y métodos de cobro con copiar. **Apple cerró el tren 1.0.9**: hay que subir `version` en `app.json` en cada envío (ITMS-90186/90062).

---

## 🟢 Sesión 3 — personalización del organizador, logout, app en TestFlight

**Web (todo live en producción):**
- **Cerrar sesión** en el hub `/mis-quinielas` y en el panel del tenant (`app/saas/actions.ts` → `saasSignOut`).
- **Panel de personalización del organizador** (`TenantSettings.tsx`): editar nombre, color de acento, **logo** (URL, beneficio Pro) y **premios** (texto libre). PATCH `/api/saas/[tenant]`.
  - Nueva columna additive `Tenant.prizesText` (migración `20260727_add_tenant_prizes`, **ya aplicada en prod**, verificada).
- **Patrocinadores por tenant** (`SponsorsManager.tsx`): reutiliza `Sponsor.tenantId` (los de PADELBOX son tenantId null). Añadir/quitar = beneficio Pro. Rutas `/api/saas/[tenant]/sponsors` (+ `/[id]` DELETE).
- **Vista del jugador** ahora renderiza **logo**, **premios** y **patrocinadores**, y tiene **metadata/OG propia por tenant** (`generateMetadata`).
- **Stripe checkout**: envuelto en try/catch → ahora devuelve el **error real de Stripe** (502) en vez de un 500 opaco. El fallo "no se puede iniciar el pago" es casi seguro **precio y clave en modos distintos (test/live)**. Las claves Stripe en Vercel son "sensibles" → no se pueden leer por `vercel env pull` (por eso los diagnósticos las veían vacías), pero la app SÍ las tiene en runtime. **Acción pendiente del dueño:** pulsar "Subir a Pro" y leer el mensaje de error real → confirmar/corregir el modo del precio.

**Paridad PRO con PADELBOX (todo live):**
- **Stripe checkout ARREGLADO**: el error real era Managed Payments (activado por defecto en la cuenta bajo la organización) exigiendo tax_code. Se pasa `managed_payments[enabled]=false` por request. Ya se puede subir a Pro (cupón DESCUENTODEV 100% para probar).
- **Podio** social en la vista del jugador (`TenantPodium`, color del tenant).
- **Banderas/escudos** de equipos en los partidos (logoUrl → FixtureVM) y escudo del campeón de cada jugador en el ranking.
- **Pick de campeón (+bonus)** completo: tabla `SaasChampionPick` + `SaasCompetition.championWinnerTeamId` (migración). El jugador elige (`ChampionPicker`, se congela al primer partido); el organizador fija ganador (`ChampionWinner`) y bonus (`pointsBonus` en CompetitionSettings). Se suma en `computeCompetitionRanking`. Tests en `saas-scoring.test.ts`.
- **Compartir la quiniela** con botones WhatsApp/email/copiar/nativo (`InviteShare`), URL absoluta.
- **Personalización**: nombre, color, logo (Pro), premios, patrocinadores (Pro), **reglas propias**, **cuota/bote e info de pago** (migración `Tenant.rulesText/entryFee/paymentInfo`). El jugador ve "Reglas e inscripción" con resumen de puntos AUTOGENERADO desde la config (defaults que se adaptan) + cuota + cómo pagar.
- **Cerrar sesión** en hub y panel. **SEO/OG por tenant**.

**App móvil (repo `~/Dev/quiniela-padelbox-app`, EAS `solintlabs`):**
- `npm install` + **builds de producción iOS con EAS** OK (credenciales de firma guardadas, válidas hasta 2027). Pipeline verificado.
- **Icono nuevo QuinielaBOX**: una **Q (anillo) con balón de fútbol dentro**, lima sobre fondo #0A0A0A. Generado con `sharp` desde SVG en `scripts/gen-icons.mjs` (icon/adaptive/splash). Build `d9d9d925-…` con el icono nuevo en curso → TestFlight.
- **Conversión multi-tenant de la app = PENDIENTE (gran bloque)**. La app sigue single-tenant PADELBOX. Requiere: (1) que la API SaaS acepte el JWT móvil (hoy `/api/saas/*` puede usar solo sesión NextAuth — verificar), (2) endpoint "mis quinielas" para móvil, (3) reescribir pantallas (hub → quiniela → pronósticos/ranking/campeón), (4) iterar con builds de desarrollo en el iPhone del dueño. Decidido arrancarlo; no se puede completar+probar a ciegas en una tacada.
- **EXPO_TOKEN** lo pasó el dueño por el chat → **debe revocarlo/regenerarlo** en expo.dev/settings/access-tokens.

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
