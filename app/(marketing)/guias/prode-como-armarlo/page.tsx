import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “prode” — como se llama la quiniela en Argentina.
 * Español rioplatense a propósito (vos, armar, fecha) para que suene local.
 */
const SLUG = 'prode-como-armarlo';
const DESCRIPTION =
  'Cómo armar un prode con tus amigos o el laburo: reglas, puntaje, cuánto cobrar y cómo repartir. Guía práctica y app gratis para llevarlo sin planilla.';

export const metadata: Metadata = {
  title: 'Prode: cómo armarlo con tus amigos (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'prode', 'como armar un prode', 'prode entre amigos', 'app para prode',
    'prode del mundial', 'armar prode con amigos', 'prode online',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Prode: cómo armarlo con tus amigos',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Qué es un prode?',
    a: 'Es un juego de pronósticos deportivos entre amigos, compañeros de trabajo o socios de un club: cada uno predice los resultados de los partidos y suma puntos según acierte. Gana quien más puntos junta. En otros países le dicen quiniela, polla, penca o porra.',
  },
  {
    q: '¿Cómo se arma un prode paso a paso?',
    a: 'Definí quiénes juegan y cuánto pone cada uno, dejá el puntaje y las reglas por escrito antes de la primera fecha, cobrá antes de arrancar, cerrá los pronósticos cuando empieza cada partido y mantené la tabla al día. Con una app los resultados y los puntos se cargan solos.',
  },
  {
    q: '¿Cuál es el puntaje habitual de un prode?',
    a: 'El más usado es 3 puntos por acertar el resultado exacto, 1 punto por acertar solo el ganador y 0 si errás. Se le puede sumar un bonus por acertar al campeón del torneo, que mantiene la tabla abierta hasta la final.',
  },
  {
    q: '¿Hay alguna app gratis para llevar el prode?',
    a: 'Sí. QuinielaBOX es gratis hasta 15 jugadores: trae los resultados automáticamente, calcula el puntaje y actualiza la tabla en vivo. La plata del pozo la maneja el organizador por fuera, la app no toca pagos.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Prode: cómo armarlo con tus amigos"
      lede="Armar el prode lleva cinco minutos. Que llegue vivo hasta la última fecha, sin quilombos y sin que el que organiza termine odiando la planilla, es otra historia."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué es un prode</h2>
      <p>
        El <strong>prode</strong> es un juego de pronósticos: cada participante
        predice los resultados de los partidos y suma puntos según lo que
        acierte. Al final, el que más puntos juntó se lleva el pozo.
      </p>
      <p>
        Es lo mismo que en otros lados llaman <strong>quiniela</strong> (México,
        España), <strong>polla</strong> (Venezuela, Colombia),{' '}
        <strong>penca</strong> (Uruguay) o <strong>porra</strong> (España).
      </p>

      <h2>1. Definí el grupo y cuánto pone cada uno</h2>
      <p>
        Dos números antes que nada: cuántos juegan y cuánto aporta cada uno. Entre
        amigos anda bien con 8–15; en un club o una oficina, 30–100.
      </p>
      <div className="gu__note">
        <p>
          <strong>Consejo:</strong> poné un monto que tu grupo pague sin pensarlo.
          Si es caro, la gente lo duda y no entra. Con monto bajo y mucha gente el
          pozo termina igual de grande y hay más ambiente.
        </p>
      </div>

      <h2>2. Dejá el puntaje por escrito antes de la primera fecha</h2>
      <p>
        Casi todas las discusiones salen de reglas que nadie escribió. Dejá claro:
      </p>
      <ul>
        <li>
          <strong>Cuánto vale cada acierto.</strong> El clásico: 3 por resultado
          exacto, 1 por el ganador, 0 si errás. Otras variantes, en la{' '}
          <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Hasta cuándo se carga</strong> cada pronóstico: lo normal es
          cerrar cuando arranca el partido.
        </li>
        <li>
          <strong>Qué resultado cuenta</strong> si hay alargue o penales:
          habitualmente el de los 90 minutos.
        </li>
        <li>
          <strong>Cómo se desempata</strong> y <strong>cómo se reparte el pozo</strong>.
        </li>
      </ul>

      <h2>3. Cobrá antes de que empiece</h2>
      <p>
        El que paga después de ver cómo viene la tabla, no paga. Cobrá todo antes
        de la primera fecha, dejá los datos de pago por escrito y llevá una lista
        visible de quién ya puso.
      </p>

      <h2>4. Repartí para que nadie se baje</h2>
      <p>
        Si solo premiás al primero, a mitad de torneo la mitad deja de cargar
        porque ya no llega. Un reparto que funciona:
      </p>
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
        Guardá algo para <strong>premio por fecha</strong>: le da a todos algo que
        ganar cada semana, aunque estén últimos.
      </p>

      <h2>5. No lo lleves en una planilla</h2>
      <p>
        Ahí mueren casi todos los prodes: el que organiza termina copiando
        resultados a mano, sumando puntos y contestando “¿cómo voy?” veinte veces
        por WhatsApp. A la tercera fecha lo abandona.
      </p>
      <p>
        Con una <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link>{' '}
        los resultados entran solos, el puntaje se calcula solo y la tabla está
        siempre al día. Vos solo repartís el pozo al final.
      </p>

      <h2>Errores que se repiten</h2>
      <ul>
        <li>Arrancar sin reglas escritas.</li>
        <li>Aceptar pronósticos con el partido ya empezado.</li>
        <li>Cobrar a mitad de torneo.</li>
        <li>Premiar solo al primero.</li>
        <li>Llevar la tabla en Excel o por chat.</li>
      </ul>
    </GuiaShell>
  );
}
