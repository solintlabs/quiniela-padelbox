import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { DeleteUserButton } from '@/components/DeleteUserButton';
import { EditUserButton } from '@/components/EditUserButton';
import { AccessLinkButton } from '@/components/AccessLinkButton';
import { EditPaymentButton } from '@/components/EditPaymentButton';
import { impersonateUser } from '@/lib/impersonation';
import { generateAccessLink, revokeAccessLink } from '@/lib/access-link';
import { formatDateTime } from '@/lib/format';
import { getPool } from '@/lib/pool';
import { getInscriptionsStatus } from '@/lib/inscriptions';

export const dynamic = 'force-dynamic';

async function markPaid(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const paidMethod = String(formData.get('paidMethod') ?? '').trim() || null;
  const paidAmount = String(formData.get('paidAmount') ?? '').trim() || null;
  const paidNote = String(formData.get('paidNote') ?? '').trim() || null;
  await prisma.user.update({
    where: { id },
    data: {
      hasPaid: true,
      paidAt: new Date(),
      paidMethod,
      paidAmount,
      paidNote,
    },
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/');
  revalidatePath('/admin/reglas');
}

async function markUnpaid(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.user.update({
    where: { id },
    data: {
      hasPaid: false,
      paidAt: null,
      paidMethod: null,
      paidAmount: null,
    },
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/');
  revalidatePath('/admin/reglas');
}

async function deleteUser(id: string) {
  'use server';
  const admin = await requireAdmin();
  if (!id) throw new Error('id requerido');
  if (id === admin.id) throw new Error('No puedes eliminarte a ti mismo');
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) throw new Error('Usuario no encontrado');
  if (target.role === 'ADMIN') throw new Error('No se pueden eliminar admins desde aquí');
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/usuarios');
  revalidatePath('/');
  revalidatePath('/ranking');
}

async function updatePaymentInfo(id: string, method: string, amount: string, note: string) {
  'use server';
  await requireAdmin();
  if (!id) throw new Error('id requerido');
  await prisma.user.update({
    where: { id },
    data: {
      paidMethod: method.trim() || null,
      paidAmount: amount.trim() || null,
      paidNote: note.trim().slice(0, 300) || null,
    },
  });
  revalidatePath('/admin/usuarios');
}

async function updateUserProfile(id: string, name: string, phone: string, email: string) {
  'use server';
  await requireAdmin();
  if (!id) throw new Error('id requerido');
  const cleanName = name.trim().slice(0, 60) || null;
  const cleanPhone = phone.trim().slice(0, 20) || null;
  const cleanEmail = email.trim().toLowerCase().slice(0, 120);

  // El email es la identidad de login. Validamos formato y, si cambia,
  // comprobamos que no choque con otro usuario (constraint unique).
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Email inválido');
  }
  const current = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!current) throw new Error('Usuario no encontrado');
  if (cleanEmail !== current.email) {
    const clash = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } });
    if (clash && clash.id !== id) {
      throw new Error('Ya existe otro usuario con ese email');
    }
  }

  await prisma.user.update({
    where: { id },
    data: { name: cleanName, phone: cleanPhone, email: cleanEmail },
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/');
  revalidatePath('/ranking');
}

async function createUser(formData: FormData) {
  'use server';
  await requireAdmin();
  const rawEmail = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim().slice(0, 60) || null;
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 20) || null;

  let email: string;
  if (rawEmail) {
    // Email real: validar formato + no duplicado.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) throw new Error('Email inválido');
    const existing = await prisma.user.findUnique({ where: { email: rawEmail }, select: { id: true } });
    if (existing) throw new Error('Ya existe un usuario con ese email');
    email = rawEmail;
  } else {
    // Sin email: usuario "solo-enlace". Generamos un email sintetico interno
    // (nunca recibe correo). El usuario entrara unicamente por su enlace de
    // acceso. Si mas adelante tiene email, el admin lo edita en su tarjeta.
    if (!name) throw new Error('Pon al menos un nombre si no hay email');
    email = `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@noemail.quinielabox.com`;
  }

  await prisma.user.create({
    data: { email, name, phone, emailVerified: new Date() },
  });
  revalidatePath('/admin/usuarios');
}

