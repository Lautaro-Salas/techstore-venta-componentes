"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { AdminTable } from "@/components/admin/admin-table";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SHIPPING_TYPES,
  shippingMethodSchema,
  type ShippingMethodFormValues,
} from "@/schemas/admin";
import type { ShippingMethodRow } from "@/services/admin/commerce-config.service";
import {
  deleteShippingMethodAction,
  saveShippingMethodAction,
  toggleShippingMethodAction,
} from "./actions";

const ICON_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

const HEAD = [
  { label: "Código" },
  { label: "Nombre" },
  { label: "Tipo" },
  { label: "Precio", className: "text-right" },
  { label: "Gratis desde", className: "text-right" },
  { label: "Entrega" },
  { label: "Orden", className: "text-right" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

const TYPE_LABEL: Record<string, string> = {
  HOME_DELIVERY: "Domicilio",
  PICKUP: "Retiro en local",
};

const TYPE_OPTIONS = SHIPPING_TYPES.map((type) => ({
  value: type,
  label: TYPE_LABEL[type] ?? type,
}));

const emptyValues = (): ShippingMethodFormValues => ({
  code: "",
  name: "",
  description: "",
  type: "HOME_DELIVERY",
  price: "",
  freeThreshold: "",
  estimatedDaysMin: "1",
  estimatedDaysMax: "5",
  isActive: true,
  sortOrder: "0",
});

const toFormValues = (
  row: ShippingMethodRow,
): ShippingMethodFormValues => ({
  code: row.code,
  name: row.name,
  description: row.description ?? "",
  type: row.type as "HOME_DELIVERY" | "PICKUP",
  price: String(row.price),
  freeThreshold:
    row.freeThreshold === null ? "" : String(row.freeThreshold),
  estimatedDaysMin: String(row.estimatedDaysMin),
  estimatedDaysMax: String(row.estimatedDaysMax),
  isActive: row.isActive,
  sortOrder: String(row.sortOrder),
});

interface FormModalProps {
  methodId?: string;
  initial: ShippingMethodFormValues;
  onClose: () => void;
}

function ShippingMethodFormModal({
  methodId,
  initial,
  onClose,
}: FormModalProps) {
  const router = useRouter();
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    ShippingMethodFormValues,
    { id: string }
  >({
    schema: shippingMethodSchema,
    initial,
    submit: (formValues) => saveShippingMethodAction(formValues, methodId),
    successMessage: methodId
      ? "Método de envío actualizado"
      : "Método de envío creado",
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={methodId ? "Editar método de envío" : "Nuevo método de envío"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="shipping-form" loading={pending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="shipping-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Código"
            required
            value={values.code}
            onChange={(e) => set("code", e.target.value)}
            error={errors.code}
            disabled={!!methodId}
            hint={methodId ? "El código no se puede cambiar" : "minúsculas, números y _"}
            maxLength={40}
          />
          <Input
            label="Nombre"
            required
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            maxLength={80}
          />
        </div>
        <Input
          label="Descripción"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          maxLength={200}
        />
        <Select
          label="Tipo"
          required
          options={TYPE_OPTIONS}
          value={values.type}
          onChange={(e) =>
            set("type", e.target.value as "HOME_DELIVERY" | "PICKUP")
          }
          error={errors.type}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Precio (ARS)"
            required
            inputMode="numeric"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            error={errors.price}
          />
          <Input
            label="Envío gratis desde (ARS)"
            inputMode="numeric"
            value={values.freeThreshold}
            onChange={(e) => set("freeThreshold", e.target.value)}
            error={errors.freeThreshold}
            hint="Opcional"
          />
          <Input
            label="Días mínimos"
            required
            inputMode="numeric"
            value={values.estimatedDaysMin}
            onChange={(e) => set("estimatedDaysMin", e.target.value)}
            error={errors.estimatedDaysMin}
          />
          <Input
            label="Días máximos"
            required
            inputMode="numeric"
            value={values.estimatedDaysMax}
            onChange={(e) => set("estimatedDaysMax", e.target.value)}
            error={errors.estimatedDaysMax}
          />
          <Input
            label="Orden"
            required
            inputMode="numeric"
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            error={errors.sortOrder}
            hint="Menor = primero"
          />
          <Checkbox
            label="Publicado"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
        </div>
      </form>
    </Modal>
  );
}

interface Props {
  methods: ShippingMethodRow[];
  canWrite: boolean;
}

export function ShippingMethodsPanel({ methods, canWrite }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<ShippingMethodRow | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<ShippingMethodRow | null>(null);
  const { pending, run } = useAdminAction();

  const toggle = (method: ShippingMethodRow) =>
    run(() => toggleShippingMethodAction(method.id), {
      success: (data) =>
        data.isActive ? "Método activado" : "Método desactivado",
      onSuccess: () => router.refresh(),
    });

  const remove = () => {
    if (!deleting) return;
    run(() => deleteShippingMethodAction(deleting.id), {
      success: "Método de envío eliminado",
      onSuccess: () => {
        setDeleting(null);
        router.refresh();
      },
    });
  };

  return (
    <Card>
      <CardHeader
        title="Métodos de envío"
        description="Tarifas y plazos que se ofrecen en el checkout."
        action={
          canWrite && (
            <Button
              size="sm"
              onClick={() => setEditing("new")}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Nuevo método
            </Button>
          )
        }
      />
      <CardBody>
        {methods.length === 0 ? (
          <p className="text-sm text-muted">
            No hay métodos de envío configurados.
          </p>
        ) : (
          <AdminTable
            caption="Métodos de envío"
            head={HEAD}
            minWidth="min-w-[880px]"
          >
            <tbody>
              {methods.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.code}</td>
                  <td>
                    {m.name}
                    {m.description && (
                      <span className="block max-w-[260px] truncate text-xs text-muted">
                        {m.description}
                      </span>
                    )}
                  </td>
                  <td>{TYPE_LABEL[m.type] ?? m.type}</td>
                  <td className="text-right tabular-nums">
                    {formatPrice(m.price)}
                  </td>
                  <td className="text-right tabular-nums">
                    {m.freeThreshold === null
                      ? "—"
                      : formatPrice(m.freeThreshold)}
                  </td>
                  <td className="whitespace-nowrap text-muted">
                    {m.estimatedDaysMin}–{m.estimatedDaysMax} días
                  </td>
                  <td className="text-right tabular-nums">{m.sortOrder}</td>
                  <td>
                    <Badge tone={m.isActive ? "success" : "danger"}>
                      {m.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td>
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(m)}
                          className={ICON_BUTTON}
                          aria-label={`Editar ${m.name}`}
                          title="Editar"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(m)}
                          className={cn(
                            ICON_BUTTON,
                            m.isActive
                              ? "text-danger hover:text-danger"
                              : "text-success hover:text-success",
                          )}
                          aria-label={
                            m.isActive
                              ? `Desactivar ${m.name}`
                              : `Activar ${m.name}`
                          }
                          title={m.isActive ? "Desactivar" : "Activar"}
                        >
                          {m.isActive ? (
                            <Ban className="size-4" aria-hidden />
                          ) : (
                            <Check className="size-4" aria-hidden />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(m)}
                          className={cn(ICON_BUTTON, "text-muted")}
                          aria-label={`Eliminar ${m.name}`}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </CardBody>
      {editing !== null && (
        <ShippingMethodFormModal
          key={editing === "new" ? "new" : editing.id}
          methodId={editing === "new" ? undefined : editing.id}
          initial={
            editing === "new" ? emptyValues() : toFormValues(editing)
          }
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar método de envío"
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={remove}
      >
        <p>
          ¿Eliminar <strong>{deleting?.name}</strong>? Si tiene pedidos
          asociados no se podrá eliminar: desactívalo en su lugar.
        </p>
      </ConfirmModal>
    </Card>
  );
}
