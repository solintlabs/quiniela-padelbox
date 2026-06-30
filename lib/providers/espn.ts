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
import { inferGroupFromMatch } from '@/lib/fifa2026';

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
  /** "Estadio Azteca · Mexico City" (null si ESPN no lo trae) */
  venue: string | null;
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
  status: { type: { name: string; state?: string } };
  competitions: Array<{
    id: string;
    competitors: EspnCompetitor[];
    venue?: {
      fullName?: string;
      address?: { city?: string; state?: string; country?: string };
    };
    notes?: Array<{ headline: string }>;
  }>;
  // Custom: lo añadimos en fetchCompetition para saber de qué liga viene
  __league?: string;
}

/**
 * Fetch a una competicion de ESPN con timeout duro y retry x1.
 * Sin esto, una llamada lenta a ESPN puede hacer expirar la funcion serverless
 * de Vercel (Hobby = 10s default) y devolver 500. Mejor fail-fast + retry.
 */
async function fetchCompetition(slug: string, start: string, end: string): Promise<EspnEvent[]> {
  const url = `https://${HOST}/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${start}-${end}`;
  const PER_ATTEMPT_TIMEOUT_MS = 8000;
  const MAX_ATTEMPTS = 2;

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'quiniela-padelbox/1.0' },
        next: { revalidate: 60 },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        // 5xx -> retry; 4xx -> abort
        if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
          lastErr = new Error(`ESPN ${slug} ${res.status} (attempt ${attempt})`);
          continue;
        }
        throw new Error(`ESPN ${slug} ${res.status}: ${await res.text().catch(() => '')}`);
      }
      const json = (await res.json()) as { events?: EspnEvent[] };
      return (json.events ?? []).map((e) => ({ ...e, __league: slug }));
    } catch (e) {
      clearTimeout(timeoutId);
      lastErr = e;
      // En el ultimo intento relanzamos
      if (attempt >= MAX_ATTEMPTS) break;
      // Backoff corto antes del retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`ESPN ${slug}: unknown error`);
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

/**
 * Marcador a 90 minutos (reglamentario) de un partido, desde el endpoint de
 * resumen de ESPN. Suma los goles de los periodos 1 y 2 (las dos partes) por
 * equipo. Para eliminatorias que van a prórroga: devuelve el resultado a los
 * 90' (el que vale en la quiniela), no el final con prórroga.
 *
 * Devuelve también el total (suma de TODOS los periodos) para que el llamador
 * valide que cuadra con el marcador final de ESPN antes de confiar en el dato.
 * null si no hay datos fiables.
 */
export async function fetchRegulationScore(
  slug: string,
  eventId: number,
): Promise<{ home: number; away: number; totalHome: number; totalAway: number } | null> {
  const url = `https://${HOST}/apis/site/v2/sports/soccer/${slug}/summary?event=${eventId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'quiniela-padelbox/1.0' },
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      header?: {
        competitions?: Array<{
          status?: { type?: { name?: string } };
          competitors?: Array<{
            homeAway?: string;
            linescores?: Array<{ displayValue?: string; value?: number }>;
          }>;
        }>;
      };
    };
    const comp = json.header?.competitions?.[0];
    if (!comp?.competitors) return null;
    // En tanda de penaltis ESPN añade un periodo extra con los GOLES de la
    // tanda (p.ej. 3-4). Esos no son goles del partido: el último periodo es la
    // tanda y hay que excluirlo del total, o el sanity check del llamador
    // (suma de periodos == marcador final de ESPN) nunca cuadra y el KO no se
    // puntúa jamás.
    const isShootout = comp.status?.type?.name === 'STATUS_FINAL_PEN';
    const home = comp.competitors.find((c) => c.homeAway === 'home');
    const away = comp.competitors.find((c) => c.homeAway === 'away');
    const periodVal = (ls: { displayValue?: string; value?: number } | undefined): number => {
      if (!ls) return 0;
      if (typeof ls.value === 'number') return ls.value;
      const n = Number.parseInt(ls.displayValue ?? '', 10);
      return Number.isFinite(n) ? n : 0;
    };
    const reg = (c: typeof home): { reg: number; total: number } | null => {
      const ls = c?.linescores;
      if (!Array.isArray(ls) || ls.length < 2) return null;
      const regScore = periodVal(ls[0]) + periodVal(ls[1]); // periodos 1 y 2 = 90 min
      const goalPeriods = isShootout ? ls.slice(0, -1) : ls; // sin la tanda de penaltis
      const total = goalPeriods.reduce((acc, p) => acc + periodVal(p), 0);
      return { reg: regScore, total };
    };
    const h = reg(home);
    const a = reg(away);
    if (!h || !a) return null;
    return { home: h.reg, away: a.reg, totalHome: h.total, totalAway: a.total };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function toNormalized(e: EspnEvent): NormalizedFixture | null {
  const externalId = Number.parseInt(e.id, 10);
  if (!Number.isFinite(externalId)) return null;

  const comp = e.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors.find((c) => c.homeAway === 'home') ?? comp.competitors[0];
  const away = comp.competitors.find((c) => c.homeAway === 'away') ?? comp.competitors[1];
  if (!home || !away) return null;

  // Marcador en LIVE y FINISHED (antes solo FINISHED → la app no mostraba
  // goles en vivo y el scoring podia perder un ciclo si ESPN reportaba
  // FINISHED y score en llamadas distintas). En SCHEDULED queda null para
  // no ensenar un 0-0 falso antes del kickoff.
  const status = mapStatus(e.status.type.name, e.status.type.state);
  const hasScore = status === 'LIVE' || status === 'FINISHED';
  const homeScore = hasScore ? parseScore(home.score) : null;
  const awayScore = hasScore ? parseScore(away.score) : null;

  // En ligas regulares (La Liga, Premier...) no hay fase, siempre GROUP con grupo "LIGA".
  const isWorldCup = e.__league === 'fifa.world';
  const stage: Stage = isWorldCup ? mapStage(e.season?.slug, comp.notes) : 'GROUP';
  const group = isWorldCup
    ? mapGroup(e.season?.slug, comp.notes, home.team.displayName, away.team.displayName)
    : e.__league === 'esp.1'
      ? 'LIGA'
      : (e.__league ?? null);

  // Estadio + ciudad: "Estadio Azteca · Mexico City". Cualquier parte puede faltar.
  const venueName = comp.venue?.fullName?.trim() || null;
  const venueCity = comp.venue?.address?.city?.trim() || null;
  const venue = venueName
    ? venueCity && !venueName.toLowerCase().includes(venueCity.toLowerCase())
      ? `${venueName} · ${venueCity}`
      : venueName
    : venueCity;

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
    venue,
    status,
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

function mapStatus(name: string, state?: string): MatchStatus {
  if (isFinishedStatus(name)) return 'FINISHED';
  switch (name) {
    case 'STATUS_SCHEDULED':
      return 'SCHEDULED';
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_HALFTIME':
    case 'STATUS_END_PERIOD':
    // Fútbol en ESPN usa estos durante el juego (¡no STATUS_IN_PROGRESS!).
    // Sin ellos, el partido caía al default SCHEDULED y no había marcador
    // en vivo (pasó con el México-Sudáfrica inaugural).
    case 'STATUS_FIRST_HALF':
    case 'STATUS_SECOND_HALF':
    case 'STATUS_BEGINNING_OF_PERIOD':
    case 'STATUS_EXTRA_TIME':
    case 'STATUS_OVERTIME':
    case 'STATUS_PENALTIES':
    case 'STATUS_SHOOTOUT':
      return 'LIVE';
    case 'STATUS_POSTPONED':
      return 'POSTPONED';
    case 'STATUS_CANCELED':
    case 'STATUS_FORFEIT':
      return 'CANCELLED';
  }
  // Status desconocido: decide por state (pre/in/post), mucho más fiable
  // que asumir SCHEDULED.
  if (state === 'in') return 'LIVE';
  if (state === 'post') return 'FINISHED';
  return 'SCHEDULED';
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
  home: string,
  away: string,
): string | null {
  // 1) Si en notes aparece "Group X" lo extraemos directo.
  const text = (notes?.[0]?.headline ?? '') + ' ' + (slug ?? '');
  const m = text.match(/group\s+([a-l])/i);
  if (m) return m[1].toUpperCase();

  // 2) Fallback: lookup en el draw oficial FIFA 2026 por nombre de equipo.
  // (ESPN no expone el grupo en su endpoint scoreboard; el draw fue el 5-dic-2025
  // y no cambia, asi que lib/fifa2026.ts es la fuente de verdad para el mapping)
  return inferGroupFromMatch(home, away);
}
