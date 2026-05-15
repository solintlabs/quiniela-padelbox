import { prisma } from '@/lib/db';

export const metadata = { title: 'Reglas · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function PublicReglasPage() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const pe = rules?.pointsExact ?? 3;
  const pw = rules?.pointsWinner ?? 1;
  const pc = rules?.pointsChampion ?? 25;
  const lock = rules?.lockOffsetMin ?? 15;

  return (
    <article className="max-w-2xl mx-auto space-y-10 leading-relaxed">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Cómo funciona</p>
        <h1 className="font-display text-4xl mt-1">Reglas de la Quiniela</h1>
        <p className="text-sm text-muted mt-3">
          Quiniela privada del Mundial 2026 para los socios del club PADELBOX.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Puntuación</h2>
        <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="font-display text-xl tabular-nums w-20 text-success">+{pe} pts</div>
            <div className="flex-1">
              <p className="font-semibold">Marcador exacto</p>
              <p className="text-xs text-muted mt-0.5">
                Aciertas resultado y diferencia (ej. predices 2-1, sale 2-1).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-line">
            <div className="font-display text-xl tabular-nums w-20 text-warning">+{pw} pt</div>
            <div className="flex-1">
              <p className="font-semibold">Ganador correcto</p>
              <p className="text-xs text-muted mt-0.5">
                Aciertas quién gana (o empate) pero no el marcador exacto.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-line">
            <div className="font-display text-xl tabular-nums w-20 text-muted">0 pts</div>
            <div className="flex-1">
              <p className="font-semibold">Fallo</p>
              <p className="text-xs text-muted mt-0.5">
                Te equivocas de ganador (o no predijiste).
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
          <p className="font-semibold mb-2">🏆 Bonus campeón del Mundial</p>
          <p className="text-sm text-muted">
            Si aciertas al campeón del Mundial 2026, sumas <span className="text-accent font-semibold">+{pc} pts</span> extra.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Cierre de pronósticos</h2>
        <p className="text-sm text-muted">
          Cada partido cierra <span className="text-ink font-semibold">{lock} minutos antes del kickoff</span>. Antes del cierre puedes ajustar
          cuantas veces quieras — solo cuenta la última versión.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Inscripción</h2>
        <p className="text-sm text-muted">
          Para enviar pronósticos hay que pagar la cuota única. Métodos aceptados: Pago Móvil, Banesco, Zelle, Binance Pay.{' '}
          <a href="/public/inscripcion" className="text-accent underline">Ver métodos →</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Privacidad de los pronósticos</h2>
        <p className="text-sm text-muted">
          Los pronósticos de los demás socios solo son visibles tras el cierre del partido.
          Sin trampas posibles: nadie puede modificar tras el cierre.
        </p>
      </section>
    </article>
  );
}
