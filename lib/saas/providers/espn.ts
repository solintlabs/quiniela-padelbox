/**
 * Proveedor de datos deportivos del SaaS: API pública (no oficial) de ESPN.
 *
 * Módulo NUEVO e independiente de lib/providers/espn.ts. Aquel resuelve el
 * Mundial de PADELBOX y tiene las ligas y los rangos de fechas incrustados en
 * una constante de módulo; este recibe liga y temporada por parámetro porque
 * cada tenant elige la suya. No se toca el viejo ni se cambia su firma.
 *
 * Endpoints (verificados el 2026-07-19 contra el catálogo real):
 *   catálogo   GET {site}/leagues/dropdown?sport=soccer&limit=500   → 221 ligas
 *   partidos   GET {site}/sports/soccer/{slug}/scoreboard?dates=YYYYMMDD-YYYYMMDD
 *
 * Solo servidor: nunca importar desde un componente cliente.
 */

const SITE = 'https://site.api.espn.com/apis/site/v2';

const USER_AGENT = 'quinielabox-saas/1.0';
const TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;

/** ESPN devuelve como máximo ~100 eventos por llamada. */
export const ESPN_EVENT_LIMIT = 100;

export interface EspnLeague {
  slug: string;
  name: string;
  abbreviation: string | null;
  logoUrl: string | null;
  hasStandings: boolean;
}

