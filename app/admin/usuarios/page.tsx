import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function togglePayment(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  await prisma.user.update({
    where: { id },
    data: {
      hasPaid: !u.hasPaid,
      paidAt: !u.hasPaid ? new Date() : null,
    },
  });
  revalidatePath('/admin/usuarios');
}

export default async function UsuariosAdmin() {
  const users = await prisma.user.findMany({
    orderBy: [{ hasPaid: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Usuarios</h1>
          <p className="text-sm text-muted mt-1">{users.length} en total · marca quién ha pagado la inscripción.</p>
        </div>
      </header>

      <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
            <tr>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left">Nombre</th>
              <th className="text-left">Registro</th>
              <th className="text-left">Rol</th>
              <th className="text-left">Pago</th>
              <th className="text-right pr-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3 px-4">{u.email}</td>
                <td>{u.name ?? <span className="text-muted">—</span>}</td>
                <td className="text-xs text-muted">{formatDateTime(u.createdAt)}</td>
                <td>{u.role === 'ADMIN' ? <span className="text-accent">Admin</span> : 'Socio'}</td>
                <td>
                  {u.hasPaid ? (
                    <span className="text-success">✓ Pagado</span>
                  ) : (
                    <span className="text-warning">⚠ Pendiente</span>
                  )}
                </td>
                <td className="text-right pr-4">
                  <form action={togglePayment}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant={u.hasPaid ? 'secondary' : 'primary'}
                    >
                      {u.hasPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
