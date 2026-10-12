import Link from "next/link";
import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { OrderStatusBadge } from "@/components/order/order-status";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";
import type { OrderRow } from "@/services/admin/orders.service";

const HEAD = [
  { label: "Pedido" },
  { label: "Cliente" },
  { label: "Email" },
  { label: "Fecha" },
  { label: "Items", className: "text-right" },
  { label: "Total", className: "text-right" },
  { label: "Estado" },
];

interface Props {
  orders: OrderRow[];
}

export function OrdersTable({ orders }: Props) {
  return (
    <AdminTable caption="Listado de pedidos" head={HEAD}>
      <tbody>
        {orders.length === 0 ? (
          <EmptyRow colSpan={HEAD.length} message="No hay pedidos con esos filtros." />
        ) : (
          orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link
                  href={`/admin/pedidos/${o.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {formatOrderNumber(o.number)}
                </Link>
                {o.couponCode && (
                  <span className="ml-2 text-xs text-muted">{o.couponCode}</span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {o.firstName} {o.lastName}
              </td>
              <td className="max-w-[220px] truncate text-muted" title={o.email}>
                {o.email}
              </td>
              <td className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</td>
              <td className="text-right tabular-nums">{o.items}</td>
              <td className="text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
              <td>
                <OrderStatusBadge status={o.status} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}
