import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { PartidosClient } from '@/components/PartidosClient';
import type { InlineMatch } from '@/components/InlinePredictionRow';
import { PdfExportButton } from '@/app/(app)/cuadro/PdfExportButton';
import { ShareImageButton } from '@/app/(app)/cuadro/ShareImageButton';
import { STAGE_LABEL } from '@/lib/format';

export const metadata = { title: 'Partidos · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

const MUNDIAL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const KNOCKOUT_STAGES = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;

type Tab = 'mundial' | 'liga';

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;
  const hasPaid = session!.user.hasPaid;
  const tab: Tab = searchParams.tab === 'liga' ? 'liga' : 'mundial';

  const [mundialCount, ligaCount, me] = await Promise.all([
    prisma.match.count({ where: { group: { in: MUNDIAL_GROUPS }, excludeFromScoring: false } }),
    prisma.match.count({ where: { group: 'LIGA', excludeFromScoring: false } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { championPick: true, championLockedAt: true },
    }),
  ]);

  // Si la tab pedida (Liga) ya no tiene matches activos, caemos a Mundial
  const effectiveTab: Tab = tab === 'liga' && ligaCount === 0 ? 'mundial' : tab;

  const matches = await prisma.match.findMany({
    where:
      effectiveTab === 'liga'
        ? { group: 'LIGA', excludeFromScoring: false }
        : {
            // Mundial: fase de grupos (A-L) + eliminatorias (group=null pero
            // stage en KO). Las eliminatorias con equipos placeholder se
            // filtran abajo hasta que ESPN defina el bracket real.
            excludeFromScoring: false,
            OR: [
              { group: { in: MUNDIAL_GROUPS } },
              { stage: { in: [...KNOCKOUT_STAGES] } },
            ],
          },
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: {
        where: { userId },
        select: { homeScore: true, awayScore: true, points: true },
      },
    },
  });

  // Equipos placeholder de eliminatorias (bracket sin definir): "Group A 2nd",
  // "Round of 32", "Third Place"... No mostrarlos hasta que haya equipos reales.
  const isPlaceholder = (s: string) =>
    /group\s|round of|third place|\bwinner\b|\brunner\b|\bwin\b|\bplace\b|\b\d(st|nd|rd|th)\b/i.test(s);

  // Distribución agregada de TODAS las predicciones por match (tendencia
  // gana-local / empate / gana-visitante). No exponemos marcadores
  // individuales ni el numero total — solo porcentajes. Se muestra desde
  // la primera prediccion para que la barra se sienta "viva".
  const MIN_PREDS_FOR_DIST = 1;
  const allPreds = await prisma.prediction.findMany({
    where: { matchId: { in: matches.map((m) => m.id) } },
    select: { matchId: true, homeScore: true, awayScore: true },
  });
  const distByMatch = new Map<string, { h: number; d: number; a: number; total: number }>();
  for (const p of allPreds) {
    const cur = distByMatch.get(p.matchId) ?? { h: 0, d: 0, a: 0, total: 0 };
    if (p.homeScore > p.awayScore) cur.h += 1;
    else if (p.homeScore === p.awayScore) cur.d += 1;
    else cur.a += 1;
    cur.total += 1;
    distByMatch.set(p.matchId, cur);
  }

  function toInline(m: typeof matches[number]): InlineMatch {
    const raw = distByMatch.get(m.id);
    let distribution: InlineMatch['distribution'] = null;
    if (raw && raw.total >= MIN_PREDS_FOR_DIST) {
      distribution = {
        homePct: Math.round((raw.h / raw.total) * 100),
        drawPct: Math.round((raw.d / raw.total) * 100),
        awayPct: Math.round((raw.a / raw.total) * 100),
      };
    }
    return {
      id: m.id,
      stage: m.stage,
      group: m.group,
      kickoff: m.kickoff.toISOString(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      lockedAt: m.lockedAt ? m.lockedAt.toISOString() : null,
      distribution,
      initial: m.predictions[0]
        ? {
            homeScore: m.predictions[0].homeScore,
            awayScore: m.predictions[0].awayScore,
            points: m.predictions[0].points,
          }
        : null,
    };
  }

  // Construir vistas de secciones segun la tab. En Mundial el usuario elige
  // cómo ver los partidos: por grupo, por jornada o por fecha (cronológico).
  type SectionDef = { title: string; items: InlineMatch[]; dim?: boolean };
  let views: Array<{ key: string; label: string; sections: SectionDef[] }> = [];

  if (effectiveTab === 'mundial') {
    const groupStage = matches.filter((m) => m.group && MUNDIAL_GROUPS.includes(m.group));
    // Eliminatorias: solo cuando ESPN ya definió los cruces (equipos reales).
    // Mientras sean placeholders ("Round of 32"...) no se muestran.
    const knockout = matches.filter(
      (m) =>
        (KNOCKOUT_STAGES as readonly string[]).includes(m.stage) &&
        !isPlaceholder(m.homeTeam) &&
        !isPlaceholder(m.awayTeam),
    );
    const knockoutSections: SectionDef[] = KNOCKOUT_STAGES.map((stage) => ({
      title: STAGE_LABEL[stage] ?? stage,
      items: knockout.filter((m) => m.stage === stage).map(toInline),
    })).filter((s) => s.items.length > 0);

    // Por grupo: A-L + rondas eliminatorias.
    const porGrupo: SectionDef[] = MUNDIAL_GROUPS.map((g) => ({
      title: `Grupo ${g}`,
      items: groupStage.filter((m) => m.group === g).map(toInline),
    })).filter((s) => s.items.length > 0);

    // Por jornada: dentro de cada grupo, sus partidos ordenados por kickoff
    // se reparten de 2 en 2 → Jornada 1 / 2 / 3.
    const byJornada = new Map<number, typeof matches>();
    for (const g of MUNDIAL_GROUPS) {
      const gm = groupStage.filter((m) => m.group === g); // ya vienen por kickoff asc
      gm.forEach((m, i) => {
        const j = Math.min(3, Math.floor(i / 2) + 1);
        const arr = byJornada.get(j) ?? [];
        arr.push(m);
        byJornada.set(j, arr);
      });
    }
    const porJornada: SectionDef[] = [...byJornada.keys()].sort((a, b) => a - b).map((j) => ({
      title: `Jornada ${j}`,
      items: byJornada
        .get(j)!
        .slice()
        .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())
        .map(toInline),
    }));

    // Por fecha: cronológico, una sección por día (hora de Caracas).
    const dayFmt = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Caracas',
    });
    const porFecha: SectionDef[] = [];
    const chrono = [...groupStage, ...knockout].sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    for (const m of chrono) {
      const raw = dayFmt.format(m.kickoff);
      const title = raw.charAt(0).toUpperCase() + raw.slice(1);
      const last = porFecha[porFecha.length - 1];
      if (last && last.title === title) last.items.push(toInline(m));
      else porFecha.push({ title, items: [toInline(m)] });
    }

    views = [
      { key: 'grupo', label: 'Por grupo', sections: [...porGrupo, ...knockoutSections] },
      { key: 'jornada', label: 'Por jornada', sections: [...porJornada, ...knockoutSections] },
      { key: 'fecha', label: 'Por fecha', sections: porFecha },
    ];
  } else {
    // La Liga: agrupacion clasica por estado (sin selector de vista).
    const upcoming = matches.filter((m) => m.status === 'SCHEDULED' && !m.lockedAt).map(toInline);
    const locked = matches
      .filter((m) => m.status !== 'FINISHED' && (m.status !== 'SCHEDULED' || m.lockedAt))
      .map(toInline);
    const finished = matches.filter((m) => m.status === 'FINISHED').map(toInline);
    views = [
      {
        key: 'estado',
        label: 'Por estado',
        sections: [
          { title: 'Próximos · puedes predecir', items: upcoming },
          { title: 'En juego o cerrados', items: locked, dim: true },
          { title: 'Finalizados', items: finished },
        ],
      },
    ];
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl">Partidos</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          {effectiveTab === 'mundial'
            ? `Mundial 2026 · ${matches.length} partidos`
            : `La Liga · ${matches.length} partidos`}
        </p>
        {!hasPaid && (
          <p className="text-xs text-warning mt-2">
            ⚠ Tu cuenta no está activa. Puedes ver partidos pero no enviar pronósticos hasta que el admin confirme tu pago.{' '}
            <Link href="/inscripcion" className="underline">Ver cómo inscribirte →</Link>
          </p>
        )}
        <p className="text-xs text-muted mt-2">
          💡 Modifica los marcadores y pulsa <strong>Guardar</strong> en cada fila o{' '}
          <strong>Guardar todo</strong> arriba para enviar varios a la vez.
        </p>
      </header>

      {/* Tabs Mundial / La Liga (Liga solo si tiene matches activos) */}
      <nav className="flex gap-1 sm:gap-2 border-b border-line items-end overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabLink href="/partidos?tab=mundial" active={effectiveTab === 'mundial'} label="🌍 Mundial 2026" count={mundialCount} />
        {ligaCount > 0 && (
          <TabLink href="/partidos?tab=liga" active={effectiveTab === 'liga'} label="🇪🇸 La Liga" count={ligaCount} />
        )}
        {/* Botones export — solo en desktop, en móvil van debajo */}
        <div className="ml-auto pb-2 hidden sm:flex gap-2 no-print">
          <ShareImageButton />
          <PdfExportButton />
        </div>
      </nav>

      {/* Botones export en móvil — fila aparte */}
      <div className="flex gap-2 no-print sm:hidden -mt-3">
        <ShareImageButton />
        <PdfExportButton />
      </div>

      {/* Card MI CAMPEÓN (solo en tab Mundial) */}
      {effectiveTab === 'mundial' && (
        <section className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-3 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-accent font-bold">
              MI CAMPEÓN
            </p>
            {me?.championPick ? (
              <>
                <p className="font-display text-lg sm:text-2xl mt-1">{me.championPick.toUpperCase()}</p>
                <p className="text-[11px] sm:text-xs text-muted mt-1">
                  {me.championLockedAt
                    ? '🔒 Pick congelado al inicio del torneo'
                    : 'Aún puedes cambiarlo antes del 11 jun'}
                </p>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-muted mt-1">
                No has elegido todavía. Pick gana +25 pts si aciertas.
              </p>
            )}
          </div>
          {!me?.championLockedAt && (
            <Link
              href="/perfil"
              className="inline-flex items-center h-9 sm:h-10 px-4 sm:px-5 rounded-lg bg-accent text-accent-fg font-display text-xs sm:text-sm hover:brightness-95 shrink-0"
            >
              {me?.championPick ? 'Cambiar →' : 'Elegir campeón →'}
            </Link>
          )}
        </section>
      )}

      <div className="screen-only">
        <PartidosClient hasPaid={hasPaid} views={views} />

        {matches.length === 0 && (
          <p className="text-sm text-muted text-center py-10">
            No hay partidos cargados en esta competición.
          </p>
        )}
      </div>

      {/* Vista compacta solo para impresion / PDF: 1 linea por partido */}
      <PrintCompactView
        title={effectiveTab === 'mundial' ? 'Mi quiniela · Mundial 2026' : 'Mi quiniela · La Liga'}
        sections={views[0].sections}
      />
    </div>
  );
}

