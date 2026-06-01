import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

export interface CuadroPdfResult {
  bytes: Uint8Array;
  filename: string;
}

/**
 * Genera el PDF del cuadro de un usuario: lista numerada de sus pronósticos por
 * grupo + eliminatorias. Nombre de archivo: "Fase de grupos - <nombre> - <fecha> - <email>.pdf".
 */
export async function buildCuadroPdf(userId: string): Promise<CuadroPdfResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, championPick: true },
  });
  if (!user) return null;

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
  const sections: Array<{ title: string; items: M[] }> = [];
  for (const g of MUNDIAL_GROUPS) {
    const gm = matches.filter((m) => m.group === g);
    if (gm.length > 0) sections.push({ title: `Grupo ${g}`, items: gm });
  }
  for (const stage of KNOCKOUT_STAGES) {
    const sm = knockout.filter((m) => m.stage === stage);
    if (sm.length > 0) sections.push({ title: STAGE_LABEL[stage] ?? stage, items: sm });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595; // A4
  const H = 842;
  const M = 48; // margen
  const accent = rgb(0.36, 0.64, 0.12);
  const ink = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.45, 0.45, 0.45);

  let page = pdf.addPage([W, H]);
  let y = H - M;

  const displayName = ascii(user.name ?? user.email.split('@')[0]);
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  // Cabecera
  page.drawText('QUINIELA PADELBOX x DELISH', { x: M, y, size: 9, font: fontBold, color: accent });
  y -= 24;
  page.drawText(`Quiniela de ${displayName}`, { x: M, y, size: 20, font: fontBold, color: ink });
  y -= 18;
  const sub = ascii(`${user.email}  -  ${dateStr}${user.championPick ? `  -  Campeon: ${user.championPick}` : ''}`);
  page.drawText(sub, { x: M, y, size: 10, font, color: muted });
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 22;

  let counter = 0;
  const lineH = 15;

  for (const section of sections) {
    // salto de página si no cabe el título + alguna fila
    if (y < M + 60) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
    page.drawText(section.title.toUpperCase(), { x: M, y, size: 11, font: fontBold, color: accent });
    y -= 16;

    for (const m of section.items) {
      counter += 1;
      if (y < M + lineH) {
        page = pdf.addPage([W, H]);
        y = H - M;
      }
      const p = m.predictions[0];
      const score = p ? `${p.homeScore}-${p.awayScore}` : '-:-';
      const home = ascii(m.homeTeam);
      const away = ascii(m.awayTeam);

      // numero
      page.drawText(`${counter}.`, { x: M, y, size: 10, font, color: muted });
      // local (alineado a la derecha de su columna)
      const homeMaxX = 250;
      const homeWidth = font.widthOfTextAtSize(home, 10);
      page.drawText(home, { x: Math.max(M + 26, homeMaxX - homeWidth), y, size: 10, font, color: ink });
      // marcador centrado
      page.drawText(score, { x: 265, y, size: 10, font: fontBold, color: p ? ink : muted });
      // visitante
      page.drawText(away, { x: 320, y, size: 10, font, color: ink });
      y -= lineH;
    }
    y -= 8;
  }

  // Pie
  if (y < M + 20) {
    page = pdf.addPage([W, H]);
    y = H - M;
  }
  page.drawText('quinielabox.com', { x: M, y: M - 10, size: 9, font, color: muted });

  const bytes = await pdf.save();
  const safe = (s: string) => ascii(s).replace(/[^\w\s.-]/g, '').replace(/\s+/g, ' ').trim();
  const filename = `Fase de grupos - ${safe(displayName)} - ${safe(dateStr)} - ${safe(user.email)}.pdf`;

  return { bytes, filename };
}
