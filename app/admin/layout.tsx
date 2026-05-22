import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { Nav } from '@/components/Nav';

export const metadata = { title: 'Admin · Quiniela PADELBOX' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <>
      <Nav isAdmin userEmail={user.email ?? undefined} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-sm flex items-center justify-between">
          <span><strong>Modo administrador.</strong> Cambios aquí afectan a todos los participantes.</span>
          <nav className="flex gap-1 text-xs flex-wrap">
            <Link href="/admin" className="px-3 py-1 rounded hover:bg-bg-elev">Resumen</Link>
            <Link href="/admin/usuarios" className="px-3 py-1 rounded hover:bg-bg-elev">Usuarios</Link>
            <Link href="/admin/partidos" className="px-3 py-1 rounded hover:bg-bg-elev">Partidos</Link>
            <Link href="/admin/pagos" className="px-3 py-1 rounded hover:bg-bg-elev">Pagos</Link>
            <Link href="/admin/sponsors" className="px-3 py-1 rounded hover:bg-bg-elev">Sponsors</Link>
            <Link href="/admin/reglas" className="px-3 py-1 rounded hover:bg-bg-elev">Reglas</Link>
            <Link href="/admin/saas" className="px-3 py-1 rounded hover:bg-bg-elev text-accent">SaaS</Link>
          </nav>
        </div>
        {children}
      </main>
    </>
  );
}
