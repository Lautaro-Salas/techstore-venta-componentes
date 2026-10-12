"use client";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ShippingQuote } from "@/services/shipping/types";

function eta(q: ShippingQuote) {
  if (q.type === "PICKUP") return `Listo en ${q.estimatedDaysMin}-${q.estimatedDaysMax} días hábiles`;
  return `Llega en ${q.estimatedDaysMin}-${q.estimatedDaysMax} días hábiles`;
}

export function StepShipping({ quotes, value, onChange, error }: { quotes: ShippingQuote[]; value: string; onChange: (code: string) => void; error?: string }) {
  if (quotes.length === 0) {
    return <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">No hay métodos de envío disponibles para esta opción. Volvé al paso anterior o contactanos.</p>;
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Elegí el método de envío</legend>
      {quotes.map((q) => (
        <label key={q.code} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors", value === q.code ? "border-primary bg-primary-soft" : "border-border")}>
          <input type="radio" name="shipping" checked={value === q.code} onChange={() => onChange(q.code)} className="accent-[var(--primary)]" />
          <span className="flex-1">
            <strong className="block">{q.name}</strong>
            <span className="text-muted">{q.description ?? eta(q)}</span>
            {q.freeThreshold !== null && q.price > 0 && <span className="block text-xs text-primary">Gratis desde {formatPrice(q.freeThreshold)}</span>}
          </span>
          <span className="text-right font-semibold">
            {q.price === 0 ? <span className="text-success">Gratis</span> : formatPrice(q.price)}
            {q.price === 0 && q.originalPrice > 0 && <s className="block text-xs font-normal text-muted">{formatPrice(q.originalPrice)}</s>}
          </span>
        </label>
      ))}
      {error && <p className="text-xs font-medium text-danger" role="alert">{error}</p>}
    </fieldset>
  );
}
