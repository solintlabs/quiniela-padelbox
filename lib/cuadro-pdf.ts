import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import { prisma } from '@/lib/db';

const MUNDIAL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const KNOCKOUT_STAGES = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;
const STAGE_LABEL: Record<string, string> = {
  R32: '1/16 de final',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semifinales',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
};

/** Quita acentos/emoji para los fonts estándar de pdf-lib (WinAnsi). */
function ascii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

/** Trunca un nombre de equipo para que quepa en la columna estrecha. */
function shortTeam(s: string): string {
  const t = ascii(s);
  if (t.length <= 12) return t;
  return t.slice(0, 11) + '.';
}

/**
 * Detecta equipos "placeholder" de eliminatorias antes de que se defina el
 * bracket (ej. "Group A 2nd", "Round of 32", "Third Place", "Winner..."). No
 * queremos esos en el PDF hasta que haya selecciones reales.
 */
function isPlaceholderTeam(s: string): boolean {
  return /group\s|round of|third place|\bwinner\b|\brunner\b|\bwin\b|\bplace\b|\b\d(st|nd|rd|th)\b/i.test(s);
}

export interface CuadroPdfResult {
  bytes: Uint8Array;
  filename: string;
}

/**
 * Genera el PDF del cuadro de un usuario en 2 columnas (2 grupos por fila),
 * con cabecera de datos (nombre, email, teléfono, fecha de envío).
 * Nombre de archivo: "Fase de grupos - <nombre> - <fecha> - <email>.pdf".
 */
export async function buildCuadroPdf(userId: string): Promise<CuadroPdfResult | null> {
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, championPick: true },
  });
  if (!userRow) return null;
  const user = userRow;

  const matches = await prisma.match.findMany({
    where: { excludeFromScoring: false, group: { in: MUNDIAL_GROUPS } },
    orderBy: { kickoff: 'asc' },
    include: { predictions: { where: { userId }, select: { homeScore: true, awayScore: true } } },
  });
  const knockout = await prisma.match.findMany({
    where: { excludeFromScoring: false, stage: { in: [...KNOCKOUT_STAGES] } },
    orderBy: { kickoff: 'asc' },
    include: { predictions: { where: { userId }, select: { homeScore: true, awayScore: true } } },
  });

  type M = (typeof matches)[number];
  const blocks: Array<{ title: string; items: M[] }> = [];
  for (const g of MUNDIAL_GROUPS) {
    const gm = matches.filter((m) => m.group === g);
    if (gm.length > 0) blocks.push({ title: `Grupo ${g}`, items: gm });
  }
  for (const stage of KNOCKOUT_STAGES) {
    // Solo incluimos eliminatorias con equipos reales (bracket ya definido).
    const sm = knockout.filter(
      (m) =>
        m.stage === stage &&
        !isPlaceholderTeam(m.homeTeam) &&
        !isPlaceholderTeam(m.awayTeam),
    );
    if (sm.length > 0) blocks.push({ title: STAGE_LABEL[stage] ?? stage, items: sm });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595, H = 842, MARGIN = 40;
  const accent = rgb(0.36, 0.64, 0.12);
  const ink = rgb(0.12, 0.12, 0.12);
  const muted = rgb(0.45, 0.45, 0.45);
  const lineGrey = rgb(0.85, 0.85, 0.85);

  const COL_GAP = 26;
  const COL_W = (W - MARGIN * 2 - COL_GAP) / 2; // dos columnas
  const COL_X = [MARGIN, MARGIN + COL_W + COL_GAP];
  const ROW_H = 13;
  const TITLE_H = 17;
  const BLOCK_GAP = 12;

  const displayName = ascii(user.name ?? user.email.split('@')[0]);
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Caracas' });
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Caracas' });

  let page: PDFPage = pdf.addPage([W, H]);

  function drawHeader(p: PDFPage): number {
    let yy = H - MARGIN;
    p.drawText('QUINIELA PADELBOX x DELISH - MUNDIAL 2026', { x: MARGIN, y: yy, size: 9, font: fontBold, color: accent });
    yy -= 22;
    p.drawText(`Quiniela de ${displayName}`, { x: MARGIN, y: yy, size: 19, font: fontBold, color: ink });
    yy -= 16;
    const datos1 = ascii(`Email: ${user.email}${user.phone ? `   Tel: ${user.phone}` : ''}`);
    p.drawText(datos1, { x: MARGIN, y: yy, size: 9.5, font, color: muted });
    yy -= 13;
    const datos2 = ascii(
      `Enviado: ${dateStr} ${timeStr}${user.championPick ? `   Campeon: ${user.championPick}` : ''}`,
    );
    p.drawText(datos2, { x: MARGIN, y: yy, size: 9.5, font, color: muted });
    yy -= 8;
    p.drawLine({ start: { x: MARGIN, y: yy }, end: { x: W - MARGIN, y: yy }, thickness: 1, color: lineGrey });
    yy -= 18;
    return yy;
  }

  const startY = drawHeader(page);
  const bottomY = MARGIN + 14;
  // Altura en y para cada columna (van bajando independientes).
  const colY = [startY, startY];
  let counter = 0;

  function blockHeight(b: { items: M[] }): number {
    return TITLE_H + b.items.length * ROW_H + BLOCK_GAP;
  }

  function drawBlock(b: { title: string; items: M[] }, fontN: PDFFont, fontB: PDFFont): void {
    // Elige la columna con más espacio disponible (mayor y).
    let col = colY[0] >= colY[1] ? 0 : 1;
    const h = blockHeight(b);
    // Si no cabe en ninguna columna, nueva página.
    if (colY[col] - h < bottomY && colY[1 - col] - h < bottomY) {
      page = pdf.addPage([W, H]);
      const sy = drawHeader(page);
      colY[0] = sy;
      colY[1] = sy;
      col = 0;
    } else if (colY[col] - h < bottomY) {
      col = 1 - col;
    }
    const x = COL_X[col];
    let y = colY[col];
    page.drawText(b.title.toUpperCase(), { x, y, size: 11, font: fontB, color: accent });
    y -= TITLE_H;
    for (const m of b.items) {
      counter += 1;
      const p = m.predictions[0];
      const score = p ? `${p.homeScore}-${p.awayScore}` : '-:-';
      const line = `${counter}. ${shortTeam(m.homeTeam)}  ${score}  ${shortTeam(m.awayTeam)}`;
      page.drawText(line, { x, y, size: 9.5, font: fontN, color: p ? ink : muted });
      y -= ROW_H;
    }
    colY[col] = y - BLOCK_GAP;
  }

  for (const b of blocks) drawBlock(b, font, fontBold);

  // Pie en la última página
  page.drawText('quinielabox.com', { x: MARGIN, y: MARGIN - 8, size: 9, font, color: muted });

  const bytes = await pdf.save();
  const safe = (s: string) => ascii(s).replace(/[^\w\s.@-]/g, '').replace(/\s+/g, ' ').trim();
  const filename = `Fase de grupos - ${safe(displayName)} - ${safe(dateStr)} - ${safe(user.email)}.pdf`;

  return { bytes, filename };
}
