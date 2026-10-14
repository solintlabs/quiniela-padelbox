'use client';

import { useEffect, useRef, useState } from 'react';

interface Turn {
  from: 'bot' | 'me';
  html: string;
}

const FAQ: Array<{ q: string; a: string }> = [
  { q: '¿Cuánto cuesta?', a: 'Empezar es <b>gratis</b>, con jugadores ilimitados. Si tu comunidad necesita algo a medida, lo vemos juntos.' },
  { q: '¿Cómo invito a mi gente?', a: 'Compartes un <b>enlace por WhatsApp</b>. Quien entra queda anotado en tu tabla, sin instalar nada para probar.' },
  { q: '¿Puedo poner mis reglas?', a: 'Sí. Tú decides <b>cuánto vale cada acierto</b> y qué premios hay. Se ajusta desde tu panel y se aplica al instante.' },
  { q: '¿Qué competencias hay?', a: 'Un catálogo de <b>221 competencias</b> —del Mundial a las grandes ligas— con resultados en vivo. O creas la tuya a mano.' },
  { q: '¿Cómo los contacto?', a: "Escríbenos a <b><a href='mailto:info@solint.cloud'>info@solint.cloud</a></b> o usa el formulario de contacto. Respondemos en menos de 24 h." },
];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    { from: 'bot', html: '¡Hola! 👋 Soy el asistente de QuinielaBOX. ¿Qué te gustaría saber?' },
  ]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [turns]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function ask(item: { q: string; a: string }) {
    setTurns((t) => [...t, { from: 'me', html: item.q }, { from: 'bot', html: item.a }]);
  }

  return (
    <div className={`lz-asst${open ? '' : ' closed'}`}>
      <div className="lz-asst__panel" hidden={!open}>
        <div className="lz-asst__hd">
          <span className="dot" />
          <b>Asistente QuinielaBOX</b>
          <span>Responde al instante</span>
        </div>
        <div className="lz-asst__body" ref={bodyRef}>
          {turns.map((t, i) => (
            <p
              key={i}
              className={`bub ${t.from === 'me' ? 'bub--me' : 'bub--bot'}`}
              dangerouslySetInnerHTML={{ __html: t.html }}
            />
          ))}
        </div>
        <div className="lz-asst__qs">
          {FAQ.map((item) => (
            <button key={item.q} type="button" className="lz-asst__q" onClick={() => ask(item)}>
              {item.q}
            </button>
          ))}
        </div>
        <div className="lz-asst__ft">
          <a href="mailto:info@solint.cloud?subject=Quiero%20montar%20mi%20quiniela">✉ Hablar con una persona</a>
        </div>
      </div>
      <button
        type="button"
        className="lz-asst__fab"
        aria-label="Abrir asistente de ayuda"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3 21l1.9-6.1A8.4 8.4 0 1 1 21 11.5z" />
        </svg>
      </button>
    </div>
  );
}
