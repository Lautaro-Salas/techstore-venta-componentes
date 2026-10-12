import Link from "next/link";
import { OrderSummary, type SummaryRow } from "@/components/cart/order-summary";
import { formatPrice } from "@/lib/format";
import { readAddress, readInstructions, type OrderDetail } from "@/services/orders/order-queries";

/** Bloques reutilizables del detalle de pedido (cliente). */
export function OrderItemsList({ order }: { order: OrderDetail }) {
  return (
    <ul className="divide-y divide-border">
      {order.items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {item.product?.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura local
              <img src={item.product.images[0].url} alt="" className="size-full object-cover" />
            )}
          </span>
          <span className="flex-1">
            {item.product ? <Link href={`/producto/${item.product.slug}`} className="font-medium hover:text-primary">{item.productName}</Link> : <span className="font-medium">{item.productName}</span>}
            <span className="block text-xs text-muted">{item.quantity} × {formatPrice(item.unitPrice)}</span>
          </span>
          <span className="font-semibold tabular-nums">{formatPrice(item.total)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: OrderDetail }) {
  const rows: SummaryRow[] = [{ label: "Subtotal", value: order.subtotal }];
  if (order.discountTotal > 0) rows.push({ label: order.couponCode ? `Descuentos (cupón ${order.couponCode})` : "Descuentos", value: order.discountTotal, tone: "discount" });
  return <OrderSummary rows={rows} total={order.total} shippingLabel={order.shippingTotal === 0 ? "Gratis" : formatPrice(order.shippingTotal)} />;
}

export function PaymentInstructionsCard({ order }: { order: OrderDetail }) {
  const payment = order.payments[0];
  const instructions = payment && payment.status === "PENDING" ? readInstructions(payment.metadata) : null;
  if (!instructions) return null;
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary-soft p-5">
      <h2 className="font-semibold">{instructions.title}</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {instructions.lines.map((l) => (
          <div key={l.label}>
            <dt className="text-xs text-muted">{l.label}</dt>
            <dd className="font-medium break-all select-all">{l.value}</dd>
          </div>
        ))}
      </dl>
      {instructions.note && <p className="mt-3 text-sm text-muted">{instructions.note}</p>}
    </div>
  );
}

export function DeliveryInfo({ order }: { order: OrderDetail }) {
  const address = readAddress(order.shippingAddress);
  return (
    <div className="text-sm">
      <p className="font-medium">{order.shippingMethodName}</p>
      {address ? (
        <p className="mt-1 text-muted">
          {address.recipientName} · {address.street} {address.number}{address.floor ? `, piso ${address.floor}` : ""}{address.apartment ? ` ${address.apartment}` : ""}
          <br />
          {address.city}, {address.province} ({address.postalCode})
        </p>
      ) : (
        <p className="mt-1 text-muted">Retiro en el local</p>
      )}
      {order.shipment?.trackingCode && <p className="mt-2">Seguimiento: <strong className="select-all">{order.shipment.trackingCode}</strong>{order.shipment.carrier && ` (${order.shipment.carrier})`}</p>}
    </div>
  );
}
