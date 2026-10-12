"use client";

import { useEffect, useState } from "react";
import { ProductRow } from "@/components/product/product-grid";
import { Section } from "@/components/home/section";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoredList } from "@/hooks/use-stored-list";
import type { ProductCardData } from "@/types/catalog";

export const RECENTLY_VIEWED_KEY = "ts_recent";
export const MAX_RECENT = 8;

/** Registra la visita a un producto (se usa en la ficha). */
export function TrackRecentlyViewed({ productId }: { productId: string }) {
  const [, setItems] = useStoredList(RECENTLY_VIEWED_KEY);
  useEffect(() => {
    setItems((list) => [productId, ...list.filter((id) => id !== productId)].slice(0, MAX_RECENT));
  }, [productId, setItems]);
  return null;
}

export function RecentlyViewed({
  excludeId,
  title = "Vistos recientemente",
}: {
  excludeId?: string;
  title?: string;
}) {
  const [ids] = useStoredList(RECENTLY_VIEWED_KEY);
  const wanted = ids.filter((id) => id !== excludeId).slice(0, 4);
  const key = wanted.join(",");
  // Estado derivado: si la key pedida todavía no volvió, se reserva el espacio con un
  // skeleton para no empujar el contenido de abajo (evita CLS).
  const [loaded, setLoaded] = useState<{ key: string; products: ProductCardData[] } | null>(null);
  const products = loaded && loaded.key === key ? loaded.products : null;

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${key}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products: ProductCardData[] }) => setLoaded({ key, products: data.products }))
      .catch((error: unknown) => {
        // El abort por navegación no debe tocar estado; un error real oculta la sección.
        if ((error as { name?: string }).name !== "AbortError") setLoaded({ key, products: [] });
      });
    return () => controller.abort();
  }, [key]);

  if (!key) return null;
  if (products === null) {
    return (
      <Section title={title}>
        <ul
          className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="w-[46%] shrink-0 snap-start sm:w-auto">
              <Skeleton className="aspect-[3/4] w-full" />
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  if (products.length === 0) return null;
  return (
    <Section title={title}>
      <ProductRow products={products} />
    </Section>
  );
}
