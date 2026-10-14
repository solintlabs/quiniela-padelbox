import { describe, it, expect } from 'vitest';
import { parseFixturesCsv, csvTemplate, CSV_MAX_ROWS } from '@/lib/saas/csv';
import {
  fixturePatchFor,
  syncWindow,
  SYNC_WINDOW_DAYS_BACK,
  SYNC_WINDOW_DAYS_AHEAD,
} from '@/lib/saas/sync';

describe('parseFixturesCsv', () => {
  it('parsea el caso normal y deduplica equipos en orden de aparición', () => {
    const csv = [
      'fecha_hora_utc,equipo_local,equipo_visitante,fase',
      '2026-08-15T18:00:00Z,Los Pibes,Ferretería FC,Jornada 1',
      '2026-08-22T18:00:00Z,Ferretería FC,Los Pibes,Jornada 2',
    ].join('\n');

    const r = parseFixturesCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(2);
    expect(r.teams).toEqual(['Los Pibes', 'Ferretería FC']);
    expect(r.rows[0].kickoff.toISOString()).toBe('2026-08-15T18:00:00.000Z');
    expect(r.rows[0].round).toBe('Jornada 1');
  });

  it('acepta la plantilla que le damos al organizador', () => {
    const r = parseFixturesCsv(csvTemplate());
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(2);
  });

  it('la columna fase es opcional', () => {
    const csv = [
      'fecha_hora_utc,equipo_local,equipo_visitante',
      '2026-08-15T18:00:00Z,A FC,B FC',
    ].join('\n');
    const r = parseFixturesCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows[0].round).toBeNull();
  });

  it('respeta comillas: un equipo puede llevar coma en el nombre', () => {
    const csv = [
      'fecha_hora_utc,equipo_local,equipo_visitante',
      '2026-08-15T18:00:00Z,"Deportivo Los Andes, B",Bar Manolo',
    ].join('\n');
    const r = parseFixturesCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows[0].homeTeam).toBe('Deportivo Los Andes, B');
  });

  it('aguanta el BOM de Excel y el punto y coma como separador', () => {
    const csv = '﻿fecha_hora_utc;equipo_local;equipo_visitante\n2026-08-15T18:00:00Z;A FC;B FC';
    const r = parseFixturesCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(1);
  });

  it('avisa de la columna que falta, con su número de línea', () => {
    const r = parseFixturesCsv('fecha_hora_utc,equipo_local\n2026-08-15T18:00:00Z,A FC');
    expect(r.errors[0].message).toContain('equipo_visitante');
    expect(r.rows).toHaveLength(0);
  });

  it('señala la fila con fecha inválida y sigue con las buenas', () => {
    const csv = [
      'fecha_hora_utc,equipo_local,equipo_visitante',
      '15/08/2026,A FC,B FC',
      '2026-08-16T18:00:00Z,C FC,D FC',
    ].join('\n');
    const r = parseFixturesCsv(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].line).toBe(2);
    expect(r.errors[0].message).toContain('Fecha inválida');
  });

  it('rechaza un equipo jugando contra sí mismo', () => {
    const csv = [
      'fecha_hora_utc,equipo_local,equipo_visitante',
      '2026-08-15T18:00:00Z,A FC,a fc',
    ].join('\n');
    const r = parseFixturesCsv(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].message).toContain('sí mismo');
  });

  it('ignora líneas en blanco intercaladas', () => {
    const csv = [
      'fecha_hora_utc,equipo_local,equipo_visitante',
      '2026-08-15T18:00:00Z,A FC,B FC',
      '',
      '   ',
      '2026-08-16T18:00:00Z,C FC,D FC',
    ].join('\n');
    expect(parseFixturesCsv(csv).rows).toHaveLength(2);
  });

  it('corta y avisa si el fichero trae demasiadas filas', () => {
    const lines = ['fecha_hora_utc,equipo_local,equipo_visitante'];
    for (let i = 0; i < CSV_MAX_ROWS + 10; i++) {
      lines.push(`2026-08-15T18:00:00Z,Equipo ${i}A,Equipo ${i}B`);
    }
    const r = parseFixturesCsv(lines.join('\n'));
    expect(r.rows).toHaveLength(CSV_MAX_ROWS);
    expect(r.errors.some((e) => e.message.includes('Demasiadas filas'))).toBe(true);
  });

  it('un fichero vacío da error en vez de romper', () => {
    expect(parseFixturesCsv('').errors[0].message).toContain('vacío');
    expect(parseFixturesCsv('   \n  \n').errors[0].message).toContain('vacío');
  });

  it('una cabecera sola sin partidos avisa', () => {
    const r = parseFixturesCsv('fecha_hora_utc,equipo_local,equipo_visitante');
    expect(r.errors[0].message).toContain('ninguna fila');
  });
});

describe('fixturePatchFor', () => {
  const incoming = {
    kickoff: new Date('2026-08-15T18:00:00Z'),
    round: 'Jornada 1',
    homeTeamId: 'home-1',
    awayTeamId: 'away-1',
    homeScore: 2,
    awayScore: 1,
    status: 'FINISHED' as const,
  };

  it('en un partido normal acepta marcador y estado del proveedor', () => {
    const patch = fixturePatchFor(
      { manualResult: false, scoredAt: null, status: 'SCHEDULED' },
      incoming,
    );
    expect(patch.homeScore).toBe(2);
    expect(patch.status).toBe('FINISHED');
  });

  it('NO pisa un resultado que el organizador fijó a mano', () => {
    const patch = fixturePatchFor(
      { manualResult: true, scoredAt: null, status: 'FINISHED' },
      incoming,
    );
    expect(patch).not.toHaveProperty('homeScore');
    expect(patch).not.toHaveProperty('status');
    // El calendario sí se actualiza: cambiar la hora no altera la puntuación.
    expect(patch.kickoff).toEqual(incoming.kickoff);
  });

  it('NO degrada a SCHEDULED un partido ya puntuado por un hipo de ESPN', () => {
    const patch = fixturePatchFor(
      { manualResult: false, scoredAt: new Date(), status: 'FINISHED' },
      { ...incoming, status: 'SCHEDULED', homeScore: null, awayScore: null },
    );
    expect(patch).not.toHaveProperty('status');
    expect(patch).not.toHaveProperty('homeScore');
  });

  it('sí corrige el marcador de un partido puntuado si sigue finalizado', () => {
    // ESPN rectificando un gol mal asignado: eso sí hay que aceptarlo.
    const patch = fixturePatchFor(
      { manualResult: false, scoredAt: new Date(), status: 'FINISHED' },
      { ...incoming, homeScore: 3 },
    );
    expect(patch.homeScore).toBe(3);
  });
});

describe('syncWindow', () => {
  it('mira unos días atrás y algo más adelante', () => {
    const now = new Date('2026-08-15T12:00:00Z');
    const w = syncWindow(now);
    expect(w.start.getTime()).toBeLessThan(now.getTime());
    expect(w.end.getTime()).toBeGreaterThan(now.getTime());
    const days = (w.end.getTime() - w.start.getTime()) / 86_400_000;
    expect(days).toBe(SYNC_WINDOW_DAYS_BACK + SYNC_WINDOW_DAYS_AHEAD);
  });

  it('mira bastante hacia delante, para que una liga en descanso no deje la quiniela vacía', () => {
    // Con 10 días, crear una quiniela de LALIGA en julio (arranca en agosto)
    // importaba CERO partidos y el organizador no veía nada.
    expect(SYNC_WINDOW_DAYS_AHEAD).toBeGreaterThanOrEqual(30);
  });
});
