import { describe, it, expect } from 'vitest';
import { buildMobileConfig } from '@/lib/saas/mobileConfig';
import { PLANS } from '@/lib/saas/plans';

const SITE = 'https://www.quinielabox.com';

describe('buildMobileConfig', () => {
  it('expone los tres planes en orden FREE → PRO → CUSTOM', () => {
    const config = buildMobileConfig({ siteUrl: SITE, upgradeFlag: undefined });
    expect(config.plans.map((p) => p.id)).toEqual(['FREE', 'PRO', 'CUSTOM']);
    expect(config.plans[1].priceUsd).toBe(PLANS.PRO.priceUsd);
    expect(config.plans[1].season).toEqual(PLANS.PRO.season);
  });

  it('convierte Infinity a null (JSON no lo representa)', () => {
    const config = buildMobileConfig({ siteUrl: SITE, upgradeFlag: undefined });
    const custom = config.plans.find((p) => p.id === 'CUSTOM')!;
    expect(custom.limits.maxPlayers).toBeNull();
    expect(custom.limits.maxCompetitions).toBeNull();
    // Y los finitos quedan como números normales.
    const free = config.plans.find((p) => p.id === 'FREE')!;
    expect(free.limits.maxPlayers).toBe(PLANS.FREE.limits.maxPlayers);
  });

  it('el botón de Pro está encendido por defecto y solo "false" lo apaga', () => {
    expect(buildMobileConfig({ siteUrl: SITE, upgradeFlag: undefined }).upgrade.enabled).toBe(true);
    expect(buildMobileConfig({ siteUrl: SITE, upgradeFlag: 'true' }).upgrade.enabled).toBe(true);
    expect(buildMobileConfig({ siteUrl: SITE, upgradeFlag: 'false' }).upgrade.enabled).toBe(false);
  });

  it('las plantillas de URL apuntan a la web y toleran la barra final', () => {
    const config = buildMobileConfig({ siteUrl: `${SITE}/`, upgradeFlag: undefined });
    expect(config.upgrade.urlTemplate).toBe(`${SITE}/saas/{slug}/panel`);
    expect(config.inscriptionUrlTemplate).toBe(`${SITE}/saas/{slug}/inscripcion`);
  });

  it('todo el shape sobrevive a JSON.stringify sin perder información', () => {
    const config = buildMobileConfig({ siteUrl: SITE, upgradeFlag: undefined });
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });
});
