import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Super Admin · QuinielaBOX' };
export const dynamic = 'force-dynamic';

/**
 * /super-admin — panel del dueño del SaaS (Sergio).
 *
 * SCAFFOLD: lista leads + tenants. Por ahora solo lectura.
 * Cuando arranque B en serio: gestion de tenants (suspend, plan, etc).
 *
 * Reutiliza el mismo guard `requireAdmin` que el resto del admin —
 * solo el ADMIN de la quiniela actual (tu) puede acceder.
 */
async function markContacted(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.lead.update({ where: { id }, data: { contacted: true } });
  revalidatePath('/super-admin');
}

async function deleteLead(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.lead.delete({ where: { id } });
  revalidatePath('/super-admin');
}

export default async function SuperAdminPage() {
  await requireAdmin();

  const [leads, tenants, leadCounts] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.tenant.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.lead.groupBy({
      by: ['contacted'],
      _count: { _all: true },
    }),
  ]);

  const pending = leadCounts.find((c) => !c.contacted)?._count._all ?? 0;
  const contacted = leadCounts.find((c) => c.contacted)?._count._all ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">
          QuinielaBOX SaaS
        </p>
        <h1 className="font-display text-3xl mt-1">Super Admin</h1>
        <p className="text-sm text-muted mt-1">
          Panel del propietario del SaaS. Solo accesible para el ADMIN actual.
        </p>
      </header>

      {/* Stats rápidas */}
      <section className="grid grid-cols-3 gap-3">
        <Stat label="Leads sin contactar" value={pending} highlight={pending > 0} />
        <Stat label="Leads contactados" value={contacted} />
        <Stat label="Tenants activos" value={tenants.filter((t) => t.status === 'ACTIVE').length} />
      </section>

      {/* Leads */}
      <section>
        <h2 className="font-display text-xl mb-3">Leads ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no hay solicitudes. Comparte{' '}
            <code className="text-accent">quiniela.solint.cloud/lanza-tu-quiniela</code>{' '}
            o el footer &quot;¿Quieres tu propia quiniela?&quot;.
          </p>
        ) : (
          <div className="space-y-2">
            {leads.map((l) => (
              <article
                key={l.id}
                className={'rounded-xl border bg-bg-elev p-4 ' + (l.contacted ? 'border-line opacity-60' : 'border-accent/40')}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">
                      {l.name ?? '(sin nombre)'} · <span className="text-accent">{l.email}</span>
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {l.clubName && <>📍 {l.clubName} · </>}
                      {l.expectedSize && <>👥 ~{l.expectedSize} socios · </>}
                      {l.phone && <>📱 {l.phone} · </>}
                      {l.source && <>via {l.source}</>}
                    </p>
                    {l.notes && (
                      <p className="text-xs mt-2 p-2 rounded bg-bg whitespace-pre-line">{l.notes}</p>
                    )}
                    <p className="text-[10px] text-muted mt-2">{formatDateTime(l.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {l.phone && (
                      <a
                        href={`https://wa.me/${l.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hola ${l.name ?? ''}! Vi tu solicitud para QuinielaBOX. ¿Cuándo tienes 10 min para una llamada?`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-md bg-[#25D366] text-white text-xs font-display flex items-center"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${l.email}`}
                      className="h-9 px-3 rounded-md border border-line text-xs flex items-center"
                    >
                      ✉ Email
                    </a>
                    {!l.contacted && (
                      <form action={markContacted}>
                        <input type="hidden" name="id" value={l.id} />
                        <Button type="submit" size="sm" variant="secondary">Marcar contactado</Button>
                      </form>
                    )}
                    <form action={deleteLead}>
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit" className="h-9 px-2 text-xs text-danger hover:bg-danger/10 rounded">🗑</button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Tenants */}
      <section>
        <h2 className="font-display text-xl mb-3">Tenants ({tenants.length})</h2>
        {tenants.length === 0 ? (
          <p className="text-sm text-muted">
            Ningún tenant creado todavía. El primer onboarding completado los creará aquí.
          </p>
        ) : (
          <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
                <tr>
                  <th className="text-left py-3 px-4">Slug</th>
                  <th className="text-left">Nombre</th>
                  <th className="text-left">Email admin</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Plan</th>
                  <th className="text-left">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 px-4 font-mono text-xs">{t.slug}</td>
                    <td>{t.name}</td>
                    <td className="text-xs">{t.adminEmail}</td>
                    <td><Badge text={t.status} /></td>
                    <td><Badge text={t.plan} /></td>
                    <td className="text-xs text-muted">{formatDateTime(t.createdAt)}</td>
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

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={'rounded-xl border bg-bg-elev p-4 ' + (highlight ? 'border-accent/50' : 'border-line')}>
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={'font-display text-3xl mt-1 tabular-nums ' + (highlight ? 'text-accent' : '')}>{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-bg border border-line">
      {text}
    </span>
  );
}
