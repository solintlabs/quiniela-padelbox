import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';
import { getPool, formatCurrency } from '@/lib/pool';
import { getAllWeeks, getCurrentWeek } from '@/lib/weeks';

function bail(reason: string): never {
  redirect(`/admin/pagos?error=${encodeURIComponent(reason)}#metodos`);
}

function done(message: string): never {
  redirect(`/admin/pagos?ok=${encodeURIComponent(message)}#metodos`);
}

export const metadata = { title: 'Pagos · Admin' };
export const dynamic = 'force-dynamic';

async function updateFee(formData: FormData) {
  'use server';
  await requireAdmin();
  const feeAmount = Number(formData.get('feeAmount') ?? 10);
  const feeCurrency = String(formData.get('feeCurrency') ?? 'USD').trim().toUpperCase();
  await prisma.rules.upsert({
    where: { id: 1 },
    update: { feeAmount, feeCurrency },
    create: { id: 1, feeAmount, feeCurrency },
  });
  revalidatePath('/admin/usuarios');
  done('Cuota guardada');
}

async function updateChampionPrizes(formData: FormData) {
  'use server';
  await requireAdmin();
  const raw = String(formData.get('championPrizesText') ?? '').trim();
  const value = raw.length > 0 ? raw.slice(0, 1500) : null;
  await prisma.rules.upsert({
    where: { id: 1 },
    update: { championPrizesText: value },
    create: { id: 1, championPrizesText: value },
  });
  revalidatePath('/');
  revalidatePath('/partidos');
  done('Premios del campeonato guardados');
}

async function updateWeeklyPrizes(formData: FormData) {
  'use server';
  await requireAdmin();
  const raw = String(formData.get('weeklyPrizesText') ?? '').trim();
  const value = raw.length > 0 ? raw.slice(0, 1500) : null;
  await prisma.rules.upsert({
    where: { id: 1 },
    update: { weeklyPrizesText: value },
    create: { id: 1, weeklyPrizesText: value },
  });
  revalidatePath('/');
  revalidatePath('/partidos');
  done('Premios de la semana guardados');
}

async function upsertWeeklyPrize(formData: FormData) {
  'use server';
  await requireAdmin();
  const weekNumber = Number(formData.get('weekNumber') ?? 0);
  const prizeText = String(formData.get('prizeText') ?? '').trim().slice(0, 1500);
  if (!weekNumber || weekNumber < 1) bail('Semana inválida');
  if (!prizeText) {
    // Texto vacío → borrar la entrada
    await prisma.weeklyPrize.deleteMany({ where: { weekNumber } });
    revalidatePath('/');
    revalidatePath('/ranking');
    done(`Premio de la semana ${weekNumber} eliminado`);
  }
  await prisma.weeklyPrize.upsert({
    where: { weekNumber },
    update: { prizeText },
    create: { weekNumber, prizeText },
  });
  revalidatePath('/');
  revalidatePath('/ranking');
  done(`Premio de la semana ${weekNumber} guardado`);
}

async function markWeeklyWinner(formData: FormData) {
  'use server';
  await requireAdmin();
  const weekNumber = Number(formData.get('weekNumber') ?? 0);
  const winnerUserId = String(formData.get('winnerUserId') ?? '').trim() || null;
  if (!weekNumber) bail('Semana inválida');
  const existing = await prisma.weeklyPrize.findUnique({ where: { weekNumber } });
  if (!existing) bail(`No hay premio configurado para la semana ${weekNumber}`);
  await prisma.weeklyPrize.update({
    where: { weekNumber },
    data: {
      winnerUserId,
      awardedAt: winnerUserId ? new Date() : null,
    },
  });
  revalidatePath('/ranking');
  done(winnerUserId ? `Ganador semana ${weekNumber} registrado` : `Ganador semana ${weekNumber} desmarcado`);
}

async function toggleMethod(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const m = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!m) return;
  await prisma.paymentMethod.update({ where: { id }, data: { enabled: !m.enabled } });
  revalidatePath('/inscripcion');
  done(m.enabled ? `"${m.title}" desactivado` : `"${m.title}" activado`);
}

