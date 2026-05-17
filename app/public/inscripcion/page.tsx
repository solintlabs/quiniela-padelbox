import { CLUB_INFO } from '@/lib/club-info';

export const metadata = { title: 'Inscripción · Quiniela PADELBOX' };

interface Row {
  label: string;
  value: string;
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
        <span className="text-2xl">{icon}</span>
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
            <dd className={'flex-1 text-sm truncate ' + (row.mono ? 'font-mono tabular-nums' : '')}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PublicInscripcionPage() {
  const p = CLUB_INFO.payment;
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Cómo participar</p>
        <h1 className="font-display text-4xl mt-1">Inscripción y pago</h1>
        <p className="text-sm text-muted mt-3 max-w-xl">
          Paga la cuota por cualquiera de los métodos de abajo y envíanos el comprobante.
          Tu cuenta se activa en cuanto confirmemos el pago.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-bg-elev p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Cuota</p>
        <p className="font-display text-5xl mt-2 tabular-nums">
          {CLUB_INFO.fee.currency}
          {CLUB_INFO.fee.amount}
        </p>
        <p className="text-sm text-muted mt-2">{CLUB_INFO.fee.description}</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Métodos de pago</h2>
        {p.pagoMovil.enabled && (
          <PaymentMethod
            icon="📲"
            title="Pago Móvil"
            subtitle={p.pagoMovil.bank}
            rows={[
              { label: 'Teléfono', value: p.pagoMovil.phone },
              { label: 'C.I.', value: p.pagoMovil.ci },
              { label: 'Titular', value: p.pagoMovil.holder },
            ]}
          />
        )}
        {p.banesco.enabled && (
          <PaymentMethod
            icon="🏦"
            title="Transferencia Banesco"
            subtitle={`Cuenta ${p.banesco.type}`}
            rows={[
              { label: 'Cuenta', value: p.banesco.account, mono: true },
              { label: 'Titular', value: p.banesco.holder },
              { label: 'C.I.', value: p.banesco.ci },
            ]}
          />
        )}
        {p.zelle.enabled && (
          <PaymentMethod
            icon="💵"
            title="Zelle"
            subtitle="USD"
            rows={[
              { label: 'Email', value: p.zelle.email, mono: true },
              { label: 'Titular', value: p.zelle.holder },
            ]}
          />
        )}
        {p.binance.enabled && (
          <PaymentMethod
            icon="🪙"
            title="Binance Pay"
            subtitle="Cripto"
            rows={[
              { label: 'Email Binance', value: p.binance.email, mono: true },
              { label: 'Moneda preferida', value: p.binance.preferredCoin },
            ]}
          />
        )}
      </section>

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
            💬 Enviar comprobante por WhatsApp →
          </a>
        )}
        <p className="text-xs text-muted mt-3 text-center">
          O escríbenos a{' '}
          <a href={`mailto:${CLUB_INFO.contact.email}`} className="text-accent underline">
            {CLUB_INFO.contact.email}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
