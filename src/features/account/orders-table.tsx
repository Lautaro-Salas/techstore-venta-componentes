import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/order/order-status";
import { formatDate, formatOrderNumber, formatPrice, pluralize } from "@/lib/format";
import type { OrderStatusName } from "@/services/orders/status";

export interface OrderRow {
  id: string;
  number: number;
  status: OrderStatusName;
  total: number;
  createdAt: Date;
  _count: { items: number };
}

/** Lista de pedidos del cliente (tarjetas en mobile, filas en desktop). */
export function OrdersList({ orders }: { orders: OrderRow[] }) {
  return (
    <ul className="divide-y divide-border">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/cuenta/pedidos/${o.id}`} className="flex items-center gap-4 px-1 py-4 hover:bg-surface-2/60 sm:px-3">
            <div className="grid flex-1 gap-1 sm:grid-cols-4 sm:items-center sm:gap-4">
              <span className="font-semibold">{formatOrderNumber(o.number)}</span>
              <span className="text-sm text-muted">{formatDate(o.createdAt)} · {pluralize(o._count.items, "producto", "productos")}</span>
              <span><OrderStatusBadge status={o.status} /></span>
              <span className="font-semibold tabular-nums sm:text-right">{formatPrice(o.total)}</span>
            </div>
            <ChevronRight className="size-4 text-muted" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
