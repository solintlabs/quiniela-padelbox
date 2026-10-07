export const metadata = {
  title: 'QuinielaBOX SaaS',
  robots: { index: false, follow: false },
};

/**
 * Raíz del SaaS. Solo existe para comprobar que el guard del layout funciona:
 * con SAAS_ENABLED=false esta página es un 404. El onboarding real vive en
 * /saas/nueva (Fase 4).
 */
export default function SaasHomePage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6">
      <p className="text-sm text-muted">SaaS activo.</p>
    </main>
  );
}
