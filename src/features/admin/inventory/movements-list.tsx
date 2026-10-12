import { formatDateTime } from "@/lib/format";
import { MOVEMENT_TYPE_LABEL } from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { InventoryMovementType } from "@prisma/client";

export interface MovementRow {
  id: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  createdAt: Date;
  user: { firstName: string; lastName: string } | null;
  order: { id: string; number: number } | null;
  warehouse: { name: string } | null;
}

interface Props {
  product: { id: string; name: string; sku: string };
  movements: MovementRow[];
}

/** Historia de movimientos de stock (ingresos, ventas, ajustes, reservas). */
export function MovementsList({ product, movements }: Props) {
  return (
    <Card>
      <CardHeader
        title="Movimientos de stock"
        description={`${product.name} · ${product.sku} · últimos ${movements.length}`}
      />
      <CardBody>
        {movements.length === 0 ? (
          <p className="text-sm text-muted">Sin movimientos registrados para este producto.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {movements.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="w-16 shrink-0 text-sm font-semibold tabular-nums">
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </span>
                <Badge tone={m.quantity > 0 ? "success" : "neutral"}>
                  {MOVEMENT_TYPE_LABEL[m.type]}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-muted" title={m.reason ?? undefined}>
                  {m.reason ?? "—"}
                </span>
                {m.warehouse && (
                  <span className="hidden text-xs text-muted md:inline">{m.warehouse.name}</span>
                )}
                <span className="shrink-0 text-xs text-muted">
                  {m.user ? `${m.user.firstName} ${m.user.lastName}`.trim() : "Sistema"}
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                  {formatDateTime(m.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
