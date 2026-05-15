import { auth } from '@/lib/auth';
import { CLUB_INFO } from '@/lib/club-info';

export const metadata = { title: 'Inscripción · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function InscripcionPage() {
  const session = await auth();
  const hasPaid = session?.user?.hasPaid ?? false;
  const userEmail = session?.user?.email ?? null;

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
          {CLUB_INFO.fee.currency}
          {CLUB_INFO.fee.amount}
        </p>
        <p className="text-sm text-muted mt-2">{CLUB_INFO.fee.description}</p>
        <p className="text-sm text-muted mt-4">
          <strong className="text-ink">Concepto:</strong> {CLUB_INFO.payment.concept}
        </p>
      </section>

      {/* Métodos de pago */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Métodos de pago</h2>

        {CLUB_INFO.payment.pagoMovil.enabled && (
          <PaymentMethod
            icon="📲"
            title="Pago Móvil"
            subtitle={CLUB_INFO.payment.pagoMovil.bank}
            rows={[
              { label: 'Teléfono', value: CLUB_INFO.payment.pagoMovil.phone, copyable: true },
              { label: 'C.I.', value: CLUB_INFO.payment.pagoMovil.ci, copyable: true },
              { label: 'Titular', value: CLUB_INFO.payment.pagoMovil.holder },
            ]}
          />
        )}

        {CLUB_INFO.payment.banesco.enabled && (
          <PaymentMethod
            icon="🏦"
            title="Transferencia Banesco"
            subtitle={`Cuenta ${CLUB_INFO.payment.banesco.type}`}
            rows={[
              { label: 'Cuenta', value: CLUB_INFO.payment.banesco.account, copyable: true, mono: true },
              { label: 'Titular', value: CLUB_INFO.payment.banesco.holder },
              { label: 'C.I.', value: CLUB_INFO.payment.banesco.ci, copyable: true },
            ]}
          />
        )}

        {CLUB_INFO.payment.zelle.enabled && (
          <PaymentMethod
            icon="💵"
            title="Zelle"
            subtitle="USD"
            rows={[
              { label: 'Email', value: CLUB_INFO.payment.zelle.email, copyable: true, mono: true },
              { label: 'Titular', value: CLUB_INFO.payment.zelle.holder },
            ]}
          />
        )}

        {CLUB_INFO.payment.binance.enabled && (
          <PaymentMethod
            icon="🪙"
            title="Binance Pay"
            subtitle="Cripto"
            rows={[
              { label: 'Email Binance', value: CLUB_INFO.payment.binance.email, copyable: true, mono: true },
              { label: 'Moneda preferida', value: CLUB_INFO.payment.binance.preferredCoin },
            ]}
          />
        )}
      </section>

      {/* Cómo confirmar */}
      <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
        <h2 className="font-display text-xl">Tras realizar el pago</h2>
        <p className="text-sm text-muted mt-2">
          Envíanos el comprobante por cualquiera de estos canales y activaremos tu cuenta:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {CLUB_INFO.contact.whatsapp && (
            <li>
              📱 WhatsApp:{' '}
              <a
                href={`https://wa.me/${CLUB_INFO.contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {CLUB_INFO.contact.whatsapp}
              </a>
            </li>
          )}
          <li>
            ✉️ Email:{' '}
            <a href={`mailto:${CLUB_INFO.contact.email}`} className="text-accent hover:underline">
              {CLUB_INFO.contact.email}
            </a>
          </li>
          {CLUB_INFO.contact.instagram && (
            <li>
              📷 Instagram:{' '}
              <a
                href={`https://instagram.com/${CLUB_INFO.contact.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {CLUB_INFO.contact.instagram}
              </a>
            </li>
          )}
        </ul>
      </section>

      {/* Premios */}
      {CLUB_INFO.prizes.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-3">Premios 🏆</h2>
          <ul className="space-y-1.5 text-sm">
            {CLUB_INFO.prizes.map((prize) => (
              <li key={prize} className="text-muted">
                · <span className="text-ink">{prize}</span>
              </li>
            ))}
          </ul>
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
