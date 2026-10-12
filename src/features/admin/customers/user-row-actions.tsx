"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check } from "lucide-react";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { cn } from "@/lib/utils";
import { toggleUserStatusAction } from "./actions";

const ICON_BUTTON =
  "inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50";

interface Props {
  user: { id: string; firstName: string; lastName: string; isActive: boolean };
  canManage: boolean;
}

/** Activar/desactivar cuenta (solo con permiso users:manage). */
export function UserRowActions({ user, canManage }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, run } = useAdminAction();

  if (!canManage) return null;

  const name = `${user.firstName} ${user.lastName}`.trim();

  const toggle = () =>
    run(() => toggleUserStatusAction(user.id), {
      success: (data) => (data.isActive ? "Cuenta activada" : "Cuenta desactivada"),
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });

  return (
    <>
      {user.isActive ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(ICON_BUTTON, "text-danger hover:text-danger")}
          aria-label={`Desactivar cuenta de ${name}`}
          title="Desactivar cuenta"
        >
          <Ban className="size-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className={cn(ICON_BUTTON, "text-success hover:text-success")}
          aria-label={`Activar cuenta de ${name}`}
          title="Activar cuenta"
        >
          <Check className="size-4" aria-hidden />
        </button>
      )}
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="Desactivar cuenta"
        confirmLabel="Desactivar"
        pending={pending}
        onConfirm={toggle}
      >
        <p>
          ¿Desactivar la cuenta de <strong>{name}</strong>? No podrá iniciar
          sesión mientras esté inactiva. Podés reactivarla cuando quieras.
        </p>
      </ConfirmModal>
    </>
  );
}
