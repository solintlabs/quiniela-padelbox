import { describe, it, expect, afterEach } from 'vitest';
import { isSaasEnabled, requireSaasEnabled } from '@/lib/saas/flags';

/**
 * El flag protege producción: si algún día se enciende por accidente (un typo
 * en Vercel, un valor heredado), PADELBOX expondría rutas a medio construir.
 * Por eso el default es cerrado y solo el literal "true" abre.
 */
const original = process.env.SAAS_ENABLED;

afterEach(() => {
  if (original === undefined) delete process.env.SAAS_ENABLED;
  else process.env.SAAS_ENABLED = original;
});

describe('isSaasEnabled', () => {
  it('está apagado si la variable no existe', () => {
    delete process.env.SAAS_ENABLED;
    expect(isSaasEnabled()).toBe(false);
  });

  it('solo se enciende con el literal "true"', () => {
    process.env.SAAS_ENABLED = 'true';
    expect(isSaasEnabled()).toBe(true);
  });

  it.each(['false', '1', 'yes', 'TRUE', '', 'si'])(
    'sigue apagado con el valor %o',
    (value) => {
      process.env.SAAS_ENABLED = value;
      expect(isSaasEnabled()).toBe(false);
    },
  );
});

describe('requireSaasEnabled', () => {
  it('devuelve 404 cuando el SaaS está apagado', async () => {
    delete process.env.SAAS_ENABLED;
    const res = requireSaasEnabled();
    expect(res).toBeInstanceOf(Response);
    expect(res?.status).toBe(404);
  });

  it('devuelve null cuando el SaaS está encendido', () => {
    process.env.SAAS_ENABLED = 'true';
    expect(requireSaasEnabled()).toBeNull();
  });
});
