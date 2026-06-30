import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchRegulationScore } from '@/lib/providers/espn';

/**
 * Regresión del scoring de eliminatorias a 90'. El riesgo: ESPN reporta la
 * prórroga y la tanda de penaltis como periodos extra de linescores. El cálculo
 * a 90' (periodos 1+2) debe ser inmune a lo que pase después del minuto 90, y el
 * total (que el llamador usa como sanity check contra el marcador final de ESPN)
 * debe excluir la tanda de penaltis — si no, el partido no se puntúa jamás.
 */

type Period = { displayValue: string };
function mockEspn(opts: {
  statusName: string;
  home: Period[];
  away: Period[];
}) {
  const body = {
    header: {
      competitions: [
        {
          status: { type: { name: opts.statusName } },
          competitors: [
            { homeAway: 'home', linescores: opts.home },
            { homeAway: 'away', linescores: opts.away },
          ],
        },
      ],
    },
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => body }) as unknown as Response),
  );
}

afterEach(() => vi.unstubAllGlobals());

const P = (...vals: number[]): Period[] => vals.map((v) => ({ displayValue: String(v) }));

describe('fetchRegulationScore() — eliminatorias a 90\'', () => {
  it('partido normal (decidido en 90\'): total = 90\'', async () => {
    mockEspn({ statusName: 'STATUS_FULL_TIME', home: P(2, 0), away: P(0, 1) });
    expect(await fetchRegulationScore('fifa.world', 1)).toEqual({
      home: 2,
      away: 1,
      totalHome: 2,
      totalAway: 1,
    });
  });

  it('penaltis: el 90\' ignora prórroga y tanda; el total excluye la tanda', async () => {
    // Caso real Alemania 1-1 Paraguay (Paraguay gana 4-3 en penales).
    // home: 1ªP 0, 2ªP 1, ET 0+0, PENALES 3 → 90'=1, total goles=1 (sin penales).
    mockEspn({ statusName: 'STATUS_FINAL_PEN', home: P(0, 1, 0, 0, 3), away: P(1, 0, 0, 0, 4) });
    expect(await fetchRegulationScore('fifa.world', 2)).toEqual({
      home: 1,
      away: 1,
      totalHome: 1, // <- sin el 3 de la tanda; cuadra con el 1-1 final de ESPN
      totalAway: 1, // <- sin el 4 de la tanda
    });
  });

  it('prórroga con goles (sin penaltis): 90\' < final, total = final', async () => {
    // 1-1 a los 90', 2-1 en la prórroga. El 90' (lo que puntúa) es 1-1; el total
    // (2-1) cuadra con el marcador final de ESPN para el sanity check.
    mockEspn({ statusName: 'STATUS_FINAL_AET', home: P(0, 1, 1, 0), away: P(1, 0, 0, 0) });
    expect(await fetchRegulationScore('fifa.world', 3)).toEqual({
      home: 1,
      away: 1,
      totalHome: 2,
      totalAway: 1,
    });
  });

  it('sin desglose fiable (menos de 2 periodos) → null', async () => {
    mockEspn({ statusName: 'STATUS_FULL_TIME', home: P(1), away: P(0) });
    expect(await fetchRegulationScore('fifa.world', 4)).toBeNull();
  });
});
