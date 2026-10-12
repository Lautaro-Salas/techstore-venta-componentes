"use client";

import { useRouter } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import { hrefWith } from "@/components/admin/query";
import { stockAdjustSchema, type StockAdjustValues } from "@/schemas/admin";
import type { InventoryRow } from "@/services/admin/inventory.service";
import { adjustStockAction } from "./actions";

const BASE = "/admin/inventario";

interface Props {
  product: InventoryRow;
  filters: Record<string, string>;
}

/** Ajuste manual de stock: delta (+/-), motivo obligatorio y stock mínimo. */
export function StockAdjustModal({ product, filters }: Props) {
  const router = useRouter();
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    StockAdjustValues,
    { row: InventoryRow | null }
  >({
    schema: stockAdjustSchema,
    initial: {
      productId: product.id,
      delta: "",
      reason: "",
      minStock: String(product.minStock),
    },
    submit: (v) => adjustStockAction(v),
    successMessage: "Stock actualizado",
    onSuccess: () => {
      router.push(hrefWith(BASE, filters, { producto: undefined }));
    },
  });

  const close = () => router.push(hrefWith(BASE, filters, { producto: undefined }));

  return (
    <Modal
      open
      onClose={close}
      title={`Ajustar stock: ${product.name}`}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="stock-adjust-form" loading={pending} icon={<PackageCheck className="size-4" aria-hidden />}>
            Guardar ajuste
          </Button>
        </>
      }
    >
      <form id="stock-adjust-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Disponible</dt>
            <dd className="text-lg font-bold tabular-nums">{product.availableStock}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Físico</dt>
            <dd className="text-lg font-bold tabular-nums">{product.quantity}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Reservado</dt>
            <dd className="text-lg font-bold tabular-nums">{product.reserved}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Mínimo</dt>
            <dd className="text-lg font-bold tabular-nums">{product.minStock}</dd>
          </div>
        </dl>
        <Input
          label="Ajuste de unidades"
          required
          type="number"
          value={values.delta}
          onChange={(e) => set("delta", e.target.value)}
          error={errors.delta}
          hint="Positivo para ingresar, negativo para egresar. Usá 0 para solo cambiar el mínimo."
        />
        <Input
          label="Motivo"
          required
          value={values.reason}
          onChange={(e) => set("reason", e.target.value)}
          error={errors.reason}
          maxLength={200}
          hint="Se registra en el historial de movimientos (ej: Ingreso de mercadería, corrección de conteo)"
        />
        <Input
          label="Stock mínimo"
          required
          type="number"
          value={values.minStock}
          onChange={(e) => set("minStock", e.target.value)}
          error={errors.minStock}
          hint="Alerta de stock bajo en el dashboard"
        />
      </form>
    </Modal>
  );
}
