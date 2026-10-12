"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { formatPrice } from "@/lib/format";
import {
  searchDiscountProducts,
  type DiscountProductOption,
} from "./actions";
import type { SelectedProduct } from "./discount-form-values";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

interface Props {
  selected: SelectedProduct[];
  onChange: (products: SelectedProduct[]) => void;
}

/** Buscador de productos para cupones/promociones: busca, vista previa y agrega. */
export function DiscountProductPicker({ selected, onChange }: Props) {
  const [q, setQ] = useState("");
  // Los resultados guardan a qué consulta corresponden: así se descarta en el
  // render lo que quedó de una búsqueda anterior, sin setState en el efecto.
  const [result, setResult] = useState<{
    query: string;
    items: DiscountProductOption[];
  }>({ query: "", items: [] });
  const [pending, startTransition] = useTransition();
  const debounced = useDebounce(q.trim(), DEBOUNCE_MS);
  // Secuencia de la consulta: descarta respuestas que llegaron tarde, para que
  // un resultado viejo no pise los productos de lo que el usuario está escribiendo.
  const requestId = useRef(0);

  useEffect(() => {
    if (debounced.length < MIN_CHARS) return;
    const id = ++requestId.current;
    startTransition(async () => {
      const response = await searchDiscountProducts(debounced);
      if (id !== requestId.current) return; // hubo otra búsqueda más reciente
      if (response.ok) setResult({ query: debounced, items: response.data });
    });
  }, [debounced]);

  // Derivado: solo se muestra lo que corresponde a la consulta vigente.
  const visible =
    debounced.length >= MIN_CHARS && result.query === debounced
      ? result.items.filter((p) => !selected.some((s) => s.id === p.id))
      : [];

  const add = (product: DiscountProductOption) => {
    onChange([...selected, { id: product.id, name: product.name }]);
    setQ("");
  };

  const remove = (id: string) => onChange(selected.filter((p) => p.id !== id));

  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Buscar productos</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar productos por nombre o SKU (mín. 2 caracteres)"
          className="border-border bg-surface h-10 w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>
      {pending && <p className="text-xs text-muted">Buscando…</p>}
      {visible.length > 0 && (
        <ul className="flex max-h-56 flex-col divide-y divide-border overflow-y-auto rounded-xl border border-border">
          {visible.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted">SKU {p.sku}</p>
              </div>
              <span className="shrink-0 text-xs text-muted tabular-nums">
                {formatPrice(p.price)}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => add(p)}
                icon={<Plus className="size-3.5" aria-hidden />}
              >
                Agregar
              </Button>
            </li>
          ))}
        </ul>
      )}
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <li
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm"
            >
              <span className="max-w-[220px] truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-muted hover:text-danger"
                aria-label={`Quitar ${p.name}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
