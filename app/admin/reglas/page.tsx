import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FIFA_2026_GROUPS } from '@/lib/fifa2026';

export const dynamic = 'force-dynamic';

const FIFA_2026_TEAMS = Object.values(FIFA_2026_GROUPS).flat().sort();

// Venezuela (Caracas) es fijo GMT-4, sin horario de verano.
const CARACAS_OFFSET = '-04:00';

/** Interpreta un valor de <input datetime-local> como hora de Caracas → Date UTC. */
function parseCaracas(s: string): Date | null {
  if (!s) return null;
  const withSeconds = s.length === 16 ? `${s}:00` : s;
  const d = new Date(`${withSeconds}${CARACAS_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Convierte una Date (UTC) a string YYYY-MM-DDTHH:mm en hora de Caracas (para defaultValue). */
function toCaracasInput(d: Date | null | undefined): string {
  if (!d) return '';
  const shifted = new Date(new Date(d).getTime() - 4 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

async function updateRules(formData: FormData) {
  'use server';
  await requireAdmin();
  const pointsExact = Number(formData.get('pointsExact') ?? 3);
  const pointsWinner = Number(formData.get('pointsWinner') ?? 1);
  const pointsChampion = Number(formData.get('pointsChampion') ?? 25);
  const lockOffsetMin = Number(formData.get('lockOffsetMin') ?? 15);
  const tournamentStartAt = String(formData.get('tournamentStartAt') ?? '').trim();
  const inscriptionsCloseAt = String(formData.get('inscriptionsCloseAt') ?? '').trim();
  const championWinnerRaw = String(formData.get('championWinner') ?? '').trim();
  const championWinner = championWinnerRaw && FIFA_2026_TEAMS.includes(championWinnerRaw)
    ? championWinnerRaw : null;
  const rankingHidden = formData.get('rankingHidden') === 'on';
  const rankingHiddenText = String(formData.get('rankingHiddenText') ?? '').trim() || null;

  await prisma.rules.upsert({
    where: { id: 1 },
    update: {
      pointsExact,
      pointsWinner,
      pointsChampion,
      lockOffsetMin,
      tournamentStartAt: parseCaracas(tournamentStartAt),
      inscriptionsCloseAt: parseCaracas(inscriptionsCloseAt),
      championWinner,
      rankingHidden,
      rankingHiddenText,
    },
    create: {
      id: 1,
      pointsExact,
      pointsWinner,
      pointsChampion,
      lockOffsetMin,
      tournamentStartAt: parseCaracas(tournamentStartAt),
      inscriptionsCloseAt: parseCaracas(inscriptionsCloseAt),
      championWinner,
      rankingHidden,
      rankingHiddenText,
    },
  });
  revalidatePath('/admin/reglas');
  revalidatePath('/admin/usuarios');
  revalidatePath('/reglas');
  revalidatePath('/inscripcion');
  revalidatePath('/login');
  revalidatePath('/ranking');
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
          <label className="text-xs uppercase tracking-[0.18em] text-muted">Fecha y hora del primer partido (hora de Caracas · cierra pick de campeón)</label>
          <Input
            type="datetime-local"
            name="tournamentStartAt"
            defaultValue={toCaracasInput(rules?.tournamentStartAt)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">
            Cierre de inscripciones
          </label>
          <p className="text-xs text-muted">
            Después de esta fecha, no se aceptan nuevos registros ni nuevos pagos.
            Cuentas ya existentes y predicciones siguen funcionando normal. Vacío = abiertas siempre.
          </p>
          <Input
            type="datetime-local"
            name="inscriptionsCloseAt"
            defaultValue={toCaracasInput(rules?.inscriptionsCloseAt)}
          />
        </div>

        <hr className="border-line my-4" />

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">
            Visibilidad del ranking
          </label>
          <p className="text-xs text-muted">
            Si lo ocultas, los participantes ven un placeholder en /ranking en lugar de la tabla.
            Útil al principio cuando aún hay poca gente inscrita y no quieres que la prueba social
            sea negativa. Tú (admin) sigues viéndolo siempre.
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="rankingHidden"
              defaultChecked={rules?.rankingHidden ?? false}
              className="mt-0.5 h-4 w-4 rounded border-line"
            />
            <span className="text-sm">
              Ocultar ranking público (solo el admin lo ve)
            </span>
          </label>
          <div className="space-y-1">
            <label className="text-xs text-muted">
              Mensaje que verán los participantes cuando esté oculto (opcional)
            </label>
            <textarea
              name="rankingHiddenText"
              defaultValue={rules?.rankingHiddenText ?? ''}
              rows={2}
              placeholder="Por defecto: «Los participantes se mostrarán más cercano al inicio del torneo, cuando todos hayan completado su inscripción.»"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink resize-y"
            />
          </div>
        </div>

        <hr className="border-line my-4" />

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">
            Campeón del Mundial 2026
          </label>
          <p className="text-xs text-muted">
            Lo seteas tras la final. Quien lo haya predicho correctamente con pick congelado se lleva el bonus de campeón.
          </p>
          <select
            name="championWinner"
            defaultValue={rules?.championWinner ?? ''}
            className="w-full h-11 bg-bg border border-line rounded-lg px-3 text-sm text-ink"
          >
            <option value="">— No hay ganador todavía —</option>
            {FIFA_2026_TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
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
