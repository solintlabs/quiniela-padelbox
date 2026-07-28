'use client';

import { useState } from 'react';

/**
 * Demo jugable de una quiniela. Datos ficticios y estado local: no toca la base
 * ni requiere cuenta. Sirve para que quien llega a la landing vea EXACTAMENTE
 * lo que recibe su club antes de registrarse.
 */

type Tab = 'inicio' | 'partidos' | 'ranking' | 'reglas';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'partidos', label: 'Partidos' },
  { key: 'ranking', label: 'Ranking' },
  { key: 'reglas', label: 'Reglas' },
];

interface DemoFixture {
  id: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  kickoff: string;
  closed: boolean;
  homeScore: number | null;
  awayScore: number | null;
  myHome: number | null;
  myAway: number | null;
  points: number | null;
}

const FIXTURES: DemoFixture[] = [
  { id: 'f1', home: 'España', away: 'Italia', homeFlag: '🇪🇸', awayFlag: '🇮🇹', kickoff: 'sáb 20:00', closed: false, homeScore: null, awayScore: null, myHome: null, myAway: null, points: null },
  { id: 'f2', home: 'Argentina', away: 'Brasil', homeFlag: '🇦🇷', awayFlag: '🇧🇷', kickoff: 'dom 18:00', closed: false, homeScore: null, awayScore: null, myHome: null, myAway: null, points: null },
  { id: 'f3', home: 'Francia', away: 'Portugal', homeFlag: '🇫🇷', awayFlag: '🇵🇹', kickoff: 'dom 21:00', closed: false, homeScore: null, awayScore: null, myHome: null, myAway: null, points: null },
  { id: 'f4', home: 'Alemania', away: 'Inglaterra', homeFlag: '🇩🇪', awayFlag: '🇬🇧', kickoff: 'mié 20:45', closed: true, homeScore: 2, awayScore: 1, myHome: 2, myAway: 1, points: 3 },
  { id: 'f5', home: 'México', away: 'Colombia', homeFlag: '🇲🇽', awayFlag: '🇨🇴', kickoff: 'mar 22:00', closed: true, homeScore: 0, awayScore: 0, myHome: 1, myAway: 0, points: 0 },
];

const RANKING = [
  { name: 'Carlos M.', points: 34, exact: 6, champion: '🇦🇷' },
  { name: 'Ana R.', points: 31, exact: 5, champion: '🇧🇷' },
  { name: 'Tú', points: 28, exact: 4, champion: '🇪🇸', isMe: true },
  { name: 'Miguel P.', points: 24, exact: 3, champion: '🇫🇷' },
  { name: 'Lucía G.', points: 21, exact: 2, champion: '🇦🇷' },
  { name: 'Javier S.', points: 17, exact: 1, champion: '🇩🇪' },
];

