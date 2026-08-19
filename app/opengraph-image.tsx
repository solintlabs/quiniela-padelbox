import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QuinielaBOX — Crea la quiniela de tu club, peña o grupo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'radial-gradient(ellipse at top left, #1a2810 0%, #0A0A0A 55%, #000 100%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#0A0A0A',
              border: '4px solid #B6FF3C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="52" height="52" viewBox="0 0 100 100">
              <circle cx="50" cy="48" r="27" fill="none" stroke="#B6FF3C" strokeWidth="12" />
              <line x1="61" y1="59" x2="76" y2="74" stroke="#B6FF3C" strokeWidth="12" strokeLinecap="round" />
              <circle cx="50" cy="48" r="12" fill="#B6FF3C" />
              <polygon points="50,44.33 53.49,46.87 52.16,50.96 47.84,50.96 46.51,46.87" fill="#0A0A0A" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 6,
                color: '#B6FF3C',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Crea tu quiniela
            </div>
            <div style={{ fontSize: 18, color: '#A1A1AA', marginTop: 4 }}>
              QuinielaBOX
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: -2,
              color: '#FFFFFF',
            }}
          >
            Pronostica.
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: -2,
              color: '#B6FF3C',
              marginTop: 4,
            }}
          >
            Gana premios.
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#D4D4D8',
              marginTop: 28,
              maxWidth: 900,
            }}
          >
            Crea la quiniela de tu club, peña o grupo de amigos: pronósticos, ranking en vivo, premios y app.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #27272A',
            paddingTop: 24,
            fontSize: 20,
            color: '#A1A1AA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#B6FF3C', fontWeight: 700 }}>quinielabox.com</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <span>3 / 1 / 0</span>
            <span style={{ color: '#52525B' }}>·</span>
            <span>+25 pts campeón</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
