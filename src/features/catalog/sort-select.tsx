"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, type SortOption } from "@/types/catalog";

export function SortSelect({ hasQuery }: { hasQuery: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = (params.get("orden") as SortOption | null) ?? (hasQuery ? "relevance" : "best_selling");

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("orden", value);
    next.delete("pagina");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Ordenar por</span>
      <select value={current} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium focus:border-primary focus:outline-none" aria-label="Ordenar productos">
        {(Object.entries(SORT_OPTIONS) as [SortOption, string][])
          .filter(([key]) => hasQuery || key !== "relevance")
          .map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
      </select>
    </label>
  );
}
