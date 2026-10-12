"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductStatus } from "@prisma/client";
import { Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { cn } from "@/lib/utils";
import { deleteProductAction, duplicateProductAction, toggleProductStatusAction } from "./actions";

interface Props {
  product: { id: string; name: string; status: ProductStatus };
  canWrite: boolean;
  canDelete: boolean;
}

const ICON_BUTTON = "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn(ICON_BUTTON, danger && "hover:bg-danger-soft hover:text-danger")}>
      {children}
    </button>
  );
}

export function ProductRowActions({ product, canWrite, canDelete }: Props) {
  const router = useRouter();
  const { pending, run } = useAdminAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isActive = product.status === "ACTIVE";

  const duplicate = () =>
    run(() => duplicateProductAction(product.id), {
      success: "Producto duplicado como borrador",
      onSuccess: ({ id }) => router.push(`/admin/productos/${id}`),
    });

  const toggle = () => run(() => toggleProductStatusAction(product.id), { success: isActive ? "Producto desactivado" : "Producto activado" });

  const remove = () =>
    run(() => deleteProductAction(product.id), {
      success: ({ archived }) => (archived ? "El producto tiene ventas registradas: se archivó en lugar de eliminarse." : "Producto eliminado"),
      onSuccess: () => setConfirmDelete(false),
    });

  return (
    <div className="flex items-center justify-end gap-0.5">
      {canWrite && (
        <>
          <Link href={`/admin/productos/${product.id}`} aria-label={`Editar ${product.name}`} title="Editar" className={ICON_BUTTON}>
            <Pencil className="size-4" aria-hidden />
          </Link>
          <IconButton label={`Duplicar ${product.name}`} onClick={duplicate} disabled={pending}>
            <Copy className="size-4" aria-hidden />
          </IconButton>
          <IconButton label={`${isActive ? "Desactivar" : "Activar"} ${product.name}`} onClick={toggle} disabled={pending}>
            {isActive ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </IconButton>
        </>
      )}
      {canDelete && (
        <IconButton label={`Eliminar ${product.name}`} onClick={() => setConfirmDelete(true)} disabled={pending} danger>
          <Trash2 className="size-4" aria-hidden />
        </IconButton>
      )}
      <ConfirmModal open={confirmDelete} title="Eliminar producto" confirmLabel="Eliminar" pending={pending} onConfirm={remove} onClose={() => setConfirmDelete(false)}>
        <p className="text-left">
          ¿Seguro que querés eliminar <strong className="text-foreground">{product.name}</strong>? Si el producto ya tiene ventas, se va a archivar para
          conservar el historial de pedidos.
        </p>
      </ConfirmModal>
    </div>
  );
}
