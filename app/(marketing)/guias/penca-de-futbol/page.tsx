import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “penca” — como se llama la quiniela en Uruguay (y parte
 * de Bolivia/Paraguay). Sinónimo regional con búsqueda constante y muy poca
 * competencia editorial.
 */
const SLUG = 'penca-de-futbol';
const DESCRIPTION =
  'Cómo organizar una penca de fútbol: reglas, puntaje, cuánto cobrar y cómo repartir el pozo. Guía práctica y app gratis para llevarla sin planilla.';

export const metadata: Metadata = {
  title: 'Penca de fútbol: cómo organizarla (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'penca de futbol', 'penca mundial', 'como organizar una penca',
    'app para penca', 'penca entre amigos', 'penca online',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Penca de fútbol: cómo organizarla',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Qué es una penca de fútbol?',
    a: 'Es un juego de pronósticos entre amigos, compañeros de trabajo o socios de un club: cada uno predice los resultados de los partidos y suma puntos según acierte. Gana quien más puntos junta. En otros países se llama quiniela, prode, polla o porra.',
  },
  {
    q: '¿Cómo se organiza una penca paso a paso?',
    a: 'Definí quiénes juegan y cuánto pone cada uno, dejá el puntaje y las reglas por escrito antes del primer partido, cobrá el pozo por adelantado, cerrá los pronósticos al empezar cada partido y mantené la tabla al día. Una app hace lo último por vos.',
  },
  {
    q: '¿Qué puntaje se usa en una penca?',
    a: 'El más común es 3 puntos por el resultado exacto, 1 punto por acertar el ganador y 0 si errás. Podés sumar un bonus por acertar al campeón del torneo para que la tabla siga abierta hasta la última fecha.',
  },
  {
    q: '¿Hay una app gratis para llevar la penca?',
    a: 'Sí. QuinielaBOX es gratis hasta 15 jugadores: los resultados se cargan solos, el puntaje se calcula automáticamente y la tabla se actualiza en vivo. El pozo lo maneja el organizador por fuera; la app no toca dinero.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Penca de fútbol: cómo organizarla"
      lede="Organizar la penca lleva un rato. Mantenerla viva hasta la última fecha, sin discusiones y sin que el organizador termine peleado con una planilla, es lo difícil."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué es una penca</h2>
      <p>
        Una <strong>penca</strong> es un juego de pronósticos: cada participante
        predice los resultados de los partidos y suma puntos según lo que
        acierte. Al final, quien más puntos juntó se lleva el pozo.
      </p>
      <p>
        Es lo mismo que en otros países llaman <strong>quiniela</strong>,{' '}
        <strong>prode</strong> (Argentina), <strong>polla</strong> (Venezuela,
        Colombia) o <strong>porra</strong> (España).
      </p>

      <h2>1. El grupo y el pozo</h2>
      <p>
        Definí cuántos juegan y cuánto pone cada uno. Entre amigos funciona con
        8–15; en un club o una oficina, 30–100. Poné un monto que todos paguen
        sin pensarlo: con monto bajo y mucha gente el pozo sale igual de grande y
        hay más ambiente.
      </p>

      <h2>2. Las reglas, antes del primer partido</h2>
      <ul>
        <li>
          <strong>Puntaje.</strong> El clásico: 3 por resultado exacto, 1 por el
          ganador, 0 si errás. Variantes en la{' '}
          <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Cierre de pronósticos:</strong> al empezar cada partido.
        </li>
        <li>
          <strong>Alargue y penales:</strong> normalmente cuenta el resultado de
          los 90 minutos.
        </li>
        <li>
          <strong>Desempate</strong> y <strong>reparto del pozo</strong>.
        </li>
      </ul>
      <div className="gu__note">
        <p>
          Escribilas donde todos las vean. Casi todas las discusiones de una penca
          salen de una regla que nadie dejó por escrito.
        </p>
      </div>

      <h2>3. Cobrá antes de arrancar</h2>
      <p>
        El que paga después de ver la tabla, no paga. Cobrá todo antes del primer
        partido y llevá una lista visible de quién ya puso.
      </p>

      <h2>4. Repartí en varios puestos</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Del pozo</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1º</td><td>60%</td></tr>
            <tr><td>2º</td><td>30%</td></tr>
            <tr><td>3º</td><td>10%</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Guardá algo para <strong>premio por fecha</strong>: mantiene jugando a los
        que ya no pelean el primer puesto.
      </p>

      <h2>5. Que la planilla no te coma</h2>
      <p>
        Copiar resultados, sumar puntos y contestar “¿cómo voy?” cada semana es lo
        que hace que las pencas se abandonen a mitad de torneo. Con una{' '}
        <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link> eso
        pasa solo y vos solo repartís el pozo al final.
      </p>
    </GuiaShell>
  );
}
