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
const PATH = '/apis/site/v2/sports/soccer/fifa.world/scoreboard';

// Ventana del Mundial 2026: del partido inaugural (11 jun) a la final (19 jul).
// Margen +/- 7 días para amistosos previos y eventos relacionados.
const RANGE_START = '20260601';
const RANGE_END   = '20260731';

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
}

export async function fetchWorldCupFixtures(): Promise<NormalizedFixture[]> {
  const url = `https://${HOST}${PATH}?dates=${RANGE_START}-${RANGE_END}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'quiniela-padelbox/1.0' },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`ESPN ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { events?: EspnEvent[] };
  const events = json.events ?? [];
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

  const finished = e.status.type.name === 'STATUS_FINAL';
  const homeScore = finished ? parseScore(home.score) : null;
  const awayScore = finished ? parseScore(away.score) : null;

  return {
    externalId,
    stage: mapStage(e.season?.slug, comp.notes),
    group: mapGroup(e.season?.slug, comp.notes, home.team.displayName, away.team.displayName),
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

function mapStatus(name: string): MatchStatus {
  switch (name) {
    case 'STATUS_SCHEDULED':
      return 'SCHEDULED';
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_HALFTIME':
    case 'STATUS_END_PERIOD':
      return 'LIVE';
    case 'STATUS_FINAL':
    case 'STATUS_FULL_TIME':
      return 'FINISHED';
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