function PrintCompactView({
  title,
  sections,
}: {
  title: string;
  sections: Array<{ title: string; items: InlineMatch[] }>;
}) {
  // Numeracion continua 1..N a traves de todas las secciones
  let counter = 0;
  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Caracas',
  });

  return (
    <div className="only-print">
      <div className="print-header">
        <h1>{title}</h1>
        <p>Generado {today} · quinielabox.com</p>
      </div>
      {sections.map((section) => {
        if (section.items.length === 0) return null;
        return (
          <div key={section.title} className="print-section">
            <h3>{section.title}</h3>
            <ol className="print-matches-list">
              {section.items.map((m) => {
                counter += 1;
                const home = m.initial?.homeScore ?? '—';
                const away = m.initial?.awayScore ?? '—';
                return (
                  <li key={m.id}>
                    <span className="print-num">{counter}.</span>
                    <span>{m.homeTeam}</span>
                    <span className="print-score">
                      {home}–{away}
                    </span>
                    <span>{m.awayTeam}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={
        'px-3 sm:px-4 py-2 text-xs sm:text-sm border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ' +
        (active
          ? 'border-accent text-ink font-semibold'
          : 'border-transparent text-muted hover:text-ink')
      }
    >
      {label} <span className="text-[10px] sm:text-xs text-muted">({count})</span>
    </Link>
  );
}