function parseFields(raw: string): Array<{ label: string; value: string; mono?: boolean }> {
  // Acepta lineas "label = value" o "label : value" (con o sin espacios)
  // Modifier opcional al final: "label = value | mono"
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    // Buscar primer separador (= o :) y dividir solo por el PRIMERO
    const sepIndex = (() => {
      const eq = line.indexOf('=');
      const co = line.indexOf(':');
      if (eq === -1) return co;
      if (co === -1) return eq;
      return Math.min(eq, co);
    })();
    if (sepIndex < 0) return { label: '', value: '', mono: undefined };
    const label = line.slice(0, sepIndex).trim();
    const restRaw = line.slice(sepIndex + 1).trim();
    const pipeIdx = restRaw.lastIndexOf('|');
    const valuePart = pipeIdx >= 0 ? restRaw.slice(0, pipeIdx).trim() : restRaw;
    const modifier = pipeIdx >= 0 ? restRaw.slice(pipeIdx + 1).trim() : '';
    const mono = modifier.toLowerCase() === 'mono';
    return { label, value: valuePart, mono: mono || undefined };
  }).filter((f) => f.label && f.value);
}

async function createMethod(formData: FormData) {
  'use server';
  await requireAdmin();
  const type = String(formData.get('type') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null;
  const icon = String(formData.get('icon') ?? '').trim() || null;
  const fieldsRaw = String(formData.get('fields') ?? '');
  const fields = parseFields(fieldsRaw);
  if (!type || !title) bail('Tipo y título son obligatorios');
  if (fields.length === 0) {
    bail('Datos a mostrar inválidos. Usa formato "Etiqueta = valor" o "Etiqueta : valor" (una línea por dato).');
  }
  const max = await prisma.paymentMethod.aggregate({ _max: { sortOrder: true } });
  await prisma.paymentMethod.create({
    data: {
      type,
      title,
      subtitle,
      icon,
      fields,
      enabled: true,
      sortOrder: (max._max.sortOrder ?? 0) + 10,
    },
  });
  revalidatePath('/inscripcion');
  done(`Método "${title}" añadido`);
}

async function updateMethod(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const type = String(formData.get('type') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null;
  const icon = String(formData.get('icon') ?? '').trim() || null;
  const fieldsRaw = String(formData.get('fields') ?? '');
  const fields = parseFields(fieldsRaw);
  if (!id) bail('Falta id del método');
  if (!type || !title) bail('Tipo y título son obligatorios');
  if (fields.length === 0) {
    bail('Datos a mostrar inválidos. Usa formato "Etiqueta = valor" o "Etiqueta : valor" (una línea por dato).');
  }
  await prisma.paymentMethod.update({
    where: { id },
    data: { type, title, subtitle, icon, fields },
  });
  revalidatePath('/inscripcion');
  done(`Método "${title}" actualizado`);
}

async function deleteMethod(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.paymentMethod.delete({ where: { id } });
  revalidatePath('/inscripcion');
  done('Método eliminado');
}

async function reorderMethod(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const dir = String(formData.get('dir') ?? '');
  if (!id || (dir !== 'up' && dir !== 'down')) return;
  const all = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } });
  const idx = all.findIndex((m) => m.id === id);
  if (idx < 0) return;
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  await prisma.$transaction([
    prisma.paymentMethod.update({ where: { id: all[idx].id }, data: { sortOrder: all[swap].sortOrder } }),
    prisma.paymentMethod.update({ where: { id: all[swap].id }, data: { sortOrder: all[idx].sortOrder } }),
  ]);
  revalidatePath('/admin/pagos');
  revalidatePath('/inscripcion');
}

