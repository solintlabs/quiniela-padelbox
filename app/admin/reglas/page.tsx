import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

async function updateRules(formData: FormData) {
  'use server';
  const pointsExact = Number(formData.get('pointsExact') ?? 3);
  const pointsWinner = Number(formData.get('pointsWinner') ?? 1);
  const pointsChampion = Number(formData.get('pointsChampion') ?? 25);
  const lockOffsetMin = Number(formData.get('lockOffsetMin') ?? 15);
  const tournamentStartAt = String(formData.get('tournamentStartAt') ?? '').trim();

  await prisma.rules.upsert({
    where: { id: 1 },
    update: {
      pointsExact,
      pointsWinner,
      pointsChampion,
      lockOffsetMin,
      tournamentStartAt: tournamentStartAt ? new Date(tournamentStartAt) : null,
    },
    create: {
      id: 1,
      pointsExact,
      pointsWinner,
      pointsChampion,
      lockOffsetMin,
      tournamentStartAt: tournamentStartAt ? new Date(tournamentStartAt) : null,
    },
  });
  revalidatePath('/admin/reglas');
  revalidatePath('/reglas');
}

export default async function ReglasAdmin() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Reglas del juego</h1>
        <p className="text-sm text-muted mt-1">
          Puntuación y cierre. Para la cuota, métodos de pago y bote acumulado, ve a{' '}
          <Link href="/admin/pagos" className="text-accent underline">/admin/pagos</Link>.
        </p>
      </header>

      <form action={updateRules} className="space-y-4 rounded-xl border border-line bg-bg-elev p-6">
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
        <Button type="submit">Guardar reglas</Button>
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
