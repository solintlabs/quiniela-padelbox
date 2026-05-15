/**
 * Proveedor de datos: ESPN public scoreboard API.
 *
 * Endpoint usado:
 *   GET https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 *       ?dates=YYYYMMDD          (un día concreto)
 *       ?dates=YYYYMMDD-YYYYMMDD (rango — preferido, 1 sola llamada)
 *
 * Notas:
 *   - API NO oficial: ESPN no la documenta. Lleva años funcionando estable.
 *   - Sin API key ni rate limit publicado.
 *   - Si ESPN rompe la estructura, esta es la ÚNICA capa que hay que
 *     reescribir. Todo lo demás de la app consume el formato normalizado.
 *
 * Para migrar a otro proveedor en el futuro:
 *   1) Crear lib/providers/{nuevo}.ts con la misma interfaz `fetchWorldCupFixtures`.
 *   2) Cambiar el import en lib/sync.ts.
 */
import type { MatchStatus, Stage } from '@prisma/client';

const HOST = 'site.api.espn.com';

// Competiciones que sincronizamos. Cada una con su rango.
// Para tener algo en vivo PRE-Mundial, incluimos también La Liga (jornadas
// activas). Cuando arranque el Mundial 2026 lo dejaremos único.
function makeRange(daysBack: number, daysAhead: number): { start: string; end: string } {
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);
  return { start: fmt(start), end: fmt(end) };
}

const COMPETITIONS: Array<{ slug: string; range: () => { start: string; end: string } }> = [
  // Mundial 2026: ventana fija de las fechas oficiales del torneo.
  { slug: 'fifa.world', range: () => ({ start: '20260601', end: '20260731' }) },
  // La Liga: ventana rodante de -2 a +10 días para capturar jornadas en juego/próximas.
  { slug: 'esp.1', range: () => makeRange(2, 10) },
];

/** Shape normalizado que devuelve este provider. Es lo único que sync.ts conoce. */
export interface NormalizedFixture {
  externalId: number;         // ESPN event.id (numérico)
  stage: Stage;
  group: string | null;       // "A".."H" en fase de grupos
  kickoff: Date;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

interface EspnCompetitor {
  homeAway: 'home' | 'away';
  score: string;
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    flag?: string;
    logo?: string;
  };
}

interface EspnEvent {
  id: string;
  date: string;
  name: string;
  season: { year: number; slug?: string };
  status: { type: { name: string } };
  competitions: Array<{
    id: string;
    competitors: EspnCompetitor[];
    venue?: { fullName: string };
    notes?: Array<{ headline: string }>;
  }>;
  // Custom: lo añadimos en fetchCompetition para saber de qué liga viene
  __league?: string;
}

async function fetchCompetition(slug: string, start: string, end: string): Promise<EspnEvent[]> {
  const url = `https://${HOST}/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${start}-${end}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'quiniela-padelbox/1.0' },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`ESPN ${slug} ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { events?: EspnEvent[] };
  return (json.events ?? []).map((e) => ({ ...e, __league: slug }));
}

/**
 * Trae todos los fixtures de las competiciones registradas. Sigue llamándose
 * `fetchWorldCupFixtures` por compatibilidad histórica; en realidad ahora trae
 * Mundial 2026 + cualquier liga adicional configurada en COMPETITIONS.
 */
export async function fetchWorldCupFixtures(): Promise<NormalizedFixture[]> {
  const results = await Promise.allSettled(
    COMPETITIONS.map(async (c) => {
      const { start, end } = c.range();
      return fetchCompetition(c.slug, start, end);
    }),
  );

  const events: EspnEvent[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') events.push(...r.value);
    else console.error('[espn] competition failed:', r.reason);
  }
  return events.map(toNormalized).filter((f): f is NormalizedFixture => f !== null);
}

function toNormalized(e: EspnEvent): NormalizedFixture | null {
  const externalId = Number.parseInt(e.id, 10);
  if (!Number.isFinite(externalId)) return null;

  const comp = e.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors.find((c) => c.homeAway === 'home') ?? comp.competitors[0];
  const away = comp.competitors.find((c) => c.homeAway === 'away') ?? comp.competitors[1];
  if (!home || !away) return null;

  const finished = isFinishedStatus(e.status.type.name);
  const homeScore = finished ? parseScore(home.score) : null;
  const awayScore = finished ? parseScore(away.score) : null;

  // En ligas regulares (La Liga, Premier...) no hay fase, siempre GROUP con grupo "LIGA".
  const isWorldCup = e.__league === 'fifa.world';
  const stage: Stage = isWorldCup ? mapStage(e.season?.slug, comp.notes) : 'GROUP';
  const group = isWorldCup
    ? mapGroup(e.season?.slug, comp.notes, home.team.displayName, away.team.displayName)
    : e.__league === 'esp.1'
      ? 'LIGA'
      : (e.__league ?? null);

  return {
    externalId,
    stage,
    group,
    kickoff: new Date(e.date),
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeFlag: home.team.flag ?? home.team.logo ?? null,
    awayFlag: away.team.flag ?? away.team.logo ?? null,
    homeScore,
    awayScore,
    status: mapStatus(e.status.type.name),
  };
}

function parseScore(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function isFinishedStatus(name: string): boolean {
  return (
    name === 'STATUS_FINAL' ||
    name === 'STATUS_FULL_TIME' ||
    name === 'STATUS_FINAL_PEN' ||
    name === 'STATUS_FINAL_AET' ||
    name === 'STATUS_AGGREGATE_FINAL'
  );
}

function mapStatus(name: string): MatchStatus {
  if (isFinishedStatus(name)) return 'FINISHED';
  switch (name) {
    case 'STATUS_SCHEDULED':
      return 'SCHEDULED';
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_HALFTIME':
    case 'STATUS_END_PERIOD':
      return 'LIVE';
    case 'STATUS_POSTPONED':
      return 'POSTPONED';
    case 'STATUS_CANCELED':
    case 'STATUS_FORFEIT':
      return 'CANCELLED';
    default:
      return 'SCHEDULED';
  }
}

function mapStage(slug: string | undefined, notes: Array<{ headline: string }> | undefined): Stage {
  const s = (slug ?? '').toLowerCase();
  const n = (notes?.[0]?.headline ?? '').toLowerCase();
  const t = s + ' ' + n;
  if (t.includes('final') && !t.includes('semi') && !t.includes('quarter') && !t.includes('third')) return 'FINAL';
  if (t.includes('third')) return 'THIRD';
  if (t.includes('semi')) return 'SF';
  if (t.includes('quarter')) return 'QF';
  if (t.includes('round-of-16') || t.includes('round of 16') || t.includes('r16')) return 'R16';
  if (t.includes('round-of-32') || t.includes('round of 32') || t.includes('r32')) return 'R32';
  return 'GROUP';
}

function mapGroup(
  slug: string | undefined,
  notes: Array<{ headline: string }> | undefined,
  _home: string,
  _away: string,
): string | null {
  // ESPN no expone el grupo (A..H) directamente. Si en notes aparece "Group X" lo extraemos.
  const text = (notes?.[0]?.headline ?? '') + ' ' + (slug ?? '');
  const m = text.match(/group\s+([a-l])/i);
  return m ? m[1].toUpperCase() : null;
}
