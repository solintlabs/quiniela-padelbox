/**
 * Cliente mínimo para API-Football (api-sports.io).
 * Docs: https://www.api-football.com/documentation-v3
 *
 * Endpoint relevante para el Mundial 2026:
 *   GET /fixtures?league={LEAGUE_ID}&season={SEASON}
 */
import type { MatchStatus, Stage } from '@prisma/client';

const HOST = process.env.API_FOOTBALL_HOST ?? 'v3.football.api-sports.io';
const KEY = process.env.API_FOOTBALL_KEY ?? '';
const LEAGUE = process.env.API_FOOTBALL_LEAGUE_ID ?? '';
const SEASON = process.env.API_FOOTBALL_SEASON ?? '2026';

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    round?: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

async function get<T>(path: string, search: Record<string, string>): Promise<T> {
  if (!KEY) throw new Error('API_FOOTBALL_KEY no definido');
  const url = new URL(`https://${HOST}${path}`);
  for (const [k, v] of Object.entries(search)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { 'x-apisports-key': KEY },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API-Football ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { response: T; errors?: unknown };
  return json.response;
}

export async function fetchWorldCupFixtures(): Promise<ApiFixture[]> {
  return get<ApiFixture[]>('/fixtures', {
    league: LEAGUE,
    season: SEASON,
  });
}

/** Mapea status corto de API-Football → MatchStatus de Prisma. */
export function mapStatus(short: string): MatchStatus {
  // https://www.api-football.com/documentation-v3#tag/Fixtures
  if (['TBD', 'NS'].includes(short)) return 'SCHEDULED';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(short)) return 'LIVE';
  if (['FT', 'AET', 'PEN'].includes(short)) return 'FINISHED';
  if (short === 'PST') return 'POSTPONED';
  if (['CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'CANCELLED';
  return 'SCHEDULED';
}

/** Mapea el campo league.round → Stage Prisma + grupo (si aplica). */
export function mapRound(round?: string): { stage: Stage; group?: string } {
  const r = (round ?? '').toLowerCase();
  if (r.includes('final') && !r.includes('semi') && !r.includes('quarter') && !r.includes('3rd')) return { stage: 'FINAL' };
  if (r.includes('3rd') || r.includes('third')) return { stage: 'THIRD' };
  if (r.includes('semi')) return { stage: 'SF' };
  if (r.includes('quarter')) return { stage: 'QF' };
  if (r.includes('round of 16') || r.includes('1/8')) return { stage: 'R16' };
  if (r.includes('round of 32') || r.includes('1/16')) return { stage: 'R32' };
  // "Group Stage - 1", "Group A - 1"
  const m = r.match(/group\s+([a-h])/i);
  return { stage: 'GROUP', group: m?.[1]?.toUpperCase() };
}
