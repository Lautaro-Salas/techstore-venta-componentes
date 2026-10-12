"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmación obligatoria para acciones destructivas. */
export function ConfirmModal({ open, title, children, confirmLabel, pending, danger = true, onConfirm, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={pending}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="text-sm text-muted">{children}</div>
    </Modal>
  );
}
