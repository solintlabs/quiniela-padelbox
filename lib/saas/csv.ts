/**
 * Import de partidos por CSV, para competiciones que ESPN no cubre (la liga
 * del barrio, un torneo interno del club).
 *
 * Formato esperado, con cabecera:
 *   fecha_hora_utc,equipo_local,equipo_visitante,fase
 *   2026-08-15T18:00:00Z,Los Pibes,Ferretería FC,Jornada 1
 *
 * `fase` es opcional. Todo puro: sin DB ni red, para poder enseñarle al
 * organizador exactamente qué se va a importar antes de tocar nada.
 */

export interface CsvFixtureRow {
  kickoff: Date;
  homeTeam: string;
  awayTeam: string;
  round: string | null;
}

export interface CsvParseResult {
  rows: CsvFixtureRow[];
  /** Errores por fila, con el número de línea del fichero original. */
  errors: Array<{ line: number; message: string }>;
  /** Equipos únicos detectados, en orden de aparición. */
  teams: string[];
}

const REQUIRED_HEADERS = ['fecha_hora_utc', 'equipo_local', 'equipo_visitante'] as const;
export const CSV_HEADERS = [...REQUIRED_HEADERS, 'fase'] as const;
export const CSV_MAX_ROWS = 2000;

/**
 * Parte una línea CSV respetando comillas dobles: un nombre de equipo puede
 * llevar coma ("Deportivo Los Andes, B").
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"'; // comilla escapada
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',' || char === ';') {
      out.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

export function parseFixturesCsv(raw: string): CsvParseResult {
  const result: CsvParseResult = { rows: [], errors: [], teams: [] };

  const lines = raw
    .replace(/^﻿/, '') // BOM que mete Excel
    .split(/\r?\n/)
    .map((l) => l.trim());

  const firstIndex = lines.findIndex((l) => l.length > 0);
  if (firstIndex === -1) {
    result.errors.push({ line: 1, message: 'El fichero está vacío.' });
    return result;
  }

  const headers = splitCsvLine(lines[firstIndex]).map((h) => h.toLowerCase());
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      result.errors.push({
        line: firstIndex + 1,
        message: `Falta la columna obligatoria "${required}".`,
      });
    }
  }
  if (result.errors.length > 0) return result;

  const col = {
    kickoff: headers.indexOf('fecha_hora_utc'),
    home: headers.indexOf('equipo_local'),
    away: headers.indexOf('equipo_visitante'),
    round: headers.indexOf('fase'),
  };

  const seenTeams = new Set<string>();

  for (let i = firstIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.length === 0) continue;

    const lineNumber = i + 1;
    if (result.rows.length >= CSV_MAX_ROWS) {
      result.errors.push({
        line: lineNumber,
        message: `Demasiadas filas (máximo ${CSV_MAX_ROWS}).`,
      });
      break;
    }

    const cells = splitCsvLine(line);
    const rawKickoff = cells[col.kickoff] ?? '';
    const homeTeam = cells[col.home] ?? '';
    const awayTeam = cells[col.away] ?? '';
    const round = col.round >= 0 ? (cells[col.round] ?? '').trim() : '';

    if (!homeTeam || !awayTeam) {
      result.errors.push({ line: lineNumber, message: 'Falta el equipo local o el visitante.' });
      continue;
    }
    if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
      result.errors.push({ line: lineNumber, message: 'Un equipo no puede jugar contra sí mismo.' });
      continue;
    }

    const kickoff = new Date(rawKickoff);
    if (!rawKickoff || Number.isNaN(kickoff.getTime())) {
      result.errors.push({
        line: lineNumber,
        message: `Fecha inválida: "${rawKickoff}". Usa el formato 2026-08-15T18:00:00Z.`,
      });
      continue;
    }

    result.rows.push({ kickoff, homeTeam, awayTeam, round: round || null });

    for (const team of [homeTeam, awayTeam]) {
      const key = team.toLowerCase();
      if (!seenTeams.has(key)) {
        seenTeams.add(key);
        result.teams.push(team);
      }
    }
  }

  if (result.rows.length === 0 && result.errors.length === 0) {
    result.errors.push({ line: firstIndex + 1, message: 'No hay ninguna fila de partidos.' });
  }

  return result;
}

/** Plantilla que se ofrece al organizador para descargar. */
export function csvTemplate(): string {
  return [
    CSV_HEADERS.join(','),
    '2026-08-15T18:00:00Z,Los Pibes,Ferretería FC,Jornada 1',
    '2026-08-15T20:30:00Z,Bar Manolo,Peña Ciclista,Jornada 1',
  ].join('\n');
}
