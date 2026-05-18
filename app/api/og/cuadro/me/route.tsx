import { ImageResponse } from '@vercel/og';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';
import { computeGroupStandings } from '@/lib/groupStandings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/og/cuadro/me
 * Devuelve PNG (1200x630, formato OG) con el cuadro del usuario actual.
 * Diseñado para compartir en WhatsApp / Instagram Stories.
 */
export async function GET(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

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

  // Colores
  const ACCENT = '#B6FF3C';
  const DELISH = '#f14826';
  const BG = '#0A0A0A';
  const INK = '#FAFAFA';
  const MUTED = '#737373';

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
          padding: 48,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: INK, letterSpacing: -1 }}>PADELBOX</span>
              <span style={{ fontSize: 28, color: MUTED }}>×</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: DELISH, letterSpacing: -1 }}>DELISH!</span>
            </div>
            <div style={{ fontSize: 18, color: ACCENT, marginTop: 8, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
              Mi Cuadro · Mundial 2026
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: INK }}>{userName}</div>
            <div style={{ fontSize: 16, color: MUTED, marginTop: 4 }}>
              {totalPredicted}/{totalMatches} predicciones
            </div>
          </div>
        </div>

        {/* Champion card */}
        {champion && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 20px',
              border: `2px solid ${ACCENT}`,
              borderRadius: 12,
              background: 'rgba(182, 255, 60, 0.1)',
              alignSelf: 'flex-start',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 28 }}>🏆</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, color: ACCENT, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                Mi Campeón
              </span>
              <span style={{ fontSize: 22, fontWeight: 900, color: INK, marginTop: 2 }}>{champion}</span>
            </div>
          </div>
        )}

        {/* Grid de grupos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            flex: 1,
          }}
        >
          {groups.slice(0, 12).map((g) => (
            <div
              key={g.group}
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                padding: 10,
                background: '#141414',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: INK, letterSpacing: 1 }}>GRUPO {g.group}</span>
                <span style={{ fontSize: 10, color: MUTED }}>{g.matchesPredicted}/{g.matchesTotal}</span>
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
                      gap: 4,
                      padding: '2px 0',
                      borderTop: i > 0 ? '1px solid #1f1f1f' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 900, color: posColor, width: 12 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: INK, flex: 1, overflow: 'hidden' }}>
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
          <span style={{ fontSize: 14, color: MUTED }}>quiniela-padelbox.vercel.app</span>
          <span style={{ fontSize: 14, color: ACCENT, fontWeight: 700 }}>¿Te animas a competir?</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // No cache: cada vez que el user comparte queremos los últimos datos.
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}