export default async function UsuariosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const filtro = sp.filtro === 'pagados' ? 'pagados' : sp.filtro === 'nopagados' ? 'nopagados' : 'todos';
  const query = (sp.q ?? '').trim().toLowerCase();

  const [allUsers, methods, pool, rules] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ hasPaid: 'asc' }, { createdAt: 'desc' }] }),
    prisma.paymentMethod.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
    getPool(),
    prisma.rules.findUnique({ where: { id: 1 }, select: { inscriptionsCloseAt: true } }),
  ]);
  const inscriptions = getInscriptionsStatus(rules?.inscriptionsCloseAt ?? null);
  const unpaidWithPhone = allUsers.filter((u) => !u.hasPaid && u.phone && u.phone.trim()).length;
  const paidCount = allUsers.filter((u) => u.hasPaid).length;
  const unpaidCount = allUsers.length - paidCount;

  // Filtro de estado + búsqueda por nombre/email/teléfono
  const users = allUsers.filter((u) => {
    if (filtro === 'pagados' && !u.hasPaid) return false;
    if (filtro === 'nopagados' && u.hasPaid) return false;
    if (query) {
      const hay = `${u.name ?? ''} ${u.email} ${u.phone ?? ''}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Usuarios</h1>
          <p className="text-sm text-muted mt-1">
            {users.length} en total · {pool.paidCount} pagado{pool.paidCount !== 1 && 's'} ·{' '}
            <span className="text-warning">{unpaidWithPhone} sin pagar con teléfono</span>
          </p>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Bote actual</p>
          <p className="font-display text-2xl text-accent tabular-nums">{pool.totalFormatted}</p>
        </div>
      </header>

      {/* Descargar contactos para captar a los que no han pagado */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-semibold">📇 Contactar a los no pagados</p>
          <p className="text-xs text-muted mt-0.5">
            Descarga sus contactos en un archivo y ábrelo en el teléfono para importarlos
            todos de golpe (aparecen con prefijo &quot;QB&quot;). O escríbeles directo por WhatsApp en cada tarjeta.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href="/api/admin/contactos?filter=unpaid"
            className="inline-flex items-center h-9 px-3 rounded-md bg-warning text-ink text-xs font-semibold hover:brightness-95"
          >
            📥 Contactos sin pagar
          </a>
          <a
            href="/api/admin/contactos?filter=all"
            className="inline-flex items-center h-9 px-3 rounded-md border border-line text-xs hover:bg-bg-elev"
          >
            Todos
          </a>
        </div>
      </div>

      {/* Filtro por estado de pago + buscador */}
      <div className="flex items-center gap-2 flex-wrap">
        <nav className="flex gap-1 rounded-lg border border-line bg-bg-elev p-1 text-sm">
          <FiltroTab filtro="todos" actual={filtro} q={query} label={`Todos (${allUsers.length})`} />
          <FiltroTab filtro="pagados" actual={filtro} q={query} label={`Pagados (${paidCount})`} />
          <FiltroTab filtro="nopagados" actual={filtro} q={query} label={`Sin pagar (${unpaidCount})`} />
        </nav>
        <form method="get" className="flex items-center gap-2 flex-1 min-w-[200px]">
          {filtro !== 'todos' && <input type="hidden" name="filtro" value={filtro} />}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por nombre, email o teléfono…"
            className="flex-1 h-9 rounded-md border border-line bg-bg-elev px-3 text-sm"
          />
          <button type="submit" className="h-9 px-3 rounded-md border border-line text-sm hover:bg-bg-elev">
            Buscar
          </button>
        </form>
      </div>

      {(filtro !== 'todos' || query) && (
        <p className="text-xs text-muted -mt-3">
          Mostrando <span className="text-ink font-semibold">{users.length}</span> usuario{users.length !== 1 && 's'}
          {filtro === 'pagados' && ' pagados'}
          {filtro === 'nopagados' && ' sin pagar'}
          {query && ` que coinciden con "${query}"`}.{' '}
          <Link href="/admin/usuarios" className="text-accent underline">Ver todos</Link>
        </p>
      )}

      {/* Crear usuario manualmente (para gente sin email o que no se registra sola) */}
      <details className="rounded-xl border border-line bg-bg-elev">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          ➕ Crear usuario manualmente
        </summary>
        <form action={createUser} className="px-4 pb-4 grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted">Nombre</label>
            <input
              type="text"
              name="name"
              maxLength={60}
              placeholder="Nombre (obligatorio si no hay email)"
              className="w-full h-9 rounded-md border border-line bg-bg px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted">Email (opcional)</label>
            <input
              type="email"
              name="email"
              placeholder="correo@ejemplo.com"
              className="w-full h-9 rounded-md border border-line bg-bg px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted">Teléfono</label>
            <input
              type="tel"
              name="phone"
              maxLength={20}
              placeholder="+58 ..."
              className="w-full h-9 rounded-md border border-line bg-bg px-2 text-sm font-mono"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" size="sm">Crear usuario</Button>
            <p className="text-[11px] text-muted mt-2">
              Sin email también vale (entrará solo por enlace). Tras crearlo, genera su 🔗 enlace de acceso desde su tarjeta y mándaselo por WhatsApp.
            </p>
          </div>
        </form>
      </details>

      {inscriptions.closeAt && (
        <div
          className={
            'rounded-xl border px-4 py-3 text-xs ' +
            (inscriptions.closed
              ? 'border-warning/40 bg-warning/10 text-warning'
              : 'border-line bg-bg-elev text-muted')
          }
        >
          {inscriptions.closed ? (
            <>
              <strong>Inscripciones cerradas</strong> desde {formatDateTime(inscriptions.closeAt)}.
              Nuevos registros bloqueados.{' '}
              <Link href="/admin/reglas" className="underline">Editar fecha</Link>
            </>
          ) : (
            <>
              Inscripciones cerrarán el {formatDateTime(inscriptions.closeAt)}.{' '}
              <Link href="/admin/reglas" className="underline text-accent">Cambiar</Link>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <article
            key={u.id}
            className={
              'rounded-xl border bg-bg-elev p-4 ' +
              (u.hasPaid ? 'border-success/30' : 'border-line')
            }
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold">
                  {u.name ?? <span className="text-muted">Sin nombre</span>}
                  {u.role === 'ADMIN' && <span className="ml-2 text-xs text-accent">· Admin</span>}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {u.email.endsWith('@noemail.quinielabox.com')
                    ? '(sin email · solo enlace)'
                    : u.email}
                </p>
                {u.phone && (
                  <p className="text-xs mt-0.5">
                    <a href={`tel:${u.phone}`} className="text-accent hover:underline">📞 {u.phone}</a>
                    {' · '}
                    <a
                      href={`https://wa.me/${u.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:underline"
                    >
                      WhatsApp
                    </a>
                  </p>
                )}
                <p className="text-[10px] text-muted mt-1">
                  Registrado: {formatDateTime(u.createdAt)}
                </p>
                <div className="mt-2 flex items-center gap-4 flex-wrap">
                  <Link
                    href={`/admin/usuarios/${u.id}/cuadro`}
                    className="text-[11px] text-accent hover:underline"
                  >
                    📄 Ver / descargar PDF
                  </Link>
                  <EditUserButton
                    userId={u.id}
                    currentName={u.name}
                    currentPhone={u.phone}
                    currentEmail={u.email}
                    updateAction={updateUserProfile}
                  />
                  {u.role !== 'ADMIN' && (
                    <form action={impersonateUser}>
                      <input type="hidden" name="targetId" value={u.id} />
                      <button type="submit" className="text-[11px] text-accent hover:underline">
                        👁️ Entrar como este usuario
                      </button>
                    </form>
                  )}
                  {u.role !== 'ADMIN' && (
                    <DeleteUserButton
                      userId={u.id}
                      userLabel={u.name ?? u.email}
                      deleteAction={deleteUser}
                    />
                  )}
                </div>
                {u.role !== 'ADMIN' && (
                  <AccessLinkButton
                    userId={u.id}
                    userLabel={u.name ?? u.email}
                    currentToken={u.accessToken}
                    generateAction={generateAccessLink}
                    revokeAction={revokeAccessLink}
                  />
                )}
              </div>

              <div className="w-full sm:w-auto">
                {u.hasPaid ? (
                  <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm min-w-[240px]">
                    <p className="text-success font-semibold">✓ Pagado</p>
                    {u.paidMethod && <p className="text-xs text-muted mt-1">Método: <span className="text-ink">{u.paidMethod}</span></p>}
                    {u.paidAmount && <p className="text-xs text-muted">Monto: <span className="text-ink">{u.paidAmount}</span></p>}
                    {u.paidNote && <p className="text-xs text-muted">Nota: <span className="text-ink">{u.paidNote}</span></p>}
                    {u.paidAt && <p className="text-[10px] text-muted mt-1">{formatDateTime(u.paidAt)}</p>}
                    <EditPaymentButton
                      userId={u.id}
                      currentMethod={u.paidMethod}
                      currentAmount={u.paidAmount}
                      currentNote={u.paidNote}
                      updateAction={updatePaymentInfo}
                    />
                    <form action={markUnpaid} className="mt-2">
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="text-xs text-danger hover:underline">
                        Marcar como pendiente
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={markPaid} className="rounded-lg border border-line bg-bg p-3 space-y-2 w-full sm:w-72">
                    <input type="hidden" name="id" value={u.id} />
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted">Método de pago</label>
                      <select
                        name="paidMethod"
                        defaultValue=""
                        className="w-full h-9 mt-1 rounded-md border border-line bg-bg-elev px-2 text-sm"
                      >
                        <option value="">— Selecciona —</option>
                        {methods.map((m) => (
                          <option key={m.id} value={m.title}>
                            {m.icon} {m.title}{m.subtitle ? ` (${m.subtitle})` : ''}
                          </option>
                        ))}
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted">Monto (opcional)</label>
                      <input
                        type="text"
                        name="paidAmount"
                        placeholder={pool.feeFormatted}
                        className="w-full h-9 mt-1 rounded-md border border-line bg-bg-elev px-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted">Nota (opcional)</label>
                      <input
                        type="text"
                        name="paidNote"
                        placeholder="Referencia, comprobante…"
                        className="w-full h-9 mt-1 rounded-md border border-line bg-bg-elev px-2 text-sm"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full">
                      ✓ Marcar pagado
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-muted text-center py-10">
            No hay usuarios que coincidan con el filtro.
          </p>
        )}
      </div>
    </div>
  );
}

function FiltroTab({
  filtro,
  actual,
  q,
  label,
}: {
  filtro: 'todos' | 'pagados' | 'nopagados';
  actual: string;
  q: string;
  label: string;
}) {
  const params = new URLSearchParams();
  if (filtro !== 'todos') params.set('filtro', filtro);
  if (q) params.set('q', q);
  const href = `/admin/usuarios${params.toString() ? `?${params.toString()}` : ''}`;
  const active = actual === filtro;
  return (
    <Link
      href={href}
      className={
        'px-3 py-1.5 rounded-md transition-colors ' +
        (active ? 'bg-accent text-accent-fg font-semibold' : 'text-muted hover:text-ink')
      }
    >
      {label}
    </Link>
  );
}
