import { describe, it, expect } from 'vitest';
import {
  toEspnDate,
  monthlyRanges,
  mapEspnStatus,
  normalizeEvent,
  teamsFromFixtures,
  filterLeagues,
  type EspnLeague,
} from '@/lib/saas/providers/espn';

describe('toEspnDate', () => {
  it('formatea en UTC como YYYYMMDD', () => {
    expect(toEspnDate(new Date('2026-06-11T20:00:00Z'))).toBe('20260611');
  });

  it('rellena mes y día con cero', () => {
    expect(toEspnDate(new Date('2026-01-05T00:00:00Z'))).toBe('20260105');
  });

  it('usa UTC y no la zona local (una hora tardía no adelanta el día)', () => {
    expect(toEspnDate(new Date('2026-03-31T23:30:00Z'))).toBe('20260331');
  });
});

describe('monthlyRanges', () => {
  it('un rango dentro del mismo mes es un solo tramo', () => {
    const r = monthlyRanges(new Date('2026-06-01T00:00:00Z'), new Date('2026-06-30T00:00:00Z'));
    expect(r).toEqual([{ start: '20260601', end: '20260630' }]);
  });

  it('parte un rango de varios meses por final de mes', () => {
    const r = monthlyRanges(new Date('2026-06-11T00:00:00Z'), new Date('2026-08-03T00:00:00Z'));
    expect(r).toEqual([
      { start: '20260611', end: '20260630' },
      { start: '20260701', end: '20260731' },
      { start: '20260801', end: '20260803' },
    ]);
  });

  it('cubre una temporada de liga entera sin huecos ni solapes', () => {
    const r = monthlyRanges(new Date('2025-08-15T00:00:00Z'), new Date('2026-05-24T00:00:00Z'));
    expect(r.length).toBe(10);
    expect(r[0].start).toBe('20250815');
    expect(r[r.length - 1].end).toBe('20260524');
    // Cada tramo empieza justo al día siguiente del anterior.
    for (let i = 1; i < r.length; i++) {
      const prevEnd = new Date(
        `${r[i - 1].end.slice(0, 4)}-${r[i - 1].end.slice(4, 6)}-${r[i - 1].end.slice(6, 8)}T00:00:00Z`,
      );
      const expected = new Date(prevEnd.getTime() + 86_400_000);
      expect(r[i].start).toBe(toEspnDate(expected));
    }
  });

  it('gestiona el año bisiesto', () => {
    const r = monthlyRanges(new Date('2028-02-01T00:00:00Z'), new Date('2028-03-01T00:00:00Z'));
    expect(r[0]).toEqual({ start: '20280201', end: '20280229' });
  });

  it('un rango invertido no devuelve tramos', () => {
    expect(monthlyRanges(new Date('2026-06-10T00:00:00Z'), new Date('2026-06-01T00:00:00Z'))).toEqual([]);
  });

  it('el mismo día es un tramo de un día', () => {
    const d = new Date('2026-06-11T00:00:00Z');
    expect(monthlyRanges(d, d)).toEqual([{ start: '20260611', end: '20260611' }]);
  });
});

describe('mapEspnStatus', () => {
  it('reconoce los finales, incluidos prórroga y penaltis', () => {
    for (const s of ['STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_FINAL_PEN', 'STATUS_FINAL_AET']) {
      expect(mapEspnStatus(s)).toBe('FINISHED');
    }
  });

  it('reconoce los estados de partido en juego del fútbol', () => {
    // ESPN NO usa STATUS_IN_PROGRESS en fútbol: usa las mitades. Si se
    // ignoran, un partido en vivo cae a SCHEDULED y no se ve el marcador.
    for (const s of ['STATUS_FIRST_HALF', 'STATUS_SECOND_HALF', 'STATUS_HALFTIME', 'STATUS_PENALTIES']) {
      expect(mapEspnStatus(s)).toBe('LIVE');
    }
  });

  it('mapea aplazado y cancelado', () => {
    expect(mapEspnStatus('STATUS_POSTPONED')).toBe('POSTPONED');
    expect(mapEspnStatus('STATUS_CANCELED')).toBe('CANCELLED');
  });

  it('ante un estado desconocido se fía de state antes que de suponer', () => {
    expect(mapEspnStatus('STATUS_ALGO_NUEVO', 'in')).toBe('LIVE');
    expect(mapEspnStatus('STATUS_ALGO_NUEVO', 'post')).toBe('FINISHED');
    expect(mapEspnStatus('STATUS_ALGO_NUEVO', 'pre')).toBe('SCHEDULED');
    expect(mapEspnStatus(undefined)).toBe('SCHEDULED');
  });
});

