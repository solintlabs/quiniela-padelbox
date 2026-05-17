import { redirect } from 'next/navigation';

// Consolidado: /predecir-grupos -> /partidos?tab=mundial.
// La nueva /partidos divide los matches por Grupo A-L automaticamente y
// tiene el mismo flujo de batch save ("Guardar todo (N)").
export default function RedirectToPartidos() {
  redirect('/partidos?tab=mundial');
}
