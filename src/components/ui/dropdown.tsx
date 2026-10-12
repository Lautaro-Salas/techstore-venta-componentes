"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** Menú desplegable accesible: cierra con Escape, click afuera o al navegar. */
export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v), id })}
      {open && (
        <div
          id={id}
          className={cn(
            "animate-fade-in border-border bg-surface absolute top-full z-50 mt-2 min-w-56 rounded-xl border p-1.5 shadow-[0_16px_40px_-12px_rgb(10_20_32/0.18)] shadow-xl",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            // Los botones de envío de un <form> (p. ej. "Cerrar sesión") NO deben
            // cerrar el menú en el click: al desmontarlos aquí, el botón queda
            // fuera del DOM antes de que el navegador ejecute la acción por
            // defecto del submit, y la submission se cancela. El cierre se hace
            // en onSubmit, una vez disparado el envío.
            if (target.closest("form button")) return;
            if (target.closest("a, button")) setOpen(false);
          }}
          onSubmit={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export const dropdownItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-surface-2";
