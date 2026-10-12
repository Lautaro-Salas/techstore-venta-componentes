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
import { Checkbox, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  installmentPlanSchema,
  type InstallmentPlanFormValues,
} from "@/schemas/admin";
import type { InstallmentPlanRow } from "@/services/admin/commerce-config.service";
import {
  deleteInstallmentPlanAction,
  saveInstallmentPlanAction,
  toggleInstallmentPlanAction,
} from "./actions";

const ICON_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

const HEAD = [
  { label: "Cuotas" },
  { label: "Interés" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

/** "Sin interés" o "12,5%" (coma decimal para es-AR). */
export function formatInterest(bps: number): string {
  if (bps === 0) return "Sin interés";
  return `${(bps / 100).toString().replace(".", ",")}%`;
}

const emptyValues = (): InstallmentPlanFormValues => ({
  installments: "1",
  interestPercent: "0",
  isActive: true,
});

const toFormValues = (
  row: InstallmentPlanRow,
): InstallmentPlanFormValues => ({
  installments: String(row.installments),
  interestPercent: (row.interestRateBps / 100)
    .toString()
    .replace(".", ","),
  isActive: row.isActive,
});

interface FormModalProps {
  installments?: number;
  initial: InstallmentPlanFormValues;
  onClose: () => void;
}

function InstallmentPlanFormModal({
  installments,
  initial,
  onClose,
}: FormModalProps) {
  const router = useRouter();
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    InstallmentPlanFormValues,
    void
  >({
    schema: installmentPlanSchema,
    initial,
    submit: (formValues) =>
      saveInstallmentPlanAction(formValues, installments),
    successMessage: installments
      ? "Plan de cuotas actualizado"
      : "Plan de cuotas creado",
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={installments ? "Editar plan de cuotas" : "Nuevo plan de cuotas"}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="installment-form" loading={pending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="installment-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Cuotas"
          required
          inputMode="numeric"
          value={values.installments}
          onChange={(e) => set("installments", e.target.value)}
          error={errors.installments}
          disabled={installments !== undefined}
          hint={
            installments !== undefined
              ? "La cantidad de cuotas no se puede cambiar"
              : "Máximo 36"
          }
        />
        <Input
          label="Interés (%)"
          required
          inputMode="decimal"
          value={values.interestPercent}
          onChange={(e) => set("interestPercent", e.target.value)}
          error={errors.interestPercent}
          hint="0 = sin interés. Ej: 12,5 para 12,5% de interés"
        />
        <Checkbox
          label="Publicado"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
      </form>
    </Modal>
  );
}

interface Props {
  plans: InstallmentPlanRow[];
  canWrite: boolean;
}

export function InstallmentPlansPanel({ plans, canWrite }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<InstallmentPlanRow | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<InstallmentPlanRow | null>(null);
  const { pending, run } = useAdminAction();

  const toggle = (plan: InstallmentPlanRow) =>
    run(() => toggleInstallmentPlanAction(plan.installments), {
      success: (data) =>
        data.isActive ? "Plan activado" : "Plan desactivado",
      onSuccess: () => router.refresh(),
    });

  const remove = () => {
    if (!deleting) return;
    run(() => deleteInstallmentPlanAction(deleting.installments), {
      success: "Plan de cuotas eliminado",
      onSuccess: () => {
        setDeleting(null);
        router.refresh();
      },
    });
  };

  return (
    <Card>
      <CardHeader
        title="Planes de cuotas"
        description="Sin interés o con interés, según la cantidad de cuotas."
        action={
          canWrite && (
            <Button
              size="sm"
              onClick={() => setEditing("new")}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Nuevo plan
            </Button>
          )
        }
      />
      <CardBody>
        {plans.length === 0 ? (
          <p className="text-sm text-muted">
            No hay planes de cuotas configurados.
          </p>
        ) : (
          <AdminTable
            caption="Planes de cuotas"
            head={HEAD}
            minWidth="min-w-[560px]"
          >
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium tabular-nums">
                    {p.installments === 1
                      ? "1 cuota"
                      : `${p.installments} cuotas`}
                  </td>
                  <td className="tabular-nums">
                    {formatInterest(p.interestRateBps)}
                  </td>
                  <td>
                    <Badge tone={p.isActive ? "success" : "danger"}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td>
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className={ICON_BUTTON}
                          aria-label={`Editar plan de ${p.installments} cuotas`}
                          title="Editar"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(p)}
                          className={cn(
                            ICON_BUTTON,
                            p.isActive
                              ? "text-danger hover:text-danger"
                              : "text-success hover:text-success",
                          )}
                          aria-label={
                            p.isActive
                              ? `Desactivar plan de ${p.installments} cuotas`
                              : `Activar plan de ${p.installments} cuotas`
                          }
                          title={p.isActive ? "Desactivar" : "Activar"}
                        >
                          {p.isActive ? (
                            <Ban className="size-4" aria-hidden />
                          ) : (
                            <Check className="size-4" aria-hidden />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          className={cn(ICON_BUTTON, "text-muted")}
                          aria-label={`Eliminar plan de ${p.installments} cuotas`}
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
        <InstallmentPlanFormModal
          key={editing === "new" ? "new" : editing.id}
          installments={
            editing === "new" ? undefined : editing.installments
          }
          initial={
            editing === "new" ? emptyValues() : toFormValues(editing)
          }
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar plan de cuotas"
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={remove}
      >
        <p>
          ¿Eliminar el plan de{" "}
          <strong>{deleting?.installments} cuotas</strong>?
        </p>
      </ConfirmModal>
    </Card>
  );
}
