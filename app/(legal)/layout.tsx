import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3">
            <Logo size={28} />
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            Entrar →
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">
        {children}
        <Footer variant="app" />
      </main>
    </>
  );
}
