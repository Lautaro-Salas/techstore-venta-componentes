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
import { cn } from "@/lib/utils";
import {
  paymentMethodSchema,
  type PaymentMethodFormValues,
} from "@/schemas/admin";
import type { PaymentMethodRow } from "@/services/admin/commerce-config.service";
import {
  deletePaymentMethodAction,
  savePaymentMethodAction,
  togglePaymentMethodAction,
} from "./actions";

const ICON_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

const HEAD = [
  { label: "Proveedor" },
  { label: "Nombre" },
  { label: "Descuento", className: "text-right" },
  { label: "Orden", className: "text-right" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

const PROVIDER_LABEL: Record<string, string> = {
  bank_transfer: "Transferencia bancaria",
  mercadopago: "Mercado Pago",
  cash_pickup: "Retiro en local (efectivo)",
};

const emptyValues = (providerCodes: string[]): PaymentMethodFormValues => ({
  code: providerCodes[0] ?? "",
  name: "",
  description: "",
  discountPercent: "0",
  isActive: true,
  sortOrder: "0",
});

const toFormValues = (
  row: PaymentMethodRow,
): PaymentMethodFormValues => ({
  code: row.code,
  name: row.name,
  description: row.description ?? "",
  discountPercent: String(row.discountPercent),
  isActive: row.isActive,
  sortOrder: String(row.sortOrder),
});

interface FormModalProps {
  providerCodes: string[];
  methodId?: string;
  initial: PaymentMethodFormValues;
  onClose: () => void;
}

function PaymentMethodFormModal({
  providerCodes,
  methodId,
  initial,
  onClose,
}: FormModalProps) {
  const router = useRouter();
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    PaymentMethodFormValues,
    { id: string }
  >({
    schema: paymentMethodSchema,
    initial,
    submit: (formValues) =>
      savePaymentMethodAction(formValues, methodId),
    successMessage: methodId
      ? "Medio de pago actualizado"
      : "Medio de pago creado",
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={methodId ? "Editar medio de pago" : "Nuevo medio de pago"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="payment-form" loading={pending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="payment-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <Select
          label="Proveedor"
          required
          options={providerCodes.map((code) => ({
            value: code,
            label: PROVIDER_LABEL[code] ?? code,
          }))}
          value={values.code}
          onChange={(e) => set("code", e.target.value)}
          error={errors.code}
          disabled={!!methodId}
          hint={methodId ? "El proveedor no se puede cambiar" : undefined}
        />
        <Input
          label="Nombre"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          maxLength={80}
        />
        <Input
          label="Descripción"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          maxLength={200}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Descuento (%)"
            required
            inputMode="numeric"
            value={values.discountPercent}
            onChange={(e) => set("discountPercent", e.target.value)}
            error={errors.discountPercent}
            hint="Descuento directo por pagar con este medio"
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
  methods: PaymentMethodRow[];
  providerCodes: string[];
  canWrite: boolean;
}

export function PaymentMethodsPanel({
  methods,
  providerCodes,
  canWrite,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<PaymentMethodRow | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<PaymentMethodRow | null>(null);
  const { pending, run } = useAdminAction();

  const toggle = (method: PaymentMethodRow) =>
    run(() => togglePaymentMethodAction(method.id), {
      success: (data) =>
        data.isActive ? "Medio activado" : "Medio desactivado",
      onSuccess: () => router.refresh(),
    });

  const remove = () => {
    if (!deleting) return;
    run(() => deletePaymentMethodAction(deleting.id), {
      success: "Medio de pago eliminado",
      onSuccess: () => {
        setDeleting(null);
        router.refresh();
      },
    });
  };

  return (
    <Card>
      <CardHeader
        title="Medios de pago"
        description="Se ofrecen en el checkout según el proveedor registrado."
        action={
          canWrite && (
            <Button
              size="sm"
              onClick={() => setEditing("new")}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Nuevo medio
            </Button>
          )
        }
      />
      <CardBody>
        {methods.length === 0 ? (
          <p className="text-sm text-muted">
            No hay medios de pago configurados.
          </p>
        ) : (
          <AdminTable
            caption="Medios de pago"
            head={HEAD}
            minWidth="min-w-[720px]"
          >
            <tbody>
              {methods.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className="font-medium">
                      {PROVIDER_LABEL[m.code] ?? m.code}
                    </span>
                    <span className="block text-xs text-muted">
                      {m.code}
                    </span>
                  </td>
                  <td>
                    {m.name}
                    {m.description && (
                      <span className="block max-w-[260px] truncate text-xs text-muted">
                        {m.description}
                      </span>
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    {m.discountPercent > 0
                      ? `−${m.discountPercent}%`
                      : "—"}
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
        <PaymentMethodFormModal
          key={editing === "new" ? "new" : editing.id}
          providerCodes={providerCodes}
          methodId={editing === "new" ? undefined : editing.id}
          initial={
            editing === "new"
              ? emptyValues(providerCodes)
              : toFormValues(editing)
          }
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar medio de pago"
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
