import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “polla futbolera” / “polla mundialista” — como se llama
 * la quiniela en Venezuela y Colombia. Sinónimo regional con mucha búsqueda y
 * poca competencia: cada uno es una puerta de entrada distinta al producto.
 */
const SLUG = 'polla-futbolera';
const DESCRIPTION =
  'Cómo armar una polla futbolera con tu grupo: reglas, puntos, cuánto cobrar y cómo repartir. Guía práctica y app gratis para llevarla sin Excel.';

export const metadata: Metadata = {
  title: 'Polla futbolera: cómo armarla con tu grupo (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'polla futbolera', 'polla mundialista', 'como hacer una polla futbolera',
    'app para polla futbolera', 'polla de futbol', 'armar polla futbolera',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Polla futbolera: cómo armarla con tu grupo',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Qué es una polla futbolera?',
    a: 'Es un juego de pronósticos entre amigos, compañeros de trabajo o socios de un club: cada participante predice los marcadores de los partidos y suma puntos según acierte. Gana quien más puntos acumula. En otros países se llama quiniela, prode, penca o porra.',
  },
  {
    q: '¿Cómo se arma una polla futbolera paso a paso?',
    a: 'Define quién juega y cuánto aporta cada uno, fija las reglas y los puntos antes del primer partido, cobra el bote por adelantado, recoge los pronósticos antes de que empiece cada juego y lleva la tabla actualizada. Con una app como QuinielaBOX los resultados, los puntos y la tabla se actualizan solos.',
  },
  {
    q: '¿Cuánto se cobra por participar en una polla?',
    a: 'Lo que tu grupo pague sin pensarlo. Es preferible una cuota baja con mucha gente que una alta con pocos: el bote termina siendo parecido y hay más ambiente. Lo importante es cobrar antes del primer partido.',
  },
  {
    q: '¿Hay una app gratis para llevar la polla?',
    a: 'Sí. QuinielaBOX es gratis para grupos de hasta 15 jugadores: trae los resultados automáticamente, calcula los puntos y mantiene la tabla en vivo. El dinero del bote lo maneja el organizador por fuera, la app no toca pagos.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Polla futbolera: cómo armarla con tu grupo"
      lede="Armar la polla es fácil. Que llegue viva hasta la última fecha, sin discusiones y sin que el organizador termine harto de un Excel, es otra cosa."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué es una polla futbolera</h2>
      <p>
        Una <strong>polla futbolera</strong> es un juego de pronósticos: cada
        participante predice los marcadores de los partidos y suma puntos según
        lo que acierte. Al final, quien más puntos tiene se lleva el bote.
      </p>
      <p>
        Es lo mismo que en otros países llaman <strong>quiniela</strong> (México,
        España), <strong>prode</strong> (Argentina), <strong>penca</strong>{' '}
        (Uruguay) o <strong>porra</strong> (España). Cambia el nombre, no el
        juego.
      </p>

      <h2>1. Define el grupo y la cuota</h2>
      <p>
        Dos números antes que nada: cuánta gente juega y cuánto pone cada uno.
        Una polla entre amigos funciona con 8–15 personas; la de un club o una
        empresa, con 30–100.
      </p>
      <div className="gu__note">
        <p>
          <strong>Consejo:</strong> pon una cuota que tu grupo pague sin pensarlo.
          Si duele, la gente lo piensa y no entra. Con cuota baja y mucha gente el
          bote sale igual de grande y hay más ambiente.
        </p>
      </div>

      <h2>2. Escribe las reglas antes del primer partido</h2>
      <p>
        Casi todas las peleas de una polla vienen de reglas que nadie escribió.
        Deja claro desde el principio:
      </p>
      <ul>
        <li>
          <strong>Cuánto vale cada acierto.</strong> Lo estándar: 3 puntos por
          marcador exacto, 1 por acertar el ganador, 0 si fallas. Más opciones en
          la <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Hasta cuándo se puede pronosticar.</strong> Lo normal es cerrar
          al pitazo inicial de cada partido.
        </li>
        <li>
          <strong>Qué marcador cuenta</strong> si hay alargue o penales: casi
          siempre el resultado de los 90 minutos.
        </li>
        <li>
          <strong>Cómo se desempata</strong> si dos terminan con los mismos puntos.
        </li>
        <li>
          <strong>Cómo se reparte el bote.</strong>
        </li>
      </ul>

      <h2>3. Cobra el bote antes de empezar</h2>
      <p>
        Quien paga después de ver cómo va la tabla, no paga. Cobra todo antes del
        primer partido, deja los datos de pago escritos (transferencia, pago
        móvil, Zelle, efectivo… lo que uses en tu país) y lleva una lista visible
        de quién ya puso.
      </p>

      <h2>4. Reparte para que nadie se desenganche</h2>
      <p>
        Si solo premias al primero, a mitad de torneo la mitad del grupo deja de
        jugar porque ya no puede ganar. Un reparto que funciona:
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Del bote</th>
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
        Y guarda algo para <strong>premios por fecha</strong> (el mejor de la
        jornada): así todos tienen algo que ganar cada semana.
      </p>

      <h2>5. No la lleves a mano</h2>
      <p>
        Aquí es donde mueren casi todas las pollas: el organizador termina
        copiando marcadores en una hoja, sumando puntos a mano y respondiendo
        “¿cómo voy?” por WhatsApp veinte veces. A la tercera fecha lo deja.
      </p>
      <p>
        Con una <Link href="/guias/aplicacion-para-quinielas">aplicación para quinielas</Link>{' '}
        los resultados entran solos, los puntos se calculan solos y la tabla está
        siempre actualizada. Tú solo repartes el bote al final.
      </p>

      <h2>Errores que se repiten</h2>
      <ul>
        <li>Empezar sin reglas escritas.</li>
        <li>Aceptar pronósticos después de que empiece el partido.</li>
        <li>Cobrar el bote a mitad del torneo.</li>
        <li>Premiar solo al primer lugar.</li>
        <li>Llevar la tabla en Excel o por chat.</li>
      </ul>
    </GuiaShell>
  );
}
