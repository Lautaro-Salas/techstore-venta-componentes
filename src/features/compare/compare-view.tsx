"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { StockBadge } from "@/components/product/stock-badge";
import { ButtonLink, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CompareProduct } from "@/types/compare";
import { buildCompareRows, cheapestIndex } from "./compare-rows";
import { useCompare } from "./use-compare";

interface Loaded {
  key: string;
  products: CompareProduct[];
  error: boolean;
}

export function CompareView() {
  const compare = useCompare();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const key = compare.ids.join(",");

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/compare?ids=${key}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { products: CompareProduct[] }) =>
        setLoaded({ key, products: data.products, error: false }),
      )
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError"))
          setLoaded({ key, products: [], error: true });
      });
    return () => controller.abort();
  }, [key]);

  // Al quitar productos se reutilizan los datos ya cargados (filtrados abajo).
  const status = !loaded
    ? "loading"
    : loaded.error
      ? "error"
      : loaded.products.length > 0 || loaded.key === key
        ? "ready"
        : "loading";
  const products = loaded?.products ?? [];

  if (!key) {
    return (
      <EmptyState
        icon={<GitCompareArrows />}
        title="No hay productos para comparar"
        description="Tocá “Comparar” en hasta 4 productos de la misma categoría."
        action={<ButtonLink href="/productos">Explorar productos</ButtonLink>}
      />
    );
  }
  if (status === "error") {
    return (
      <EmptyState
        title="No pudimos cargar la comparación"
        action={<Button onClick={() => window.location.reload()}>Reintentar</Button>}
      />
    );
  }
  if (status !== "ready") return <Skeleton className="h-96 w-full" />;

  const visible = products.filter((p) => compare.ids.includes(p.id));
  const rows = buildCompareRows(visible).filter((r) => !onlyDiff || r.different);
  const cheapest = cheapestIndex(visible);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          label="Mostrar solo diferencias"
          checked={onlyDiff}
          onChange={(e) => setOnlyDiff(e.target.checked)}
        />
        <Button variant="ghost" size="sm" onClick={compare.clear}>
          Vaciar comparador
        </Button>
      </div>
      <div className="border-border overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">Comparación de productos</caption>
          <thead>
            <tr className="bg-surface">
              <th
                scope="col"
                className="bg-surface sticky left-0 z-10 w-44 p-4 text-left align-bottom font-semibold"
              >
                Característica
              </th>
              {visible.map((p) => (
                <th key={p.id} scope="col" className="min-w-52 p-4 text-left align-top font-normal">
                  <div className="relative flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => compare.remove(p.id)}
                      className="text-muted hover:bg-surface-2 absolute -top-1 right-0 rounded-full p-1"
                      aria-label={`Quitar ${p.name} de la comparación`}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                    <span className="bg-surface-2 relative block size-24 overflow-hidden rounded-xl">
                      {p.image && (
                        <Image
                          src={p.image.url}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized={p.image.url.endsWith(".svg")}
                        />
                      )}
                    </span>
                    <Link
                      href={`/producto/${p.slug}`}
                      className="hover:text-primary line-clamp-2 pr-6 font-semibold"
                    >
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            <tr className="bg-surface">
              <th
                scope="row"
                className="bg-surface text-muted sticky left-0 p-4 text-left font-medium"
              >
                Precio
              </th>
              {visible.map((p, i) => (
                <td
                  key={p.id}
                  className={cn(
                    "p-4 text-base font-bold tabular-nums",
                    i === cheapest && visible.length > 1 && "text-success",
                  )}
                >
                  {formatPrice(p.price)}
                  {i === cheapest && visible.length > 1 && (
                    <span className="bg-success-soft ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
                      Mejor precio
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="bg-surface">
              <th
                scope="row"
                className="bg-surface text-muted sticky left-0 p-4 text-left font-medium"
              >
                Disponibilidad
              </th>
              {visible.map((p) => (
                <td key={p.id} className="p-4">
                  <StockBadge level={p.stockLevel} available={p.available} />
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.key} className={row.different ? "bg-warning-soft/40" : "bg-surface"}>
                <th
                  scope="row"
                  className={cn(
                    "text-muted sticky left-0 p-4 text-left font-medium",
                    row.different ? "bg-warning-soft" : "bg-surface",
                  )}
                >
                  {row.label}
                  {row.different && <span className="sr-only"> (difiere)</span>}
                </th>
                {row.values.map((v, i) => (
                  <td key={visible[i]!.id} className={cn("p-4", row.different && "font-semibold")}>
                    {v ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-surface">
              <th
                scope="row"
                className="bg-surface text-muted sticky left-0 p-4 text-left font-medium"
              >
                Garantía
              </th>
              {visible.map((p) => (
                <td key={p.id} className="p-4">
                  {p.warrantyMonths} meses
                </td>
              ))}
            </tr>
            <tr className="bg-surface">
              <td className="bg-surface sticky left-0 p-4" />
              {visible.map((p) => (
                <td key={p.id} className="p-4">
                  <AddToCartButton product={p} size="sm" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-muted text-xs">
        Las filas resaltadas indican diferencias entre los productos.
      </p>
    </div>
  );
}
