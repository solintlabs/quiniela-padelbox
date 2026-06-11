import { redirect } from 'next/navigation';

/**
 * Ruta histórica: la vista "Mis pronósticos" se consolidó en /partidos
 * (lista con tus picks inline). Redirige para no romper enlaces viejos.
 * /mis-pronosticos/print sigue existiendo para la versión imprimible.
 */
export default function MisPronosticosRedirect() {
  redirect('/partidos');
}
