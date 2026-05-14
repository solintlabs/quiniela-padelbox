# Transferir el repo a la cuenta de PADELBOX

> Este documento es para Sergio (admin de `solintlabs`). Sigue estos pasos cuando el cliente PADELBOX esté listo para asumir la propiedad del código.

---

## Antes de transferir

- [ ] El cliente tiene cuenta de GitHub (o ya existe la organización `padelbox-sports-club` o similar).
- [ ] Se ha decidido si Vercel sigue siendo desplegado por Solint o si PADELBOX asume el deploy.
- [ ] Se han identificado los secretos a rotar tras la transferencia: `AUTH_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `API_FOOTBALL_KEY`, `GOOGLE_CLIENT_SECRET`.

---

## Paso 1 — Transfer en GitHub

1. Ve a `https://github.com/solintlabs/quiniela-padelbox/settings`.
2. Scroll abajo → "Danger Zone" → **Transfer ownership**.
3. Introduce el nombre de la nueva organización/usuario (ej. `padelbox-sports-club`).
4. Confirma con el nombre del repo (`quiniela-padelbox`).
5. El nuevo owner recibirá una invitación que debe aceptar.

> Después de la transferencia, la URL pasa a `https://github.com/<nuevo-owner>/quiniela-padelbox`. Los enlaces antiguos redirigirán automáticamente, pero conviene actualizar referencias.

---

## Paso 2 — Reconectar Vercel

Opción A — **PADELBOX asume el deploy:**

1. PADELBOX crea (o usa) una cuenta/team en Vercel.
2. En Vercel → Add New → Project → importar `padelbox/quiniela-padelbox`.
3. Copiar todas las env vars del proyecto actual de Solint (Vercel CLI: `vercel env pull .env.production` desde el proyecto antiguo).
4. Setear esas env vars en el proyecto nuevo.
5. **Rotar `AUTH_SECRET` y `CRON_SECRET`** (ver paso 4).
6. Deploy a producción.
7. Apuntar el dominio (ej. `quiniela.padelbox.es`) al nuevo proyecto.
8. Borrar el proyecto antiguo en Vercel de Solint cuando se verifique que el nuevo funciona.

Opción B — **Solint sigue desplegando** (servicio de hosting):

1. Invitar al cliente como Viewer/Member al team de Vercel.
2. Sin cambios técnicos. Mantener factura de Vercel a cargo de Solint y cobrar al cliente.

---

## Paso 3 — Rotar credenciales

Crítico: cualquiera con acceso al repo antiguo vio los secretos en `.env.local` si los compartiste. Rotar:

```bash
# nuevo AUTH_SECRET
openssl rand -base64 32

# nuevo CRON_SECRET
openssl rand -hex 32
```

- **Resend:** crear nueva API key en https://resend.com → revocar la antigua.
- **API-Football:** la free tier solo permite 1 key. Si compartiste, considera migrar la cuenta a PADELBOX o mantener bajo Solint si Solint sigue operando.
- **Google OAuth:** rotar `GOOGLE_CLIENT_SECRET` en Google Cloud Console.

Actualizar las env vars en Vercel y redeployar.

---

## Paso 4 — Migrar Neon

Si PADELBOX asume todo:

1. Crear nuevo proyecto Neon bajo la cuenta del cliente.
2. Exportar el dump de la DB actual:
   ```bash
   pg_dump $OLD_DATABASE_URL > backup.sql
   ```
3. Restaurar en la nueva:
   ```bash
   psql $NEW_DATABASE_URL < backup.sql
   ```
4. Actualizar `DATABASE_URL` y `DIRECT_URL` en Vercel.
5. Deploy y smoke test (login, predicción, ranking).
6. Pasados unos días sin incidencias, borrar el Neon antiguo.

---

## Paso 5 — Comunicación al cliente

Email tipo:

> Hola PADELBOX,
> El repositorio de la Quiniela del Mundial 2026 ya está bajo vuestra organización: https://github.com/PADELBOX/quiniela-padelbox.
> El despliegue está en https://quiniela.padelbox.es. Para cualquier cambio o nueva feature, basta con abrir una issue. Hemos rotado todas las credenciales por seguridad.
> Documentación operativa: ver `claude.md` y `README.md` en la raíz del repo.

---

## Checklist final

- [ ] Repo transferido en GitHub
- [ ] Vercel reconfigurado con env vars rotadas
- [ ] DNS apuntando al nuevo proyecto
- [ ] Smoke test post-transfer (login, predicción, cron, admin)
- [ ] Documentación enviada al cliente
- [ ] Eliminar proyecto Vercel antiguo
- [ ] Cerrar (o transferir) la cuenta de Resend, API-Football, Neon
