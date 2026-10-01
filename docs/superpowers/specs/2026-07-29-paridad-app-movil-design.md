# Paridad app móvil ↔ web SaaS — diseño aprobado

> Aprobado por el dueño el 2026-07-29. Abarca el repo web (`quiniela-padelbox`,
> rama `feat/saas`) y el repo de la app (`quiniela-padelbox-app`).

## Objetivo

La app (iOS/Android) ofrece el mismo servicio que la web respetando las
normativas de Apple y Google: hub multi-tenant como pantalla de inicio, crear
quiniela desde el teléfono, ver planes y subir a Pro, y el dinero del bote
SIEMPRE fuera de la app.

## Estado de partida (verificado)

- El repo GitHub de la app está en **v1.0.9 solo-PADELBOX**. La v1.2.0 de
  TestFlight (selector "Mis quinielas", `lib/saas-api.ts`, `app/q/[slug]/…`)
  se construyó desde el Mac (`~/Dev/quiniela-padelbox-app`, commit `a5ee79c`,
  árbol limpio) y **nunca se pusheó**. EAS solo guarda el tarball
  internamente; su API no permite descargarlo. **Bloqueante: `git push`
  desde el Mac antes de tocar la app.**
- El backend ya acepta el JWT móvil en toda `/api/saas/*` (`requireUserApi`),
  y `GET/POST /api/saas/tenants` ya existen (selector + alta self-service).

## Decisiones del dueño

1. **Subir a Pro en la app = link externo al checkout web (Stripe)**, con
   interruptor remoto servido por el backend para poder apagar el botón sin
   build nuevo si un revisor lo objeta. Sin IAP: un solo sistema de cobro,
   sin comisión de Apple. Los beneficios Pro se reflejan solos en la app
   porque `Tenant.plan` vive en el servidor. Storefront principal: EEUU
   (links de pago externos permitidos en App Store y Play tras las
   sentencias Epic).
2. **Ads solo en quinielas FREE** (paridad con la web). Fase 1: slot con
   auto-promo QuinielaBOX (JS puro, sin riesgo de revisión). Fase 2: AdMob
   real cuando Apple apruebe la conversión y exista cuenta AdMob
   (`react-native-google-mobile-ads` + ATT + app-ads.txt).
3. **Inscripción/bote fuera de la app.** Se eliminan los datos de pago que
   la v1.1.2 muestra dentro. En su lugar, botón que abre la página web
   pública de ESA quiniela, donde el organizador customiza sus métodos de
   pago desde su panel (ya existe el manager).

## Piezas web (este repo — sin migraciones de DB)

### A. Página pública `app/saas/[tenant]/inscripcion/page.tsx`

- Fuera del grupo `(jugar)` → sin login. `isSaasEnabled()` o 404.
- Muestra: marca del tenant (nombre, logo, `tenantThemeVars`), cuota
  (`Tenant.entryFee`), `Tenant.paymentInfo`, y los `PaymentMethod` del
  tenant (componente `PaymentMethods` reutilizado, con copiar).
- `robots: noindex` (contiene datos de pago; pública por URL pero no
  indexable). CTA "Abrir la quiniela" → `/saas/[slug]`.
- "Powered by QuinielaBOX" según `showsBranding(plan)`.

### B. Endpoint `GET /api/saas/config`

- Sin auth (misma información que la landing), tras `requireSaasEnabled`.
- Devuelve: `plans` (desde `lib/saas/plans.ts`, `Infinity → null`),
  `upgrade: { enabled, urlTemplate }` e `inscriptionUrlTemplate`.
- `upgrade.enabled` = kill switch remoto: `MOBILE_UPGRADE_ENABLED !== 'false'`
  (por defecto encendido; apagar = env + redeploy, sin build de app).
- Base URL: `NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com'`.
- Test unitario del shape y del kill switch.

## Piezas app (repo app — BLOQUEADO hasta el push del Mac)

1. **Hub como inicio**: tras login se abre `quinielas.tsx` (marca
   QuinielaBOX); PADELBOX pasa a ser una entrada más de la lista.
2. **Crear quiniela nativa**: formulario nombre (+ color) →
   `POST /api/saas/tenants` → pantalla de compartir invitación. Gestión
   avanzada = botón "Panel completo" que abre la web.
3. **Pantalla de planes**: datos de `/api/saas/config`; botón "Subir a Pro"
   (solo OWNER) abre el navegador si `upgrade.enabled`; si no, pantalla
   informativa "gestiona tu plan desde la web".
4. **Inscripción**: quitar métodos de cobro embebidos; botón "Cómo pagar tu
   inscripción" → `inscriptionUrlTemplate` con el slug.
5. **Ad slot** en pantallas de quinielas FREE (auto-promo; AdMob en fase 2).
6. Build EAS → TestFlight → revisión de Apple. Después: AdMob real y alta en
   Play Console.

## Riesgos asumidos

- La página pública de inscripción expone los datos de cobro del organizador
  a quien tenga la URL (petición explícita del dueño: el jugador llega sin
  login). Mitigación: noindex + slugs no enumerables (404 uniforme).
- El link de pago externo puede ser objetado por un revisor en storefronts
  no-EEUU → kill switch remoto y la pantalla degrada a informativa.
- El checkout web exige sesión web (magic link / Google): fricción asumida
  en v1; un puente de sesión app→web queda como mejora futura.
