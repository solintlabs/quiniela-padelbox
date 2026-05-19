import { auth } from '@/lib/auth';
import { CLUB_INFO } from '@/lib/club-info';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/pool';
import { getInscriptionsStatus } from '@/lib/inscriptions';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Inscripción · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function InscripcionPage() {
  const session = await auth();
  const hasPaid = session?.user?.hasPaid ?? false;
  const userEmail = session?.user?.email ?? null;
  const [rules, methods] = await Promise.all([
    prisma.rules.findUnique({ where: { id: 1 } }),
    prisma.paymentMethod.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
  ]);
  const feeAmount = rules?.feeAmount ?? CLUB_INFO.fee.amount;
  const feeCurrency = rules?.feeCurrency ?? CLUB_INFO.fee.currency;
  const inscriptions = getInscriptionsStatus(rules?.inscriptionsCloseAt ?? null);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Cómo participar</p>
        <h1 className="font-display text-4xl mt-1">Inscripción y pago</h1>
        <p className="text-sm text-muted mt-3 max-w-xl">
          La quiniela es privada para los socios del club. Para activar tu cuenta
          y poder enviar pronósticos, paga la cuota por cualquiera de los métodos
          de abajo y avísanos. Tu acceso se activa en cuanto confirmemos el pago.
        </p>
      </header>

      {inscriptions.closed && !hasPaid && (
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-5">
          <p className="font-display text-base">⏰ Inscripciones cerradas</p>
          <p className="text-sm text-muted mt-2">
            Las inscripciones se cerraron el{' '}
            <strong className="text-ink">{formatDateTime(inscriptions.closeAt!)}</strong>.
            Si ya hiciste el pago y necesitas que te activemos manualmente,
            contáctanos por WhatsApp y revisamos tu caso.
          </p>
        </div>
      )}

      {hasPaid ? (
        <div className="rounded-xl border border-success/40 bg-success/10 p-5">
          <p className="text-sm">
            ✓ <strong>Ya estás inscrito.</strong> Tu cuota está al día, puedes enviar pronósticos sin problema.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
          <p className="text-sm">
            ⚠ <strong>Aún no estás activo.</strong> Realiza el pago y avísanos por WhatsApp/email
            con tu nombre {userEmail && `(${userEmail})`} para que activemos tu cuenta.
          </p>
        </div>
      )}

      {/* Cuota */}
      <section className="rounded-xl border border-line bg-bg-elev p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Cuota</p>
        <p className="font-display text-5xl mt-2 tabular-nums">
          {formatCurrency(feeAmount, feeCurrency)}
        </p>
        <p className="text-sm text-muted mt-2">{CLUB_INFO.fee.description}</p>
        <p className="text-sm text-muted mt-4">
          <strong className="text-ink">Concepto:</strong> {CLUB_INFO.payment.concept}
        </p>
      </section>

      {/* Métodos de pago — desde DB editables en /admin/pagos */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Métodos de pago</h2>
        {methods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">
              Aún no hay métodos configurados. Contacta al admin por WhatsApp para coordinar el pago.
            </p>
          </div>
        ) : (
          methods.map((m) => {
            const fields = Array.isArray(m.fields) ? (m.fields as Array<{ label: string; value: string; mono?: boolean }>) : [];
            return (
              <PaymentMethod
                key={m.id}
                icon={m.icon ?? '💳'}
                title={m.title}
                subtitle={m.subtitle ?? ''}
                rows={fields.map((f) => ({ label: f.label, value: f.value, copyable: true, mono: f.mono }))}
              />
            );
          })
        )}
      </section>

      {/* Cómo confirmar — CTA WhatsApp protagonista */}
      <section className="rounded-2xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-6">
        <h2 className="font-display text-xl">Tras realizar el pago</h2>
        <p className="text-sm text-muted mt-2">
          Envíanos el comprobante por WhatsApp y activamos tu cuenta en minutos.
        </p>
        {CLUB_INFO.contact.whatsapp && (
          <a
            href={`https://wa.me/${CLUB_INFO.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hola! Acabo de pagar la cuota de la Quiniela PADELBOX × DELISH. Te paso el comprobante 👇`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-3 h-14 rounded-xl bg-[#25D366] hover:brightness-95 text-white font-display text-base shadow-lg shadow-[#25D366]/20"
          >
            💬 Enviar comprobante por WhatsApp
            <span className="text-sm font-normal opacity-90">→</span>
          </a>
        )}
        <p className="text-xs text-muted mt-3 text-center">
          O escríbenos a{' '}
          <a href={`mailto:${CLUB_INFO.contact.email}`} className="text-accent hover:underline">
            {CLUB_INFO.contact.email}
          </a>
          {CLUB_INFO.contact.instagram && (
            <>
              {' · '}
              <a
                href={`https://instagram.com/${CLUB_INFO.contact.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {CLUB_INFO.contact.instagram}
              </a>
            </>
          )}
        </p>
      </section>

      {/* Premios */}
      {CLUB_INFO.prizes.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-3">Premios 🏆</h2>
          <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
            {CLUB_INFO.prizes.map((prize, i) => (
              <div
                key={prize.place}
                className={'flex items-center justify-between px-5 py-3 ' + (i > 0 ? 'border-t border-line' : '')}
              >
                <span className="text-sm">{prize.place}</span>
                <span className="font-display text-xl tabular-nums text-accent">{prize.amount}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recordatorio reglas */}
      <section className="rounded-xl border border-line p-5 text-sm space-y-2">
        <p className="font-semibold">Cómo se gana</p>
        <p className="text-muted">
          <strong className="text-ink">{CLUB_INFO.rules.pointsExact} pts</strong> por marcador exacto ·{' '}
          <strong className="text-ink">{CLUB_INFO.rules.pointsWinner} pt</strong> si aciertas solo el ganador ·{' '}
          <strong className="text-ink">+{CLUB_INFO.rules.pointsChampion} pts</strong> si aciertas el campeón.
        </p>
        <p className="text-muted">
          Los pronósticos se cierran {CLUB_INFO.rules.closeMin} minutos antes del kickoff de cada partido.
        </p>
      </section>
    </div>
  );
}

interface Row {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}

function PaymentMethod({
  icon,
  title,
  subtitle,
  rows,
}: {
  icon: string;
  title: string;
  subtitle: string;
  rows: Row[];
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
      <header className="px-5 py-4 border-b border-line flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="font-display text-lg leading-tight">{title}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </header>
      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="px-5 py-3 flex items-center gap-3">
            <dt className="text-xs uppercase tracking-[0.12em] text-muted w-28 shrink-0">
              {row.label}
            </dt>
            <dd
              className={
                'flex-1 text-sm truncate ' + (row.mono ? 'font-mono tabular-nums' : '')
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