export interface EspnTeamRef {
  espnId: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

export type EspnFixtureStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

export interface EspnFixture {
  externalId: string;
  kickoff: Date;
  round: string | null;
  home: EspnTeamRef;
  away: EspnTeamRef;
  homeScore: number | null;
  awayScore: number | null;
  status: EspnFixtureStatus;
}

/**
 * GET con timeout duro y un reintento. Sin esto, una llamada lenta a ESPN
 * agota la función serverless y devuelve 500: mejor fallar rápido y reintentar.
 */
async function getJson<T>(url: string, revalidateSeconds: number): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: revalidateSeconds },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        // 5xx puede ser pasajero; 4xx no se reintenta.
        if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
          lastError = new Error(`ESPN ${res.status} en ${url}`);
          continue;
        }
        throw new Error(`ESPN ${res.status} en ${url}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      clearTimeout(timeout);
      lastError = e;
      if (attempt >= MAX_ATTEMPTS) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`ESPN: fallo en ${url}`);
}

// -----------------------------------------------------------------
// Catálogo de ligas
// -----------------------------------------------------------------

interface DropdownResponse {
  leagues?: Array<{
    slug?: string;
    name?: string;
    abbreviation?: string;
    hasStandings?: boolean;
    logos?: Array<{ href?: string }>;
  }>;
}

/**
 * Catálogo completo de ligas de fútbol de ESPN (221 a fecha de hoy).
 *
 * La respuesta pesa ~580 KB, así que se cachea 24 h en el fetch de Next y
 * además en memoria del proceso: el wizard de onboarding la consulta en cada
 * pulsación del buscador y no puede pedirla cada vez.
 */
let leaguesMemo: { at: number; leagues: EspnLeague[] } | null = null;
const LEAGUES_TTL_MS = 24 * 60 * 60_000;

export async function listLeagues(): Promise<EspnLeague[]> {
  if (leaguesMemo && Date.now() - leaguesMemo.at < LEAGUES_TTL_MS) {
    return leaguesMemo.leagues;
  }

  const json = await getJson<DropdownResponse>(
    `${SITE}/leagues/dropdown?sport=soccer&limit=500`,
    60 * 60 * 24,
  );

  const leagues = (json.leagues ?? [])
    .filter((l): l is { slug: string; name: string } & typeof l => !!l.slug && !!l.name)
    .map((l) => ({
      slug: l.slug,
      name: l.name,
      abbreviation: l.abbreviation ?? null,
      logoUrl: l.logos?.[0]?.href ?? null,
      hasStandings: l.hasStandings ?? false,
    }));

  leaguesMemo = { at: Date.now(), leagues };
  return leagues;
}

/** Búsqueda para el wizard: por nombre, abreviatura o slug. Puro sobre la lista. */
export function filterLeagues(leagues: EspnLeague[], query: string): EspnLeague[] {
  const q = query.trim().toLowerCase();
  if (!q) return leagues;
  return leagues.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.slug.toLowerCase().includes(q) ||
      (l.abbreviation ?? '').toLowerCase().includes(q),
  );
}

/** Comprueba que un slug existe de verdad antes de guardarlo en la competición. */
export async function isKnownLeague(slug: string): Promise<boolean> {
  const leagues = await listLeagues();
  return leagues.some((l) => l.slug === slug);
}

// -----------------------------------------------------------------
// Fechas
// -----------------------------------------------------------------

/** Date → "YYYYMMDD" en UTC, que es como ESPN espera el parámetro. */
export function toEspnDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Parte un rango de fechas en tramos mensuales.
 *
 * ESPN corta la respuesta del scoreboard en ~100 eventos. Una temporada
 * completa de liga son 380 partidos: pedida de una vez, se pierden tres
 * cuartos en silencio. Por tramos mensuales cada uno queda muy por debajo del
 * límite. (A PADELBOX ya le pasó: se perdieron semifinales, 3er puesto y
 * final del Mundial hasta que se partió en tramos.)
 *
 * Puro y testeable: sin red ni reloj.
 */
export function monthlyRanges(start: Date, end: Date): Array<{ start: string; end: string }> {
  if (end.getTime() < start.getTime()) return [];

  const ranges: Array<{ start: string; end: string }> = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));

  while (cursor.getTime() <= end.getTime()) {
    // Último día del mes del cursor.
    const monthEnd = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
    );
    const chunkEnd = monthEnd.getTime() < end.getTime() ? monthEnd : end;
    ranges.push({ start: toEspnDate(cursor), end: toEspnDate(chunkEnd) });
    cursor = new Date(Date.UTC(chunkEnd.getUTCFullYear(), chunkEnd.getUTCMonth(), chunkEnd.getUTCDate() + 1));
  }

  return ranges;
}

// -----------------------------------------------------------------
// Partidos
// -----------------------------------------------------------------

interface ScoreboardResponse {
  events?: EspnEvent[];
}

interface EspnEvent {
  id?: string;
  date?: string;
  season?: { year?: number; slug?: string };
  status?: { type?: { name?: string; state?: string } };
  competitions?: Array<{
    competitors?: Array<{
      homeAway?: string;
      score?: string;
      team?: {
        id?: string;
        displayName?: string;
        shortDisplayName?: string;
        abbreviation?: string;
        logo?: string;
        flag?: string;
      };
    }>;
    notes?: Array<{ headline?: string }>;
  }>;
}

const FINISHED_STATUSES = new Set([
  'STATUS_FINAL',
  'STATUS_FULL_TIME',
  'STATUS_FINAL_PEN',
  'STATUS_FINAL_AET',
  'STATUS_AGGREGATE_FINAL',
]);

const LIVE_STATUSES = new Set([
  'STATUS_IN_PROGRESS',
  'STATUS_HALFTIME',
  'STATUS_END_PERIOD',
  // El fútbol en ESPN usa estos durante el juego, no STATUS_IN_PROGRESS.
  'STATUS_FIRST_HALF',
  'STATUS_SECOND_HALF',
  'STATUS_BEGINNING_OF_PERIOD',
  'STATUS_EXTRA_TIME',
  'STATUS_OVERTIME',
  'STATUS_PENALTIES',
  'STATUS_SHOOTOUT',
]);

/** Puro: nombre de estado de ESPN → estado propio. */
export function mapEspnStatus(name: string | undefined, state?: string): EspnFixtureStatus {
  if (name) {
    if (FINISHED_STATUSES.has(name)) return 'FINISHED';
    if (LIVE_STATUSES.has(name)) return 'LIVE';
    if (name === 'STATUS_SCHEDULED') return 'SCHEDULED';
    if (name === 'STATUS_POSTPONED') return 'POSTPONED';
    if (name === 'STATUS_CANCELED' || name === 'STATUS_FORFEIT') return 'CANCELLED';
  }
  // Estado desconocido: `state` (pre/in/post) es más fiable que asumir.
  if (state === 'in') return 'LIVE';
  if (state === 'post') return 'FINISHED';
  return 'SCHEDULED';
}

function toTeamRef(team: NonNullable<NonNullable<EspnEvent['competitions']>[number]['competitors']>[number]['team']): EspnTeamRef | null {
  const espnId = team?.id;
  const name = team?.displayName;
  if (!espnId || !name) return null;
  return {
    espnId,
    name,
    shortName: team.shortDisplayName ?? team.abbreviation ?? null,
    logoUrl: team.logo ?? team.flag ?? null,
  };
}

/** Puro: evento crudo de ESPN → fixture normalizado, o null si no es utilizable. */
export function normalizeEvent(event: EspnEvent): EspnFixture | null {
  const externalId = event.id;
  const dateRaw = event.date;
  if (!externalId || !dateRaw) return null;

  const kickoff = new Date(dateRaw);
  if (Number.isNaN(kickoff.getTime())) return null;

  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const homeRaw = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
  const awayRaw = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];

  const home = toTeamRef(homeRaw?.team);
  const away = toTeamRef(awayRaw?.team);
  if (!home || !away) return null;

  const status = mapEspnStatus(event.status?.type?.name, event.status?.type?.state);
  // Antes del pitido inicial no hay marcador: un 0-0 falso confundiría al
  // jugador y, peor, podría puntuarse si el estado llega mal.
  const hasScore = status === 'LIVE' || status === 'FINISHED';

  return {
    externalId,
    kickoff,
    round: competition?.notes?.[0]?.headline?.trim() || null,
    home,
    away,
    homeScore: hasScore ? parseScore(homeRaw?.score) : null,
    awayScore: hasScore ? parseScore(awayRaw?.score) : null,
    status,
  };
}

function parseScore(raw: string | undefined): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Partidos de una liga entre dos fechas. Trocea en tramos mensuales, tolera
 * que algún tramo falle (ESPN caído) y deduplica por id de evento.
 *
 * Devuelve también `partial` para que el llamador sepa que la foto está
 * incompleta y no marque la competición como sincronizada del todo.
 */
export async function fetchFixtures(
  slug: string,
  start: Date,
  end: Date,
): Promise<{ fixtures: EspnFixture[]; partial: boolean }> {
  const ranges = monthlyRanges(start, end);
  if (ranges.length === 0) return { fixtures: [], partial: false };

  const results = await Promise.allSettled(
    ranges.map((r) =>
      getJson<ScoreboardResponse>(
        `${SITE}/sports/soccer/${encodeURIComponent(slug)}/scoreboard?dates=${r.start}-${r.end}`,
        60,
      ),
    ),
  );

  const byId = new Map<string, EspnFixture>();
  let partial = false;

  for (const result of results) {
    if (result.status !== 'fulfilled') {
      partial = true;
      console.error('[saas/espn] tramo fallido:', result.reason);
      continue;
    }
    const events = result.value.events ?? [];
    // Si un tramo viene justo en el tope, ESPN probablemente truncó.
    if (events.length >= ESPN_EVENT_LIMIT) partial = true;

    for (const event of events) {
      const fixture = normalizeEvent(event);
      if (fixture) byId.set(fixture.externalId, fixture);
    }
  }

  const fixtures = [...byId.values()].sort(
    (a, b) => a.kickoff.getTime() - b.kickoff.getTime(),
  );
  return { fixtures, partial };
}

/** Equipos que aparecen en un conjunto de partidos, deduplicados por espnId. */
export function teamsFromFixtures(fixtures: EspnFixture[]): EspnTeamRef[] {
  const byId = new Map<string, EspnTeamRef>();
  for (const f of fixtures) {
    if (!byId.has(f.home.espnId)) byId.set(f.home.espnId, f.home);
    if (!byId.has(f.away.espnId)) byId.set(f.away.espnId, f.away);
  }
  return [...byId.values()];
}
