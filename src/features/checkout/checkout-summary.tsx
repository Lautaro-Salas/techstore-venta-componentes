"use client";

import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { OrderSummary, type SummaryRow } from "@/components/cart/order-summary";
import { formatPrice, pluralize } from "@/lib/format";
import type { CheckoutBootstrap } from "./types";

interface Props {
  cart: CheckoutBootstrap["cart"];
  rows: SummaryRow[];
  total: number;
  shippingLabel: string;
}

function Items({ cart }: { cart: CheckoutBootstrap["cart"] }) {
  return (
    <ul className="flex flex-col gap-3">
      {cart.lines.map((l) => (
        <li key={l.productId} className="flex items-center gap-3 text-sm">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {l.image && (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura local
              <img src={l.image} alt="" className="size-full object-cover" />
            )}
            <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">{l.quantity}</span>
          </span>
          <span className="line-clamp-2 flex-1">{l.name}</span>
          <span className="font-medium tabular-nums">{formatPrice(l.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Resumen permanente: colapsable arriba en mobile, fijo a la derecha en desktop. */
export function CheckoutSummary({ cart, rows, total, shippingLabel }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="card lg:hidden">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium">
            Resumen ({pluralize(cart.itemCount, "producto", "productos")}) <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </span>
          <span className="text-base font-bold tabular-nums">{formatPrice(total)}</span>
        </button>
        {open && (
          <div className="border-t border-border p-4">
            <OrderSummary rows={rows} total={total} shippingLabel={shippingLabel}><Items cart={cart} /></OrderSummary>
          </div>
        )}
      </div>
      <aside className="card hidden p-5 lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Resumen de compra">
        <h2 className="mb-4 text-lg font-semibold">Resumen de compra</h2>
        <OrderSummary
          rows={rows}
          total={total}
          shippingLabel={shippingLabel}
          footer={<p className="flex items-center justify-center gap-1.5 text-xs text-muted"><Lock className="size-3.5" aria-hidden /> Tus datos viajan cifrados</p>}
        >
          <Items cart={cart} />
        </OrderSummary>
      </aside>
    </>
  );
}
