import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";

export interface SummaryRow {
  label: string;
  value: number;
  tone?: "discount" | "muted";
  note?: string;
}

/** Resumen de importes reutilizado en carrito, checkout y detalle de pedido. */
export function OrderSummary({ rows, total, shippingLabel, children, footer }: { rows: SummaryRow[]; total: number; shippingLabel?: string; children?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {children}
      <dl className="flex flex-col gap-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <dt className="text-muted">
              {row.label}
              {row.note && <span className="block text-xs">{row.note}</span>}
            </dt>
            <dd className={row.tone === "discount" ? "font-medium text-success tabular-nums" : "font-medium tabular-nums"}>
              {row.tone === "discount" ? `-${formatPrice(row.value)}` : formatPrice(row.value)}
            </dd>
          </div>
        ))}
        {shippingLabel && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Envío</dt>
            <dd className="text-right font-medium">{shippingLabel}</dd>
          </div>
        )}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="text-2xl font-bold tracking-tight tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>
      {footer}
    </div>
  );
}
