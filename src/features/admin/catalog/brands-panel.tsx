"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { AdminTable } from "@/components/admin/admin-table";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { brandSchema, type BrandFormValues } from "@/schemas/admin";
import type { BrandRow } from "@/services/admin/catalog-config.service";
import { deleteBrandAction, saveBrandAction } from "./actions";

const ICON_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

const HEAD = [
  { label: "Nombre" },
  { label: "Slug" },
  { label: "Logo" },
  { label: "Productos", className: "text-right" },
  { label: "Acciones", srOnly: true },
];

const emptyValues = (): BrandFormValues => ({
  name: "",
  slug: "",
  logoUrl: "",
});

const toFormValues = (row: BrandRow): BrandFormValues => ({
  name: row.name,
  slug: row.slug,
  logoUrl: row.logoUrl ?? "",
});

interface FormModalProps {
  brandId?: string;
  initial: BrandFormValues;
  onClose: () => void;
}

function BrandFormModal({
  brandId,
  initial,
  onClose,
}: FormModalProps) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    BrandFormValues,
    { id: string }
  >({
    schema: brandSchema,
    initial,
    submit: (formValues) => saveBrandAction(formValues, brandId),
    successMessage: brandId ? "Marca actualizada" : "Marca creada",
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={brandId ? "Editar marca" : "Nueva marca"}
      className="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="brand-form" loading={pending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="brand-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Nombre"
          required
          value={values.name}
          onChange={(e) => {
            set("name", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
          error={errors.name}
          maxLength={80}
        />
        <Input
          label="Slug"
          required
          value={values.slug}
          onChange={(e) => {
            set("slug", e.target.value);
            setSlugTouched(true);
          }}
          error={errors.slug}
          maxLength={200}
          hint="Se autocompleta con el nombre"
        />
        <Input
          label="Logo (URL)"
          value={values.logoUrl}
          onChange={(e) => set("logoUrl", e.target.value)}
          error={errors.logoUrl}
          maxLength={300}
          placeholder="https://…"
        />
      </form>
    </Modal>
  );
}

interface Props {
  brands: BrandRow[];
  canWrite: boolean;
}

export function BrandsPanel({ brands, canWrite }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<BrandRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<BrandRow | null>(null);
  const { pending, run } = useAdminAction();

  const remove = () => {
    if (!deleting) return;
    run(() => deleteBrandAction(deleting.id), {
      success: "Marca eliminada",
      onSuccess: () => {
        setDeleting(null);
        router.refresh();
      },
    });
  };

  return (
    <Card>
      <CardHeader
        title="Marcas"
        description="Marcas que agrupan los productos."
        action={
          canWrite && (
            <Button
              size="sm"
              onClick={() => setEditing("new")}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Nueva marca
            </Button>
          )
        }
      />
      <CardBody>
        {brands.length === 0 ? (
          <p className="text-sm text-muted">No hay marcas configuradas.</p>
        ) : (
          <AdminTable caption="Marcas" head={HEAD} minWidth="min-w-[680px]">
            <tbody>
              {brands.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium">{b.name}</td>
                  <td className="text-muted">{b.slug}</td>
                  <td>
                    {b.logoUrl ? (
                      <span className="block max-w-[220px] truncate text-xs text-muted">
                        {b.logoUrl}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    {b.productsCount}
                  </td>
                  <td>
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(b)}
                          className={ICON_BUTTON}
                          aria-label={`Editar ${b.name}`}
                          title="Editar"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(b)}
                          className={cn(ICON_BUTTON, "text-muted")}
                          aria-label={`Eliminar ${b.name}`}
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
        <BrandFormModal
          key={editing === "new" ? "new" : editing.id}
          brandId={editing === "new" ? undefined : editing.id}
          initial={
            editing === "new" ? emptyValues() : toFormValues(editing)
          }
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar marca"
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={remove}
      >
        <p>
          ¿Eliminar <strong>{deleting?.name}</strong>? Si tiene productos
          no se podrá eliminar.
        </p>
      </ConfirmModal>
    </Card>
  );
}
