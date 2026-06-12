import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { sendPushToUsers } from '@/lib/push';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Push · Admin' };
export const dynamic = 'force-dynamic';

type Audiencia = 'todos' | 'pagados' | 'nopagados';

async function sendBroadcast(formData: FormData) {
  'use server';
  await requireAdmin();
  const title = String(formData.get('title') ?? '').trim().slice(0, 60);
  const body = String(formData.get('body') ?? '').trim().slice(0, 170);
  const audRaw = String(formData.get('audiencia') ?? 'todos');
  const audiencia: Audiencia = audRaw === 'pagados' ? 'pagados' : audRaw === 'nopagados' ? 'nopagados' : 'todos';
  if (!title || !body) {
    redirect('/admin/push?error=vacio');
  }

  const users = await prisma.user.findMany({
    where: {
      pushDevices: { some: {} },
      ...(audiencia === 'pagados' ? { hasPaid: true } : {}),
      ...(audiencia === 'nopagados' ? { hasPaid: false } : {}),
    },
    select: { id: true },
  });

  const result = await sendPushToUsers(
    users.map((u) => u.id),
    () => ({
      title,
      body,
      data: { type: 'admin-broadcast' },
    }),
  );

  redirect(`/admin/push?sent=${result.sent}&users=${users.length}&aud=${audiencia}`);
}

/**
 * Difusión de push manual: el admin redacta título + mensaje y lo envía a
 * todos los que tengan la app instalada (o solo pagados / no pagados).
 * Útil para promos de sponsors, avisos de premios, recordatorios.
 */
export default async function PushAdmin({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; users?: string; aud?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const [conApp, pagadosConApp] = await Promise.all([
    prisma.user.count({ where: { pushDevices: { some: {} } } }),
    prisma.user.count({ where: { pushDevices: { some: {} }, hasPaid: true } }),
  ]);
  const noPagadosConApp = conApp - pagadosConApp;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Notificaciones push</h1>
        <p className="text-sm text-muted mt-1">
          Envía un push a quien elijas: promos de los sponsors, aviso del premio semanal,
          lo que necesites. Llega a los que tienen la app instalada con notificaciones activas.
        </p>
      </header>

      {sp.sent !== undefined && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
          ✅ Enviado a <strong>{sp.sent}</strong> dispositivo{sp.sent !== '1' && 's'}{' '}
          ({sp.users} usuario{sp.users !== '1' && 's'}
          {sp.aud === 'pagados' && ' pagados'}
          {sp.aud === 'nopagados' && ' sin pagar'}).
        </div>
      )}
      {sp.error === 'vacio' && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          El título y el mensaje no pueden estar vacíos.
        </div>
      )}

      {/* Alcance actual */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <Alcance label="Con la app" value={conApp} />
        <Alcance label="Pagados" value={pagadosConApp} />
        <Alcance label="Sin pagar" value={noPagadosConApp} />
      </div>

      <form action={sendBroadcast} className="rounded-xl border border-line bg-bg-elev p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Audiencia</label>
          <select
            name="audiencia"
            defaultValue="todos"
            className="w-full h-10 rounded-md border border-line bg-bg px-2 text-sm"
          >
            <option value="todos">Todos con la app ({conApp})</option>
            <option value="pagados">Solo pagados ({pagadosConApp})</option>
            <option value="nopagados">Solo sin pagar ({noPagadosConApp})</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Título</label>
          <input
            type="text"
            name="title"
            required
            maxLength={60}
            placeholder="🍔 2x1 en DELISH este viernes"
            className="w-full h-10 rounded-md border border-line bg-bg px-3 text-sm"
          />
          <p className="text-[11px] text-muted">Máx 60 caracteres. Los emojis ayudan a que se abra.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Mensaje</label>
          <textarea
            name="body"
            required
            maxLength={170}
            rows={3}
            placeholder="Presenta tu app de QuinielaBOX en DELISH y llévate 2x1 en combos. Solo este viernes."
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm resize-y"
          />
          <p className="text-[11px] text-muted">Máx 170 caracteres (lo que cabe en la notificación).</p>
        </div>

        <Button type="submit" className="w-full">
          📣 Enviar push ahora
        </Button>
        <p className="text-[11px] text-muted">
          Se envía inmediatamente, sin programación ni deshacer. Revisa el texto antes de pulsar.
        </p>
      </form>
    </div>
  );
}

function Alcance({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-3">
      <p className="font-display text-2xl tabular-nums">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
