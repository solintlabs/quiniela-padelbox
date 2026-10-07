import { describe, it, expect } from 'vitest';
import { applyStripeEvent, isTrialActive, trialDaysLeft } from '@/lib/saas/billing';
import { isTenantAccessible } from '@/lib/saas/tenant';
import {
  resolveLocale,
  translator,
  missingKeys,
  LOCALES,
  formatDateTimeIn,
  formatCurrencyIn,
} from '@/lib/saas/i18n';
import {
  PLANS,
  canAddPlayer,
  canAddCompetition,
  canUseEspnCatalog,
  showsAds,
  showsBranding,
} from '@/lib/saas/plans';

describe('applyStripeEvent', () => {
  const trial = { status: 'TRIAL' as const, plan: 'FREE' as const };

  it('el pago del checkout activa el comercio con su plan nuevo', () => {
    expect(applyStripeEvent(trial, 'checkout.session.completed', 'PRO')).toEqual({
      status: 'ACTIVE',
      plan: 'PRO',
    });
  });

  it('un impago NO suspende: deja la quiniela funcionando', () => {
    // Cortar el torneo a mitad por una tarjeta caducada castiga a los
    // jugadores y garantiza que el organizador no renueve.
    const active = { status: 'ACTIVE' as const, plan: 'PRO' as const };
    expect(applyStripeEvent(active, 'invoice.payment_failed')).toEqual({
      status: 'PAYMENT_FAILED',
      plan: 'PRO',
    });
  });

  it('cobrar de nuevo recupera el estado', () => {
    const failed = { status: 'PAYMENT_FAILED' as const, plan: 'PRO' as const };
    expect(applyStripeEvent(failed, 'invoice.payment_succeeded').status).toBe('ACTIVE');
  });

  it('un cambio de plan durante un impago no da el impago por resuelto', () => {
    const failed = { status: 'PAYMENT_FAILED' as const, plan: 'PRO' as const };
    const next = applyStripeEvent(failed, 'customer.subscription.updated', 'CUSTOM');
    expect(next.status).toBe('PAYMENT_FAILED');
    expect(next.plan).toBe('CUSTOM');
  });

  it('cancelar cae a plan gratuito pero la quiniela sigue abierta (accesible)', () => {
    // Cancelar Pro NO debe cerrar la quiniela: status ACTIVE (accesible), no
    // CANCELLED (que 404ea). Los jugadores siguen jugando en el plan gratis.
    const active = { status: 'ACTIVE' as const, plan: 'PRO' as const };
    const next = applyStripeEvent(active, 'customer.subscription.deleted');
    expect(next).toEqual({ status: 'ACTIVE', plan: 'FREE' });
    expect(isTenantAccessible(next.status)).toBe(true);
  });
});

describe('periodo de prueba', () => {
  const now = new Date('2026-07-20T12:00:00Z');

  it('sigue activo antes de vencer', () => {
    expect(isTrialActive('TRIAL', new Date('2026-08-01T00:00:00Z'), now)).toBe(true);
  });

  it('deja de estarlo al vencer', () => {
    expect(isTrialActive('TRIAL', new Date('2026-07-01T00:00:00Z'), now)).toBe(false);
  });

  it('no aplica a un comercio ya activo', () => {
    expect(isTrialActive('ACTIVE', new Date('2026-08-01T00:00:00Z'), now)).toBe(false);
  });

  it('cuenta los días que faltan para el aviso del panel', () => {
    expect(trialDaysLeft('TRIAL', new Date('2026-07-25T12:00:00Z'), now)).toBe(5);
    expect(trialDaysLeft('TRIAL', new Date('2026-07-01T00:00:00Z'), now)).toBe(0);
    expect(trialDaysLeft('ACTIVE', new Date('2026-07-25T00:00:00Z'), now)).toBeNull();
  });
});

describe('límites por plan', () => {
  it('el plan gratuito tiene tope de jugadores', () => {
    // El tope se lee del plan, no se fija en el test: así subirlo (15 → 25) no
    // obliga a tocar el aserto.
    const max = PLANS.FREE.limits.maxPlayers;
    expect(canAddPlayer('FREE', max - 1).allowed).toBe(true);
    const full = canAddPlayer('FREE', max);
    expect(full.allowed).toBe(false);
    expect(full.message).toContain(String(max));
  });

  it('todos los planes llegan al catálogo de ligas (manual solo no bastaba)', () => {
    // El catálogo ESPN se habilitó también en FREE: la entrada manual sola no
    // permitía arrancar una quiniela real.
    expect(canUseEspnCatalog('FREE').allowed).toBe(true);
    expect(canUseEspnCatalog('PRO').allowed).toBe(true);
  });

  it('el plan a medida no tiene topes', () => {
    expect(canAddPlayer('CUSTOM', 100_000).allowed).toBe(true);
    expect(canAddCompetition('CUSTOM', 999).allowed).toBe(true);
  });

  it('los anuncios y el "Powered by" solo aparecen en el plan gratuito', () => {
    expect(showsAds('FREE')).toBe(true);
    expect(showsAds('PRO')).toBe(false);
    expect(showsBranding('FREE')).toBe(true);
    expect(showsBranding('PRO')).toBe(false);
  });
});

describe('resolveLocale', () => {
  it('el usuario manda por encima de todo', () => {
    expect(resolveLocale({ user: 'pt', tenant: 'es', acceptLanguage: 'en-US' })).toBe('pt');
  });

  it('sin preferencia del usuario, manda el comercio', () => {
    expect(resolveLocale({ tenant: 'en', acceptLanguage: 'es-ES' })).toBe('en');
  });

  it('si no, el idioma del dispositivo', () => {
    expect(resolveLocale({ acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8' })).toBe('pt');
  });

  it('ante un idioma que no soportamos, español', () => {
    expect(resolveLocale({ acceptLanguage: 'de-DE,fr;q=0.9' })).toBe('es');
    expect(resolveLocale({})).toBe('es');
  });

  it('ignora valores inválidos en vez de romper', () => {
    expect(resolveLocale({ user: 'klingon', tenant: 'xx' })).toBe('es');
  });
});

describe('traducciones', () => {
  it('ningún idioma tiene claves sin traducir', () => {
    for (const locale of LOCALES) {
      expect(missingKeys(locale)).toEqual([]);
    }
  });

  it('traduce y cae al español ante una clave desconocida', () => {
    expect(translator('en')('ranking.title')).toBe('Standings');
    expect(translator('pt')('invite.cta')).toBe('Participar');
    // Clave inexistente: devuelve la clave, no una pantalla vacía.
    expect(translator('en')('clave.que.no.existe')).toBe('clave.que.no.existe');
  });

  it('formatea fechas y moneda según el idioma', () => {
    const date = new Date('2026-08-15T18:00:00Z');
    const es = formatDateTimeIn('es', date, 'UTC');
    const en = formatDateTimeIn('en', date, 'UTC');
    expect(es).not.toBe(en);
    expect(formatCurrencyIn('en', 29, 'USD')).toContain('29');
  });
});
