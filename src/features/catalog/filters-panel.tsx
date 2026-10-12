"use client";

import { useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/modal";
import { formatPrice } from "@/lib/format";
import type { CatalogFacets } from "@/types/catalog";
import { SPEC_PARAM_PREFIX } from "./params";

interface Props {
  facets: CatalogFacets;
  /** Si la página ya está filtrada por marca (ej. /marcas/asus) no se muestra ese filtro. */
  hideBrands?: boolean;
}

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("pagina");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const toggleInList = (key: string, value: string) => {
    const current = (params.get(key) ?? "").split(",").filter(Boolean);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    apply({ [key]: next.join(",") || null });
  };

  const isChecked = (key: string, value: string) => (params.get(key) ?? "").split(",").includes(value);

  return { params, apply, toggleInList, isChecked, pending };
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border pb-5">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      <div className="flex flex-col gap-2">{children}</div>
    </fieldset>
  );
}

function FilterContent({ facets, hideBrands }: Props) {
  const { params, apply, toggleInList, isChecked, pending } = useFilterNavigation();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  const submitPrice = (e: FormEvent) => {
    e.preventDefault();
    apply({ min: min.replace(/\D/g, "") || null, max: max.replace(/\D/g, "") || null });
  };

  const option = (key: string, value: string, label: string, count: number) => (
    <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={isChecked(key, value)} onChange={() => toggleInList(key, value)} className="size-4 rounded accent-[var(--primary)]" />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-muted tabular-nums">{count}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-5" aria-busy={pending}>
      <label className="flex cursor-pointer items-center justify-between gap-2 border-b border-border pb-5 text-sm font-medium">
        Solo con stock
        <input type="checkbox" checked={params.get("stock") === "1"} onChange={(e) => apply({ stock: e.target.checked ? "1" : null })} className="size-4 accent-[var(--primary)]" />
      </label>

      <FacetGroup title="Precio">
        <form onSubmit={submitPrice} className="flex items-end gap-2">
          <label className="flex-1 text-xs text-muted">
            Mínimo
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder={formatPrice(facets.priceRange.min)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground" />
          </label>
          <label className="flex-1 text-xs text-muted">
            Máximo
            <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder={formatPrice(facets.priceRange.max)} className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground" />
          </label>
          <Button type="submit" size="sm" variant="outline" className="h-10">Aplicar</Button>
        </form>
      </FacetGroup>

      {!hideBrands && facets.brands.length > 1 && (
        <FacetGroup title="Marca">{facets.brands.map((b) => option("marca", b.value, b.label, b.count))}</FacetGroup>
      )}

      {facets.specs.map((spec) => (
        <FacetGroup key={spec.key} title={spec.label}>
          {spec.options.map((o) => option(`${SPEC_PARAM_PREFIX}${spec.key}`, o.value, o.label, o.count))}
        </FacetGroup>
      ))}
    </div>
  );
}

export function FiltersSidebar(props: Props) {
  return (
    <aside aria-label="Filtros" className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto pr-2">
        <FilterContent {...props} />
      </div>
    </aside>
  );
}

export function FiltersDrawerButton({ activeCount, ...props }: Props & { activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="lg:hidden" icon={<SlidersHorizontal className="size-4" aria-hidden />}>
        Filtros{activeCount > 0 && ` (${activeCount})`}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Filtros" side="bottom" footer={<Button fullWidth onClick={() => setOpen(false)}>Ver resultados</Button>}>
        <FilterContent {...props} />
      </Drawer>
    </>
  );
}
