"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import { formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatusName } from "@/services/orders/status";
import { orderStatusChangeSchema, type OrderStatusChangeValues } from "@/schemas/admin";
import { changeOrderStatusAction } from "./actions";

interface Props {
  order: { id: string; number: number; status: OrderStatusName };
  /** Transiciones válidas desde el estado actual (calculadas en el servidor). */
  allowed: { value: OrderStatusName; label: string }[];
  shipment: { carrier: string | null; trackingCode: string | null } | null;
}

/** Formulario de cambio de estado con transiciones válidas y seguimiento. */
export function OrderStatusForm({ order, allowed, shipment }: Props) {
  const router = useRouter();
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    OrderStatusChangeValues,
    { status: string }
  >({
    schema: orderStatusChangeSchema,
    initial: {
      orderId: order.id,
      status: allowed[0]?.value ?? "PENDING",
      note: "",
      trackingCode: shipment?.trackingCode ?? "",
      carrier: shipment?.carrier ?? "",
    },
    submit: (v) => changeOrderStatusAction(v),
    successMessage: "Estado del pedido actualizado",
    onSuccess: () => router.refresh(),
  });

  const showTracking = values.status === "SHIPPED";

  return (
    <Card>
      <CardHeader
        title="Actualizar estado"
        description={`Pedido ${formatOrderNumber(order.number)} · actual: ${ORDER_STATUS_LABEL[order.status]}`}
      />
      <CardBody>
        {allowed.length === 0 ? (
          <p className="text-sm text-muted">
            Este pedido está en un estado final y no admite más transiciones.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Select
              label="Nuevo estado"
              required
              options={allowed}
              value={values.status}
              onChange={(e) => set("status", e.target.value as OrderStatusName)}
              error={errors.status}
            />
            {showTracking && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Transportista"
                  value={values.carrier}
                  onChange={(e) => set("carrier", e.target.value)}
                  error={errors.carrier}
                  maxLength={80}
                  placeholder="Andreani, OCA, correo local…"
                />
                <Input
                  label="Código de seguimiento"
                  value={values.trackingCode}
                  onChange={(e) => set("trackingCode", e.target.value)}
                  error={errors.trackingCode}
                  maxLength={80}
                />
              </div>
            )}
            <Textarea
              label="Nota (opcional)"
              value={values.note}
              onChange={(e) => set("note", e.target.value)}
              error={errors.note}
              maxLength={500}
              rows={3}
              placeholder="Ej: Se despachó con el paquete en perfecto estado"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={pending}
                icon={<CheckCircle2 className="size-4" aria-hidden />}
              >
                Guardar cambio
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
