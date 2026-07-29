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

export interface MobileConfig {
  plans: MobilePlan[];
  upgrade: {
    enabled: boolean;
    /** Panel del organizador, donde vive el botón de checkout. */
    urlTemplate: string;
  };
  /** Página pública con la cuota y los métodos de pago del bote. */
  inscriptionUrlTemplate: string;
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
    upgrade: {
      enabled: options.upgradeFlag !== 'false',
      urlTemplate: `${site}/saas/{slug}/panel`,
    },
    inscriptionUrlTemplate: `${site}/saas/{slug}/inscripcion`,
  };
}
