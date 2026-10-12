"use client";

import { CreditCard, Landmark, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { quoteInstallments } from "@/services/pricing/rules";
import type { AvailablePaymentMethod } from "@/services/payments/registry";

const ICONS: Record<string, typeof CreditCard> = { bank_transfer: Landmark, mercadopago: CreditCard, cash_pickup: Wallet };

interface Props {
  methods: AvailablePaymentMethod[];
  value: string;
  onChange: (code: string) => void;
  installments: number;
  onInstallmentsChange: (n: number) => void;
  plans: { installments: number; interestRateBps: number }[];
  amount: number;
  error?: string;
}

export function StepPayment({ methods, value, onChange, installments, onInstallmentsChange, plans, amount, error }: Props) {
  const selected = methods.find((m) => m.code === value);
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Elegí cómo pagar</legend>
        {methods.map((m) => {
          const Icon = ICONS[m.code] ?? CreditCard;
          return (
            <label key={m.code} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors", value === m.code ? "border-primary bg-primary-soft" : "border-border")}>
              <input type="radio" name="payment" checked={value === m.code} onChange={() => onChange(m.code)} className="accent-[var(--primary)]" />
              <Icon className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="flex-1">
                <strong className="block">{m.name}</strong>
                {m.description && <span className="text-muted">{m.description}</span>}
              </span>
              {m.discountPercent > 0 && <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">{m.discountPercent}% OFF</span>}
            </label>
          );
        })}
        {error && <p className="text-xs font-medium text-danger" role="alert">{error}</p>}
      </fieldset>

      {selected?.supportsInstallments && plans.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Cuotas</legend>
          <select value={installments} onChange={(e) => onInstallmentsChange(Number(e.target.value))} className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" aria-label="Cantidad de cuotas">
            {plans.map((p) => {
              const q = quoteInstallments(amount, p);
              return (
                <option key={p.installments} value={p.installments}>
                  {p.installments === 1 ? `1 pago de ${formatPrice(q.total)}` : `${p.installments} cuotas de ${formatPrice(q.amount)}${q.interestFree ? " sin interés" : ` (total ${formatPrice(q.total)})`}`}
                </option>
              );
            })}
          </select>
          <p className="mt-1.5 text-xs text-muted">Las cuotas finales dependen de tu tarjeta y se confirman en Mercado Pago.</p>
        </fieldset>
      )}

      {methods.length === 0 && <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">No hay medios de pago disponibles en este momento.</p>}
    </div>
  );
}
