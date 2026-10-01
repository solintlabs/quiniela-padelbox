import { describe, it, expect } from 'vitest';
import {
  membershipScope,
  competitionScope,
  teamScope,
  fixtureScope,
  entryScope,
} from '@/lib/saas/scope';

/**
 * El fallo que hunde un SaaS multi-tenant es servirle a un comercio los datos
 * de otro. Estos tests no tocan la DB: comprueban que el filtro generado lleva
 * SIEMPRE el acotado por tenant y que nada de lo que pase el llamador puede
 * quitarlo.
 */

/** Todas las condiciones sueltas dentro de los AND anidados. */
function flatten(where: unknown): unknown[] {
  if (Array.isArray(where)) return where.flatMap(flatten);
  if (where && typeof where === 'object') {
    const obj = where as Record<string, unknown>;
    if ('AND' in obj) return flatten(obj.AND);
    return [obj];
  }
  return [];
}

/** ¿Existe una condición que ate el resultado a este tenant? */
function bindsTenant(where: unknown, tenantId: string): boolean {
  return flatten(where).some((c) => JSON.stringify(c).includes(`"${tenantId}"`));
}

const TENANT = 'tenant-padelbox';
const OTHER = 'tenant-rival';

const SCOPES = [
  ['membershipScope', membershipScope],
  ['competitionScope', competitionScope],
  ['teamScope', teamScope],
  ['fixtureScope', fixtureScope],
  ['entryScope', entryScope],
] as const;

describe.each(SCOPES)('%s', (_name, scope) => {
  it('ata la consulta al tenant sin filtro extra', () => {
    const where = scope(TENANT);
    expect(bindsTenant(where, TENANT)).toBe(true);
  });

  it('sigue atada al tenant con un filtro extra normal', () => {
    const where = scope(TENANT, { id: 'algo' });
    expect(bindsTenant(where, TENANT)).toBe(true);
  });

  it('un extra que trae su propio tenantId NO reemplaza el acotado', () => {
    // Caso hostil: alguien construye el filtro con el tenant de otro.
    const where = scope(TENANT, { tenantId: OTHER } as never);
    // El acotado legítimo sigue presente: el AND deja la consulta imposible
    // de satisfacer en vez de devolver datos ajenos.
    expect(bindsTenant(where, TENANT)).toBe(true);
  });

  it('no cuela el tenant ajeno cuando no se pide', () => {
    const where = scope(TENANT);
    expect(bindsTenant(where, OTHER)).toBe(false);
  });
});

describe('entryScope', () => {
  it('exige tenant por partida doble: membership Y competición del partido', () => {
    const conditions = flatten(entryScope(TENANT)).map((c) => JSON.stringify(c));
    expect(conditions).toContain(JSON.stringify({ membership: { tenantId: TENANT } }));
    expect(conditions).toContain(
      JSON.stringify({ fixture: { competition: { tenantId: TENANT } } }),
    );
  });
});
