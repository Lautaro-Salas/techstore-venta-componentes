"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { AdminTable } from "@/components/admin/admin-table";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { categorySchema, type CategoryFormValues } from "@/schemas/admin";
import type { CategoryRow } from "@/services/admin/catalog-config.service";
import {
  deleteCategoryAction,
  saveCategoryAction,
  toggleCategoryAction,
} from "./actions";

const ICON_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

const HEAD = [
  { label: "Nombre" },
  { label: "Slug" },
  { label: "Padre" },
  { label: "Productos", className: "text-right" },
  { label: "Subcategorías", className: "text-right" },
  { label: "Orden", className: "text-right" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

const emptyValues = (): CategoryFormValues => ({
  name: "",
  slug: "",
  description: "",
  icon: "",
  sortOrder: "0",
  isActive: true,
  parentId: "",
});

const toFormValues = (row: CategoryRow): CategoryFormValues => ({
  name: row.name,
  slug: row.slug,
  description: row.description ?? "",
  icon: row.icon ?? "",
  sortOrder: String(row.sortOrder),
  isActive: row.isActive,
  parentId: row.parentId ?? "",
});

/** IDs de la categoría y todos sus descendientes (para no crear ciclos). */
function excludedIds(
  categories: { id: string; parentId: string | null }[],
  selfId: string,
): Set<string> {
  const excluded = new Set<string>([selfId]);
  const queue = [selfId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const category of categories) {
      if (
        category.parentId === current &&
        !excluded.has(category.id)
      ) {
        excluded.add(category.id);
        queue.push(category.id);
      }
    }
  }
  return excluded;
}

interface FormModalProps {
  /** Todas las categorías (para el selector de padre). */
  categories: CategoryRow[];
  categoryId?: string;
  initial: CategoryFormValues;
  onClose: () => void;
}

function CategoryFormModal({
  categories,
  categoryId,
  initial,
  onClose,
}: FormModalProps) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    CategoryFormValues,
    { id: string }
  >({
    schema: categorySchema,
    initial,
    submit: (formValues) => saveCategoryAction(formValues, categoryId),
    successMessage: categoryId
      ? "Categoría actualizada"
      : "Categoría creada",
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  const excluded = categoryId
    ? excludedIds(categories, categoryId)
    : new Set<string>();
  const parentOptions = [
    { value: "", label: "Sin categoría padre" },
    ...categories
      .filter((c) => !excluded.has(c.id))
      .map((c) => ({
        value: c.id,
        label: c.parentName ? `${c.parentName} / ${c.name}` : c.name,
      })),
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={categoryId ? "Editar categoría" : "Nueva categoría"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form" loading={pending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <Input
          label="Descripción"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          maxLength={300}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ícono (lucide)"
            value={values.icon}
            onChange={(e) => set("icon", e.target.value)}
            error={errors.icon}
            maxLength={60}
            placeholder="Ej: Cpu, Monitor, Keyboard"
          />
          <Select
            label="Categoría padre"
            options={parentOptions}
            value={values.parentId}
            onChange={(e) => set("parentId", e.target.value)}
            error={errors.parentId}
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
            label="Publicada"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
        </div>
      </form>
    </Modal>
  );
}

interface Props {
  categories: CategoryRow[];
  canWrite: boolean;
}

export function CategoriesPanel({ categories, canWrite }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const { pending, run } = useAdminAction();

  const toggle = (category: CategoryRow) =>
    run(() => toggleCategoryAction(category.id), {
      success: (data) =>
        data.isActive ? "Categoría activada" : "Categoría desactivada",
      onSuccess: () => router.refresh(),
    });

  const remove = () => {
    if (!deleting) return;
    run(() => deleteCategoryAction(deleting.id), {
      success: "Categoría eliminada",
      onSuccess: () => {
        setDeleting(null);
        router.refresh();
      },
    });
  };

  return (
    <Card>
      <CardHeader
        title="Categorías"
        description="Jerarquía de categorías de la tienda."
        action={
          canWrite && (
            <Button
              size="sm"
              onClick={() => setEditing("new")}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Nueva categoría
            </Button>
          )
        }
      />
      <CardBody>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            No hay categorías configuradas.
          </p>
        ) : (
          <AdminTable
            caption="Categorías"
            head={HEAD}
            minWidth="min-w-[900px]"
          >
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="inline-flex items-center gap-2 font-medium">
                      <FolderTree className="size-4 shrink-0 text-muted" aria-hidden />
                      {c.name}
                    </span>
                    {c.description && (
                      <span className="block max-w-[260px] truncate text-xs text-muted">
                        {c.description}
                      </span>
                    )}
                  </td>
                  <td className="text-muted">{c.slug}</td>
                  <td className="text-muted">{c.parentName ?? "—"}</td>
                  <td className="text-right tabular-nums">
                    {c.productsCount}
                  </td>
                  <td className="text-right tabular-nums">
                    {c.childrenCount}
                  </td>
                  <td className="text-right tabular-nums">{c.sortOrder}</td>
                  <td>
                    <Badge tone={c.isActive ? "success" : "danger"}>
                      {c.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td>
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          className={ICON_BUTTON}
                          aria-label={`Editar ${c.name}`}
                          title="Editar"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(c)}
                          className={cn(
                            ICON_BUTTON,
                            c.isActive
                              ? "text-danger hover:text-danger"
                              : "text-success hover:text-success",
                          )}
                          aria-label={
                            c.isActive
                              ? `Desactivar ${c.name}`
                              : `Activar ${c.name}`
                          }
                          title={c.isActive ? "Desactivar" : "Activar"}
                        >
                          {c.isActive ? (
                            <Ban className="size-4" aria-hidden />
                          ) : (
                            <Check className="size-4" aria-hidden />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          className={cn(ICON_BUTTON, "text-muted")}
                          aria-label={`Eliminar ${c.name}`}
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
        <CategoryFormModal
          key={editing === "new" ? "new" : editing.id}
          categories={categories}
          categoryId={editing === "new" ? undefined : editing.id}
          initial={
            editing === "new" ? emptyValues() : toFormValues(editing)
          }
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar categoría"
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={remove}
      >
        <p>
          ¿Eliminar <strong>{deleting?.name}</strong>? Si tiene productos o
          subcategorías no se podrá eliminar.
        </p>
      </ConfirmModal>
    </Card>
  );
}
