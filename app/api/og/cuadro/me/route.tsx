import { ImageResponse } from '@vercel/og';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';
import { computeGroupStandings } from '@/lib/groupStandings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/og/cuadro/me
 * Devuelve PNG (1200x630) con el cuadro del usuario actual.
 *
 * IMPORTANTE: @vercel/og usa Satori. Satori SOLO soporta `display: flex`
 * (no grid). Cada View con multiples hijos exige `display: 'flex'`
 * explicito o Satori lanza error. Por eso evitamos className/utility CSS
 * y todo va inline.
 */
export async function GET(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  try {
    const [me, matches] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true, championPick: true, championLockedAt: true },
      }),
      prisma.match.findMany({
        where: { stage: 'GROUP' },
        include: { predictions: { where: { userId: user.id } } },
        orderBy: { kickoff: 'asc' },
      }),
    ]);

    const groups = computeGroupStandings(matches);
    const totalPredicted = groups.reduce((s, g) => s + g.matchesPredicted, 0);
    const totalMatches = groups.reduce((s, g) => s + g.matchesTotal, 0);
    const userName = me?.name ?? (me?.email ? me.email.split('@')[0] : 'Socio');
    const champion = me?.championPick ?? null;

    const ACCENT = '#B6FF3C';
    const DELISH = '#f14826';
    const BG = '#0A0A0A';
    const INK = '#FAFAFA';
    const MUTED = '#737373';

    // Layout 4x3 via flexWrap (Satori no soporta grid)
    const CARD_GAP = 12;
    const PADDING = 48;
    const COLS = 4;
    const CARD_W = (1200 - PADDING * 2 - CARD_GAP * (COLS - 1)) / COLS;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: BG,
            color: INK,
            fontFamily: 'system-ui, sans-serif',
            padding: PADDING,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: INK, letterSpacing: -1 }}>PADELBOX</span>
                <span style={{ fontSize: 28, color: MUTED, margin: '0 12px' }}>×</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: DELISH, letterSpacing: -1 }}>DELISH!</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 18,
                  color: ACCENT,
                  marginTop: 8,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Mi Cuadro · Mundial 2026
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', fontSize: 24, fontWeight: 900, color: INK }}>{userName}</div>
              <div style={{ display: 'flex', fontSize: 16, color: MUTED, marginTop: 4 }}>
                {totalPredicted}/{totalMatches} predicciones
              </div>
            </div>
          </div>

          {/* Champion card o spacer */}
          {champion ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                border: `2px solid ${ACCENT}`,
                borderRadius: 12,
                background: 'rgba(182, 255, 60, 0.1)',
                alignSelf: 'flex-start',
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 28, marginRight: 16 }}>🏆</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: 12,
                    color: ACCENT,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Mi Campeón
                </span>
                <span style={{ fontSize: 22, fontWeight: 900, color: INK, marginTop: 2 }}>{champion}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', marginBottom: 24 }} />
          )}

          {/* "Grid" 4x3 via flexWrap (Satori-friendly) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flex: 1,
            }}
          >
            {groups.slice(0, 12).map((g, gi) => (
              <div
                key={g.group}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: CARD_W,
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: 10,
                  background: '#141414',
                  marginRight: gi % COLS === COLS - 1 ? 0 : CARD_GAP,
                  marginBottom: CARD_GAP,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: INK,
                      letterSpacing: 1,
                    }}
                  >
                    GRUPO {g.group}
                  </span>
                  <span style={{ fontSize: 10, color: MUTED }}>
                    {g.matchesPredicted}/{g.matchesTotal}
                  </span>
                </div>
                {g.standings.map((s, i) => {
                  const posColor =
                    i === 0 ? ACCENT
                    : i === 1 ? '#3B82F6'
                    : i === 2 ? '#F59E0B'
                    : MUTED;
                  return (
                    <div
                      key={s.team}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px 0',
                        borderTop: i > 0 ? '1px solid #1f1f1f' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 900, color: posColor, width: 14 }}>{i + 1}</span>
                      <span
                        style={{
                          display: 'flex',
                          fontSize: 11,
                          color: INK,
                          flex: 1,
                          overflow: 'hidden',
                          marginLeft: 4,
                        }}
                      >
                        {s.team.length > 11 ? s.team.slice(0, 10) + '…' : s.team}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: posColor }}>{s.pts}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
              paddingTop: 16,
              borderTop: `2px solid ${ACCENT}`,
            }}
          >
            <span style={{ fontSize: 14, color: MUTED }}>quiniela.solint.cloud</span>
            <span style={{ fontSize: 14, color: ACCENT, fontWeight: 700 }}>¿Te animas a competir?</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'cache-control': 'no-store, max-age=0',
        },
      },
    );
  } catch (e) {
    // Log + devuelve un error legible (en lugar de un 500 opaco)
    console.error('[og/cuadro] error:', e);
    return new Response(
      JSON.stringify({
        error: 'No se pudo generar la imagen',
        detail: e instanceof Error ? e.message : String(e),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
