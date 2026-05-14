import { auth } from '@/lib/auth';
import { computeRanking } from '@/lib/ranking';
import { RankingTable } from '@/components/RankingTable';

export const metadata = { title: 'Ranking · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const session = await auth();
  const ranking = await computeRanking();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Ranking</h1>
        <p className="text-sm text-muted mt-1">
          Desempate por <span className="text-ink">marcadores exactos</span> · luego por fecha de registro.
        </p>
      </header>
      <RankingTable rows={ranking} meId={session?.user.id} />
    </div>
  );
}
