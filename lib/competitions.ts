/**
 * Registro central de competiciones. Cada competición agrupa partidos por el
 * campo `Match.group`. Permite al admin desactivar (excludeFromScoring=true)
 * o reactivar todas las matches de una competición a la vez.
 *
 * Para añadir una competición nueva: crear los matches con un `group` único
 * y registrarlo aquí. Si no quieres que aparezca en el panel admin, no lo
 * registres y se ignorará silenciosamente.
 */

export interface Competition {
  id: string;
  label: string;
  description?: string;
  groups: string[];
}

export const COMPETITIONS: readonly Competition[] = [
  {
    id: 'LIGA',
    label: 'La Liga (España)',
    description: 'Competición de práctica pre-Mundial. La Liga terminó tras la jornada 38.',
    groups: ['LIGA'],
  },
  {
    id: 'MUNDIAL_2026',
    label: 'Mundial 2026',
    description: 'Fase de grupos (A–L). Las eliminatorias se añaden cuando se definen.',
    groups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  },
];

export function getCompetitionById(id: string): Competition | undefined {
  return COMPETITIONS.find((c) => c.id === id);
}
