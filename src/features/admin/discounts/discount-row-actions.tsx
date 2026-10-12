"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Check, Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { cn } from "@/lib/utils";
import {
  deleteCouponAction,
  deletePromotionAction,
  toggleCouponAction,
  togglePromotionAction,
} from "./actions";

const ACTION_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

interface Props {
  kind: "coupon" | "promotion";
  id: string;
  name: string;
  isActive: boolean;
  editHref: string;
  canWrite: boolean;
  canDelete: boolean;
}

/** Acciones por fila: editar, activar/desactivar y eliminar (con confirmación). */
export function DiscountRowActions({
  kind,
  id,
  name,
  isActive,
  editHref,
  canWrite,
  canDelete,
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pending, run } = useAdminAction();
  const isCoupon = kind === "coupon";

  const toggle = () =>
    run(
      () => (isCoupon ? toggleCouponAction(id) : togglePromotionAction(id)),
      {
        success: (data) =>
          data.isActive
            ? isCoupon
              ? "Cupón activado"
              : "Promoción activada"
            : isCoupon
              ? "Cupón desactivado"
              : "Promoción desactivada",
        onSuccess: () => router.refresh(),
      },
    );

  const remove = () =>
    run(
      () => (isCoupon ? deleteCouponAction(id) : deletePromotionAction(id)),
      {
        success: isCoupon
          ? "Cupón eliminado (desactivado si ya se usó)"
          : "Promoción eliminada",
        onSuccess: () => {
          setConfirmOpen(false);
          router.refresh();
        },
      },
    );

  return (
    <>
      {canWrite && (
        <Link
          href={editHref}
          className={ACTION_BUTTON}
          aria-label={`Editar ${name}`}
          title="Editar"
        >
          <Pencil className="size-4" aria-hidden />
        </Link>
      )}
      {canWrite &&
        (isActive ? (
          <button
            type="button"
            onClick={toggle}
            className={cn(ACTION_BUTTON, "text-danger hover:text-danger")}
            aria-label={`Desactivar ${name}`}
            title="Desactivar"
          >
            <Ban className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className={cn(ACTION_BUTTON, "text-success hover:text-success")}
            aria-label={`Activar ${name}`}
            title="Activar"
          >
            <Check className="size-4" aria-hidden />
          </button>
        ))}
      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={cn(ACTION_BUTTON, "text-muted")}
          aria-label={`Eliminar ${name}`}
          title="Eliminar"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isCoupon ? "Eliminar cupón" : "Eliminar promoción"}
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={remove}
      >
        <p>
          ¿Eliminar <strong>{name}</strong>?
          {isCoupon &&
            " Si ya se usó, se desactivará en lugar de eliminarse para conservar el historial."}
        </p>
      </ConfirmModal>
    </>
  );
}
