import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

interface Props {
  action: string;
  defaultValue: string;
  placeholder: string;
  label: string;
  /** Filtros que deben conservarse al buscar. */
  hidden?: Record<string, string>;
  children?: ReactNode;
}

/** Búsqueda por GET: la URL refleja el filtro y la página vuelve a la 1. */
export function SearchForm({ action, defaultValue, placeholder, label, hidden = {}, children }: Props) {
  return (
    <form action={action} method="get" role="search" className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {Object.entries(hidden).map(([key, value]) => (value ? <input key={key} type="hidden" name={key} value={value} /> : null))}
      <label className="relative flex-1">
        <span className="sr-only">{label}</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm focus:border-primary focus:ring-2 focus:ring-ring/40 focus:outline-none"
        />
      </label>
      {children}
      <button type="submit" className={buttonClasses({ variant: "outline", size: "sm" }, "h-10")}>
        Buscar
      </button>
    </form>
  );
}
