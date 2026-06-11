import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import { LiveSearch } from '@/components/LiveSearch';

export const metadata = { title: 'Predicciones · Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  user?: string;
  match?: string;
  view?: string;
}

/**
 * Vista admin de actividad de predicciones.
 * Modos:
 *  - Default: 50 predicciones mas recientes con user + match + score.
 *  - ?user=ID: predicciones de un usuario concreto (ordenadas por kickoff).
 *  - ?match=ID: predicciones para un match concreto (ordenadas por user).
 *  - ?view=by-user: agregado por usuario con total/exact/jugados.
 *  - ?view=by-match: agregado por match con cuantos predijeron.
 */
export default async function PrediccionesAdmin({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const filter: { userId?: string; matchId?: string } = {};
  if (sp.user) filter.userId = sp.user;
  if (sp.match) filter.matchId = sp.match;

  const view = sp.view ?? 'recent';

  if (view === 'by-user') {
    return <ByUserView />;
  }
  if (view === 'by-match') {
    return <ByMatchView />;
  }

  // Modo recent o filtrado
  const predictions = await prisma.prediction.findMany({
    where: filter,
    orderBy: [{ updatedAt: 'desc' }],
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true } },
      match: {
        select: {
          id: true,
          homeTeam: true,
          awayTeam: true,
          homeScore: true,
          awayScore: true,
          status: true,
          kickoff: true,
          group: true,
          excludeFromScoring: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Predicciones</h1>
          <p className="text-sm text-muted mt-1">
            Actividad reciente · {predictions.length} predicciones cargadas
          </p>
        </div>
        <nav className="flex gap-1 text-xs flex-wrap">
          <TabLink href="/admin/predicciones" active={view === 'recent' && !sp.user && !sp.match} label="Recientes" />
          <TabLink href="/admin/predicciones?view=by-user" active={view === 'by-user'} label="Por usuario" />
          <TabLink href="/admin/predicciones?view=by-match" active={view === 'by-match'} label="Por partido" />
        </nav>
      </header>

      {(sp.user || sp.match) && (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs flex items-center justify-between gap-2">
          <span>
            Filtrado por {sp.user ? 'usuario' : 'partido'}.{' '}
            <Link href="/admin/predicciones" className="underline text-accent">
              Quitar filtro
            </Link>
          </span>
        </div>
      )}

      {predictions.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Sin predicciones que mostrar.</p>
      ) : (
        <>
        <LiveSearch scopeId="tabla-predicciones" placeholder="Buscar por usuario o partido…" />
        <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2">Cuándo</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Partido</th>
                <th className="px-3 py-2">Predicción</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody id="tabla-predicciones">
              {predictions.map((p) => {
                const m = p.match;
                const realDone =
                  m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null;
                return (
                  <tr
                    key={p.id}
                    data-search={`${p.user.name ?? ''} ${p.user.email} ${m.homeTeam} ${m.awayTeam} ${m.group ?? ''}`}
                    className="border-t border-line"
                  >
                    <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                      {formatDateTime(p.updatedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/predicciones?user=${p.user.id}`}
                        className="hover:text-accent"
                      >
                        {p.user.name ?? p.user.email}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className="text-muted">{m.group ?? '—'}:</span>{' '}
                      <Link
                        href={`/admin/predicciones?match=${m.id}`}
                        className="hover:text-accent"
                      >
                        {m.homeTeam} vs {m.awayTeam}
                      </Link>
                      {m.excludeFromScoring && (
                        <span className="ml-2 text-[10px] uppercase text-warning">excluido</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {p.homeScore}–{p.awayScore}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-muted">
                      {realDone ? `${m.homeScore}–${m.awayScore}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p.points === null ? (
                        <span className="text-muted">·</span>
                      ) : p.points === 3 ? (
                        <span className="text-success font-semibold">+3</span>
                      ) : p.points === 1 ? (
                        <span className="text-warning font-semibold">+1</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

async function ByUserView() {
  const users = await prisma.user.findMany({
    where: { hasPaid: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { predictions: true } },
      predictions: {
        where: { match: { excludeFromScoring: false } },
        select: { points: true },
      },
    },
  });

  const rows = users.map((u) => {
    const scored = u.predictions.filter((p) => p.points !== null);
    const totalPoints = scored.reduce((a, p) => a + (p.points ?? 0), 0);
    const exact = scored.filter((p) => p.points === 3).length;
    return {
      id: u.id,
      label: u.name ?? u.email,
      totalPreds: u._count.predictions,
      activePreds: u.predictions.length,
      played: scored.length,
      points: totalPoints,
      exact,
    };
  });
  rows.sort((a, b) => b.points - a.points || b.exact - a.exact);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Predicciones por usuario</h1>
          <p className="text-sm text-muted mt-1">{rows.length} usuarios pagados</p>
        </div>
        <nav className="flex gap-1 text-xs flex-wrap">
          <TabLink href="/admin/predicciones" active={false} label="Recientes" />
          <TabLink href="/admin/predicciones?view=by-user" active={true} label="Por usuario" />
          <TabLink href="/admin/predicciones?view=by-match" active={false} label="Por partido" />
        </nav>
      </header>

      <LiveSearch scopeId="tabla-por-usuario" placeholder="Buscar usuario…" />

      <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2 text-right">Predicciones</th>
              <th className="px-3 py-2 text-right">Jugados</th>
              <th className="px-3 py-2 text-right">Exactos</th>
              <th className="px-3 py-2 text-right">Pts totales</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody id="tabla-por-usuario">
            {rows.map((r) => (
              <tr key={r.id} data-search={r.label} className="border-t border-line">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.activePreds}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.played}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.exact}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.points}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/predicciones?user=${r.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function ByMatchView() {
  const matches = await prisma.match.findMany({
    where: { excludeFromScoring: false },
    orderBy: { kickoff: 'asc' },
    take: 200,
    include: { _count: { select: { predictions: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Predicciones por partido</h1>
          <p className="text-sm text-muted mt-1">{matches.length} partidos activos</p>
        </div>
        <nav className="flex gap-1 text-xs flex-wrap">
          <TabLink href="/admin/predicciones" active={false} label="Recientes" />
          <TabLink href="/admin/predicciones?view=by-user" active={false} label="Por usuario" />
          <TabLink href="/admin/predicciones?view=by-match" active={true} label="Por partido" />
        </nav>
      </header>

      <LiveSearch scopeId="tabla-por-partido" placeholder="Buscar partido o grupo…" />

      <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">Partido</th>
              <th className="px-3 py-2">Grupo</th>
              <th className="px-3 py-2">Kickoff</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Predicciones</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody id="tabla-por-partido">
            {matches.map((m) => (
              <tr
                key={m.id}
                data-search={`${m.homeTeam} ${m.awayTeam} ${m.group ?? ''}`}
                className="border-t border-line"
              >
                <td className="px-3 py-2">{m.homeTeam} vs {m.awayTeam}</td>
                <td className="px-3 py-2 text-xs text-muted">{m.group ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                  {formatDateTime(m.kickoff)}
                </td>
                <td className="px-3 py-2 text-xs text-muted">{m.status}</td>
                <td className="px-3 py-2 text-right tabular-nums">{m._count.predictions}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/predicciones?match=${m.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        'px-3 py-1.5 rounded-md ' +
        (active ? 'bg-bg-elev border border-line text-ink' : 'text-muted hover:text-ink')
      }
    >
      {label}
    </Link>
  );
}
