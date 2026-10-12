import { Check, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ORDER_PROGRESS, ORDER_STATUS_LABEL, type OrderStatusName } from "@/services/orders/status";

const TONE: Record<OrderStatusName, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PREPARING: "primary",
  SHIPPED: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatusName }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

/** Línea de tiempo del pedido para el cliente. */
export function OrderTimeline({ status }: { status: OrderStatusName }) {
  if (status === "CANCELLED") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
        <X className="size-4" aria-hidden /> Este pedido fue cancelado.
      </p>
    );
  }
  const current = ORDER_PROGRESS.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Estado del pedido">
      {ORDER_PROGRESS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col items-center gap-2 text-center" aria-current={i === current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done ? "bg-success" : "bg-border")} />
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", done ? "bg-success text-white" : "bg-surface-2 text-muted")}>
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === ORDER_PROGRESS.length - 1 ? "opacity-0" : i < current ? "bg-success" : "bg-border")} />
            </div>
            <span className={cn("text-[11px] sm:text-xs", i === current ? "font-semibold" : "text-muted")}>{ORDER_STATUS_LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}
