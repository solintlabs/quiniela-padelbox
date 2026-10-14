/**
 * Idiomas del SaaS.
 *
 * Se usa un diccionario propio y no next-intl a propósito: next-intl exige
 * envolver el layout raíz y tocar la configuración de rutas de TODO el
 * proyecto, incluidas las páginas y las /api/* de PADELBOX que consume la app
 * publicada en las stores. Para tres idiomas y un puñado de cadenas, el
 * riesgo no compensa. Si algún día el SaaS se separa en su propio despliegue,
 * migrar a next-intl es directo: las claves ya están extraídas.
 *
 * Los nombres de equipos y ligas NO se traducen: vienen de ESPN tal cual.
 */

export const LOCALES = ['es', 'en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Idioma efectivo. Prioridad: usuario > tenant > dispositivo > es.
 * Puro: la cabecera Accept-Language se pasa como string.
 */
export function resolveLocale(input: {
  user?: string | null;
  tenant?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.user)) return input.user;
  if (isLocale(input.tenant)) return input.tenant;

  for (const part of (input.acceptLanguage ?? '').split(',')) {
    // "pt-BR;q=0.9" -> "pt"
    const tag = part.trim().split(';')[0]?.split('-')[0]?.toLowerCase();
    if (isLocale(tag)) return tag;
  }

  return DEFAULT_LOCALE;
}

type Messages = Record<string, string>;

const es: Messages = {
  'nav.panel': 'Panel',
  'nav.playerView': 'Ver como jugador',
  'onboarding.title': 'Crea tu quiniela',
  'onboarding.subtitle': 'En tres pasos. Sin tarjeta, sin instalar nada.',
  'onboarding.step.brand': 'Tu marca',
  'onboarding.step.competition': 'Competición',
  'onboarding.step.points': 'Puntos',
  'onboarding.submit': 'Crear mi quiniela',
  'competition.fromCatalog': 'Del catálogo',
  'competition.manual': 'A mano',
  'invite.title': 'Te han invitado a la quiniela',
  'invite.cta': 'Apuntarme',
  'player.pendingPayment': 'Tu inscripción está pendiente de confirmar por el organizador.',
  'ranking.title': 'Clasificación',
  'ranking.empty': 'Aún no hay jugadores.',
  'ranking.exact': 'exactos',
  'fixture.open': 'Abierto',
  'fixture.closed': 'Cerrado',
  'points.exact': 'Marcador exacto',
  'points.winner': 'Acertar el ganador',
  'points.goalDiff': 'Acertar la diferencia de goles',
  'points.teamScore': 'Por cada equipo con los goles clavados',
  'points.drawBonus': 'Extra por clavar un empate',
  'branding.poweredBy': 'Powered by QuinielaBOX',
};

const en: Messages = {
  'nav.panel': 'Dashboard',
  'nav.playerView': 'View as player',
  'onboarding.title': 'Create your pool',
  'onboarding.subtitle': 'Three steps. No card, nothing to install.',
  'onboarding.step.brand': 'Your brand',
  'onboarding.step.competition': 'Competition',
  'onboarding.step.points': 'Points',
  'onboarding.submit': 'Create my pool',
  'competition.fromCatalog': 'From catalogue',
  'competition.manual': 'Manual',
  'invite.title': "You've been invited to the pool",
  'invite.cta': 'Join',
  'player.pendingPayment': 'The organiser has not confirmed your entry yet.',
  'ranking.title': 'Standings',
  'ranking.empty': 'No players yet.',
  'ranking.exact': 'exact',
  'fixture.open': 'Open',
  'fixture.closed': 'Closed',
  'points.exact': 'Exact score',
  'points.winner': 'Correct winner',
  'points.goalDiff': 'Correct goal difference',
  'points.teamScore': 'Per team whose goals you nail',
  'points.drawBonus': 'Bonus for nailing a draw',
  'branding.poweredBy': 'Powered by QuinielaBOX',
};

const pt: Messages = {
  'nav.panel': 'Painel',
  'nav.playerView': 'Ver como jogador',
  'onboarding.title': 'Crie o seu bolão',
  'onboarding.subtitle': 'Em três passos. Sem cartão, sem instalar nada.',
  'onboarding.step.brand': 'A sua marca',
  'onboarding.step.competition': 'Competição',
  'onboarding.step.points': 'Pontos',
  'onboarding.submit': 'Criar o meu bolão',
  'competition.fromCatalog': 'Do catálogo',
  'competition.manual': 'Manual',
  'invite.title': 'Você foi convidado para o bolão',
  'invite.cta': 'Participar',
  'player.pendingPayment': 'A sua inscrição ainda não foi confirmada pelo organizador.',
  'ranking.title': 'Classificação',
  'ranking.empty': 'Ainda não há jogadores.',
  'ranking.exact': 'exatos',
  'fixture.open': 'Aberto',
  'fixture.closed': 'Fechado',
  'points.exact': 'Placar exato',
  'points.winner': 'Acertar o vencedor',
  'points.goalDiff': 'Acertar o saldo de gols',
  'points.teamScore': 'Por cada time cujos gols você acertar',
  'points.drawBonus': 'Bônus por cravar um empate',
  'branding.poweredBy': 'Powered by QuinielaBOX',
};

const MESSAGES: Record<Locale, Messages> = { es, en, pt };

/**
 * Traductor para un idioma. Si falta una clave cae al español y, si tampoco
 * está, devuelve la propia clave: una cadena sin traducir se ve fea, pero es
 * mejor que una pantalla en blanco.
 */
export function translator(locale: Locale): (key: string) => string {
  const dict = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  return (key: string) => dict[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
}

/** Claves sin traducir en algún idioma. Lo usa un test para que no se olviden. */
export function missingKeys(locale: Locale): string[] {
  const base = Object.keys(MESSAGES[DEFAULT_LOCALE]);
  const dict = MESSAGES[locale];
  return base.filter((k) => !(k in dict));
}

/** Formateo de fecha/hora por idioma. No toca lib/format.ts de PADELBOX. */
export function formatDateTimeIn(locale: Locale, date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export function formatCurrencyIn(locale: Locale, amount: number, currency: string): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency,
  }).format(amount);
}

function localeTag(locale: Locale): string {
  return locale === 'es' ? 'es-ES' : locale === 'pt' ? 'pt-BR' : 'en-US';
}
