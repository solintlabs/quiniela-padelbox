import { prisma } from '@/lib/db';

export const metadata = { title: 'Reglas · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function ReglasPage() {
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
          Quiniela del Mundial 2026 patrocinada por PADELBOX.
        </p>
      </header>

      {/* Puntuación */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">1. Puntuación</h2>
        <p className="text-sm text-muted">
          Por cada partido, comparamos tu pronóstico con el resultado a los{' '}
          <span className="text-ink font-semibold">90 minutos (tiempo reglamentario)</span>:
        </p>
        <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
          <RuleRow
            points={`+${pe} pts`}
            color="success"
            title="Marcador exacto"
            desc="Aciertas resultado y diferencia (ej. predices 2-1, sale 2-1)."
          />
          <RuleRow
            points={`+${pw} pt`}
            color="warning"
            title="Ganador correcto"
            desc="Aciertas quién gana (o empate) pero no el marcador exacto."
            border
          />
          <RuleRow
            points="0 pts"
            color="muted"
            title="Fallo"
            desc="Te equivocas de ganador (o no predijiste)."
            border
          />
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <span>⏱️</span> Importante: todo se cuenta a los 90 minutos
          </p>
          <p className="text-sm text-muted">
            Los marcadores valen por el resultado al final de los <span className="text-ink font-semibold">90 minutos
            reglamentarios</span> (más el tiempo añadido del árbitro). En las eliminatorias,
            la <span className="text-ink font-semibold">prórroga y los penales NO cuentan</span> para tu pronóstico.
            Ejemplo: si un partido va 1-1 a los 90 min y luego un equipo gana en prórroga, para la quiniela
            ese partido es <span className="text-ink font-semibold">empate 1-1</span>.
          </p>
        </div>

        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <span>🏆</span> Bonus campeón del Mundial
          </p>
          <p className="text-sm text-muted">
            Si aciertas al campeón del Mundial 2026, sumas <span className="text-accent font-semibold">+{pc} pts</span> extra al ranking final.
            Tu pick se configura desde el <a href="/perfil" className="underline hover:text-accent">perfil</a>. Tienes hasta el inicio
            del primer partido para decidirte.
          </p>
        </div>
      </section>

      {/* Cierre */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">2. Cierre de pronósticos</h2>
        <p className="text-sm text-muted">
          Cada partido se cierra <span className="text-ink font-semibold">{lock} minutos antes del kickoff</span>.
          Una vez cerrado, ya no se puede crear ni modificar el pronóstico para ese partido.
        </p>
        <p className="text-sm text-muted">
          Puedes ajustar cuantas veces quieras hasta el cierre — solo cuenta la última versión.
        </p>
      </section>

      {/* Fases */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">3. Fases del torneo</h2>
        <p className="text-sm text-muted">
          El Mundial 2026 tiene <span className="text-ink font-semibold">104 partidos</span> en total:
        </p>
        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
          <li><span className="text-ink">Fase de grupos:</span> 48 partidos · 12 grupos de 4 selecciones · disponibles para predecir desde hoy.</li>
          <li><span className="text-ink">1/16 de final:</span> 16 partidos · aparecen cuando termina la fase de grupos.</li>
          <li><span className="text-ink">Octavos:</span> 8 partidos.</li>
          <li><span className="text-ink">Cuartos:</span> 4 partidos.</li>
          <li><span className="text-ink">Semifinales:</span> 2 partidos.</li>
          <li><span className="text-ink">3er puesto + Final:</span> 2 partidos.</li>
        </ul>
        <p className="text-sm text-muted">
          Los partidos de eliminatoria aparecen automáticamente conforme se definen los emparejamientos reales.
          No predices &quot;ganador grupo A vs 2º grupo B&quot; — esperas a saber qué equipos juegan.
        </p>
      </section>

      {/* Ranking */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">4. Ranking</h2>
        <p className="text-sm text-muted">
          El ranking se ordena por <span className="text-ink font-semibold">puntos totales</span>. En caso de empate:
        </p>
        <ol className="text-sm text-muted space-y-1.5 list-decimal list-inside">
          <li>Mayor número de <span className="text-ink">marcadores exactos</span>.</li>
          <li>Si sigue empate, gana quien se inscribió primero (fecha de registro).</li>
        </ol>
      </section>

      {/* Pago e inscripción */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">5. Inscripción y pago</h2>
        <p className="text-sm text-muted">
          Para poder enviar pronósticos hay que pagar la cuota única. Métodos aceptados:
          Pago Móvil, Transferencia Banesco, Zelle, Binance Pay. Detalles en{' '}
          <a href="/inscripcion" className="text-accent underline">/inscripcion</a>.
        </p>
        <p className="text-sm text-muted">
          Hasta que confirmemos tu pago, puedes navegar la app y ver partidos pero no enviar pronósticos.
        </p>
      </section>

      {/* Privacidad */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">6. Privacidad de los pronósticos</h2>
        <p className="text-sm text-muted">
          Los pronósticos del resto de participantes <span className="text-ink font-semibold">solo son visibles
          una vez que el partido se ha cerrado</span> (kickoff − {lock} min). Antes del cierre, cada
          uno solo ve los suyos. Después, todos podemos ver qué predijo cada uno — sin trampas
          posibles, ya que nadie puede modificar tras el cierre.
        </p>
      </section>

      {/* Premios */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">7. Premios</h2>
        <p className="text-sm text-muted">
          Los premios se entregan en PADELBOX al finalizar el Mundial. Lista actual en{' '}
          <a href="/inscripcion" className="text-accent underline">/inscripcion</a>.
        </p>
        <p className="text-sm text-muted">
          PADELBOX no se queda con la cuota: el bote se reparte en premios y, cuando aplica,
          en costes de organización (cena de entrega, materiales).
        </p>
      </section>

      {/* Dudas */}
      <section className="rounded-xl border border-line bg-bg-elev p-5">
        <p className="font-semibold">¿Dudas?</p>
        <p className="text-sm text-muted mt-2">
          Escríbenos a <a href="mailto:info@solint.cloud" className="text-accent underline">info@solint.cloud</a> o
          contacta con el organizador de la quiniela. Tu cuenta y tus pronósticos están registrados — siempre podemos
          revisar tu historial si hay alguna duda.
        </p>
      </section>
    </article>
  );
}

function RuleRow({
  points,
  color,
  title,
  desc,
  border,
}: {
  points: string;
  color: 'success' | 'warning' | 'muted';
  title: string;
  desc: string;
  border?: boolean;
}) {
  const colorClass =
    color === 'success' ? 'text-success' : color === 'warning' ? 'text-warning' : 'text-muted';
  return (
    <div className={'flex items-center gap-4 p-4 ' + (border ? 'border-t border-line' : '')}>
      <div className={'font-display text-xl tabular-nums w-20 ' + colorClass}>{points}</div>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
