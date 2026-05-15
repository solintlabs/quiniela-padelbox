import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { WhatsappFab } from '@/components/WhatsappFab';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur bg-bg/85 border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3">
            <Logo size={28} />
            <span className="text-xs text-muted hidden sm:inline">Quiniela Mundial 2026</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/public/reglas" className="px-3 py-1.5 rounded-md hover:bg-bg-elev">Reglas</Link>
            <Link href="/public/inscripcion" className="px-3 py-1.5 rounded-md hover:bg-bg-elev">Inscripción</Link>
            <Link href="/login" className="px-3 py-1.5 rounded-md bg-accent text-accent-fg font-semibold ml-2">
              Entrar
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
        <Footer variant="app" />
      </main>
      <WhatsappFab />
    </>
  );
}
