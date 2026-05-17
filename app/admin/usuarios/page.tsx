import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { getPool } from '@/lib/pool';

export const dynamic = 'force-dynamic';

async function markPaid(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const paidMethod = String(formData.get('paidMethod') ?? '').trim() || null;
  const paidAmount = String(formData.get('paidAmount') ?? '').trim() || null;
  const paidNote = String(formData.get('paidNote') ?? '').trim() || null;
  await prisma.user.update({
    where: { id },
    data: {
      hasPaid: true,
      paidAt: new Date(),
      paidMethod,
      paidAmount,
      paidNote,
    },
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/');
  revalidatePath('/admin/reglas');
}

async function markUnpaid(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.user.update({
    where: { id },
    data: {
      hasPaid: false,
      paidAt: null,
      paidMethod: null,
      paidAmount: null,
    },
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/');
  revalidatePath('/admin/reglas');
}

export default async function UsuariosAdmin() {
  const [users, methods, pool] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ hasPaid: 'asc' }, { createdAt: 'desc' }] }),
    prisma.paymentMethod.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
    getPool(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Usuarios</h1>
          <p className="text-sm text-muted mt-1">
            {users.length} en total · {pool.paidCount} pagado{pool.paidCount !== 1 && 's'}.
          </p>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Bote actual</p>
          <p className="font-display text-2xl text-accent tabular-nums">{pool.totalFormatted}</p>
        </div>
      </header>

      <div className="space-y-2">
        {users.map((u) => (
          <article
            key={u.id}
            className={
              'rounded-xl border bg-bg-elev p-4 ' +
              (u.hasPaid ? 'border-success/30' : 'border-line')
            }
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold">
                  {u.name ?? <span className="text-muted">Sin nombre</span>}
                  {u.role === 'ADMIN' && <span className="ml-2 text-xs text-accent">· Admin</span>}
                </p>
                <p className="text-xs text-muted mt-0.5">{u.email}</p>
                {u.phone && (
                  <p className="text-xs mt-0.5">
                    <a href={`tel:${u.phone}`} className="text-accent hover:underline">📞 {u.phone}</a>
                    {' · '}
                    <a
                      href={`https://wa.me/${u.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:underline"
                    >
                      WhatsApp
                    </a>
                  </p>
                )}
                <p className="text-[10px] text-muted mt-1">
                  Registrado: {formatDateTime(u.createdAt)}
                </p>
              </div>

              <div className="w-full sm:w-auto">
                {u.hasPaid ? (
                  <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm min-w-[240px]">
                    <p className="text-success font-semibold">✓ Pagado</p>
                    {u.paidMethod && <p className="text-xs text-muted mt-1">Método: <span className="text-ink">{u.paidMethod}</span></p>}
                    {u.paidAmount && <p className="text-xs text-muted">Monto: <span className="text-ink">{u.paidAmount}</span></p>}
                    {u.paidNote && <p className="text-xs text-muted">Nota: <span className="text-ink">{u.paidNote}</span></p>}
                    {u.paidAt && <p className="text-[10px] text-muted mt-1">{formatDateTime(u.paidAt)}</p>}
                    <form action={markUnpaid} className="mt-2">
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="text-xs text-danger hover:underline">
                        Marcar como pendiente
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={markPaid} className="rounded-lg border border-line bg-bg p-3 space-y-2 w-full sm:w-72">
                    <input type="hidden" name="id" value={u.id} />
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted">Método de pago</label>
                      <select
                        name="paidMethod"
                        defaultValue=""
                        className="w-full h-9 mt-1 rounded-md border border-line bg-bg-elev px-2 text-sm"
                      >
                        <option value="">— Selecciona —</option>
                        {methods.map((m) => (
                          <option key={m.id} value={m.title}>
                            {m.icon} {m.title}{m.subtitle ? ` (${m.subtitle})` : ''}
                          </option>
                        ))}
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted">Monto (opcional)</label>
                      <input
                        type="text"
                        name="paidAmount"
                        placeholder={pool.feeFormatted}
                        className="w-full h-9 mt-1 rounded-md border border-line bg-bg-elev px-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted">Nota (opcional)</label>
                      <input
                        type="text"
                        name="paidNote"
                        placeholder="Referencia, comprobante…"
                        className="w-full h-9 mt-1 rounded-md border border-line bg-bg-elev px-2 text-sm"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full">
                      ✓ Marcar pagado
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-muted text-center py-10">Aún no hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
