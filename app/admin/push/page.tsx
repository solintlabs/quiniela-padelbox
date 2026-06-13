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

  const errParam = result.errors.length ? `&err=${encodeURIComponent(result.errors.join(' · '))}` : '';
  redirect(`/admin/push?sent=${result.sent}&users=${users.length}&aud=${audiencia}${errParam}`);
}

async function sendTest(formData: FormData) {
  'use server';
  const admin = await requireAdmin();
  void formData;
  const result = await sendPushToUsers([admin.id], () => ({
    title: '🔔 Prueba de notificación',
    body: 'Si ves esto, las notificaciones funcionan correctamente.',
    data: { type: 'admin-test' },
  }));
  const errParam = result.errors.length ? `&err=${encodeURIComponent(result.errors.join(' · '))}` : '';
  redirect(`/admin/push?test=${result.sent}${errParam}`);
}

/**
 * Difusión de push manual: el admin redacta título + mensaje y lo envía a
 * todos los que tengan la app instalada (o solo pagados / no pagados).
 * Útil para promos de sponsors, avisos de premios, recordatorios.
 */
export default async function PushAdmin({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; users?: string; aud?: string; error?: string; test?: string; err?: string }>;
}) {
  const sp = await searchParams;

  const [conApp, pagadosConApp, totalDevices] = await Promise.all([
    prisma.user.count({ where: { pushDevices: { some: {} } } }),
    prisma.user.count({ where: { pushDevices: { some: {} }, hasPaid: true } }),
    prisma.pushDevice.count(),
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
      {sp.test !== undefined && (
        <div className={`rounded-xl border p-4 text-sm ${sp.test === '0' ? 'border-warning/40 bg-warning/10' : 'border-success/40 bg-success/10'}`}>
          {sp.test === '0'
            ? '⚠ No se envió a ningún dispositivo (no tienes ninguno registrado — abre la app en tu móvil y acepta las notificaciones).'
            : `✅ Prueba enviada a ${sp.test} de tus dispositivos. Si no la ves en el móvil en unos segundos, el problema es la entrega (APNs).`}
        </div>
      )}
      {sp.err && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          <strong>Error de Expo:</strong> <span className="font-mono">{sp.err}</span>
          {sp.err.includes('redential') && (
            <p className="mt-2 text-ink">
              Esto significa que falta la <strong>clave APNs</strong> en EAS. Corre{' '}
              <span className="font-mono">eas credentials</span> → iOS → production → Push Notifications.
            </p>
          )}
        </div>
      )}

      {/* Diagnóstico de dispositivos */}
      <div className="rounded-xl border border-line bg-bg-elev p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <p>
            Dispositivos registrados ahora mismo: <strong className="tabular-nums">{totalDevices}</strong>
          </p>
          {totalDevices === 0 && (
            <p className="text-xs text-warning mt-1">
              ⚠ No hay ninguno. Abre la app en tu iPhone y acepta las notificaciones; luego pulsa
              «Enviar prueba» para verificar.
            </p>
          )}
        </div>
        <form action={sendTest}>
          <Button type="submit" variant="secondary">🔔 Enviar prueba a mí</Button>
        </form>
      </div>

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
