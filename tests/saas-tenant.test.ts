import { describe, it, expect } from 'vitest';
import {
  normalizeSlug,
  isValidSlug,
  RESERVED_SLUGS,
  SLUG_MAX_LENGTH,
} from '@/lib/saas/slug';
import { hasAtLeastRole, canManageCompetition, canManageBilling } from '@/lib/saas/roles';
import { isTenantAccessible } from '@/lib/saas/tenant';

describe('normalizeSlug', () => {
  it('convierte un nombre de club real en slug', () => {
    expect(normalizeSlug('Club Padelista del Este')).toBe('club-padelista-del-este');
  });

  it('quita acentos y eñes', () => {
    expect(normalizeSlug('Peña Fútbol Ñuñoa')).toBe('pena-futbol-nunoa');
  });

  it('colapsa separadores y signos', () => {
    expect(normalizeSlug('  El  Bar!! de -- Juan  ')).toBe('el-bar-de-juan');
  });

  it('no deja guiones colgando al recortar por longitud', () => {
    const slug = normalizeSlug('a'.repeat(SLUG_MAX_LENGTH - 1) + ' palabra');
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('es idempotente', () => {
    const once = normalizeSlug('Club Padelista del Este');
    expect(normalizeSlug(once)).toBe(once);
  });
});

describe('isValidSlug', () => {
  it.each(['padelbox-club', 'bar123', 'abc'])('acepta %o', (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each([
    ['ab', 'demasiado corto'],
    ['-club', 'empieza por guion'],
    ['club-', 'acaba en guion'],
    ['Club', 'mayusculas'],
    ['mi_club', 'guion bajo'],
    ['mi club', 'espacio'],
    ['peña', 'caracter no ascii'],
    ['a'.repeat(SLUG_MAX_LENGTH + 1), 'demasiado largo'],
  ])('rechaza %o (%s)', (slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });

  it('rechaza los slugs reservados', () => {
    for (const reserved of RESERVED_SLUGS) {
      expect(isValidSlug(reserved)).toBe(false);
    }
  });

  it('rechaza "nueva" para que nadie secuestre la ruta de onboarding', () => {
    expect(isValidSlug('nueva')).toBe(false);
  });
});

describe('jerarquía de roles', () => {
  it('OWNER puede todo lo de ADMIN, y ADMIN todo lo de PLAYER', () => {
    expect(hasAtLeastRole('OWNER', 'ADMIN')).toBe(true);
    expect(hasAtLeastRole('OWNER', 'PLAYER')).toBe(true);
    expect(hasAtLeastRole('ADMIN', 'PLAYER')).toBe(true);
  });

  it('un PLAYER no alcanza roles superiores', () => {
    expect(hasAtLeastRole('PLAYER', 'ADMIN')).toBe(false);
    expect(hasAtLeastRole('PLAYER', 'OWNER')).toBe(false);
    expect(hasAtLeastRole('ADMIN', 'OWNER')).toBe(false);
  });

  it('gestionar la competición requiere ADMIN', () => {
    expect(canManageCompetition('OWNER')).toBe(true);
    expect(canManageCompetition('ADMIN')).toBe(true);
    expect(canManageCompetition('PLAYER')).toBe(false);
  });

  it('la facturación es solo del OWNER: un ADMIN invitado no cambia lo que se cobra', () => {
    expect(canManageBilling('OWNER')).toBe(true);
    expect(canManageBilling('ADMIN')).toBe(false);
    expect(canManageBilling('PLAYER')).toBe(false);
  });
});

describe('isTenantAccessible', () => {
  it('deja pasar a los operativos', () => {
    expect(isTenantAccessible('TRIAL')).toBe(true);
    expect(isTenantAccessible('ACTIVE')).toBe(true);
  });

  it('no corta la quiniela por un impago: castigaría a los jugadores', () => {
    expect(isTenantAccessible('PAYMENT_FAILED')).toBe(true);
  });

  it('bloquea lead, suspendido y cancelado', () => {
    expect(isTenantAccessible('LEAD')).toBe(false);
    expect(isTenantAccessible('SUSPENDED')).toBe(false);
    expect(isTenantAccessible('CANCELLED')).toBe(false);
  });
});