/** Evento con la forma que devuelve el scoreboard de ESPN. */
function makeEvent(over: {
  id?: string;
  date?: string;
  statusName?: string;
  homeScore?: string;
  awayScore?: string;
  note?: string;
}) {
  return {
    id: over.id ?? '700123',
    date: over.date ?? '2026-06-11T20:00Z',
    status: { type: { name: over.statusName ?? 'STATUS_SCHEDULED', state: 'pre' } },
    competitions: [
      {
        notes: over.note ? [{ headline: over.note }] : [],
        competitors: [
          {
            homeAway: 'home',
            score: over.homeScore,
            team: {
              id: '83',
              displayName: 'Real Madrid',
              shortDisplayName: 'Madrid',
              abbreviation: 'RMA',
              logo: 'https://a.espncdn.com/rma.png',
            },
          },
          {
            homeAway: 'away',
            score: over.awayScore,
            team: {
              id: '86',
              displayName: 'Barcelona',
              shortDisplayName: 'Barça',
              abbreviation: 'BAR',
              logo: 'https://a.espncdn.com/bar.png',
            },
          },
        ],
      },
    ],
  };
}

describe('normalizeEvent', () => {
  it('normaliza un partido programado sin marcador', () => {
    const f = normalizeEvent(makeEvent({}));
    expect(f).not.toBeNull();
    expect(f!.externalId).toBe('700123');
    expect(f!.home.name).toBe('Real Madrid');
    expect(f!.away.espnId).toBe('86');
    expect(f!.status).toBe('SCHEDULED');
    expect(f!.homeScore).toBeNull();
    expect(f!.awayScore).toBeNull();
  });

  it('NO inventa un 0-0 antes del pitido inicial aunque ESPN mande "0"', () => {
    // Un 0-0 falso antes de empezar confunde al jugador y podría puntuarse
    // si el estado llegara mal.
    const f = normalizeEvent(makeEvent({ statusName: 'STATUS_SCHEDULED', homeScore: '0', awayScore: '0' }));
    expect(f!.homeScore).toBeNull();
    expect(f!.awayScore).toBeNull();
  });

  it('lee el marcador en vivo y al final', () => {
    const live = normalizeEvent(makeEvent({ statusName: 'STATUS_SECOND_HALF', homeScore: '2', awayScore: '1' }));
    expect(live!.status).toBe('LIVE');
    expect(live!.homeScore).toBe(2);

    const done = normalizeEvent(makeEvent({ statusName: 'STATUS_FULL_TIME', homeScore: '3', awayScore: '3' }));
    expect(done!.status).toBe('FINISHED');
    expect(done!.awayScore).toBe(3);
  });

  it('guarda la fase cuando ESPN la trae en notes', () => {
    const f = normalizeEvent(makeEvent({ note: 'Round of 16' }));
    expect(f!.round).toBe('Round of 16');
  });

  it('descarta eventos sin id, sin fecha, con fecha inválida o sin dos equipos', () => {
    expect(normalizeEvent({ ...makeEvent({}), id: undefined })).toBeNull();
    expect(normalizeEvent({ ...makeEvent({}), date: undefined })).toBeNull();
    expect(normalizeEvent({ ...makeEvent({}), date: 'no-es-fecha' })).toBeNull();
    expect(normalizeEvent({ ...makeEvent({}), competitions: [{ competitors: [] }] })).toBeNull();
  });
});

describe('teamsFromFixtures', () => {
  it('deduplica equipos por espnId a lo largo de varias jornadas', () => {
    const fixtures = [
      normalizeEvent(makeEvent({ id: '1' }))!,
      normalizeEvent(makeEvent({ id: '2' }))!,
    ];
    const teams = teamsFromFixtures(fixtures);
    expect(teams).toHaveLength(2);
    expect(teams.map((t) => t.espnId).sort()).toEqual(['83', '86']);
  });

  it('sin partidos no hay equipos', () => {
    expect(teamsFromFixtures([])).toEqual([]);
  });
});

describe('filterLeagues', () => {
  const leagues: EspnLeague[] = [
    { slug: 'esp.1', name: 'Spanish LALIGA', abbreviation: 'LALIGA', logoUrl: null, hasStandings: true },
    { slug: 'eng.1', name: 'English Premier League', abbreviation: 'PREM', logoUrl: null, hasStandings: true },
    { slug: 'conmebol.america', name: 'Copa América', abbreviation: null, logoUrl: null, hasStandings: false },
  ];

  it('busca por nombre sin distinguir mayúsculas', () => {
    expect(filterLeagues(leagues, 'premier').map((l) => l.slug)).toEqual(['eng.1']);
  });

  it('busca por slug', () => {
    expect(filterLeagues(leagues, 'esp.').map((l) => l.slug)).toEqual(['esp.1']);
  });

  it('busca por abreviatura y tolera abreviatura ausente', () => {
    expect(filterLeagues(leagues, 'laliga').map((l) => l.slug)).toEqual(['esp.1']);
  });

  it('una búsqueda vacía devuelve todo', () => {
    expect(filterLeagues(leagues, '   ')).toHaveLength(3);
  });
});
