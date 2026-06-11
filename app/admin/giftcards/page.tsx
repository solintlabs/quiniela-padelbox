import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import { GiftCardStudio } from '@/components/GiftCardStudio';
import { LiveSearch } from '@/components/LiveSearch';

export const metadata = { title: 'Gift cards · Admin' };
export const dynamic = 'force-dynamic';

async function setStatus(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !['ACTIVE', 'REDEEMED', 'VOID'].includes(status)) return;
  await prisma.giftCard.update({
    where: { id },
    data: {
      status,
      redeemedAt: status === 'REDEEMED' ? new Date() : null,
    },
  });
  revalidatePath('/admin/giftcards');
}

/**
 * Generador + registro de gift cards para premios semanales.
 * Cada tarjeta emitida lleva código único + QR; el local lo verifica en
 * /gift/[code] y aquí se marca como canjeada (un solo uso).
 */
export default async function GiftCardsAdmin() {
  const [sponsors, cards] = await Promise.all([
    prisma.sponsor.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.giftCard.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Gift cards</h1>
        <p className="text-sm text-muted mt-1">
          Genera la imagen del premio con el logo y colores del patrocinador. Cada tarjeta
          lleva un <strong className="text-ink">código único + QR anti-falsificación</strong>:
          el local lo escanea y ve al instante si es válida o ya se canjeó.
        </p>
      </header>

      <GiftCardStudio sponsors={sponsors} />

      {/* Registro de emitidas */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h2 className="font-display text-xl">Emitidas ({cards.length})</h2>
          {cards.length > 0 && (
            <LiveSearch
              scopeId="tabla-giftcards"
              placeholder="Buscar código, ganador, sponsor…"
              className="w-full sm:w-80"
            />
          )}
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no has emitido ninguna. Al pulsar «Emitir y descargar» la tarjeta queda
            registrada aquí con su código.
          </p>
        ) : (
          <div className="rounded-xl border border-line bg-bg-elev overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-bg text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">Sponsor</th>
                  <th className="px-3 py-2">Ganador</th>
                  <th className="px-3 py-2">Emitida</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="tabla-giftcards">
                {cards.map((c) => (
                  <tr
                    key={c.id}
                    data-search={`${c.code} ${c.monto} ${c.sponsorName ?? ''} ${c.winnerName ?? ''}`}
                    className="border-t border-line"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={`/gift/${c.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {c.code}
                      </a>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{c.monto}</td>
                    <td className="px-3 py-2 text-xs text-muted">{c.sponsorName ?? '—'}</td>
                    <td className="px-3 py-2 text-xs">{c.winnerName ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      {c.status === 'ACTIVE' && (
                        <span className="text-xs text-success font-semibold">● Válida</span>
                      )}
                      {c.status === 'REDEEMED' && (
                        <span className="text-xs text-warning font-semibold">
                          ● Canjeada{c.redeemedAt ? ` · ${formatDateTime(c.redeemedAt)}` : ''}
                        </span>
                      )}
                      {c.status === 'VOID' && (
                        <span className="text-xs text-danger font-semibold">● Anulada</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {c.status === 'ACTIVE' && (
                        <>
                          <StatusBtn id={c.id} status="REDEEMED" label="✓ Canjear" tone="warning" />
                          <StatusBtn id={c.id} status="VOID" label="Anular" tone="danger" />
                        </>
                      )}
                      {c.status !== 'ACTIVE' && (
                        <StatusBtn id={c.id} status="ACTIVE" label="↺ Reactivar" tone="muted" />
                      )}
                    </td>
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

function StatusBtn({
  id,
  status,
  label,
  tone,
}: {
  id: string;
  status: 'ACTIVE' | 'REDEEMED' | 'VOID';
  label: string;
  tone: 'warning' | 'danger' | 'muted';
}) {
  const toneClass =
    tone === 'warning'
      ? 'text-warning hover:bg-warning/10'
      : tone === 'danger'
        ? 'text-danger hover:bg-danger/10'
        : 'text-muted hover:bg-bg';
  return (
    <form action={setStatus} className="inline-block ml-1.5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`text-[11px] px-2 py-1 rounded-md border border-line ${toneClass}`}>
        {label}
      </button>
    </form>
  );
}