export function DemoQuiniela() {
  const [tab, setTab] = useState<Tab>('inicio');
  const [picks, setPicks] = useState<Record<string, { h: number; a: number; saved: boolean }>>({});

  function set(id: string, side: 'h' | 'a', delta: number) {
    setPicks((prev) => {
      const cur = prev[id] ?? { h: 0, a: 0, saved: false };
      const next = { ...cur, saved: false };
      next[side] = Math.max(0, Math.min(20, cur[side] + delta));
      return { ...prev, [id]: next };
    });
  }

  function save(id: string) {
    setPicks((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { h: 0, a: 0 }), saved: true } }));
  }

  const open = FIXTURES.filter((f) => !f.closed);
  const closed = FIXTURES.filter((f) => f.closed);

  return (
    <div className="dq">
      <div className="dq__head">
        <span className="dq__logo" aria-hidden>PA</span>
        <div>
          <p className="dq__eyebrow">Quiniela</p>
          <h3 className="dq__name">Peña Los Amigos</h3>
        </div>
        <span className="dq__badge">Demo</span>
      </div>

      <div className="dq__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={'dq__tab' + (tab === t.key ? ' is-on' : '')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'inicio' && (
        <>
          <div className="dq__podium">
            {[RANKING[1], RANKING[0], RANKING[2]].map((r, i) => {
              const pos = i === 1 ? 1 : i === 0 ? 2 : 3;
              return (
                <div key={r.name} className="dq__podcol">
                  {pos === 1 && <span className="dq__crown">🥇</span>}
                  <span className="dq__avatar">{r.name[0]}</span>
                  <span className="dq__podname">{r.name}</span>
                  <span className="dq__podpts">{r.points} pts</span>
                  <div className={`dq__step dq__step--${pos}`}>{pos}</div>
                </div>
              );
            })}
          </div>

          <div className="dq__champ">
            <strong>🏆 Tu campeón: 🇪🇸 España</strong>
            <span>Aciertas el campeón = +25 pts</span>
          </div>

          <h4 className="dq__section">Próximos partidos</h4>
          {open.slice(0, 2).map((f) => (
            <Fixture key={f.id} f={f} pick={picks[f.id]} onStep={set} onSave={save} />
          ))}
        </>
      )}

      {tab === 'partidos' && (
        <>
          <h4 className="dq__section">Por jugar</h4>
          {open.map((f) => (
            <Fixture key={f.id} f={f} pick={picks[f.id]} onStep={set} onSave={save} />
          ))}
          <h4 className="dq__section">Jugados</h4>
          {closed.map((f) => (
            <Fixture key={f.id} f={f} pick={picks[f.id]} onStep={set} onSave={save} />
          ))}
        </>
      )}

      {tab === 'ranking' && (
        <ol className="dq__rank">
          {RANKING.map((r, i) => (
            <li key={r.name} className={r.isMe ? 'is-me' : ''}>
              <span className="dq__pos">{i + 1}</span>
              <span className="dq__flag" aria-hidden>{r.champion}</span>
              <span className="dq__rname">{r.name}</span>
              <span className="dq__rex">{r.exact} exactos</span>
              <span className="dq__rpts">{r.points}</span>
            </li>
          ))}
        </ol>
      )}

      {tab === 'reglas' && (
        <div className="dq__rules">
          <p><strong>Cuota:</strong> 10 € por jugador</p>
          <p className="dq__muted">Cada club fija la suya y cómo se paga (transferencia, PayPal, efectivo…).</p>
          <ul>
            <li>Marcador exacto: 3 pts</li>
            <li>Acertar el ganador: 1 pt</li>
            <li>Acertar el campeón: +25 pts</li>
            <li>Cierre: 15 min antes de cada partido</li>
          </ul>
          <p className="dq__muted">
            Los puntos los decide el organizador: puedes premiar la diferencia de
            goles, los empates o subir el bonus del campeón.
          </p>
          <p><strong>Premios:</strong> 🥇 60% del bote · 🥈 30% · 🥉 10%</p>
        </div>
      )}
    </div>
  );
}

function Fixture({
  f,
  pick,
  onStep,
  onSave,
}: {
  f: DemoFixture;
  pick?: { h: number; a: number; saved: boolean };
  onStep: (id: string, side: 'h' | 'a', d: number) => void;
  onSave: (id: string) => void;
}) {
  const h = pick?.h ?? f.myHome ?? 0;
  const a = pick?.a ?? f.myAway ?? 0;

  return (
    <div className="dq__fx">
      <div className="dq__fxtop">
        <span className="dq__teams">
          <span aria-hidden>{f.homeFlag}</span> {f.home} <em>vs</em>{' '}
          <span aria-hidden>{f.awayFlag}</span> {f.away}
        </span>
        {f.closed ? (
          <span className="dq__score">{f.homeScore}–{f.awayScore}</span>
        ) : (
          <span className="dq__when">{f.kickoff}</span>
        )}
      </div>

      {f.closed ? (
        <p className="dq__mine">
          Tu pronóstico: {f.myHome}–{f.myAway}
          {f.points !== null && (
            <em className={f.points > 0 ? 'is-good' : ''}> · +{f.points} pts</em>
          )}
        </p>
      ) : (
        <div className="dq__pickrow">
          <Stepper value={h} onDown={() => onStep(f.id, 'h', -1)} onUp={() => onStep(f.id, 'h', 1)} />
          <span className="dq__dash">–</span>
          <Stepper value={a} onDown={() => onStep(f.id, 'a', -1)} onUp={() => onStep(f.id, 'a', 1)} />
          <button
            type="button"
            onClick={() => onSave(f.id)}
            className={'dq__save' + (pick?.saved ? ' is-saved' : '')}
          >
            {pick?.saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

function Stepper({ value, onDown, onUp }: { value: number; onDown: () => void; onUp: () => void }) {
  return (
    <span className="dq__stepper">
      <button type="button" onClick={onDown} aria-label="Restar gol">−</button>
      <span>{value}</span>
      <button type="button" onClick={onUp} aria-label="Sumar gol">+</button>
    </span>
  );
}
