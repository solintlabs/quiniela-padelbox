import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';
import { getPool, formatCurrency } from '@/lib/pool';

export const metadata = { title: 'Pagos · Admin' };
export const dynamic = 'force-dynamic';

async function updateFee(formData: FormData) {
  'use server';
  const feeAmount = Number(formData.get('feeAmount') ?? 10);
  const feeCurrency = String(formData.get('feeCurrency') ?? 'USD').trim().toUpperCase();
  await prisma.rules.upsert({
    where: { id: 1 },
    update: { feeAmount, feeCurrency },
    create: { id: 1, feeAmount, feeCurrency },
  });
  revalidatePath('/admin/pagos');
  revalidatePath('/admin/usuarios');
}

async function updateWeeklyPrizes(formData: FormData) {
  'use server';
  const raw = String(formData.get('weeklyPrizesText') ?? '').trim();
  const value = raw.length > 0 ? raw.slice(0, 1500) : null;
  await prisma.rules.upsert({
    where: { id: 1 },
    update: { weeklyPrizesText: value },
    create: { id: 1, weeklyPrizesText: value },
  });
  revalidatePath('/admin/pagos');
  revalidatePath('/');
  revalidatePath('/partidos');
}

async function toggleMethod(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const m = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!m) return;
  await prisma.paymentMethod.update({ where: { id }, data: { enabled: !m.enabled } });
  revalidatePath('/admin/pagos');
  revalidatePath('/inscripcion');
}

export default async function PagosAdmin() {
  const [rules, pool, methods, paidUsers] = await Promise.all([
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
  ]);

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

      {/* Bote hero */}
      <section className="rounded-xl border border-accent/40 bg-accent/10 p-6 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Bote acumulado</p>
        <p className="font-display text-5xl text-accent tabular-nums mt-2">{pool.totalFormatted}</p>
        <p className="text-sm text-muted mt-2">
          {pool.feeFormatted} × <strong className="text-ink tabular-nums">{pool.paidCount}</strong> socio{pool.paidCount !== 1 && 's'} pagado{pool.paidCount !== 1 && 's'} ·{' '}
          <span className="text-muted">{pool.totalPaidCount} registrados</span>
        </p>
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs">
          Premios garantizados: <strong>$1.500 + $500 + $300 = $2.300</strong>.
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

      {/* Premios de esta semana — texto libre */}
      <section className="rounded-xl border border-line bg-bg-elev p-5 max-w-2xl">
        <h2 className="font-display text-xl">Premios de esta semana</h2>
        <p className="text-sm text-muted mt-1">
          Lo que aparece en el dashboard a todos los socios. Edítalo cada semana.
          Acepta texto plano y emojis (máx 1500 caracteres). Déjalo vacío para ocultar el bloque.
        </p>
        <form action={updateWeeklyPrizes} className="mt-4">
          <textarea
            name="weeklyPrizesText"
            defaultValue={rules?.weeklyPrizesText ?? ''}
            maxLength={1500}
            rows={5}
            placeholder={'Ej:\n🥇 1er lugar: Gift card $50 DELISH\n🍔 Top 5: Combo Vinny\'s\n🌮 Premio sorpresa: 3 docenas de tacos Tacoberto'}
            className="w-full rounded-lg border border-line bg-bg p-3 text-sm font-mono text-ink resize-y min-h-[140px] focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex justify-end mt-3">
            <Button type="submit">Guardar premios de la semana</Button>
          </div>
        </form>
      </section>

      {/* Métodos de pago */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-display text-xl">Métodos de pago</h2>
            <p className="text-sm text-muted mt-1">Lo que ven los socios en /inscripcion. (Editor completo próximamente)</p>
          </div>
        </div>
        <div className="space-y-2">
          {methods.map((m) => (
            <article key={m.id} className={'rounded-xl border bg-bg-elev p-4 flex items-center gap-3 ' + (m.enabled ? 'border-line' : 'border-line opacity-50')}>
              <span className="text-2xl">{m.icon ?? '💳'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{m.title}</p>
                {m.subtitle && <p className="text-xs text-muted">{m.subtitle}</p>}
              </div>
              <form action={toggleMethod}>
                <input type="hidden" name="id" value={m.id} />
                <Button type="submit" variant={m.enabled ? 'secondary' : 'primary'} size="sm">
                  {m.enabled ? 'Desactivar' : 'Activar'}
                </Button>
              </form>
            </article>
          ))}
          {methods.length === 0 && (
            <p className="text-sm text-muted text-center py-8">Sin métodos configurados. Hay 4 cargados por el seed; si no aparecen, regenera la BD.</p>
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
