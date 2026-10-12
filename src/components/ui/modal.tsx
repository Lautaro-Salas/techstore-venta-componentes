"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Usa <dialog> nativo: foco atrapado, Escape y accesibilidad incluidos. */
function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose();
  };
  return { ref, onBackdropClick };
}

function DialogHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label="Cerrar">
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, className }: DialogBaseProps) {
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-label={title}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl open:animate-fade-in",
        className,
      )}
    >
      {open && (
        <>
          <DialogHeader title={title} onClose={onClose} />
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

export function Drawer({ open, onClose, title, children, footer, className, side = "right" }: DialogBaseProps & { side?: "right" | "left" | "bottom" }) {
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);
  const position = {
    right: "ml-auto mr-0 h-dvh max-h-dvh w-full max-w-md open:animate-slide-in-right",
    left: "mr-auto ml-0 h-dvh max-h-dvh w-full max-w-sm open:animate-slide-in-left",
    bottom: "mb-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-2xl open:animate-slide-up",
  }[side];
  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-label={title}
      className={cn("m-0 border-0 bg-surface p-0 text-foreground shadow-2xl", position, className)}
    >
      {open && (
        <div className="flex h-full max-h-[inherit] flex-col">
          <DialogHeader title={title} onClose={onClose} />
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
