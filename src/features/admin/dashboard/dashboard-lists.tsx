import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { STOCK_LEVEL_TONE } from "@/components/admin/labels";
import { OrderStatusBadge } from "@/components/order/order-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import type { InventoryRow } from "@/services/admin/inventory.service";
import { STOCK_LEVEL_LABEL, stockLevel } from "@/services/inventory/rules";

interface RecentOrder {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
}

export function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card className="overflow-hidden xl:col-span-2">
      <CardHeader title="Últimos pedidos" action={<Link href="/admin/pedidos" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>} />
      {orders.length === 0 ? (
        <p className="p-5 text-sm text-muted">Todavía no hay pedidos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm [&_td]:px-5 [&_td]:py-3">
            <caption className="sr-only">Últimos 5 pedidos</caption>
            <thead className="text-xs text-muted uppercase">
              <tr>
                <th scope="col" className="px-5 py-2 font-semibold">Pedido</th>
                <th scope="col" className="px-5 py-2 font-semibold">Cliente</th>
                <th scope="col" className="px-5 py-2 font-semibold">Fecha</th>
                <th scope="col" className="px-5 py-2 font-semibold">Estado</th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td><Link href={`/admin/pedidos/${o.id}`} className="font-medium text-primary hover:underline">{formatOrderNumber(o.number)}</Link></td>
                  <td>{o.firstName} {o.lastName}</td>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function LowStockList({ items }: { items: InventoryRow[] }) {
  return (
    <Card>
      <CardHeader title="Stock bajo" action={<Link href="/admin/inventario?filtro=alerta" className="text-sm font-medium text-primary hover:underline">Ver inventario</Link>} />
      {items.length === 0 ? (
        <p className="p-5 text-sm text-muted">Todo el catálogo tiene stock suficiente.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const level = stockLevel(item.availableStock, item.minStock);
            return (
              <li key={item.id}>
                <Link href={`/admin/inventario?producto=${item.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted">{item.sku} · disponible {item.availableStock} / mín. {item.minStock}</span>
                  </span>
                  <Badge tone={STOCK_LEVEL_TONE[level]}>{STOCK_LEVEL_LABEL[level]}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