export default async function PagosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const errorMsg = params.error;
  const okMsg = params.ok;
  const [rules, pool, methods, paidUsers, weeklyPrizes] = await Promise.all([
    prisma.rules.findUnique({ where: { id: 1 } }),
    getPool(),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.user.findMany({
      where: { hasPaid: true },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        paidAt: true,
        paidAmount: true,
        paidMethod: true,
        paidNote: true,
      },
    }),
    prisma.weeklyPrize.findMany({ orderBy: { weekNumber: 'asc' } }),
  ]);

  const tournamentStart = rules?.tournamentStartAt ?? null;
  const allWeeks = tournamentStart ? getAllWeeks(tournamentStart) : [];
  const currentWeek = tournamentStart ? getCurrentWeek(new Date(), tournamentStart) : 1;
  const weeklyPrizeByWeek = new Map(weeklyPrizes.map((p) => [p.weekNumber, p]));
  const userById = new Map(paidUsers.map((u) => [u.id, u]));

  // Agregaciones por método de pago
  const byMethod = new Map<string, { count: number; users: typeof paidUsers }>();
  for (const u of paidUsers) {
    const key = u.paidMethod ?? '(sin especificar)';
    if (!byMethod.has(key)) byMethod.set(key, { count: 0, users: [] });
    const entry = byMethod.get(key)!;
    entry.count++;
    entry.users.push(u);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Pagos y bote</h1>
        <p className="text-sm text-muted mt-1">Cuota, bote acumulado, métodos disponibles y historial.</p>
      </header>

      {errorMsg && (
        <div className="rounded-xl border border-danger bg-danger/10 text-danger px-5 py-3 text-sm">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}
      {okMsg && (
        <div className="rounded-xl border border-success bg-success/10 text-success px-5 py-3 text-sm">
          ✓ {okMsg}
        </div>
      )}

      {/* Bote hero */}
      <section className="rounded-xl border border-accent/40 bg-accent/10 p-6 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Bote acumulado</p>
        <p className="font-display text-5xl text-accent tabular-nums mt-2">{pool.totalFormatted}</p>
        <p className="text-sm text-muted mt-2">
          {pool.feeFormatted} × <strong className="text-ink tabular-nums">{pool.paidCount}</strong> socio{pool.paidCount !== 1 && 's'} pagado{pool.paidCount !== 1 && 's'} ·{' '}
          <span className="text-muted">{pool.totalPaidCount} registrados</span>
        </p>
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs">
          Premios garantizados: <strong>$1.500 + $600 + $300 = $2.400</strong>.
          Lo recogido por encima cubre operativa / patrocinios extra.
        </div>
      </section>

      {/* Cuota editable */}
      <section className="rounded-xl border border-line bg-bg-elev p-5 max-w-2xl">
        <h2 className="font-display text-xl">Cuota de inscripción</h2>
        <p className="text-sm text-muted mt-1">Cada socio que pagues sumará automáticamente al bote.</p>
        <form action={updateFee} className="grid grid-cols-[1fr_120px_auto] gap-3 items-end mt-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.18em] text-muted">Cantidad</label>
            <Input type="number" name="feeAmount" defaultValue={rules?.feeAmount ?? 10} min={0} max={100000} />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.18em] text-muted">Moneda</label>
            <Input type="text" name="feeCurrency" defaultValue={rules?.feeCurrency ?? 'USD'} maxLength={4} />
          </div>
          <Button type="submit">Guardar</Button>
        </form>
      </section>

      {/* Premios del CAMPEONATO (texto libre — aparece en dashboard movil) */}
      <section className="rounded-xl border border-line bg-bg-elev p-5 max-w-2xl">
        <h2 className="font-display text-xl">Premios del campeonato</h2>
        <p className="text-sm text-muted mt-1">
          Texto del bloque &quot;Premios del campeonato&quot; en el dashboard de la app móvil.
          <br />
          <strong className="text-warning">Para App Store review déjalo vacío</strong> (la app
          mostrará un texto genérico &quot;Premio del podio&quot;). Tras aprobación, pega aquí
          los montos reales y aparecerán automáticamente.
        </p>
        <form action={updateChampionPrizes} className="mt-4">
          <textarea
            name="championPrizesText"
            defaultValue={rules?.championPrizesText ?? ''}
            maxLength={1500}
            rows={4}
            placeholder={'Ej (post-aprobacion Apple):\n🥇 1er lugar: $1.500\n🥈 2º lugar: $600\n🥉 3er lugar: $300'}
            className="w-full rounded-lg border border-line bg-bg p-3 text-sm font-mono text-ink resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex justify-end mt-3">
            <Button type="submit">Guardar premios del campeonato</Button>
          </div>
        </form>
      </section>

      {/* Premios semanales — uno por semana */}
      <section className="max-w-2xl">
        <h2 className="font-display text-xl">Premios semanales</h2>
        <p className="text-sm text-muted mt-1 mb-4">
          {tournamentStart ? (
            <>
              Cada semana del Mundial puede tener su premio propio. Solo creas
              entrada para las semanas que vayas a premiar. Al cerrar la semana,
              marca el ganador (sale del top del ranking semanal).
            </>
          ) : (
            <>
              <strong className="text-warning">Configura primero la fecha de inicio del torneo</strong>{' '}
              en <Link href="/admin/reglas" className="text-accent underline">/admin/reglas</Link> para generar las semanas.
            </>
          )}
        </p>

        {tournamentStart && allWeeks.length > 0 && (
          <div className="space-y-2">
            {allWeeks.map((w) => {
              const prize = weeklyPrizeByWeek.get(w.weekNumber);
              const winner = prize?.winnerUserId ? userById.get(prize.winnerUserId) : null;
              const isCurrent = w.weekNumber === currentWeek;
              return (
                <details
                  key={w.weekNumber}
                  className={
                    'rounded-xl border bg-bg-elev ' +
                    (isCurrent ? 'border-accent' : 'border-line')
                  }
                  open={isCurrent && !prize}
                >
                  <summary className="cursor-pointer px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">
                        Semana {w.weekNumber}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-accent">
                            actual
                          </span>
                        )}
                        {w.isPartial && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted">
                            parcial
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">{w.label}</p>
                    </div>
                    <span className="text-xs text-right shrink-0">
                      {prize ? (
                        winner ? (
                          <span className="text-success">✓ {winner.name ?? winner.email}</span>
                        ) : (
                          <span className="text-accent">Premio configurado</span>
                        )
                      ) : (
                        <span className="text-muted">Sin premio</span>
                      )}
                    </span>
                  </summary>
                  <div className="p-4 border-t border-line space-y-4">
                    {/* Edit text */}
                    <form action={upsertWeeklyPrize} className="space-y-2">
                      <input type="hidden" name="weekNumber" value={w.weekNumber} />
                      <label className="text-xs uppercase tracking-[0.18em] text-muted">
                        Texto del premio
                      </label>
                      <textarea
                        name="prizeText"
                        defaultValue={prize?.prizeText ?? ''}
                        maxLength={1500}
                        rows={3}
                        placeholder={'Ej:\n🥇 1er lugar: Gift card $50 DELISH\n🍔 Top 5: Combo Vinny\'s'}
                        className="w-full rounded-lg border border-line bg-bg p-3 text-sm font-mono text-ink resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <p className="text-[11px] text-muted">
                        Vacío = elimina el premio de esta semana.
                      </p>
                      <div className="flex justify-end">
                        <Button type="submit" size="sm">
                          {prize ? 'Actualizar' : 'Guardar premio'}
                        </Button>
                      </div>
                    </form>

                    {/* Mark winner — solo si hay premio */}
                    {prize && (
                      <form action={markWeeklyWinner} className="space-y-2 border-t border-line pt-3">
                        <input type="hidden" name="weekNumber" value={w.weekNumber} />
                        <label className="text-xs uppercase tracking-[0.18em] text-muted">
                          Ganador
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          <select
                            name="winnerUserId"
                            defaultValue={prize.winnerUserId ?? ''}
                            className="flex-1 min-w-[200px] h-10 bg-bg border border-line rounded-md px-3 text-sm text-ink"
                          >
                            <option value="">— Sin asignar —</option>
                            {paidUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name ?? u.email}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="secondary">
                            Guardar ganador
                          </Button>
                        </div>
                        {prize.awardedAt && (
                          <p className="text-[11px] text-muted">
                            Otorgado el {formatDateTime(prize.awardedAt)}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {/* Texto legacy — campo Rules.weeklyPrizesText (queda como compat) */}
        <details className="rounded-xl border border-line bg-bg-elev mt-4">
          <summary className="cursor-pointer px-4 py-3 text-xs text-muted">
            Texto legacy de premios (compatibilidad con app móvil v8)
          </summary>
          <form action={updateWeeklyPrizes} className="p-4 border-t border-line">
            <p className="text-xs text-muted mb-2">
              La app móvil aún lee este campo único. Lo mantendremos hasta que la próxima
              versión de la app consuma WeeklyPrize por semana.
            </p>
            <textarea
              name="weeklyPrizesText"
              defaultValue={rules?.weeklyPrizesText ?? ''}
              maxLength={1500}
              rows={4}
              placeholder={'Vacío = oculta el bloque'}
              className="w-full rounded-lg border border-line bg-bg p-3 text-sm font-mono text-ink resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex justify-end mt-3">
              <Button type="submit" size="sm">Guardar texto legacy</Button>
            </div>
          </form>
        </details>
      </section>

      {/* Métodos de pago — editor completo */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-display text-xl">Métodos de pago</h2>
            <p className="text-sm text-muted mt-1">
              Lo que ven los socios en <code className="bg-bg-elev px-1 rounded">/inscripcion</code> (web y app).
              Si no hay ninguno activo, se muestra empty-state.
            </p>
          </div>
        </div>

        {/* Crear nuevo metodo */}
        <details className="rounded-xl border border-line bg-bg-elev mb-3">
          <summary className="cursor-pointer px-5 py-4 font-semibold">➕ Añadir método de pago</summary>
          <form action={createMethod} className="px-5 pb-5 grid sm:grid-cols-2 gap-3">
            <Field label="Tipo (interno) *">
              <select name="type" required defaultValue="pago_movil" className="h-11 w-full bg-bg border border-line rounded-md px-3 text-sm text-ink">
                <option value="pago_movil">Pago Móvil</option>
                <option value="bank_transfer">Transferencia bancaria</option>
                <option value="zelle">Zelle</option>
                <option value="binance">Binance Pay</option>
                <option value="paypal">PayPal</option>
                <option value="wise">Wise</option>
                <option value="cash">Efectivo</option>
                <option value="other">Otro</option>
              </select>
            </Field>
            <Field label="Icono (emoji)">
              <Input name="icon" placeholder="📲" maxLength={4} />
            </Field>
            <Field label="Título *">
              <Input name="title" required maxLength={60} placeholder="Pago Móvil Banesco" />
            </Field>
            <Field label="Subtítulo">
              <Input name="subtitle" maxLength={60} placeholder="Banco Banesco · respuesta inmediata" />
            </Field>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs uppercase tracking-[0.18em] text-muted">
                Datos a mostrar *
              </label>
              <p className="text-xs text-muted">
                Una línea por dato. Formato: <code>Etiqueta = valor</code> (también vale{' '}
                <code>Etiqueta : valor</code>). Añade <code>| mono</code> al final si quieres
                fuente monoespaciada (cuentas, IBAN).
              </p>
              <textarea
                name="fields"
                required
                rows={4}
                className="w-full rounded-lg border border-line bg-bg p-3 text-sm font-mono text-ink"
                placeholder={'Teléfono = 0412-1234567\nCédula = V-12345678\nTitular = Tu Nombre\nCuenta = 0134-0000-0000-0000-0000 | mono'}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Añadir método</Button>
            </div>
          </form>
        </details>

        <div className="space-y-2">
          {methods.map((m, i) => {
            const fields = Array.isArray(m.fields) ? (m.fields as Array<{ label: string; value: string; mono?: boolean }>) : [];
            const fieldsAsText = fields
              .map((f) => `${f.label} = ${f.value}${f.mono ? ' | mono' : ''}`)
              .join('\n');
            return (
              <div key={m.id} className={'rounded-xl border bg-bg-elev ' + (m.enabled ? 'border-line' : 'border-line opacity-50')}>
                {/* Header de la fila */}
                <div className="flex items-center gap-3 p-4">
                  <span className="text-2xl">{m.icon ?? '💳'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.title}</p>
                    {m.subtitle && <p className="text-xs text-muted">{m.subtitle}</p>}
                    <p className="text-[10px] text-muted mt-0.5">
                      {fields.length} campo{fields.length !== 1 ? 's' : ''} · tipo: {m.type}
                    </p>
                  </div>
                  <form action={reorderMethod} className="flex flex-col gap-0.5">
                    <input type="hidden" name="id" value={m.id} />
                    <button name="dir" value="up" disabled={i === 0} className="text-xs px-2 py-0.5 rounded hover:bg-bg disabled:opacity-30">↑</button>
                    <button name="dir" value="down" disabled={i === methods.length - 1} className="text-xs px-2 py-0.5 rounded hover:bg-bg disabled:opacity-30">↓</button>
                  </form>
                  <form action={toggleMethod}>
                    <input type="hidden" name="id" value={m.id} />
                    <Button type="submit" variant={m.enabled ? 'secondary' : 'primary'} size="sm">
                      {m.enabled ? 'Desactivar' : 'Activar'}
                    </Button>
                  </form>
                </div>

                {/* Edit panel */}
                <details className="border-t border-line">
                  <summary className="cursor-pointer px-4 py-2 text-xs text-muted hover:text-ink">
                    ✏️ Editar / borrar
                  </summary>
                  <div className="p-4 space-y-3">
                    <form action={updateMethod} className="grid sm:grid-cols-2 gap-3">
                      <input type="hidden" name="id" value={m.id} />
                      <Field label="Tipo">
                        <select name="type" defaultValue={m.type} className="h-11 w-full bg-bg border border-line rounded-md px-3 text-sm text-ink">
                          <option value="pago_movil">Pago Móvil</option>
                          <option value="bank_transfer">Transferencia bancaria</option>
                          <option value="zelle">Zelle</option>
                          <option value="binance">Binance Pay</option>
                          <option value="paypal">PayPal</option>
                          <option value="wise">Wise</option>
                          <option value="cash">Efectivo</option>
                          <option value="other">Otro</option>
                        </select>
                      </Field>
                      <Field label="Icono">
                        <Input name="icon" defaultValue={m.icon ?? ''} maxLength={4} />
                      </Field>
                      <Field label="Título">
                        <Input name="title" defaultValue={m.title} required maxLength={60} />
                      </Field>
                      <Field label="Subtítulo">
                        <Input name="subtitle" defaultValue={m.subtitle ?? ''} maxLength={60} />
                      </Field>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs uppercase tracking-[0.18em] text-muted">Datos</label>
                        <textarea
                          name="fields"
                          required
                          rows={Math.max(3, fields.length + 1)}
                          defaultValue={fieldsAsText}
                          className="w-full rounded-lg border border-line bg-bg p-3 text-sm font-mono text-ink"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-between items-center gap-2 flex-wrap">
                        <Button type="submit" size="sm">Guardar cambios</Button>
                      </div>
                    </form>
                    <form action={deleteMethod}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="text-xs text-danger hover:bg-danger/10 px-3 py-1.5 rounded-md border border-danger/40">
                        🗑 Borrar método
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            );
          })}
          {methods.length === 0 && (
            <div className="rounded-xl border border-dashed border-line py-8 text-center">
              <p className="text-sm text-muted">
                Sin métodos configurados. Pulsa <strong>Añadir método de pago</strong> arriba para
                empezar. Los socios verán un mensaje invitándoles a contactar por WhatsApp mientras tanto.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Agregados por método */}
      {byMethod.size > 0 && (
        <section>
          <h2 className="font-display text-xl mb-3">Resumen por método</h2>
          <div className="rounded-xl border border-line bg-bg-elev overflow-hidden divide-y divide-line">
            {[...byMethod.entries()].map(([method, data]) => (
              <div key={method} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm">{method}</span>
                <span className="text-sm text-muted">
                  <strong className="text-ink">{data.count}</strong> pago{data.count !== 1 && 's'} ·{' '}
                  <span className="font-display tabular-nums text-ink">
                    {formatCurrency((rules?.feeAmount ?? 10) * data.count, rules?.feeCurrency ?? 'USD')}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historial cronológico */}
      <section>
        <h2 className="font-display text-xl mb-3">Historial de pagos</h2>
        {paidUsers.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay pagos registrados. Marca usuarios como pagados en{' '}
            <Link href="/admin/usuarios" className="text-accent underline">/admin/usuarios</Link>.
          </p>
        ) : (
          <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
                <tr>
                  <th className="text-left py-3 px-4">Fecha</th>
                  <th className="text-left">Socio</th>
                  <th className="text-left">Método</th>
                  <th className="text-right">Monto</th>
                  <th className="text-left pl-4">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paidUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 text-xs text-muted whitespace-nowrap">{u.paidAt ? formatDateTime(u.paidAt) : '—'}</td>
                    <td className="text-sm">{u.name ?? u.email}</td>
                    <td className="text-sm">{u.paidMethod ?? <span className="text-muted">—</span>}</td>
                    <td className="text-right tabular-nums">{u.paidAmount ?? <span className="text-muted">—</span>}</td>
                    <td className="text-xs text-muted pl-4">{u.paidNote ?? <span className="text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-[0.18em] text-muted">{label}</label>
      {children}
    </div>
  );
}
