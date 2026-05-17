import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPool } from '@/lib/pool';

export const dynamic = 'force-dynamic';

async function updateRules(formData: FormData) {
  'use server';
  const pointsExact = Number(formData.get('pointsExact') ?? 3);
  const pointsWinner = Number(formData.get('pointsWinner') ?? 1);
  const pointsChampion = Number(formData.get('pointsChampion') ?? 25);
  const lockOffsetMin = Number(formData.get('lockOffsetMin') ?? 15);
  const feeAmount = Number(formData.get('feeAmount') ?? 10);
  const feeCurrency = String(formData.get('feeCurrency') ?? 'USD').trim().toUpperCase();
  const tournamentStartAt = String(formData.get('tournamentStartAt') ?? '').trim();

  await prisma.rules.upsert({
    where: { id: 1 },
    update: {
      pointsExact,
      pointsWinner,
      pointsChampion,
      lockOffsetMin,
      feeAmount,
      feeCurrency,
      tournamentStartAt: tournamentStartAt ? new Date(tournamentStartAt) : null,
    },
    create: {
      id: 1,
      pointsExact,
      pointsWinner,
      pointsChampion,
      lockOffsetMin,
      feeAmount,
      feeCurrency,
      tournamentStartAt: tournamentStartAt ? new Date(tournamentStartAt) : null,
    },
  });
  revalidatePath('/admin/reglas');
  revalidatePath('/');
  revalidatePath('/inscripcion');
}

export default async function ReglasAdmin() {
  const [rules, pool] = await Promise.all([
    prisma.rules.findUnique({ where: { id: 1 } }),
    getPool(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Reglas y cuota</h1>
        <p className="text-sm text-muted mt-1">Ajusta la puntuación, el cierre y la cuota de inscripción.</p>
      </header>

      {/* Resumen del bote en vivo */}
      <section className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Bote actual (calculado)</p>
        <p className="font-display text-4xl text-accent tabular-nums mt-1">{pool.totalFormatted}</p>
        <p className="text-sm text-muted mt-1">
          {pool.feeFormatted} × <strong className="text-ink">{pool.paidCount}</strong> socio{pool.paidCount !== 1 && 's'} pagado{pool.paidCount !== 1 && 's'}
          {' '}({pool.totalPaidCount} registrados en total)
        </p>
      </section>

      <form action={updateRules} className="space-y-4 rounded-xl border border-line bg-bg-elev p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Cuota de inscripción</p>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted">Cantidad</label>
            <Input type="number" name="feeAmount" defaultValue={rules?.feeAmount ?? 10} min={0} max={100000} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted">Moneda</label>
            <Input type="text" name="feeCurrency" defaultValue={rules?.feeCurrency ?? 'USD'} maxLength={4} />
          </div>
        </div>
        <p className="text-xs text-muted -mt-2">
          Cada pago de un socio sumará automáticamente al bote.
        </p>

        <hr className="border-line my-4" />

        <p className="text-xs uppercase tracking-[0.18em] text-muted">Puntuación</p>
        <Field label="Puntos por marcador exacto" name="pointsExact" defaultValue={rules?.pointsExact ?? 3} />
        <Field label="Puntos por acertar el ganador (1X2)" name="pointsWinner" defaultValue={rules?.pointsWinner ?? 1} />
        <Field label="Puntos extra por acertar el campeón" name="pointsChampion" defaultValue={rules?.pointsChampion ?? 25} />
        <Field label="Minutos antes del kickoff para cerrar pronósticos" name="lockOffsetMin" defaultValue={rules?.lockOffsetMin ?? 15} />

        <hr className="border-line my-4" />

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">Fecha y hora del primer partido (cierra pick de campeón)</label>
          <Input
            type="datetime-local"
            name="tournamentStartAt"
            defaultValue={rules?.tournamentStartAt ? new Date(rules.tournamentStartAt).toISOString().slice(0, 16) : ''}
          />
        </div>
        <Button type="submit">Guardar cambios</Button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted">{label}</label>
      <Input type="number" name={name} defaultValue={defaultValue} min={0} max={1000} />
    </div>
  );
}
