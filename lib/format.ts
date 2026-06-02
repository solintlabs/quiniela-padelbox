// La quiniela es de PADELBOX (Venezuela). Postgres guarda UTC; aquí
// formateamos SIEMPRE en hora de Caracas (GMT-4) para que las horas de los
// partidos coincidan con la zona del usuario, independientemente de que el
// servidor (Vercel) corra en UTC.
const TIME_ZONE = 'America/Caracas';

const DATE_FMT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: TIME_ZONE,
});

const TIME_FMT = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});

const DATETIME_FMT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});

export const formatDate = (d: Date | string) => DATE_FMT.format(new Date(d));
export const formatTime = (d: Date | string) => TIME_FMT.format(new Date(d));
export const formatDateTime = (d: Date | string) => DATETIME_FMT.format(new Date(d));

/**
 * "2h 14m" | "32m" | "12s" | "—" si negativo
 */
export function timeLeft(target: Date | string, now: Date = new Date()): string {
  const ms = new Date(target).getTime() - now.getTime();
  if (ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (days > 0) return `${days}d ${h}h`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}

export const STAGE_LABEL: Record<string, string> = {
  GROUP: 'Fase de grupos',
  R32: '1/16',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semifinales',
  THIRD: '3er puesto',
  FINAL: 'Final',
};

/** Mapea código ISO de país → emoji bandera. Acepta "ES", "ESP", null. */
export function flag(code?: string | null): string {
  if (!code) return '🏳️';
  const iso2 = code.length === 3 ? COUNTRY_3_TO_2[code.toUpperCase()] ?? code.slice(0, 2) : code;
  const cps = iso2.toUpperCase().split('').map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...cps);
}

// Pequeño mapa ISO-3 → ISO-2 para selecciones habituales del Mundial.
// Si falta alguna, se rellena por defecto con las 2 primeras letras (suele acertar).
const COUNTRY_3_TO_2: Record<string, string> = {
  ESP: 'ES', ARG: 'AR', MEX: 'MX', POR: 'PT', FRA: 'FR', ALE: 'DE', DEU: 'DE',
  BRA: 'BR', URU: 'UY', JPN: 'JP', USA: 'US', CAN: 'CA', ENG: 'GB', GBR: 'GB',
  ITA: 'IT', BEL: 'BE', NED: 'NL', NLD: 'NL', CRO: 'HR', SUI: 'CH', CHE: 'CH',
  DEN: 'DK', DNK: 'DK', POL: 'PL', COL: 'CO', CHI: 'CL', CHL: 'CL', PER: 'PE',
  ECU: 'EC', PAR: 'PY', PRY: 'PY', VEN: 'VE', BOL: 'BO', MAR: 'MA', SEN: 'SN',
  GHA: 'GH', CMR: 'CM', NGA: 'NG', EGY: 'EG', TUN: 'TN', KSA: 'SA', SAU: 'SA',
  KOR: 'KR', QAT: 'QA', UAE: 'AE', AUS: 'AU', NZL: 'NZ', WAL: 'GB-WLS',
};
