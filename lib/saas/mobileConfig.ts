import { PLANS, type PlanLimits } from '@/lib/saas/plans';
import type { TenantPlan } from '@prisma/client';

/**
 * Config que consume la app móvil al arrancar: los planes (para la pantalla
 * de precios), el interruptor remoto del botón "Subir a Pro" y las plantillas
 * de URL hacia la web ({slug} se sustituye en el cliente).
 *
 * El interruptor existe porque el link de pago externo está permitido en el
 * storefront de EEUU pero un revisor puede objetarlo: apagar el botón debe
 * costar un cambio de env + redeploy, nunca un build nuevo de la app.
 *
 * Puro y sin DB para poder testearlo; la ruta API le pasa el env real.
 */

export interface MobilePlanLimits {
  /** null = sin límite (JSON no representa Infinity). */
  maxPlayers: number | null;
  maxCompetitions: number | null;
  espnCatalog: boolean;
  removeBranding: boolean;
  showsAds: boolean;
}

export interface MobilePlan {
  id: TenantPlan;
  name: string;
  priceUsd: number | null;
  period: 'mes' | 'torneo' | null;
  tagline: string;
  season: { priceUsd: number; months: number; label: string; note: string } | null;
  limits: MobilePlanLimits;
}

/** Tarjeta de plan LISTA PARA PINTAR en la app (Pro Temporada y Pro Mensual
 *  son tarjetas separadas: convierte mejor que una tarjeta con letra pequeña). */
export interface MobileDisplayPlan {
  id: 'FREE' | 'PRO_SEASON' | 'PRO_MONTHLY' | 'CUSTOM';
  planId: TenantPlan;
  name: string;
  priceBig: string;
  priceSub: string;
  tagline: string;
  features: string[];
  recommended: boolean;
  /** Puede abrir el checkout (los Pro). */
  upgradable: boolean;
}

export interface MobileConfig {
  plans: MobilePlan[];
  /** Presente desde 2026-08-01; los clientes viejos siguen usando `plans`. */
  displayPlans: MobileDisplayPlan[];
  upgrade: {
    enabled: boolean;
    /** Panel del organizador, donde vive el botón de checkout. */
    urlTemplate: string;
  };
  /** Página pública con la cuota y los métodos de pago del bote. */
  inscriptionUrlTemplate: string;
}

function features(limits: PlanLimits): string[] {
  const players =
    limits.maxPlayers === Number.POSITIVE_INFINITY
      ? 'Jugadores ilimitados'
      : `Hasta ${limits.maxPlayers} jugadores`;
  const comps =
    limits.maxCompetitions === Number.POSITIVE_INFINITY
      ? 'Competiciones ilimitadas'
      : `${limits.maxCompetitions} competición${limits.maxCompetitions === 1 ? '' : 'es'} a la vez`;
  return [
    players,
    comps,
    limits.showsAds ? 'Con anuncios' : 'Sin anuncios',
    limits.removeBranding ? 'Tu marca, tu color y tu logo' : 'Marca QuinielaBOX',
  ];
}

function finiteOrNull(n: number): number | null {
  return Number.isFinite(n) ? n : null;
}

function toMobileLimits(limits: PlanLimits): MobilePlanLimits {
  return {
    maxPlayers: finiteOrNull(limits.maxPlayers),
    maxCompetitions: finiteOrNull(limits.maxCompetitions),
    espnCatalog: limits.espnCatalog,
    removeBranding: limits.removeBranding,
    showsAds: limits.showsAds,
  };
}

export function buildMobileConfig(options: {
  siteUrl: string;
  /** Valor crudo de MOBILE_UPGRADE_ENABLED. Solo "false" apaga el botón. */
  upgradeFlag: string | undefined;
}): MobileConfig {
  const site = options.siteUrl.replace(/\/+$/, '');
  const season = PLANS.PRO.season;
  return {
    plans: (['FREE', 'PRO', 'CUSTOM'] as const).map((id) => {
      const plan = PLANS[id];
      return {
        id: plan.id,
        name: plan.name,
        priceUsd: plan.priceUsd,
        period: plan.period,
        tagline: plan.tagline,
        season: plan.season ?? null,
        limits: toMobileLimits(plan.limits),
      };
    }),
    displayPlans: [
      {
        id: 'FREE',
        planId: 'FREE',
        name: PLANS.FREE.name,
        priceBig: 'Gratis',
        priceSub: 'para siempre',
        tagline: PLANS.FREE.tagline,
        features: features(PLANS.FREE.limits),
        recommended: false,
        upgradable: false,
      },
      ...(season
        ? [
            {
              id: 'PRO_SEASON' as const,
              planId: 'PRO' as const,
              name: 'Pro Temporada',
              priceBig: `$${season.priceUsd}`,
              priceSub: 'pago único · todo el torneo',
              tagline: 'Un pago y listo: cubre el torneo de principio a fin.',
              features: features(PLANS.PRO.limits),
              recommended: true,
              upgradable: true,
            },
          ]
        : []),
      {
        id: 'PRO_MONTHLY',
        planId: 'PRO',
        name: 'Pro Mensual',
        priceBig: `$${PLANS.PRO.priceUsd}`,
        priceSub: 'al mes · cancela cuando quieras',
        tagline: 'Para quinielas que no paran en todo el año.',
        features: features(PLANS.PRO.limits),
        recommended: false,
        upgradable: true,
      },
      {
        id: 'CUSTOM',
        planId: 'CUSTOM',
        name: PLANS.CUSTOM.name,
        priceBig: 'A medida',
        priceSub: 'white-label y soporte directo',
        tagline: PLANS.CUSTOM.tagline,
        features: features(PLANS.CUSTOM.limits),
        recommended: false,
        upgradable: false,
      },
    ],
    upgrade: {
      enabled: options.upgradeFlag !== 'false',
      urlTemplate: `${site}/saas/{slug}/panel`,
    },
    inscriptionUrlTemplate: `${site}/saas/{slug}/inscripcion`,
  };
}
