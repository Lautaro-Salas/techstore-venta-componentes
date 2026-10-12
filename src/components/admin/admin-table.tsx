import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  caption: string;
  head: { label: string; className?: string; srOnly?: boolean }[];
  /** Filas de la tabla. El llamador debe aportar su propio `<tbody>`. */
  children: ReactNode;
  minWidth?: string;
  className?: string;
}

/** Tabla del admin: se desplaza horizontalmente en pantallas chicas. */
export function AdminTable({ caption, head, children, minWidth = "min-w-[760px]", className }: Props) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table
        className={cn(
          "w-full text-left text-sm",
          "[&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_tr:hover]:bg-surface-2/50 [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle",
          minWidth,
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2/60 text-xs text-muted uppercase">
          <tr>
            {head.map((h) => (
              <th key={h.label} scope="col" className={cn("px-4 py-3 font-semibold whitespace-nowrap", h.className)}>
                {h.srOnly ? <span className="sr-only">{h.label}</span> : h.label}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10! text-center text-muted">
        {message}
      </td>
    </tr>
  );
}
